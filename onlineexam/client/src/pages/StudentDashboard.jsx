import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import api from '../utils/api'
import useAuth from '../store/auth'

export default function StudentDashboard() {
  const [exams, setExams] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { user } = useAuth()

  useEffect(() => {
    setLoading(true)
    api.get('/exams')
      .then(({ data }) => setExams(data))
      .catch(err => setError(err.response?.data?.error || 'Failed to load exams'))
      .finally(() => setLoading(false))
  }, [])

  const hasDraft = (examId) => {
    try {
      const key = user ? `examDraft:${user.id || user._id || user.name}:${examId}` : `examDraft:${examId}`
      return !!localStorage.getItem(key)
    } catch {
      return false
    }
  }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Available Exams</h1>

      {loading && <div className="text-sm text-gray-600">Loading...</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}
      {!loading && !error && (
        <div className="grid sm:grid-cols-2 gap-4">
          {exams.length === 0 && <div className="text-sm text-gray-600">No exams available.</div>}
          {exams.map(x => (
            <div key={x._id} className="bg-white border rounded-lg p-4">
              <div className="font-semibold">{x.title}</div>
              <div className="text-sm text-gray-600">{x.category} • {x.durationMin} min</div>
              {hasDraft(x._id) ? (
                <Link to={`/exam/${x._id}`} className="inline-block mt-3 px-3 py-1.5 rounded bg-yellow-600 text-white text-sm">Resume</Link>
              ) : (
                <Link to={`/exam/${x._id}`} className="inline-block mt-3 px-3 py-1.5 rounded bg-blue-600 text-white text-sm">Start</Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
