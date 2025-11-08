import { Router } from 'express'
import User from '../models/User.js'
import Exam from '../models/Exam.js'
import { signToken, requireAuth } from '../middleware/auth.js'
import crypto from 'crypto'

const router = Router()

// Mock admin credential for demo
const ADMIN_USER = { username: 'admin', password: 'admin123' }

function genOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Simple scrypt-based hashing (format: scrypt:<saltHex>:<hashHex>)
async function hashPassword(password) {
  const salt = crypto.randomBytes(16)
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) return reject(err)
      resolve(`scrypt:${salt.toString('hex')}:${derivedKey.toString('hex')}`)
    })
  })
}

async function verifyPassword(password, passwordHash) {
  try {
    const [scheme, saltHex, hashHex] = passwordHash.split(':')
    if (scheme !== 'scrypt') return false
    const salt = Buffer.from(saltHex, 'hex')
    const expected = Buffer.from(hashHex, 'hex')
    return await new Promise((resolve) => {
      crypto.scrypt(password, salt, expected.length, (err, derived) => {
        if (err) return resolve(false)
        resolve(crypto.timingSafeEqual(derived, expected))
      })
    })
  } catch {
    return false
  }
}

router.post('/student-login', async (req, res) => {
  try {
    const { regNo, examCode } = req.body
    if (!regNo) return res.status(400).json({ error: 'regNo required' })
    if (!examCode || !/^\d{9}$/.test(String(examCode))) {
      return res.status(400).json({ error: 'Invalid exam code' })
    }
    const exam = await Exam.findOne({ $or: [
      { code: String(examCode) },
      { loginCode: String(examCode) },
      { resumeCode: String(examCode) },
    ] })
    if (!exam) return res.status(401).json({ error: 'Invalid exam code' })
    const user = await User.findOne({ regNo, role: 'student' })
    if (!user) return res.status(401).json({ error: 'Not registered. Contact admin.' })
    const token = signToken({ id: user._id.toString(), name: user.name, role: user.role })
    res.json({ token, user })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

router.post('/reexam-login', async (req, res) => {
  try {
    const { regNo, examCode } = req.body
    if (!regNo) return res.status(400).json({ error: 'regNo required' })
    if (!examCode || !/^\d{9}$/.test(String(examCode))) {
      return res.status(400).json({ error: 'Invalid exam code' })
    }
    const exam = await Exam.findOne({ $or: [
      { code: String(examCode) },
      { loginCode: String(examCode) },
      { resumeCode: String(examCode) },
    ] })
    if (!exam || !['reexam', 'resume'].includes(exam.examType || 'normal')) {
      return res.status(401).json({ error: 'Invalid exam code for re-exam' })
    }
    let user = await User.findOne({ regNo })
    if (!user) user = await User.create({ name: regNo, regNo, role: 'student' })
    const token = signToken({ id: user._id.toString(), name: user.name, role: 'student' })
    res.json({ token, user, examId: exam._id, examType: exam.examType })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// Faculty login with username/password
router.post('/faculty-login', async (req, res) => {
  try {
    const { username, password } = req.body
    if (!username || !password) return res.status(400).json({ error: 'username and password required' })
    const user = await User.findOne({ name: username, role: 'faculty' })
    if (!user || !user.passwordHash) return res.status(401).json({ error: 'Invalid credentials' })
    const ok = await verifyPassword(password, user.passwordHash)
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' })
    const token = signToken({ id: user._id.toString(), name: user.name, role: 'faculty' })
    res.json({ token, user })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// Admin: set or update faculty credentials (and optional phone)
router.post('/admin/faculty-set', requireAuth(['admin']), async (req, res) => {
  try {
    const { username, password, phone } = req.body
    if (!username || !password) return res.status(400).json({ error: 'username and password required' })
    let user = await User.findOne({ name: username, role: 'faculty' })
    if (!user) user = await User.create({ name: username, role: 'faculty' })
    user.passwordHash = await hashPassword(password)
    if (phone) user.phone = phone
    user.otpCode = undefined
    user.otpExpiresAt = undefined
    await user.save()
    res.json({ ok: true, user: { id: user._id, name: user.name, role: user.role, phone: user.phone } })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

router.post('/admin-login', async (req, res) => {
  try {
    const { username, password } = req.body
    const user = await User.findOne({ name: username, role: 'admin' })
    if (!user || !user.passwordHash) return res.status(401).json({ error: 'Invalid credentials' })
    const ok = await verifyPassword(password, user.passwordHash)
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' })
    const token = signToken({ id: user._id.toString(), name: user.name, role: 'admin' })
    res.json({ token, user })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// Admin setup helpers
router.get('/admin-exists', async (_req, res) => {
  try {
    const count = await User.countDocuments({ role: 'admin', passwordHash: { $exists: true, $ne: null } })
    res.json({ exists: count > 0 })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

router.post('/admin-setup', async (req, res) => {
  try {
    const existing = await User.findOne({ role: 'admin' })
    const { username, password } = req.body
    if (!username || !password) return res.status(400).json({ error: 'username and password required' })
    const passwordHash = await hashPassword(password)
    if (!existing) {
      const user = await User.create({ name: username, role: 'admin', passwordHash })
      return res.json({ ok: true, user: { id: user._id, name: user.name, role: user.role } })
    }
    if (!existing.passwordHash) {
      existing.name = username
      existing.passwordHash = passwordHash
      await existing.save()
      return res.json({ ok: true, user: { id: existing._id, name: existing.name, role: existing.role } })
    }
    return res.status(409).json({ error: 'Admin already exists' })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// Admin: list faculty users
router.get('/admin/faculty-list', requireAuth(['admin']), async (_req, res) => {
  try {
    const users = await User.find({ role: 'faculty' }).select('name phone createdAt updatedAt')
    res.json(users)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

router.delete('/admin/faculty/:id', requireAuth(['admin']), async (req, res) => {
  try {
    const { id } = req.params
    const user = await User.findOne({ _id: id, role: 'faculty' })
    if (!user) return res.status(404).json({ error: 'Faculty not found' })
    await User.deleteOne({ _id: id, role: 'faculty' })
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// Admin management
router.get('/admin/list', requireAuth(['admin']), async (_req, res) => {
  try {
    const admins = await User.find({ role: 'admin' }).select('name createdAt updatedAt')
    res.json(admins)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

router.post('/admin/add', requireAuth(['admin']), async (req, res) => {
  try {
    const { username, password } = req.body
    if (!username || !password) return res.status(400).json({ error: 'username and password required' })
    const exists = await User.findOne({ name: username, role: 'admin' })
    if (exists) return res.status(400).json({ error: 'Admin username already exists' })
    const passwordHash = await hashPassword(password)
    const user = await User.create({ name: username, role: 'admin', passwordHash })
    res.json({ ok: true, user: { id: user._id, name: user.name } })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

router.delete('/admin/:id', requireAuth(['admin']), async (req, res) => {
  try {
    const { id } = req.params
    if (id === req.user.id) return res.status(400).json({ error: 'Cannot delete current admin' })
    const user = await User.findOne({ _id: id, role: 'admin' })
    if (!user) return res.status(404).json({ error: 'Admin not found' })
    await User.deleteOne({ _id: id, role: 'admin' })
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

export default router
