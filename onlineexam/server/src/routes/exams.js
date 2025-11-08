import { Router } from 'express'
import Exam from '../models/Exam.js'
import { requireAuth } from '../middleware/auth.js'
import multer from 'multer'
import { parseMcqTxt } from '../utils/txtParser.js'

const router = Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 } })

async function generateUniqueExamCode() {
  // 9-digit numeric string, ensure uniqueness across all code fields
  while (true) {
    const code = String(Math.floor(100000000 + Math.random() * 900000000))
    const exists = await Exam.findOne({ $or: [
      { code: code },
      { loginCode: code },
      { resumeCode: code },
    ] })
    if (!exists) return code
  }
}

// Create exam (admin or faculty)
router.post('/', requireAuth(['admin', 'faculty']), async (req, res) => {
  try {
    const { append } = req.body
    if (append && req.body.title) {
      const existing = await Exam.findOne({ title: req.body.title })
      if (existing) {
        // append questions to existing exam
        const toAdd = Array.isArray(req.body.questions) ? req.body.questions : []
        existing.questions.push(...toAdd)
        if (req.body.durationMin) existing.durationMin = req.body.durationMin
        if (req.body.category) existing.category = req.body.category
        if (!existing.loginCode) existing.loginCode = await generateUniqueExamCode()
        if (!existing.resumeCode) existing.resumeCode = await generateUniqueExamCode()
        if (!existing.code) existing.code = existing.loginCode
        await existing.save()
        return res.json(existing)
      }
    }
    const loginCode = await generateUniqueExamCode()
    let resumeCode = await generateUniqueExamCode()
    // ensure distinct
    while (resumeCode === loginCode) resumeCode = await generateUniqueExamCode()
    const exam = await Exam.create({ ...req.body, createdBy: req.user.id, code: loginCode, loginCode, resumeCode })
    res.json(exam)
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

// Upload .txt to create MCQ exam (admin or faculty)
router.post('/upload-txt', requireAuth(['admin', 'faculty']), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'file required' })
      const content = req.file.buffer.toString('utf8')
    const questions = parseMcqTxt(content)
    const { title = 'Uploaded Exam', category = 'General', durationMin = 60, randomized = true, append, examType } = req.body
    if (!questions.length) return res.status(400).json({ error: 'No questions parsed' })
    if (append && title) {
      const existing = await Exam.findOne({ title })
      if (existing) {
        existing.questions.push(...questions)
        existing.durationMin = Number(durationMin) || existing.durationMin
        existing.category = ['General', 'Technical'].includes(category) ? category : existing.category
        if (!existing.loginCode) existing.loginCode = await generateUniqueExamCode()
        if (!existing.resumeCode) existing.resumeCode = await generateUniqueExamCode()
        if (!existing.code) existing.code = existing.loginCode
        await existing.save()
        return res.json(existing)
      }
    }
    const loginCode2 = await generateUniqueExamCode()
    let resumeCode2 = await generateUniqueExamCode()
    while (resumeCode2 === loginCode2) resumeCode2 = await generateUniqueExamCode()
    const exam = await Exam.create({
      title,
      category: ['General', 'Technical'].includes(category) ? category : 'General',
      durationMin: Number(durationMin) || 60,
      randomized: randomized !== 'false',
      questions,
      createdBy: req.user.id,
      code: loginCode2,
      loginCode: loginCode2,
      resumeCode: resumeCode2,
      examType: examType === 'resume' || examType === 'reexam' ? examType : 'normal',
    })
    res.json(exam)
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

// List exams (everyone)
router.get('/', requireAuth(['admin', 'student']), async (req, res) => {
  const exams = await Exam.find().sort({ createdAt: -1 })
  res.json(exams)
})

// List my exams (faculty)
router.get('/mine', requireAuth(['faculty', 'admin']), async (req, res) => {
  try {
    if (req.user.role === 'faculty') {
      const exams = await Exam.find({ createdBy: req.user.id }).sort({ createdAt: -1 })
      return res.json(exams)
    }
    // admin: return all for convenience
    const exams = await Exam.find().sort({ createdAt: -1 })
    res.json(exams)
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

// Get exam by id (randomize order if enabled)
router.get('/:id', requireAuth(['admin', 'student']), async (req, res) => {
  const exam = await Exam.findById(req.params.id)
  if (!exam) return res.status(404).json({ error: 'Not found' })
  const dto = exam.toObject()
  if (dto.randomized) {
    dto.questions = [...dto.questions].sort(() => Math.random() - 0.5)
  }
  res.json(dto)
})

// Get exam by 9-digit code (randomize order if enabled)
router.get('/code/:code', requireAuth(['admin', 'student']), async (req, res) => {
  const code = req.params.code
  const exam = await Exam.findOne({ $or: [
    { code },
    { loginCode: code },
    { resumeCode: code },
  ] })
  if (!exam) return res.status(404).json({ error: 'Not found' })
  const dto = exam.toObject()
  if (dto.randomized) {
    dto.questions = [...dto.questions].sort(() => Math.random() - 0.5)
  }
  res.json(dto)
})

// Update exam (admin)
router.put('/:id', requireAuth(['admin']), async (req, res) => {
  try {
    const exam = await Exam.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!exam) return res.status(404).json({ error: 'Not found' })
    res.json(exam)
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

// Delete exam (admin or faculty owner)
router.delete('/:id', requireAuth(['admin', 'faculty']), async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id)
    if (!exam) return res.status(404).json({ error: 'Not found' })
    if (req.user.role === 'faculty' && String(exam.createdBy) !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' })
    }
    await Exam.deleteOne({ _id: exam._id })
    res.json({ ok: true })
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

export default router
