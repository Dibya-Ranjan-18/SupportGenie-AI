import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sun, Moon, Bell, Shield, Palette, LogOut } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import CustomerLayout from '../layouts/CustomerLayout'
import CustomSelect from '../components/ui/CustomSelect'
import { cn } from '../utils'

const NOTIFICATION_PREFS_KEY = 'sg_notification_prefs'

const DEFAULT_PREFS = {
  ticket_updates: true,
  chat_responses: true,
  system_announcements: true,
}

function loadPrefs() {
  try {
    const stored = localStorage.getItem(NOTIFICATION_PREFS_KEY)
    return stored ? { ...DEFAULT_PREFS, ...JSON.parse(stored) } : DEFAULT_PREFS
  } catch {
    return DEFAULT_PREFS
  }
}

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme()
  const { logout, user } = useAuth()
  const navigate = useNavigate()
  const [notifPrefs, setNotifPrefs] = useState(loadPrefs)
  const [sessionTimeout, setSessionTimeout] = useState('1d')

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const toggleNotif = (key) => {
    setNotifPrefs((prev) => {
      const updated = { ...prev, [key]: !prev[key] }
      try {
        localStorage.setItem(NOTIFICATION_PREFS_KEY, JSON.stringify(updated))
      } catch {}
      return updated
    })
  }

  const NOTIFICATION_OPTIONS = [
    { key: 'ticket_updates', label: 'Ticket updates', desc: 'Get notified when your ticket status changes' },
    { key: 'chat_responses', label: 'Chat responses', desc: 'Receive alerts for new chat responses' },
    { key: 'system_announcements', label: 'System announcements', desc: 'Platform updates and maintenance notices' },
  ]

  return (
    <CustomerLayout>
      <div className="overflow-y-auto h-full">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
          <h1 className="text-xl sm:text-2xl font-bold mb-1">Settings</h1>
          <p className="text-[var(--text-secondary)] text-xs sm:text-sm mb-6 sm:mb-8">Customize your SupportGenie AI experience and manage account controls</p>

          {/* Appearance & Theme Toggle */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-4 sm:p-6 mb-6">
            <h2 className="text-base font-semibold mb-4 sm:mb-5 flex items-center gap-2">
              <Palette className="h-4 w-4 text-primary-500" /> Appearance & Theme
            </h2>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">Interface Mode</p>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  {theme === 'dark' ? 'Using dark theme — optimal for low-light environments' : 'Using light theme — clean & high contrast'}
                </p>
              </div>
              <button
                onClick={toggleTheme}
                className={cn(
                  'relative h-11 sm:h-12 rounded-xl border-2 transition-all shrink-0 self-start sm:self-auto',
                  theme === 'dark' ? 'border-primary-500 w-28' : 'border-[var(--border)] w-28'
                )}
              >
                <div className="grid grid-cols-2 gap-0 h-full">
                  <div className={cn('flex flex-col items-center justify-center gap-0.5 rounded-l-lg transition-all', theme === 'light' && 'bg-primary-600')}>
                    <Sun className={cn('h-3.5 w-3.5', theme === 'light' ? 'text-white' : 'text-[var(--text-muted)]')} />
                    <span className={cn('text-[10px] font-medium', theme === 'light' ? 'text-white' : 'text-[var(--text-muted)]')}>Light</span>
                  </div>
                  <div className={cn('flex flex-col items-center justify-center gap-0.5 rounded-r-lg transition-all', theme === 'dark' && 'bg-primary-600')}>
                    <Moon className={cn('h-3.5 w-3.5', theme === 'dark' ? 'text-white' : 'text-[var(--text-muted)]')} />
                    <span className={cn('text-[10px] font-medium', theme === 'dark' ? 'text-white' : 'text-[var(--text-muted)]')}>Dark</span>
                  </div>
                </div>
              </button>
            </div>
          </motion.div>

          {/* Notifications */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card p-4 sm:p-6 mb-6">
            <h2 className="text-base font-semibold mb-4 sm:mb-5 flex items-center gap-2">
              <Bell className="h-4 w-4 text-amber-500" /> Notifications
            </h2>
            {NOTIFICATION_OPTIONS.map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between gap-3 py-3 border-b border-[var(--border)] last:border-0">
                <div className="min-w-0 pr-2">
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-xs text-[var(--text-muted)] truncate sm:whitespace-normal">{desc}</p>
                </div>
                <button
                  role="switch"
                  aria-checked={notifPrefs[key]}
                  onClick={() => toggleNotif(key)}
                  className="relative inline-flex items-center cursor-pointer focus:outline-none shrink-0"
                >
                  <div className={cn(
                    'w-9 h-5 rounded-full transition-colors',
                    notifPrefs[key] ? 'bg-primary-600' : 'bg-surface-300 dark:bg-surface-700'
                  )}>
                    <span className={cn(
                      'absolute top-0.5 left-0.5 bg-white rounded-full h-4 w-4 transition-transform shadow',
                      notifPrefs[key] ? 'translate-x-4' : 'translate-x-0'
                    )} />
                  </div>
                </button>
              </div>
            ))}
          </motion.div>

          {/* Security */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card p-4 sm:p-6 mb-6">
            <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-500" /> Security
            </h2>
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 py-2">
                <div>
                  <p className="text-sm font-medium">Session timeout</p>
                  <p className="text-xs text-[var(--text-muted)]">Automatically log out after inactivity</p>
                </div>
                <div className="w-full sm:w-36">
                  <CustomSelect
                    value={sessionTimeout}
                    onChange={setSessionTimeout}
                    options={[
                      { value: '1h', label: '⏱️ 1 hour' },
                      { value: '4h', label: '⏱️ 4 hours' },
                      { value: '1d', label: '⏱️ 1 day' },
                      { value: 'never', label: '♾️ Never' },
                    ]}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between py-2 border-t border-[var(--border)]">
                <div>
                  <p className="text-sm font-medium">Two-factor authentication</p>
                  <p className="text-xs text-[var(--text-muted)]">Add an extra layer of security</p>
                </div>
                <span className="badge-warning badge text-xs shrink-0 ml-2">Coming soon</span>
              </div>
            </div>
          </motion.div>

          {/* Account Session & Sign Out */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card p-4 sm:p-6 border-red-500/20">
            <h2 className="text-base font-semibold mb-2 text-red-500 flex items-center gap-2">
              <LogOut className="h-4 w-4" /> Account Session
            </h2>
            <p className="text-xs text-[var(--text-muted)] mb-5">
              Logged in as <strong className="text-[var(--text-primary)]">{user?.email || user?.username}</strong>. Click below to securely sign out of your account.
            </p>
            <button
              onClick={handleLogout}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 active:scale-95 text-white text-sm font-bold transition-all shadow-glow"
            >
              <LogOut className="h-4 w-4" />
              Sign Out of Account
            </button>
          </motion.div>
        </div>
      </div>
    </CustomerLayout>
  )
}
