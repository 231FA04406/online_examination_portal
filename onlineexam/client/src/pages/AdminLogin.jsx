import { useState } from 'react'
import useAuth from '../store/auth'
import api from '../utils/api'
import { useNavigate } from 'react-router-dom'

export default function AdminLogin() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const { login } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const nav = useNavigate()

  const onSubmit = (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    api.post('/auth/admin-login', { username, password })
      .then(({ data }) => {
        login(data.user, data.token)
        nav('/admin', { replace: true })
      })
      .catch(err => setError(err.response?.data?.error || 'Login failed'))
      .finally(() => setLoading(false))
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white border rounded-2xl shadow p-8">
        <h1 className="text-center text-2xl font-semibold text-gray-800">Admin Login</h1>
        <p className="text-center text-xs text-gray-500 mt-1">Note: Username & Password</p>

        <form onSubmit={onSubmit} className="mt-6">
          <div className="text-sm text-gray-600 mb-4 text-center">Enter your admin credentials to continue.</div>
          {error && <div className="mb-3 text-sm text-red-600 text-center">{error}</div>}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input value={username} onChange={e=>setUsername(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Username" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Password" />
            </div>
            <div className="flex justify-end">
              <button disabled={loading} className="inline-flex justify-center px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60">{loading ? 'Signing in...' : 'Submit'}</button>
            </div>
          </div>
        </form>
        <div className="text-center text-xs text-gray-400 mt-6">© 2025. All rights reserved</div>
      </div>
    </div>
  )
}
