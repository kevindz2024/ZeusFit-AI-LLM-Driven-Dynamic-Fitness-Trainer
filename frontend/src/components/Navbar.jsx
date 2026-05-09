import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navItemClass = ({ isActive }) =>
  'rounded-lg px-3 py-2 text-sm ' +
  (isActive ? 'bg-zinc-800 text-white' : 'text-zinc-300 hover:bg-zinc-900 hover:text-white')

export default function Navbar() {
  const { user, logout } = useAuth()

  return (
    <div className="sticky top-0 z-20 border-b border-zinc-900 bg-zinc-950/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-violet-600 text-sm font-black">
            Z
          </div>
          <div>
            <div className="text-sm font-semibold leading-4 text-white">ZeusFit AI</div>
            <div className="text-xs text-zinc-400">Dynamic Fitness Trainer</div>
          </div>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          <NavLink to="/dashboard" className={navItemClass}>
            Dashboard
          </NavLink>
          <NavLink to="/workout" className={navItemClass}>
            Workout
          </NavLink>
          <NavLink to="/diet" className={navItemClass}>
            Diet
          </NavLink>
          <NavLink to="/chatbot" className={navItemClass}>
            Chatbot
          </NavLink>
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <div className="hidden text-sm text-zinc-300 sm:block">
                Hi, <span className="font-semibold text-white">{user.name}</span>
              </div>
              <button
                onClick={logout}
                className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 hover:bg-zinc-800"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 hover:bg-zinc-800"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="rounded-xl bg-violet-600 px-3 py-2 text-sm font-semibold text-white hover:bg-violet-500"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

