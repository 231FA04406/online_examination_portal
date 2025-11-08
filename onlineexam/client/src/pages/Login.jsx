import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import useAuth from '../store/auth'

export default function Login() {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('student')
  const { login } = useAuth()
  const nav = useNavigate()
  const loc = useLocation()

  const onSubmit = (e) => {
    e.preventDefault()
    // Placeholder login; replace with backend auth
    const mockUser = { id: 'u1', name: email.split('@')[0] || 'User', role }
    login(mockUser)
    const to = loc.state?.from?.pathname || (role === 'admin' ? '/admin' : '/student')
    nav(to, { replace: true })
  }

  return (
    <div className="max-w-md mx-auto bg-white border rounded-lg p-6 shadow-sm">
      <h1 className="text-xl font-semibold mb-4">Login</h1>
      <form className="space-y-4" onSubmit={onSubmit}>
        <div>
          <label className="block text-sm mb-1">Email</label>
          <input value={email} onChange={e => setEmail(e.target.value)} type="email" required className="w-full border rounded px-3 py-2" placeholder="you@college.edu" />
        </div>
        <div>
          <label className="block text-sm mb-1">Role</label>
          <select value={role} onChange={e => setRole(e.target.value)} className="w-full border rounded px-3 py-2">
            <option value="student">Student</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <button className="w-full bg-blue-600 text-white rounded px-3 py-2">Sign In</button>
      </form>
    </div>
  )
}
