import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Timer from '../components/Timer'
import api from '../utils/api'
import { useEffect as useEffect2 } from 'react'
import { getSocket } from '../utils/socket'
import useAuth from '../store/auth'

export default function Exam() {
  const { examId } = useParams()
  const [exam, setExam] = useState(null)
  const [answers, setAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [fsBlocked, setFsBlocked] = useState(false)
  const [tabSwitches, setTabSwitches] = useState(0)
  const nav = useNavigate()
  const { user } = useAuth()
  const draftKey = user ? `examDraft:${user.id || user._id || user.name}:${examId}` : `examDraft:${examId}`
  const timerKey = user ? `examTimerRemaining:${user.id || user._id || user.name}:${examId}` : `examTimerRemaining:${examId}`

  useEffect(() => {
    setLoading(true)
    api.get(`/exams/${examId}`)
      .then(({ data }) => {
        // normalize ids for mapping
        const normalized = {
          ...data,
          durationSec: (data.durationMin || 60) * 60,
          questions: (data.questions || []).map(q => ({ ...q, _id: q._id || q.id }))
        }
        setExam(normalized)
        // try restore draft
        try {
          const raw = localStorage.getItem(draftKey)
          if (raw) {
            const parsed = JSON.parse(raw)
            if (parsed?.answers && typeof parsed.answers === 'object') {
              setAnswers(parsed.answers)
            }
          }
        } catch {}
      })
      .catch(err => setError(err.response?.data?.error || 'Failed to load exam'))
      .finally(() => setLoading(false))
  }, [examId])

  // Realtime: tab monitoring + count tab switches
  useEffect2(() => {
    const s = getSocket()
    const emit = (type, extra) => s.emit('tab-event', { type, examId, ...extra })
    const onBlur = () => { emit('blur'); setTabSwitches((c) => c + 1) }
    const onFocus = () => emit('focus')
    const onVisibility = () => {
      const hidden = document.hidden
      emit(hidden ? 'visibility-hidden' : 'visibility-visible')
      if (hidden) setTabSwitches((c) => c + 1)
    }
    window.addEventListener('blur', onBlur)
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisibility)
    // emit session start
    emit('start')
    return () => {
      emit('end')
      window.removeEventListener('blur', onBlur)
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [examId])

  // Attempt to enter fullscreen when exam is ready
  useEffect(() => {
    if (!exam || submitted) return
    const el = document.documentElement
    const req = el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen || el.msRequestFullscreen
    if (req) {
      req.call(el).catch(() => setFsBlocked(true))
    }
  }, [exam, submitted])

  useEffect(() => {
    if (!submitted && tabSwitches > 5) {
      handleSubmit()
    }
  }, [tabSwitches, submitted])

  const requestFullscreenManually = () => {
    const el = document.documentElement
    const req = el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen || el.msRequestFullscreen
    if (req) {
      req.call(el).then(() => setFsBlocked(false)).catch(() => setFsBlocked(true))
    }
  }

  const handleAutoSubmit = () => {
    if (!submitted) handleSubmit()
  }

  const handleSubmit = () => {
    if (!exam) return
    const payload = {
      answers: Object.entries(answers).map(([qid, value]) => ({ qid, value })),
      tabSwitches,
    }
    api.post(`/submissions/${examId}`, payload)
      .then(({ data }) => {
        setResult(data)
        setSubmitted(true)
        // clear draft
        try { localStorage.removeItem(draftKey) } catch {}
        try { localStorage.removeItem(timerKey) } catch {}
        setTimeout(() => nav('/student'), 3000)
      })
      .catch(err => setError(err.response?.data?.error || 'Submission failed'))
  }

  const scoreText = useMemo(() => {
    if (!result) return null
    const total = result.total ?? (exam?.questions?.filter(q => q.type === 'mcq').length || 0)
    const s = result.score ?? result.scoreAuto
    return `${s ?? 0} / ${total}`
  }, [result, exam])

  if (loading) return <div>Loading exam...</div>
  if (error) return <div className="text-red-600">{error}</div>
  if (!exam) return <div>Exam not found.</div>

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">{exam.title}</h1>
        <Timer durationSec={exam.durationSec} onElapsed={handleAutoSubmit} persistKey={timerKey} />
      </div>

      {fsBlocked && (
        <div className="mb-4 p-3 border rounded bg-yellow-50 text-sm text-yellow-800">
          The browser blocked automatic fullscreen. Click the button below to continue in fullscreen mode.
          <button onClick={requestFullscreenManually} className="ml-3 px-3 py-1.5 rounded bg-blue-600 text-white">Enter Fullscreen</button>
        </div>
      )}

      {!submitted ? (
        <div className="space-y-6">
          {exam.questions.map((q, idx) => (
            <div key={q._id || q.id} className="bg-white border rounded-lg p-4">
              <div className="font-medium">Q{idx + 1}. {q.q || q.prompt}</div>
              {q.type === 'mcq' && (
                <div className="mt-3 space-y-2">
                  {q.opts.map((opt, i) => (
                    <label key={i} className="flex gap-2 items-center">
                      <input type="radio" name={q._id} checked={answers[q._id] === i} onChange={() => {
                        const next = { ...(answers || {}), [q._id]: i }
                        setAnswers(next)
                        try { localStorage.setItem(draftKey, JSON.stringify({ answers: next })) } catch {}
                      }} />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              )}
              {q.type === 'code' && (
                <textarea className="mt-3 w-full border rounded p-2 h-40 font-mono" placeholder="// Write your code here" onChange={e => {
                  const next = { ...(answers || {}), [q._id]: e.target.value }
                  setAnswers(next)
                  try { localStorage.setItem(draftKey, JSON.stringify({ answers: next })) } catch {}
                }} value={answers[q._id] || ''} />
              )}
            </div>
          ))}

          <div className="flex justify-end">
            <button className="px-4 py-2 rounded bg-green-600 text-white" onClick={handleSubmit}>Submit</button>
          </div>
        </div>
      ) : (
        <div className="bg-white border rounded-lg p-6">
          <div className="text-lg font-semibold mb-2">Submission received</div>
          {scoreText !== null && <div className="text-gray-700">Auto-evaluated score: <span className="font-medium">{scoreText}</span></div>}
          <div className="text-sm text-gray-600 mt-2">Redirecting to dashboard...</div>
        </div>
      )}
    </div>
  )
}
