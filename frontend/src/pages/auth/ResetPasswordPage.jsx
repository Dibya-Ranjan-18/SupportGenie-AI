import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { Lock, Eye, EyeOff, Bot, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { authService } from '../../services'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'

export default function ResetPasswordPage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const { register, handleSubmit, watch, formState: { errors } } = useForm()
  const password = watch('new_password')

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      await authService.resetPassword({ token, ...data })
      setDone(true)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Reset failed. The link may have expired.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] px-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="flex items-center gap-2.5 mb-8 justify-center">
          <div className="h-10 w-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
            <Bot className="h-5.5 w-5.5 text-white" />
          </div>
          <span className="text-xl font-bold">SupportGenie AI</span>
        </div>

        <div className="card p-8">
          {done ? (
            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-emerald-500" />
              </div>
              <h2 className="text-xl font-bold mb-2">Password reset!</h2>
              <p className="text-[var(--text-secondary)] text-sm mb-6">
                Your password has been successfully reset. You can now sign in with your new password.
              </p>
              <Button variant="primary" className="w-full" onClick={() => navigate('/login')}>
                Go to login
              </Button>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-bold">Set new password</h1>
                <p className="text-[var(--text-secondary)] text-sm mt-1">Enter your new password below.</p>
              </div>
              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                <Input
                  label="New password"
                  type={showPw ? 'text' : 'password'}
                  placeholder="Min. 8 characters"
                  icon={<Lock className="h-4 w-4" />}
                  iconRight={<button type="button" onClick={() => setShowPw(!showPw)}>{showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>}
                  error={errors.new_password?.message}
                  {...register('new_password', {
                    required: 'Required',
                    minLength: { value: 8, message: 'Min. 8 characters' }
                  })}
                />
                <Input
                  label="Confirm new password"
                  type="password"
                  placeholder="Repeat password"
                  icon={<Lock className="h-4 w-4" />}
                  error={errors.new_password_confirm?.message}
                  {...register('new_password_confirm', {
                    required: 'Required',
                    validate: val => val === password || 'Passwords do not match'
                  })}
                />
                <Button type="submit" variant="primary" loading={loading} className="w-full mt-2">
                  Reset password
                </Button>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}
