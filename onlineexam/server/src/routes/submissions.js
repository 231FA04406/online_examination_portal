import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import Submission from '../models/Submission.js'
import Exam from '../models/Exam.js'

const router = Router()

// Submit answers (student)
router.post('/:examId', requireAuth(['student', 'admin']), async (req, res) => {
  try {
    const { examId } = req.params
    const { answers, tabSwitches } = req.body // [{ qid, value }], tabSwitches number
    const exam = await Exam.findById(examId)
    if (!exam) return res.status(404).json({ error: 'Exam not found' })

    // Auto-grade MCQs
    let scoreAuto = 0
    let total = 0
    const answerMap = new Map((answers || []).map(a => [a.qid, a.value]))
    for (const q of exam.questions) {
      if (q.type === 'mcq') {
        total += 1
        const val = answerMap.get(q._id.toString())
        if (val === q.answer) scoreAuto += 1
      }
    }

    const sub = await Submission.create({
      exam: exam._id,
      user: req.user.id,
      answers,
      score: scoreAuto,
      scoreAuto,
      scoreManual: 0,
      total,
      status: 'submitted',
      tabSwitches: typeof tabSwitches === 'number' ? tabSwitches : 0,
    })
    res.json(sub)
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

// Get submission by id (admin)
router.get('/:id', requireAuth(['admin']), async (req, res) => {
  const sub = await Submission.findById(req.params.id).populate('user', 'name role regNo')
  if (!sub) return res.status(404).json({ error: 'Not found' })
  res.json(sub)
})

// Get my submission for an exam
router.get('/me/:examId', requireAuth(['student', 'admin']), async (req, res) => {
  const sub = await Submission.findOne({ exam: req.params.examId, user: req.user.id })
  if (!sub) return res.status(404).json({ error: 'Not found' })
  res.json(sub)
})

// List submissions (admin or faculty owner)
router.get('/exam/:examId', requireAuth(['admin', 'faculty']), async (req, res) => {
  try {
    const { examId } = req.params
    if (req.user.role === 'faculty') {
      const exam = await Exam.findById(examId)
      if (!exam) return res.status(404).json({ error: 'Exam not found' })
      if (String(exam.createdBy) !== req.user.id) return res.status(403).json({ error: 'Forbidden' })
    }
    const subs = await Submission.find({ exam: examId }).populate('user', 'name role regNo')
    res.json(subs)
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

// Manual review (admin)
// Body: { reviews: [{ qid, score, comment }], scoreManual? }
router.patch('/:id/review', requireAuth(['admin']), async (req, res) => {
  try {
    const { reviews = [], scoreManual } = req.body
    const sub = await Submission.findById(req.params.id)
    if (!sub) return res.status(404).json({ error: 'Not found' })

    // merge reviews by qid
    const map = new Map(sub.reviews.map(r => [r.qid, r]))
    for (const r of reviews) {
      if (!r?.qid) continue
      const existing = map.get(r.qid)
      if (existing) {
        if (typeof r.score === 'number') existing.score = r.score
        if (typeof r.comment === 'string') existing.comment = r.comment
      } else {
        map.set(r.qid, { qid: r.qid, score: r.score || 0, comment: r.comment || '' })
      }
    }
    const merged = Array.from(map.values())
    const manualSum = typeof scoreManual === 'number' ? scoreManual : merged.reduce((s, r) => s + (r.score || 0), 0)

    sub.reviews = merged
    sub.scoreManual = manualSum
    sub.score = (sub.scoreAuto || 0) + manualSum
    sub.status = 'evaluated'
    await sub.save()
    res.json(sub)
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

export default router
