import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Users, MessageSquare, Ticket, ThumbsUp, BookOpen, TrendingUp,
  Activity, AlertCircle, CheckCircle, Clock
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts'
import AdminLayout from '../../layouts/AdminLayout'
import { dashboardService, analyticsService } from '../../services'
import StatCard from '../../components/ui/StatCard'
import { SkeletonStat } from '../../components/ui/Skeleton'
import { formatDate } from '../../utils'

export default function DashboardPage() {
  const [stats, setStats] = useState(null)
  const [chatData, setChatData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      dashboardService.getStats(),
      analyticsService.getChats({ period: 'daily', days: 14 }),
    ]).then(([statsRes, chatRes]) => {
      setStats(statsRes.data)
      setChatData(chatRes.data)
    }).finally(() => setLoading(false))
  }, [])

  const statCards = stats ? [
    { title: 'Total Users',       value: stats.users.total,           color: 'primary', icon: <Users className="h-5 w-5" />,       subtitle: `${stats.users.new_this_week} new this week` },
    { title: 'Total Chats',       value: stats.chats.total,           color: 'violet',  icon: <MessageSquare className="h-5 w-5" />, subtitle: `${stats.chats.today} today` },
    { title: 'Total Messages',    value: stats.chats.total_messages,  color: 'sky',     icon: <Activity className="h-5 w-5" />,      subtitle: `Across all conversations` },
    { title: 'Open Tickets',      value: stats.tickets.open + stats.tickets.pending, color: 'amber', icon: <Ticket className="h-5 w-5" />, subtitle: `${stats.tickets.resolved} resolved` },
    { title: 'Resolved Tickets',  value: stats.tickets.resolved,      color: 'emerald', icon: <CheckCircle className="h-5 w-5" />,   subtitle: `Of ${stats.tickets.total} total` },
    { title: 'Feedback',          value: stats.feedback.total,        color: 'rose',    icon: <ThumbsUp className="h-5 w-5" />,      subtitle: `${stats.feedback.positive} positive` },
    { title: 'Documents',         value: stats.knowledge_base.indexed, color: 'emerald', icon: <BookOpen className="h-5 w-5" />,    subtitle: `${stats.knowledge_base.total_chunks} chunks indexed` },
    { title: 'Active Users',      value: stats.users.active,          color: 'sky',     icon: <TrendingUp className="h-5 w-5" />,    subtitle: `${stats.users.blocked} blocked` },
  ] : []

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
      <div className="card px-3 py-2 shadow-lg text-xs">
        <p className="font-medium text-[var(--text-primary)] mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }}>{p.name}: {p.value}</p>
        ))}
      </div>
    )
  }

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Dashboard</h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">Welcome back! Here's what's happening with SupportGenie AI.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <SkeletonStat key={i} />)
            : statCards.map((s, i) => (
                <motion.div key={s.title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <StatCard {...s} />
                </motion.div>
              ))
          }
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Chats */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card p-6">
            <h2 className="text-sm font-semibold mb-5 text-[var(--text-primary)]">Chats — Last 14 Days</h2>
            {chatData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chatData}>
                  <defs>
                    <linearGradient id="chatGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickFormatter={d => d.slice(5)} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="chats" stroke="#6366f1" fill="url(#chatGrad)" strokeWidth={2} name="Chats" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-sm text-[var(--text-muted)]">No chat data yet</div>
            )}
          </motion.div>

          {/* Ticket Summary */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="card p-6">
            <h2 className="text-sm font-semibold mb-5">Ticket Status Overview</h2>
            {stats && (
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Pending', value: stats.tickets.pending, color: 'bg-amber-500' },
                  { label: 'Open', value: stats.tickets.open, color: 'bg-primary-500' },
                  { label: 'Resolved', value: stats.tickets.resolved, color: 'bg-emerald-500' },
                  { label: 'Closed', value: stats.tickets.closed, color: 'bg-surface-400' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[var(--text-secondary)]">{label}</span>
                      <span className="text-sm font-bold">{value}</span>
                    </div>
                    <div className="h-1.5 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${color} transition-all duration-700`}
                        style={{ width: `${stats.tickets.total ? (value / stats.tickets.total * 100) : 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {stats && (
              <div className="mt-6 p-4 bg-[var(--bg-secondary)] rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-[var(--text-secondary)]">Satisfaction Rate</span>
                  <span className="text-sm font-bold text-emerald-500">
                    {stats.feedback.total > 0
                      ? Math.round(stats.feedback.positive / stats.feedback.total * 100)
                      : 0}%
                  </span>
                </div>
                <div className="h-2 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                    style={{ width: `${stats.feedback.total > 0 ? (stats.feedback.positive / stats.feedback.total * 100) : 0}%` }}
                  />
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-1">{stats.feedback.positive} positive out of {stats.feedback.total} total feedback</p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </AdminLayout>
  )
}
