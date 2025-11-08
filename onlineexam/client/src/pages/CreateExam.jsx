import { useState } from 'react'
import api from '../utils/api'
import { useLocation } from 'react-router-dom'

export default function CreateExam() {
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const initialType = (() => {
    const t = params.get('type')
    if (t === 'resume' || t === 'reexam') return t
    return 'normal'
  })()
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('General')
  const [duration, setDuration] = useState(60)
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [append, setAppend] = useState(false)
  const [examType] = useState(initialType)

  const addMcq = () => {
    setQuestions(qs => [...qs, { id: crypto.randomUUID(), type: 'mcq', q: '', opts: ['', '', '', ''], answer: 0 }])
  }

  const addCode = () => {
    setQuestions(qs => [...qs, { id: crypto.randomUUID(), type: 'code', prompt: '' }])
  }

  const updateQuestion = (id, patch) => {
    setQuestions(qs => qs.map(q => q.id === id ? { ...q, ...patch } : q))
  }

  const save = async () => {
    setMsg('')
    setError('')
    const payload = { title, category, durationMin: Number(duration), questions, append, examType }
    if (!payload.title || !questions.length) { setError('Please add a title and at least one question'); return }
    setLoading(true)
    try {
      const { data } = await api.post('/exams', payload)
      setMsg(`Exam created: ${data.title} (${data.questions?.length || 0} questions)`) 
      setQuestions([])
      setTitle('')
      setCategory('General')
      setDuration(60)
      setAppend(false)
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to create exam')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-xl font-semibold mb-4">Create {examType === 'resume' ? 'Resume ' : examType === 'reexam' ? 'Re-Exam ' : ''}Exam</h1>

      {msg && <div className="mb-3 text-sm text-green-700">{msg}</div>}
      {error && <div className="mb-3 text-sm text-red-600">{error}</div>}

      <div className="bg-white border rounded-lg p-4 space-y-3 mb-6">
        <div className="grid sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm mb-1">Title</label>
            <input className="w-full border rounded px-3 py-2" value={title} onChange={e => setTitle(e.target.value)} placeholder={examType === 'resume' ? 'Resume Exam Title' : examType === 'reexam' ? 'Re-Exam Title' : 'Exam Title'} />
          </div>
          <div>
            <label className="block text-sm mb-1">Category</label>
            <select className="w-full border rounded px-3 py-2" value={category} onChange={e => setCategory(e.target.value)}>
              <option>General</option>
              <option>Technical</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Duration (min)</label>
            <input type="number" className="w-full border rounded px-3 py-2" value={duration} onChange={e => setDuration(e.target.value)} />
          </div>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 rounded bg-gray-100" onClick={addMcq}>Add MCQ</button>
          <button className="px-3 py-1.5 rounded bg-gray-100" onClick={addCode}>Add Coding</button>
        </div>
        <div className="flex items-center gap-2">
          <input id="append" type="checkbox" checked={append} onChange={e => setAppend(e.target.checked)} />
          <label htmlFor="append" className="text-sm">Append to existing exam with same title</label>
        </div>
      </div>

      <div className="space-y-4">
        {questions.map((q, idx) => (
          <div key={q.id} className="bg-white border rounded-lg p-4">
            <div className="font-medium mb-2">Q{idx + 1} • {q.type.toUpperCase()}</div>
            {q.type === 'mcq' ? (
              <div className="space-y-3">
                <input className="w-full border rounded px-3 py-2" placeholder="Question" value={q.q} onChange={e => updateQuestion(q.id, { q: e.target.value })} />
                {q.opts.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input type="radio" name={`ans-${q.id}`} checked={q.answer === i} onChange={() => updateQuestion(q.id, { answer: i })} />
                    <input className="flex-1 border rounded px-3 py-2" placeholder={`Option ${i + 1}`} value={opt} onChange={e => updateQuestion(q.id, { opts: q.opts.map((o, j) => j === i ? e.target.value : o) })} />
                  </div>
                ))}
              </div>
            ) : (
              <textarea className="w-full border rounded px-3 py-2 h-32" placeholder="Coding prompt" value={q.prompt} onChange={e => updateQuestion(q.id, { prompt: e.target.value })} />
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-end mt-6">
        <button disabled={loading} className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-60" onClick={save}>{loading ? 'Saving...' : 'Save Exam'}</button>
      </div>
    </div>
  )
}
