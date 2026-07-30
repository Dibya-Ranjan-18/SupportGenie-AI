import { useState, useEffect } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageSquare, History, Ticket, User, Settings, LogOut,
  Sun, Moon, Menu, X, Bot, ChevronRight, Plus
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import Avatar from '../components/ui/Avatar'
import { cn } from '../utils'

const NAV_ITEMS = [
  { to: '/chat', icon: <MessageSquare className="h-5 w-5" />, label: 'Chat & AI Assist' },
  { to: '/history', icon: <History className="h-5 w-5" />, label: 'Chat History' },
  { to: '/tickets', icon: <Ticket className="h-5 w-5" />, label: 'Support Tickets' },
  { to: '/profile', icon: <User className="h-5 w-5" />, label: 'My Account' },
  { to: '/settings', icon: <Settings className="h-5 w-5" />, label: 'Settings' },
]

// ─── Moved outside CustomerLayout to avoid remounting on every parent render ───
function SidebarContent({ user, onClose, onNewChat, location, navigate }) {
  return (
    <div className="flex flex-col h-full bg-[var(--bg-card)] border-r border-[var(--border)] text-[var(--text-primary)] select-none transition-colors duration-300">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="h-10 w-10 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow-indigo">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-500 ring-2 ring-[var(--bg-card)]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-extrabold tracking-tight text-[var(--text-primary)]">SupportGenie</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase bg-primary-500/10 text-primary-600 dark:text-primary-300 border border-primary-500/20">AI</span>
            </div>
            <span className="block text-xs text-[var(--text-muted)] font-medium">Enterprise Assistant</span>
          </div>
        </div>

        {/* Mobile close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 rounded-xl hover:bg-[var(--bg-tertiary)]"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Start New Chat Action */}
      <div className="px-4 pt-5 pb-3">
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-2xl bg-gradient-primary hover:opacity-95 text-white text-sm font-bold transition-all shadow-glow-indigo active:scale-95"
        >
          <Plus className="h-4.5 w-4.5" />
          <span>New Conversation</span>
        </button>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 py-3 overflow-y-auto space-y-1.5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] px-3.5 mb-3">
          Navigation
        </p>
        {NAV_ITEMS.map((item) => {
          if (item.to === '/chat') {
            const isChatActive = location.pathname.startsWith('/chat')
            return (
              <button
                key={item.to}
                onClick={() => {
                  const lastSessionId = localStorage.getItem('last_active_session_id')
                  if (lastSessionId) {
                    navigate(`/chat/${lastSessionId}`)
                  } else {
                    navigate('/chat')
                  }
                }}
                className={cn(
                  'sidebar-item w-full text-left',
                  isChatActive
                    ? 'active'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
                )}
              >
                {item.icon}
                <span className="flex-1 truncate">{item.label}</span>
                {isChatActive && (
                  <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                )}
              </button>
            )
          }
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'sidebar-item',
                  isActive
                    ? 'active'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
                )
              }
            >
              {item.icon}
              <span className="flex-1 truncate">{item.label}</span>
            </NavLink>
          )
        })}
      </nav>

      {/* Footer: User Profile Card */}
      <div className="px-4 py-4 border-t border-[var(--border)]">
        <div
          onClick={() => navigate('/profile')}
          className="flex items-center gap-3 p-3 rounded-2xl bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] transition-all cursor-pointer border border-[var(--border)]"
        >
          <Avatar user={user} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-[var(--text-primary)] truncate">
              {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : user?.username}
            </p>
            <p className="text-[11px] text-[var(--text-muted)] truncate">{user?.email}</p>
          </div>
          <ChevronRight className="h-4 w-4 text-[var(--text-muted)]" />
        </div>
      </div>
    </div>
  )
}

export default function CustomerLayout({ children }) {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Close mobile drawer on route change
  useEffect(() => { setSidebarOpen(false) }, [location.pathname])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const handleNewChat = () => {
    localStorage.removeItem('last_active_session_id')
    navigate('/chat')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-primary)]">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-72 shrink-0 h-full">
        <SidebarContent
          user={user}
          onClose={null}
          onNewChat={handleNewChat}
          location={location}
          navigate={navigate}
        />
      </aside>

      {/* Mobile Sidebar Modal */}
      <AnimatePresence>
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="absolute top-0 bottom-0 left-0 w-80 max-w-[85vw]"
            >
              <SidebarContent
                user={user}
                onClose={() => setSidebarOpen(false)}
                onNewChat={handleNewChat}
                location={location}
                navigate={navigate}
              />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Mobile Header Bar */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-card)] shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-xl border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-xl bg-gradient-primary flex items-center justify-center">
                <Bot className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="font-bold text-sm text-[var(--text-primary)]">SupportGenie AI</span>
            </div>
          </div>

          <button
            onClick={() => navigate('/profile')}
            className="p-1 rounded-full border border-[var(--border)]"
          >
            <Avatar user={user} size="xs" />
          </button>
        </header>

        {/* Page Content Viewport */}
        <main className="flex-1 overflow-hidden relative">
          {children}
        </main>
      </div>
    </div>
  )
}
