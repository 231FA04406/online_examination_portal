import { Navigate, Outlet, useLocation } from 'react-router-dom'
import useAuth from '../store/auth'

export default function ProtectedRoute({ allowed }) {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) {
    return <Navigate to="/" replace state={{ from: location }} />
  }
  if (allowed && !allowed.includes(user.role)) {
    return <Navigate to="/" replace />
  }
  return <Outlet />
}
