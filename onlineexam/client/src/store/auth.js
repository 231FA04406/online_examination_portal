import { create } from 'zustand'

const stored = (() => {
  try { return JSON.parse(localStorage.getItem('user')) } catch { return null }
})()
const storedToken = (() => {
  try { return localStorage.getItem('token') || null } catch { return null }
})()

const useAuth = create((set) => ({
  user: stored,
  token: storedToken,
  login: (user, token) => {
    localStorage.setItem('user', JSON.stringify(user))
    if (token) localStorage.setItem('token', token)
    set({ user, token })
  },
  logout: () => {
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    set({ user: null })
  }
}))

export default useAuth
