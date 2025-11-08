import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import api from '../utils/api'
import { ShieldCheck, User2, Gauge, RotateCcw } from 'lucide-react'

export default function Home() {
  const [adminExists, setAdminExists] = useState(true)
  useEffect(() => {
    api.get('/auth/admin-exists')
      .then(({ data }) => setAdminExists(!!data.exists))
      .catch(() => setAdminExists(true))
  }, [])
  return (
    <div className="min-h-screen bg-blue-500">
      <header className="w-full bg-blue-600 text-white">
        <div className="w-full px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/20 rounded" />
            <div className="font-semibold">Online Examination Portal</div>
          </div>
          <Link to="/" className="px-3 py-1.5 rounded bg-white/10 hover:bg-white/20 text-sm">HOME</Link>
        </div>
      </header>

      <section className="bg-gradient-to-r from-blue-500 to-blue-400">
        <div className="w-full grid md:grid-cols-2 gap-6 px-4 py-10 items-center">
          <div>
            <div className="relative rounded overflow-hidden">
              <img className="w-full h-[260px] object-cover" src="https://images.unsplash.com/photo-1513258496099-48168024aec0?q=80&w=1600&auto=format&fit=crop" alt="Exam" />
            </div>
          </div>
          <div className="text-white text-center md:text-left">
            <div className="text-[44px] md:text-[56px] leading-none font-extrabold tracking-wide">ONLINE</div>
            <div className="mt-2 text-[44px] md:text-[56px] leading-none font-extrabold tracking-wide">EXAMINATION PORTAL</div>
          </div>
        </div>
      </section>

      <section className="bg-blue-500">
        <div className="w-full px-4 py-8">
          <div className="mb-4 p-3 border rounded bg-yellow-50 text-sm text-yellow-800">
            {adminExists ? (
              <>
                Admin is already configured. You can <Link to="/setup-admin" className="underline font-medium">open Setup Admin</Link> to review or you'll be redirected to Admin Login.
              </>
            ) : (
              <>
                No admin is configured yet. <Link to="/setup-admin" className="underline font-medium">Click here to set up the Admin</Link>.
              </>
            )}
          </div>
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
            <Tile to="/login/student" title="Student Login" icon={<ShieldCheck className="w-8 h-8 text-blue-600" />} />
            <Tile to="/login/faculty" title="Faculty Login" icon={<User2 className="w-8 h-8 text-blue-600" />} />
            <Tile to="/login/admin" title="Admin Login" icon={<Gauge className="w-8 h-8 text-blue-600" />} />
            <Tile to="/login/reexam" title="Re-Exam Student Login" icon={<RotateCcw className="w-8 h-8 text-blue-600" />} />
          </div>
        </div>
      </section>

      <footer className="text-center text-xs text-gray-100 py-6">ALL RIGHTS RESERVED</footer>
    </div>
  )
}

function Tile({ to, title, icon }) {
  return (
    <Link to={to} className="bg-white/95 hover:bg-white transition rounded-lg p-4 border shadow-sm flex items-center gap-4">
      <div className="w-12 h-12 rounded-full bg-blue-100 grid place-items-center">
        {icon}
      </div>
      <div>
        <div className="font-semibold">{title}</div>
        <div className="text-xs text-gray-500">Click Here</div>
      </div>
    </Link>
  )
}
