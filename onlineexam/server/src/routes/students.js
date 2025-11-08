import { Router } from 'express'
import User from '../models/User.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

// Get current student profile
router.get('/me', requireAuth(['student']), async (req, res) => {
  try {
    const user = await User.findById(req.user.id).lean()
    if (!user) return res.status(404).json({ error: 'Not found' })
    const { _id, name, email, regNo, phone, department, year, section, role, createdAt, updatedAt } = user
    res.json({ _id, name, email, regNo, phone, department, year, section, role, createdAt, updatedAt })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// Update current student profile
router.patch('/me', requireAuth(['student']), async (req, res) => {
  try {
    const allowed = ['name', 'email', 'phone', 'department', 'year', 'section']
    const update = {}
    for (const key of allowed) {
      if (key in req.body) update[key] = req.body[key]
    }
    const user = await User.findByIdAndUpdate(req.user.id, { $set: update }, { new: true })
    if (!user) return res.status(404).json({ error: 'Not found' })
    const { _id, name, email, regNo, phone, department, year, section, role, createdAt, updatedAt } = user.toObject()
    res.json({ _id, name, email, regNo, phone, department, year, section, role, createdAt, updatedAt })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// Admin: list registered students (regNo)
router.get('/admin/list', requireAuth(['admin']), async (_req, res) => {
  try {
    const students = await User.find({ role: 'student' }).select('name regNo createdAt updatedAt')
    res.json(students)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// Admin: add/register a student by regNo (and optional name)
router.post('/admin/add', requireAuth(['admin']), async (req, res) => {
  try {
    const { regNo, name } = req.body
    if (!regNo) return res.status(400).json({ error: 'regNo required' })
    const exists = await User.findOne({ regNo, role: 'student' })
    if (exists) return res.status(400).json({ error: 'Student already registered' })
    const user = await User.create({ name: name || regNo, regNo, role: 'student' })
    res.json({ ok: true, user: { id: user._id, name: user.name, regNo: user.regNo } })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// Admin: delete a registered student
router.delete('/admin/:id', requireAuth(['admin']), async (req, res) => {
  try {
    const { id } = req.params
    const user = await User.findOne({ _id: id, role: 'student' })
    if (!user) return res.status(404).json({ error: 'Student not found' })
    await User.deleteOne({ _id: id, role: 'student' })
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

export default router
