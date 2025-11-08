import { Router } from 'express'

const router = Router()

router.post('/tab', (req, res) => {
  const io = req.app.get('io')
  const payload = { ...req.body, at: Date.now() }
  io?.emit('tab-event', payload)
  res.json({ ok: true })
})

export default router
