import { useState } from 'react'
import useAuth from '../store/auth'
import api from '../utils/api'
import { useNavigate } from 'react-router-dom'

export default function ReExamLogin() {
  const [reg, setReg] = useState('')
  const [examCode, setExamCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login } = useAuth()
  const nav = useNavigate()
  const [mode, setMode] = useState('start') // 'start' | 'resume'

  const onSubmit = (e) => {
    e.preventDefault()
    setError('')
    const trimmedReg = (reg || '').trim()
    const trimmedCode = (examCode || '').trim()
    if (!trimmedReg) {
      const msg = 'Registration number required'
      setError(msg)
      alert(msg)
      return
    }
    if (!/^\d{9}$/.test(trimmedCode)) {
      const msg = 'Enter a valid 9-digit exam code'
      setError(msg)
      alert(msg)
      return
    }
    setLoading(true)
    api.post('/auth/reexam-login', { regNo: trimmedReg, examCode: trimmedCode })
      .then(({ data }) => {
        // data includes token, user, examId, examType
        login(data.user, data.token)
        if (data.examId) return nav(`/exam/${data.examId}`, { replace: true })
        nav('/student', { replace: true })
      })
      .catch((err) => {
        const msg = err.response?.data?.error || 'Invalid code or login failed'
        setError(msg)
        alert(msg)
      })
      .finally(() => setLoading(false))
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white border rounded-2xl shadow p-8">
        <h1 className="text-center text-2xl font-semibold text-gray-800">Re-Exam Student Login</h1>
        <p className="text-center text-xs text-gray-500 mt-1">Note: Registration No & 9-digit Exam Code</p>

        <div className="flex items-center justify-center gap-4 mt-5">
          <button type="button" onClick={() => setMode('start')} className={`text-sm font-medium ${mode==='start' ? 'text-blue-700' : 'text-blue-600'}`}>Start Exam</button>
          <span className="text-gray-300">|</span>
          <button type="button" onClick={() => setMode('resume')} className={`text-sm font-medium ${mode==='resume' ? 'text-blue-700' : 'text-blue-600'}`}>Resume Exam</button>
        </div>

        <form onSubmit={onSubmit} className="mt-6">
          <div className="text-sm text-gray-600 mb-4 text-center">Enter your Register No and Code to continue.</div>
          {error && <div className="mb-3 text-sm text-red-600 text-center">{error}</div>}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Register No</label>
              <input value={reg} onChange={e=>setReg(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. 21CS1234" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Exam Code</label>
              <input value={examCode} onChange={e=>setExamCode(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="9-digit Code" maxLength={9} />
            </div>
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500">Mode: {mode === 'resume' ? 'Resume' : 'Start'}</div>
              <button disabled={loading} className="inline-flex justify-center px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60">{loading ? 'Logging in...' : 'Login'}</button>
            </div>
          </div>
        </form>
        <div className="text-center text-xs text-gray-400 mt-6">© 2025. All rights reserved</div>
      </div>
    </div>
  )
}
