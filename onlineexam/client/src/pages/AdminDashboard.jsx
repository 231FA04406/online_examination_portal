import { Link } from 'react-router-dom'
import useAuth from '../store/auth'
import { useEffect, useState } from 'react'
import api from '../utils/api'

export default function AdminDashboard() {
  const { user } = useAuth()
  const [exams, setExams] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    api.get('/exams/mine')
      .then(({ data }) => setExams(data || []))
      .catch(err => setError(err.response?.data?.error || 'Failed to load exams'))
      .finally(() => setLoading(false))
  }, [])

  const copy = async (text) => {
    try { await navigator.clipboard.writeText(text) } catch {}
  }

  const deleteExam = async (id) => {
    if (!confirm('Delete this exam? This cannot be undone.')) return
    try {
      await api.delete(`/exams/${id}`)
      setExams(prev => prev.filter(e => e._id !== id))
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete exam')
    }
  }
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Admin Dashboard</h1>
        <div className="flex gap-2">
          {user?.role === 'admin' ? (
            <>
              <Link to="/admin/faculty" className="px-3 py-1.5 rounded bg-gray-100 text-sm">Manage Faculty</Link>
              <Link to="/admin/students" className="px-3 py-1.5 rounded bg-gray-100 text-sm">Manage Students</Link>
              <Link to="/admin/create-exam" className="px-3 py-1.5 rounded bg-blue-600 text-white text-sm">Create Exam</Link>
              <Link to="/admin/create-exam?type=reexam" className="px-3 py-1.5 rounded bg-indigo-600 text-white text-sm">Create Re-Exam</Link>
              <Link to="/admin/upload-txt" className="px-3 py-1.5 rounded bg-green-600 text-white text-sm">Upload .txt</Link>
              <Link to="/admin/results" className="px-3 py-1.5 rounded bg-gray-100 text-sm">Results</Link>
            </>
          ) : (
            <>
              <Link to="/admin/create-options" className="px-3 py-1.5 rounded bg-blue-600 text-white text-sm">Create Exam</Link>
              <Link to="/admin/create-options?type=reexam" className="px-3 py-1.5 rounded bg-indigo-600 text-white text-sm">Create Re-Exam</Link>
            </>
          )}
        </div>
      </div>

      <div className="bg-white border rounded-lg p-4">
        <div className="font-medium mb-2">Recent Exams</div>
        {loading && <div className="text-sm text-gray-600">Loading...</div>}
        {error && <div className="text-sm text-red-600">{error}</div>}
        {!loading && !error && (
          exams.length === 0 ? (
            <div className="text-sm text-gray-600">No exams yet. Create one to get started.</div>
          ) : (
            <div className="grid md:grid-cols-2 gap-3">
              {exams.map(ex => (
                <div key={ex._id} className="border rounded p-3">
                  <div className="font-medium">{ex.title}</div>
                  <div className="text-xs text-gray-600">{ex.category} • {ex.durationMin} min</div>
                  <div className="mt-1 text-xs text-gray-700">Type: <span className="font-medium">{ex.examType || 'normal'}</span></div>
                  <div className="mt-2 text-xs">
                    <div>
                      <span className="text-gray-500">Login Exam OTP:</span> <span className="font-mono">{ex.loginCode || ex.code || ex._id}</span>
                      <button onClick={() => copy(ex.loginCode || ex.code || ex._id)} className="ml-2 px-2 py-0.5 text-xs rounded border">Copy</button>
                    </div>
                    <div className="mt-1">
                      <span className="text-gray-500">Resume Exam OTP:</span> <span className="font-mono">{ex.resumeCode || ex.loginCode || ex.code || ex._id}</span>
                      <button onClick={() => copy(ex.resumeCode || ex.loginCode || ex.code || ex._id)} className="ml-2 px-2 py-0.5 text-xs rounded border">Copy</button>
                    </div>
                  </div>
                  <div className="mt-2">
                    <button onClick={() => deleteExam(ex._id)} className="px-2 py-1 text-xs rounded bg-red-600 text-white">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  )
}
