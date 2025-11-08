import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'

export default function SetupAdmin() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [exists, setExists] = useState(null)
  const nav = useNavigate()

  useEffect(() => {
    api.get('/auth/admin-exists').then(({ data }) => {
      setExists(data.exists)
      if (data.exists) nav('/login/admin', { replace: true })
    }).catch(() => setExists(true))
  }, [nav])

  const onSubmit = (e) => {
    e.preventDefault()
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    setError('')
    setLoading(true)
    api.post('/auth/admin-setup', { username, password })
      .then(() => {
        nav('/login/admin', { replace: true })
      })
      .catch(err => setError(err.response?.data?.error || 'Setup failed'))
      .finally(() => setLoading(false))
  }

  if (exists === null) return <div>Checking setup...</div>
  if (exists) return null

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-semibold mb-2">Admin Setup</h1>
      <p className="text-sm text-gray-600 mb-4">Create the first admin account. This can be done only once.</p>
      <form onSubmit={onSubmit} className="bg-white border rounded shadow-sm p-6">
        {error && <div className="mb-3 text-sm text-red-600">{error}</div>}
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-blue-700 mb-1">Username</label>
            <input value={username} onChange={e=>setUsername(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="admin username" />
          </div>
          <div>
            <label className="block text-sm text-blue-700 mb-1">Password</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="password" />
          </div>
          <div>
            <label className="block text-sm text-blue-700 mb-1">Confirm Password</label>
            <input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="confirm password" />
          </div>
          <div className="flex justify-end">
            <button disabled={loading} className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-60">{loading ? 'Setting up...' : 'Create Admin'}</button>
          </div>
        </div>
      </form>
    </div>
  )
}
