import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, User, Bot, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'

export default function RegisterPage() {
  const { register: registerUser } = useAuth()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, watch, formState: { errors } } = useForm()
  const password = watch('password')

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const user = await registerUser(data)
      toast.success('Account created! Welcome to SupportGenie AI 🎉')
      navigate('/chat', { replace: true })
    } catch (err) {
      const data = err.response?.data
      if (data) {
        const firstError = Object.values(data).flat()[0]
        toast.error(typeof firstError === 'string' ? firstError : 'Registration failed.')
      } else {
        toast.error('Registration failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] px-4 sm:px-6 py-8 sm:py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="flex items-center gap-2.5 mb-6 sm:mb-8 justify-center">
          <div className="h-10 w-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow shrink-0">
            <Bot className="h-5.5 w-5.5 text-white" />
          </div>
          <span className="text-lg sm:text-xl font-bold">SupportGenie AI</span>
        </div>

        <div className="card p-4 sm:p-8">
          <div className="mb-5 sm:mb-6 text-center">
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">Create your account</h1>
            <p className="text-[var(--text-secondary)] text-xs sm:text-sm mt-1">Start getting AI-powered support today</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="First name"
                placeholder="John"
                error={errors.first_name?.message}
                {...register('first_name')}
              />
              <Input
                label="Last name"
                placeholder="Doe"
                {...register('last_name')}
              />
            </div>

            <Input
              label="Username"
              placeholder="johndoe"
              icon={<User className="h-4 w-4" />}
              error={errors.username?.message}
              {...register('username', {
                required: 'Username is required',
                minLength: { value: 3, message: 'Min 3 characters' },
                pattern: { value: /^[a-zA-Z0-9_]+$/, message: 'Only letters, numbers, underscores' }
              })}
            />

            <Input
              label="Email address"
              type="email"
              placeholder="you@company.com"
              icon={<Mail className="h-4 w-4" />}
              error={errors.email?.message}
              {...register('email', {
                required: 'Email is required',
                pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' }
              })}
            />

            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Min. 8 characters"
              icon={<Lock className="h-4 w-4" />}
              iconRight={
                <button type="button" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
              error={errors.password?.message}
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 8, message: 'Min. 8 characters' }
              })}
            />

            <Input
              label="Confirm password"
              type="password"
              placeholder="Repeat your password"
              icon={<Lock className="h-4 w-4" />}
              error={errors.password_confirm?.message}
              {...register('password_confirm', {
                required: 'Please confirm your password',
                validate: (val) => val === password || 'Passwords do not match'
              })}
            />

            <Button
              type="submit"
              variant="primary"
              loading={loading}
              className="w-full mt-2"
              iconRight={!loading && <ArrowRight className="h-4 w-4" />}
            >
              Create account
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-[var(--text-secondary)]">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 hover:text-primary-700 font-semibold">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
