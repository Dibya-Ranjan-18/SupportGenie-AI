import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Save, Lock, Camera, User } from 'lucide-react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import CustomerLayout from '../layouts/CustomerLayout'
import AdminLayout from '../layouts/AdminLayout'
import { useAuth } from '../context/AuthContext'
import { authService } from '../services'
import Input, { Textarea } from '../components/ui/Input'
import Button from '../components/ui/Button'
import Avatar from '../components/ui/Avatar'
import Badge from '../components/ui/Badge'

export default function ProfilePage() {
  const { user, loadProfile, updateUser } = useAuth()
  const [saving, setSaving] = useState(false)
  const [changingPw, setChangingPw] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [avatarFile, setAvatarFile] = useState(null)
  const avatarInputRef = useRef(null)

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      username: user?.username || '',
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      bio: user?.bio || '',
      phone: user?.phone || '',
    }
  })

  const { register: regPw, handleSubmit: handlePw, formState: { errors: pwErrors }, reset: resetPw } = useForm()

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Avatar image must be under 5 MB.')
      return
    }
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      toast.error('Only JPEG, PNG, WebP, or GIF images are allowed.')
      return
    }
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const onSaveProfile = async (data) => {
    setSaving(true)
    try {
      const formData = new FormData()
      Object.entries(data).forEach(([key, val]) => {
        if (val !== undefined && val !== null) formData.append(key, val)
      })
      if (avatarFile) {
        formData.append('avatar', avatarFile)
      }
      const res = await authService.updateProfile(formData)
      if (res.data?.user) {
        updateUser(res.data.user)
      }
      await loadProfile()
      setAvatarFile(null)
      setAvatarPreview(null)
      toast.success('Profile updated successfully!')
    } catch (err) {
      toast.error(err.response?.data?.username?.[0] || 'Failed to update profile.')
    } finally {
      setSaving(false)
    }
  }

  const onChangePassword = async (data) => {
    setChangingPw(true)
    try {
      await authService.changePassword(data)
      toast.success('Password changed successfully!')
      resetPw()
    } catch (err) {
      toast.error(err.response?.data?.old_password?.[0] || err.response?.data?.new_password?.[0] || 'Failed to change password.')
    } finally {
      setChangingPw(false)
    }
  }

  const Layout = user?.role === 'admin' ? AdminLayout : CustomerLayout
  const currentAvatarUrl = user?.avatar_url || null

  return (
    <Layout>
      <div className="overflow-y-auto h-full">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-xl sm:text-2xl font-bold">My Profile</h1>
            <p className="text-[var(--text-secondary)] text-xs sm:text-sm mt-1">Manage your account information</p>
          </div>

          {/* User Overview Section */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-4 sm:p-6 mb-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 sm:gap-5">
              {/* Avatar with upload overlay */}
              <div className="relative shrink-0 group">
                {avatarPreview || currentAvatarUrl ? (
                  <img
                    src={avatarPreview || currentAvatarUrl}
                    alt="Avatar"
                    className="h-20 w-20 rounded-2xl object-cover border-2 border-[var(--border)] shadow-card"
                  />
                ) : (
                  <div className="h-20 w-20 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow-indigo">
                    <User className="h-9 w-9 text-white" />
                  </div>
                )}
                {/* Upload overlay button */}
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                  title="Change avatar"
                >
                  <Camera className="h-6 w-6 text-white" />
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>

              <div className="flex-1 min-w-0">
                <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">
                  {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : user?.username}
                </h2>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-medium truncate">{user?.email}</p>
                <div className="mt-1.5 flex justify-center sm:justify-start">
                  <Badge status={user?.role === 'admin' ? 'admin' : 'active'}>
                    {user?.role === 'admin' ? 'Administrator' : 'Customer'}
                  </Badge>
                </div>
                {avatarPreview && (
                  <p className="text-xs text-primary-500 font-semibold mt-1.5">
                    ✓ New avatar selected — save to apply
                  </p>
                )}
              </div>

              {/* Click-to-upload hint */}
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="flex items-center justify-center gap-2 text-xs font-bold text-[var(--text-secondary)] hover:text-primary-500 px-3 py-2 rounded-xl border border-[var(--border)] hover:border-primary-500/40 transition-all w-full sm:w-auto shrink-0"
              >
                <Camera className="h-4 w-4" />
                Change Photo
              </button>
            </div>
          </motion.div>

          {/* Profile Form */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card p-4 sm:p-6 mb-6">
            <h2 className="text-base font-bold mb-5">Personal Information</h2>
            <form onSubmit={handleSubmit(onSaveProfile)} encType="multipart/form-data" className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="First name" placeholder="John" {...register('first_name')} />
                <Input label="Last name" placeholder="Doe" {...register('last_name')} />
              </div>
              <Input label="Username" placeholder="johndoe" error={errors.username?.message} {...register('username', { required: 'Required', minLength: { value: 3, message: 'Min. 3 chars' } })} />
              <Input label="Phone" placeholder="+1 (555) 000-0000" {...register('phone')} />
              <Textarea label="Bio" placeholder="Tell us about yourself..." rows={3} {...register('bio')} />
              <div className="flex justify-end">
                <Button type="submit" variant="primary" loading={saving} icon={<Save className="h-4 w-4" />} className="w-full sm:w-auto">
                  Save Changes
                </Button>
              </div>
            </form>
          </motion.div>


          {/* Change Password */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card p-6">
            <h2 className="text-base font-bold mb-5 flex items-center gap-2">
              <Lock className="h-4 w-4 text-[var(--text-secondary)]" /> Change Password
            </h2>
            <form onSubmit={handlePw(onChangePassword)} className="flex flex-col gap-4">
              <Input label="Current password" type="password" placeholder="••••••••" error={pwErrors.old_password?.message} {...regPw('old_password', { required: 'Required' })} />
              <Input label="New password" type="password" placeholder="Min. 8 characters" error={pwErrors.new_password?.message} {...regPw('new_password', { required: 'Required', minLength: { value: 8, message: 'Min. 8 chars' } })} />
              <Input label="Confirm new password" type="password" placeholder="Repeat password" {...regPw('new_password_confirm', { required: 'Required' })} />
              <div className="flex justify-end">
                <Button type="submit" variant="secondary" loading={changingPw}>
                  Change Password
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </Layout>
  )
}
