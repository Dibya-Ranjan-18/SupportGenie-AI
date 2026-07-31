import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Bot, ArrowLeft, CheckCircle, Shield, Lock, Eye, EyeOff, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { authService } from '../../services'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'

/* ── Step indicators ─────────────────────────────────────────────── */
const STEPS = ['Email', 'Verify OTP', 'New Password']

function StepDots({ current }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {STEPS.map((label, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className={`flex items-center justify-center h-7 w-7 rounded-full text-xs font-bold transition-all duration-300 ${
            i < current ? 'bg-emerald-500 text-white' :
            i === current ? 'bg-primary-600 text-white shadow-glow' :
            'bg-[var(--border)] text-[var(--text-secondary)]'
          }`}>
            {i < current ? <CheckCircle className="h-3.5 w-3.5" /> : i + 1}
          </div>
          <span className={`text-xs font-medium hidden sm:block ${
            i === current ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'
          }`}>{label}</span>
          {i < STEPS.length - 1 && (
            <div className={`h-px w-6 sm:w-10 transition-all duration-300 ${i < current ? 'bg-emerald-500' : 'bg-[var(--border)]'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

/* ── OTP boxes ───────────────────────────────────────────────────── */
function OTPInput({ value, onChange }) {
  const refs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()]

  const handleKey = (i, e) => {
    if (e.key === 'Backspace') {
      if (value[i]) {
        const arr = value.split('')
        arr[i] = ''
        onChange(arr.join(''))
      } else if (i > 0) {
        refs[i - 1].current?.focus()
      }
    } else if (e.key === 'ArrowLeft' && i > 0) {
      refs[i - 1].current?.focus()
    } else if (e.key === 'ArrowRight' && i < 5) {
      refs[i + 1].current?.focus()
    }
  }

  const handleChange = (i, e) => {
    const char = e.target.value.replace(/\D/g, '').slice(-1)
    const arr = (value.padEnd(6, ' ')).split('')
    arr[i] = char || ' '
    const next = arr.join('')
    onChange(next.trimEnd())
    if (char && i < 5) refs[i + 1].current?.focus()
  }

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    onChange(pasted)
    const focusIdx = Math.min(pasted.length, 5)
    refs[focusIdx].current?.focus()
    e.preventDefault()
  }

  return (
    <div className="flex gap-2 sm:gap-3 justify-center">
      {refs.map((ref, i) => (
        <input
          key={i}
          ref={ref}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ''}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKey(i, e)}
          onPaste={handlePaste}
          className={`
            h-12 w-10 sm:h-14 sm:w-12 rounded-xl border-2 text-center text-xl font-bold
            bg-[var(--bg-input)] text-[var(--text-primary)]
            transition-all duration-200 outline-none
            ${value[i]
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
              : 'border-[var(--border)] focus:border-primary-400'}
          `}
          autoFocus={i === 0}
        />
      ))}
    </div>
  )
}

/* ── Main page ───────────────────────────────────────────────────── */
export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)          // 0=email, 1=otp, 2=password, 3=done
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showConfirmPw, setShowConfirmPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)

  // Countdown for resend
  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  /* Step 1: Send OTP */
  const sendOTP = async (e) => {
    e && e.preventDefault()
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      return toast.error('Enter a valid email address.')
    }
    setLoading(true)
    try {
      await authService.forgotPassword(email.trim())
      toast.success('OTP sent! Check your inbox.')
      setStep(1)
      setCountdown(60)
    } catch (err) {
      const resData = err.response?.data
      const msg = typeof resData === 'string'
        ? resData
        : (resData?.error || resData?.message || (typeof resData === 'object' ? Object.values(resData).flat()?.[0] : null) || 'Something went wrong. Please try again.')
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  /* Step 2: Verify OTP */
  const verifyOTP = async (e) => {
    e && e.preventDefault()
    if (otp.replace(/\s/g, '').length < 6) {
      return toast.error('Enter the full 6-digit OTP.')
    }
    setLoading(true)
    try {
      const res = await authService.verifyOTP(email.trim(), otp.trim())
      setResetToken(res.data.token)
      toast.success('OTP verified!')
      setStep(2)
    } catch (err) {
      const msg = err.response?.data?.error || 'Invalid or expired OTP.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  /* Step 3: Reset password */
  const resetPassword = async (e) => {
    e && e.preventDefault()
    if (password.length < 8) return toast.error('Password must be at least 8 characters.')
    if (password !== confirmPassword) return toast.error('Passwords do not match.')
    setLoading(true)
    try {
      await authService.resetPassword({ token: resetToken, new_password: password, new_password_confirm: confirmPassword })
      setStep(3)
    } catch (err) {
      const msg = err.response?.data?.error || 'Reset failed. Please start over.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const slideVariants = {
    initial: { opacity: 0, x: 30 },
    animate: { opacity: 1, x: 0, transition: { duration: 0.3 } },
    exit:    { opacity: 0, x: -30, transition: { duration: 0.2 } },
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] px-4 py-10">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">

        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-8 justify-center">
          <div className="h-10 w-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
            <Bot className="h-5.5 w-5.5 text-white" />
          </div>
          <span className="text-xl font-bold">SupportGenie AI</span>
        </div>

        <div className="card p-6 sm:p-8">
          {step < 3 && <StepDots current={step} />}

          <AnimatePresence mode="wait">

            {/* ── Step 0: Enter Email ── */}
            {step === 0 && (
              <motion.div key="step-email" variants={slideVariants} initial="initial" animate="animate" exit="exit">
                <div className="text-center mb-6">
                  <div className="h-14 w-14 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mx-auto mb-4">
                    <Mail className="h-7 w-7 text-primary-600" />
                  </div>
                  <h1 className="text-2xl font-bold">Forgot Password?</h1>
                  <p className="text-[var(--text-secondary)] text-sm mt-1">Enter your email to receive a 6-digit OTP</p>
                </div>
                <form onSubmit={sendOTP} className="flex flex-col gap-4">
                  <Input
                    label="Email address"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    icon={<Mail className="h-4 w-4" />}
                    required
                  />
                  <Button type="submit" variant="primary" loading={loading} className="w-full mt-1">
                    Send OTP
                  </Button>
                </form>
                <p className="mt-5 text-center text-sm text-[var(--text-secondary)]">
                  <Link to="/login" className="text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-1 justify-center">
                    <ArrowLeft className="h-4 w-4" /> Back to login
                  </Link>
                </p>
              </motion.div>
            )}

            {/* ── Step 1: Enter OTP ── */}
            {step === 1 && (
              <motion.div key="step-otp" variants={slideVariants} initial="initial" animate="animate" exit="exit">
                <div className="text-center mb-6">
                  <div className="h-14 w-14 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mx-auto mb-4">
                    <Shield className="h-7 w-7 text-violet-600" />
                  </div>
                  <h2 className="text-2xl font-bold">Enter OTP</h2>
                  <p className="text-[var(--text-secondary)] text-sm mt-1">
                    We sent a 6-digit code to <span className="font-semibold text-[var(--text-primary)]">{email}</span>
                  </p>
                </div>

                <form onSubmit={verifyOTP} className="flex flex-col gap-6">
                  <OTPInput value={otp} onChange={setOtp} />

                  <Button type="submit" variant="primary" loading={loading} className="w-full" disabled={otp.replace(/\s/g, '').length < 6}>
                    Verify OTP
                  </Button>
                </form>

                <div className="mt-5 text-center">
                  {countdown > 0 ? (
                    <p className="text-sm text-[var(--text-secondary)]">
                      Resend OTP in <span className="font-semibold text-primary-600">{countdown}s</span>
                    </p>
                  ) : (
                    <button
                      onClick={sendOTP}
                      disabled={loading}
                      className="text-sm text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-1 mx-auto"
                    >
                      <RefreshCw className="h-3.5 w-3.5" /> Resend OTP
                    </button>
                  )}
                  <button onClick={() => { setStep(0); setOtp('') }} className="mt-3 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1 mx-auto">
                    <ArrowLeft className="h-3 w-3" /> Change email
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── Step 2: New Password ── */}
            {step === 2 && (
              <motion.div key="step-password" variants={slideVariants} initial="initial" animate="animate" exit="exit">
                <div className="text-center mb-6">
                  <div className="h-14 w-14 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-4">
                    <Lock className="h-7 w-7 text-emerald-600" />
                  </div>
                  <h2 className="text-2xl font-bold">Set New Password</h2>
                  <p className="text-[var(--text-secondary)] text-sm mt-1">Choose a strong password for your account</p>
                </div>
                <form onSubmit={resetPassword} className="flex flex-col gap-4">
                  <Input
                    label="New password"
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    icon={<Lock className="h-4 w-4" />}
                    iconRight={
                      <button type="button" onClick={() => setShowPw(!showPw)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                        {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    }
                    required
                  />
                  <Input
                    label="Confirm password"
                    type={showConfirmPw ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    icon={<Lock className="h-4 w-4" />}
                    iconRight={
                      <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                        {showConfirmPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    }
                    error={confirmPassword && password !== confirmPassword ? 'Passwords do not match' : ''}
                    required
                  />
                  {/* Password strength bar */}
                  {password && (
                    <div className="flex gap-1">
                      {[8, 10, 12].map((len, i) => (
                        <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${password.length >= len ? (i === 0 ? 'bg-orange-400' : i === 1 ? 'bg-yellow-400' : 'bg-emerald-500') : 'bg-[var(--border)]'}`} />
                      ))}
                      <span className="text-xs text-[var(--text-secondary)] ml-1">
                        {password.length < 8 ? 'Too short' : password.length < 10 ? 'Weak' : password.length < 12 ? 'Fair' : 'Strong'}
                      </span>
                    </div>
                  )}
                  <Button type="submit" variant="primary" loading={loading} className="w-full mt-1" disabled={password !== confirmPassword || password.length < 8}>
                    Reset Password
                  </Button>
                </form>
              </motion.div>
            )}

            {/* ── Step 3: Done ── */}
            {step === 3 && (
              <motion.div key="step-done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4">
                <motion.div
                  initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                  className="h-20 w-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-5"
                >
                  <CheckCircle className="h-10 w-10 text-emerald-500" />
                </motion.div>
                <h2 className="text-2xl font-bold mb-2">Password Reset!</h2>
                <p className="text-[var(--text-secondary)] text-sm mb-7">
                  Your password has been successfully reset. You can now sign in with your new password.
                </p>
                <Button variant="primary" className="w-full" onClick={() => navigate('/login')}>
                  Go to Login
                </Button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}
