import { useState, useEffect } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Users, BookOpen, BarChart2, MessageSquare,
  Ticket, ThumbsUp, LogOut, Sun, Moon, Menu, X, Bot, ChevronRight,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import Avatar from '../components/ui/Avatar'
import { cn } from '../utils'

const NAV_ITEMS = [
  { to: '/admin/dashboard', icon: <LayoutDashboard className="h-4.5 w-4.5" />, label: 'Dashboard' },
  { to: '/admin/users', icon: <Users className="h-4.5 w-4.5" />, label: 'Users' },
  { to: '/admin/knowledge', icon: <BookOpen className="h-4.5 w-4.5" />, label: 'Knowledge Base' },
  { to: '/admin/tickets', icon: <Ticket className="h-4.5 w-4.5" />, label: 'Tickets' },
  { to: '/admin/analytics', icon: <BarChart2 className="h-4.5 w-4.5" />, label: 'Analytics' },
  { to: '/admin/feedback', icon: <ThumbsUp className="h-4.5 w-4.5" />, label: 'Feedback' },
]

export default function AdminLayout({ children }) {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => { setSidebarOpen(false) }, [location.pathname])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-5 border-b border-white/10">
        <div className="h-8 w-8 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
          <Bot className="h-4.5 w-4.5 text-white" />
        </div>
        <div>
          <span className="text-sm font-bold text-white">SupportGenie</span>
          <span className="block text-[10px] text-amber-400 font-semibold">Admin Panel</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30 px-3 mb-2">Navigation</p>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn('sidebar-item', isActive ? 'active' : 'text-white/60 hover:text-white')
            }
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-4 border-t border-white/10 pt-3 space-y-1">
        <button
          onClick={toggleTheme}
          className="sidebar-item w-full text-white/60 hover:text-white"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
        <button
          onClick={handleLogout}
          className="sidebar-item w-full text-white/60 hover:text-red-400"
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </button>

        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl mt-2 bg-white/5">
          <Avatar user={user} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white truncate">{user?.full_name || user?.username}</p>
            <p className="text-[10px] text-amber-400 truncate">Administrator</p>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-[var(--bg-primary)] overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-60 bg-[var(--bg-sidebar)] shrink-0 flex-col">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed left-0 top-0 bottom-0 w-64 bg-[var(--bg-sidebar)] z-50 lg:hidden flex flex-col"
            >
              <div className="absolute top-3 right-3">
                <button onClick={() => setSidebarOpen(false)} className="rounded-lg p-1.5 text-white/60 hover:text-white">
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-card)] shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="rounded-xl p-2 hover:bg-surface-100 dark:hover:bg-surface-800">
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Bot className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-bold">Admin Panel</span>
          </div>
          <div className="flex-1" />
          <button onClick={toggleTheme} className="rounded-xl p-2 hover:bg-surface-100 dark:hover:bg-surface-800">
            {theme === 'dark' ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
          </button>
        </header>

        <main className="flex-1 overflow-y-auto bg-[var(--bg-secondary)]">
          {children}
        </main>
      </div>
    </div>
  )
}
