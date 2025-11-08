import { Routes, Route, Navigate, Link } from 'react-router-dom'
import StudentDashboard from './pages/StudentDashboard'
import Exam from './pages/Exam'
import AdminDashboard from './pages/AdminDashboard'
import CreateExam from './pages/CreateExam'
import CreateExamOptions from './pages/CreateExamOptions'
import NotFound from './pages/NotFound'
import ProtectedRoute from './components/ProtectedRoute'
import useAuth from './store/auth'
import { useLocation } from 'react-router-dom'
import Home from './pages/Home'
import StudentLogin from './pages/StudentLogin'
import FacultyLogin from './pages/FacultyLogin'
import AdminLogin from './pages/AdminLogin'
import ReExamLogin from './pages/ReExamLogin'
import UploadExamTxt from './pages/UploadExamTxt'
import ManageFaculty from './pages/ManageFaculty'
import SetupAdmin from './pages/SetupAdmin'
import ManageAdmins from './pages/ManageAdmins'
import FacultyResults from './pages/FacultyResults'
import ManageStudents from './pages/ManageStudents'

function Nav() {
  const { user, logout } = useAuth()
  return (
    <nav className="border-b bg-white">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
        <Link to="/" className="font-semibold text-lg text-blue-700">Online Examination Portal</Link>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="text-sm text-gray-600">{user.role}: {user.name}</span>
              <button className="px-3 py-1.5 rounded bg-gray-100 hover:bg-gray-200 text-sm" onClick={logout}>Logout</button>
            </>
          ) : (
            <Link to="/" className="px-3 py-1.5 rounded bg-blue-600 text-white text-sm">Home</Link>
          )}
        </div>
      </div>
    </nav>
  )
}

export default function App() {
  const { user } = useAuth()
  const location = useLocation()
  const hideNav = location.pathname === '/'
  return (
    <div className="min-h-screen flex flex-col">
      {!hideNav && <Nav />}
      <div className="flex-1 w-full">
        <Routes>
          <Route path="/" element={<Home />} />
          {/* Specific login pages */}
          <Route path="/login/student" element={<StudentLogin />} />
          <Route path="/login/faculty" element={<FacultyLogin />} />
          <Route path="/login/admin" element={<AdminLogin />} />
          <Route path="/login/reexam" element={<ReExamLogin />} />
          <Route path="/setup-admin" element={<SetupAdmin />} />

          <Route element={<ProtectedRoute allowed={["student", "admin"]} />}> 
            <Route path="/student" element={<StudentDashboard />} />
            <Route path="/exam/:examId" element={<Exam />} />
          </Route>

          <Route element={<ProtectedRoute allowed={["admin", "faculty"]} />}> 
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/create-options" element={<CreateExamOptions />} />
            <Route path="/admin/create-exam" element={<CreateExam />} />
            <Route path="/admin/upload-txt" element={<UploadExamTxt />} />
            <Route path="/admin/results" element={<FacultyResults />} />
          </Route>

          {/* Admin-only routes */}
          <Route element={<ProtectedRoute allowed={["admin"]} />}> 
            <Route path="/admin/faculty" element={<ManageFaculty />} />
            <Route path="/admin/admins" element={<ManageAdmins />} />
            <Route path="/admin/students" element={<ManageStudents />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </div>
  )
}
