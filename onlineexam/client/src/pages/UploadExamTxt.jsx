import { useState } from 'react'
import api from '../utils/api'
import { useLocation } from 'react-router-dom'

export default function UploadExamTxt() {
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const examType = params.get('type') === 'reexam' ? 'reexam' : 'normal'
  const [file, setFile] = useState(null)
  const [title, setTitle] = useState('Uploaded Exam')
  const [category, setCategory] = useState('General')
  const [duration, setDuration] = useState(60)
  const [randomized, setRandomized] = useState(true)
  const [append, setAppend] = useState(false)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    setMsg('')
    setError('')
    if (!file) { setError('Please choose a .txt file'); return }
    const fd = new FormData()
    fd.append('file', file)
    fd.append('title', title)
    fd.append('category', category)
    fd.append('durationMin', String(duration))
    fd.append('randomized', String(randomized))
    fd.append('append', String(append))
    if (examType !== 'normal') fd.append('examType', examType)
    setLoading(true)
    try {
      const { data } = await api.post('/exams/upload-txt', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setMsg(`Exam created: ${data.title} (${data.questions.length} questions)`) 
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-semibold mb-4">Upload {examType === 'reexam' ? 'Re-Exam ' : ''}Exam (.txt)</h1>
      <form onSubmit={onSubmit} className="bg-white border rounded p-6 space-y-4">
        {msg && <div className="text-green-700 text-sm">{msg}</div>}
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <div>
          <label className="block text-sm mb-1">.txt File</label>
          <input type="file" accept=".txt" onChange={e => setFile(e.target.files?.[0] || null)} />
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm mb-1">Title</label>
            <input className="w-full border rounded px-3 py-2" value={title} onChange={e => setTitle(e.target.value)} />
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
        <div className="flex items-center gap-2">
          <input id="rand" type="checkbox" checked={randomized} onChange={e => setRandomized(e.target.checked)} />
          <label htmlFor="rand" className="text-sm">Randomize question order</label>
        </div>
        <div className="flex items-center gap-2">
          <input id="append" type="checkbox" checked={append} onChange={e => setAppend(e.target.checked)} />
          <label htmlFor="append" className="text-sm">Append to existing exam with same title</label>
        </div>
        <div className="flex justify-end">
          <button disabled={loading} className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-60">{loading ? 'Uploading...' : 'Create Exam'}</button>
        </div>
      </form>

      <div className="mt-6 bg-white border rounded p-4 text-sm text-gray-700">
        <div className="font-medium mb-2">Accepted .txt format</div>
        <pre className="bg-gray-50 p-3 rounded overflow-auto text-xs">
Q: 2 + 2 = ?
A) 3
B) 4
C) 5
D) 6
ANSWER: B
        </pre>
      </div>
    </div>
  )
}
