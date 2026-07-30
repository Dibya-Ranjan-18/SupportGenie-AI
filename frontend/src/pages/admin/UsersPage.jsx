import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Search, Shield, Ban, Trash2, UserCheck, User } from 'lucide-react'
import toast from 'react-hot-toast'
import AdminLayout from '../../layouts/AdminLayout'
import { adminService } from '../../services'
import { formatDate, formatRelative, debounce } from '../../utils'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Avatar from '../../components/ui/Avatar'
import CustomSelect from '../../components/ui/CustomSelect'
import { SkeletonTable } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'

export default function UsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [actionLoading, setActionLoading] = useState(null)

  const fetchUsers = useCallback(async (q = '', role = '') => {
    setLoading(true)
    try {
      const params = {}
      if (q) params.search = q
      if (role) params.role = role
      const { data } = await adminService.getUsers(params)
      setUsers(data)
    } catch { toast.error('Failed to load users.') }
    finally { setLoading(false) }
  }, [])

  const debouncedSearch = useCallback(debounce((q) => fetchUsers(q, roleFilter), 400), [fetchUsers, roleFilter])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const handleToggleBlock = async (user) => {
    setActionLoading(user.id)
    try {
      await adminService.updateUser(user.id, { is_blocked: !user.is_blocked })
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_blocked: !u.is_blocked } : u))
      toast.success(user.is_blocked ? 'User unblocked.' : 'User blocked.')
    } catch { toast.error('Action failed.') }
    finally { setActionLoading(null) }
  }

  const handleDelete = async (userId) => {
    if (!confirm('Permanently delete this user? This cannot be undone.')) return
    setActionLoading(userId)
    try {
      await adminService.deleteUser(userId)
      setUsers(prev => prev.filter(u => u.id !== userId))
      toast.success('User deleted.')
    } catch { toast.error('Failed to delete user.') }
    finally { setActionLoading(null) }
  }

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-5 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold">User Management</h1>
          <p className="text-[var(--text-secondary)] text-xs sm:text-sm mt-0.5">{users.length} users total</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-full sm:max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)] pointer-events-none z-10" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); debouncedSearch(e.target.value) }}
              placeholder="Search by name, email..."
              className="input !pl-10 w-full"
            />
          </div>
          <div className="w-full sm:w-48">
            <CustomSelect
              value={roleFilter}
              onChange={val => { setRoleFilter(val); fetchUsers(search, val) }}
              options={[
                { value: '', label: '🌐 All Roles' },
                { value: 'customer', label: '👤 Customer' },
                { value: 'admin', label: '🛡️ Admin' },
              ]}
            />
          </div>
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          {loading ? (
            <div className="p-6"><SkeletonTable rows={5} cols={5} /></div>
          ) : users.length === 0 ? (
            <EmptyState icon={<User className="h-8 w-8" />} title="No users found" description="Try adjusting your search or filters" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--bg-secondary)]">
                    {['User', 'Role', 'Status', 'Joined', 'Last Login', 'Actions'].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, i) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-b border-[var(--border)] hover:bg-[var(--bg-secondary)] transition-colors"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar user={user} size="sm" />
                          <div>
                            <p className="font-medium text-[var(--text-primary)]">{user.full_name || user.username}</p>
                            <p className="text-xs text-[var(--text-muted)]">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant={user.role === 'admin' ? 'primary' : 'gray'}>{user.role}</Badge>
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant={user.is_blocked ? 'danger' : 'success'}>
                          {user.is_blocked ? 'Blocked' : 'Active'}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-xs text-[var(--text-secondary)]">{formatDate(user.created_at)}</td>
                      <td className="px-5 py-4 text-xs text-[var(--text-secondary)]">
                        {user.last_login ? formatRelative(user.last_login) : 'Never'}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleToggleBlock(user)}
                            disabled={actionLoading === user.id}
                            className={`p-1.5 rounded-lg transition-colors ${user.is_blocked ? 'text-emerald-500 hover:bg-emerald-100 dark:hover:bg-emerald-900/20' : 'text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-900/20'}`}
                            title={user.is_blocked ? 'Unblock' : 'Block'}
                          >
                            {user.is_blocked ? <UserCheck className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                          </button>
                          <button
                            onClick={() => handleDelete(user.id)}
                            disabled={actionLoading === user.id}
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
