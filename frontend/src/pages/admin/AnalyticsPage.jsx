import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'
import AdminLayout from '../../layouts/AdminLayout'
import { analyticsService } from '../../services'
import { SkeletonCard } from '../../components/ui/Skeleton'

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#0ea5e9', '#8b5cf6']

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="card px-3 py-2 shadow-lg text-xs">
      <p className="font-medium mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  )
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState('daily')
  const [chatData, setChatData] = useState([])
  const [userData, setUserData] = useState([])
  const [ticketData, setTicketData] = useState(null)
  const [feedbackData, setFeedbackData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const days = period === 'daily' ? 30 : period === 'weekly' ? 90 : 365
        const [chatRes, userRes, ticketRes, feedbackRes] = await Promise.all([
          analyticsService.getChats({ period, days }),
          analyticsService.getUsers({ days: 30 }),
          analyticsService.getTickets({ days: 30 }),
          analyticsService.getFeedbackAnalytics({ days: 30 }),
        ])
        setChatData(chatRes.data)
        setUserData(userRes.data)
        setTicketData(ticketRes.data)
        setFeedbackData(feedbackRes.data)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [period])

  const ticketByStatus = ticketData?.by_status?.map(d => ({ name: d.status, value: d.count })) || []
  const ticketByPriority = ticketData?.by_priority?.map(d => ({ name: d.priority, value: d.count })) || []

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8">
        <div className="flex items-start justify-between flex-wrap gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold">Analytics</h1>
            <p className="text-[var(--text-secondary)] text-sm mt-1">Platform usage and performance metrics</p>
          </div>
          <div className="flex items-center gap-1.5 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-1">
            {['daily', 'weekly', 'monthly'].map(p => (
              <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${period === p ? 'bg-primary-600 text-white' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'}`}>
                {p}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1,2,3,4].map(i => <SkeletonCard key={i} rows={6} />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chat Volume */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-6 lg:col-span-2">
              <h2 className="text-sm font-semibold mb-5">Chat Volume ({period})</h2>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chatData}>
                  <defs>
                    <linearGradient id="chatGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey={period === 'daily' ? 'date' : period === 'weekly' ? 'week' : 'month'} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickFormatter={d => d?.slice(5) || d} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="chats" stroke="#6366f1" fill="url(#chatGrad)" strokeWidth={2} name="Chats" />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>

            {/* User Growth */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card p-6">
              <h2 className="text-sm font-semibold mb-5">User Growth (30 days)</h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={userData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickFormatter={d => d?.slice(5)} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="users" fill="#8b5cf6" radius={[4,4,0,0]} name="New Users" />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Ticket by Status Pie */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card p-6">
              <h2 className="text-sm font-semibold mb-5">Tickets by Status</h2>
              <div className="flex items-center gap-6">
                <ResponsiveContainer width="60%" height={200}>
                  <PieChart>
                    <Pie data={ticketByStatus} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                      {ticketByStatus.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-2">
                  {ticketByStatus.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-xs capitalize text-[var(--text-secondary)]">{d.name}</span>
                      <span className="text-xs font-bold ml-auto">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Feedback Trend */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card p-6 lg:col-span-2">
              <h2 className="text-sm font-semibold mb-5">Feedback Trend (30 days)</h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={feedbackData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickFormatter={d => d?.slice(5)} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="positive" fill="#10b981" radius={[4,4,0,0]} name="Positive" stackId="a" />
                  <Bar dataKey="negative" fill="#f43f5e" radius={[4,4,0,0]} name="Negative" stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
