import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, Bot, ArrowRight, Sparkles, Sun, Moon } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'

export default function LoginPage() {
  const { login } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { email: '', password: '', remember_me: false }
  })

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const user = await login(data)
      toast.success(`Welcome back, ${user.full_name || user.username}!`)
      navigate(user.role === 'admin' ? '/admin/dashboard' : '/chat', { replace: true })
    } catch (err) {
      const msg = err.response?.data?.non_field_errors?.[0]
        || err.response?.data?.detail
        || 'Login failed. Please check your credentials.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-300 relative">
      {/* Desktop Theme Toggle button */}
      <button
        onClick={toggleTheme}
        title={theme === 'dark' ? 'Switch Light Mode' : 'Switch Dark Mode'}
        className="hidden lg:flex absolute top-6 right-6 z-30 p-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] shadow-card transition-all active:scale-95 items-center gap-2 text-xs font-bold"
      >
        {theme === 'dark' ? (
          <>
            <Sun className="h-4 w-4 text-amber-400 shrink-0" />
            <span>Light Mode</span>
          </>
        ) : (
          <>
            <Moon className="h-4 w-4 text-indigo-500 shrink-0" />
            <span>Dark Mode</span>
          </>
        )}
      </button>

      {/* Left Hero Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#07090e] dark:bg-[#030712] flex-col justify-between p-12 relative overflow-hidden text-white">
        {/* Ambient Radial Gradient Glows */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900/40 via-[#07090e] to-violet-900/30" />
        <div className="absolute top-1/4 left-1/4 h-72 w-72 bg-primary-500/15 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 h-72 w-72 bg-violet-500/15 rounded-full blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow-indigo">
              <Bot className="h-5.5 w-5.5 text-white" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-white">SupportGenie AI</span>
          </div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="h-5 w-5 text-primary-400" />
            <span className="text-xs font-bold text-primary-400 uppercase tracking-widest">Enterprise RAG Intelligence</span>
          </div>
          <h2 className="text-4xl font-extrabold text-white leading-tight mb-4 tracking-tight">
            Instant AI Answers from your Company Documents
          </h2>
          <p className="text-surface-300 text-base leading-relaxed font-medium">
            SupportGenie AI leverages real-time vector embeddings to deliver accurate, citation-backed responses for all support inquiries.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-4">
            {[
              { label: 'Response Latency', value: '< 1s' },
              { label: 'Accuracy Score', value: '99.4%' },
              { label: 'Supported Formats', value: 'PDF, DOCX, TXT' },
              { label: 'Vector Engine', value: 'FAISS Active' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/5 rounded-2xl p-4 border border-white/10 backdrop-blur-md">
                <p className="text-xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-surface-400 mt-0.5 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <p className="text-xs text-surface-400 font-medium">© 2026 SupportGenie AI · Enterprise Platform</p>
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md"
        >
          {/* Mobile brand header with inline Theme Toggle */}
          <div className="flex items-center justify-between gap-3 mb-6 lg:hidden">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-9 w-9 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow-indigo shrink-0">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <span className="text-base font-extrabold text-[var(--text-primary)] truncate">SupportGenie AI</span>
            </div>

            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch Light Mode' : 'Switch Dark Mode'}
              className="p-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] shadow-sm transition-all active:scale-95 shrink-0"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-indigo-500" />}
            </button>
          </div>

          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] mb-1.5 tracking-tight">Welcome Back 👋</h1>
            <p className="text-[var(--text-secondary)] text-xs sm:text-sm font-medium">Sign in to access your AI chat dashboard</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input
              id="email"
              label="Email address"
              type="email"
              placeholder="you@company.com"
              icon={<Mail className="h-4 w-4 text-[var(--text-muted)]" />}
              error={errors.email?.message}
              {...register('email', {
                required: 'Email is required',
                pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' }
              })}
            />

            <Input
              id="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              icon={<Lock className="h-4 w-4 text-[var(--text-muted)]" />}
              iconRight={
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
              error={errors.password?.message}
              {...register('password', { required: 'Password is required' })}
            />

            <div className="flex items-center justify-between gap-2 flex-wrap mt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="rounded-lg border-[var(--border)] text-primary-600 focus:ring-primary-500"
                  {...register('remember_me')}
                />
                <span className="text-xs font-semibold text-[var(--text-secondary)]">Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-xs text-primary-600 hover:text-primary-700 font-bold">
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              variant="primary"
              loading={loading}
              className="w-full mt-2 py-3 rounded-2xl font-bold shadow-glow-indigo"
              iconRight={!loading && <ArrowRight className="h-4 w-4" />}
            >
              Sign In
            </Button>
          </form>

          <div className="mt-6 text-center border-t border-[var(--border)] pt-5">
            <p className="text-xs text-[var(--text-secondary)] font-medium">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary-600 hover:text-primary-700 font-bold">
                Create Account
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
