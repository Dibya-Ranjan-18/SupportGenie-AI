import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react'
import toast from 'react-hot-toast'
import AdminLayout from '../../layouts/AdminLayout'
import { feedbackService } from '../../services'
import { formatRelative } from '../../utils'
import Badge from '../../components/ui/Badge'
import { SkeletonCard } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'

export default function FeedbackPage() {
  const [feedback, setFeedback] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    Promise.all([
      feedbackService.getFeedback(filter !== 'all' ? { rating: filter } : {}),
      feedbackService.getStats(),
    ]).then(([fbRes, statsRes]) => {
      setFeedback(fbRes.data)
      setStats(statsRes.data)
    }).catch(() => toast.error('Failed to load feedback.'))
    .finally(() => setLoading(false))
  }, [filter])

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">User Feedback</h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">Review what users think about AI responses</p>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total Feedback', value: stats.total, icon: <MessageSquare className="h-4 w-4 text-primary-500" /> },
              { label: 'Positive', value: stats.positive, icon: <ThumbsUp className="h-4 w-4 text-emerald-500" /> },
              { label: 'Negative', value: stats.negative, icon: <ThumbsDown className="h-4 w-4 text-red-500" /> },
              { label: 'Satisfaction', value: `${stats.satisfaction_rate}%`, icon: <ThumbsUp className="h-4 w-4 text-amber-500" /> },
            ].map(({ label, value, icon }) => (
              <div key={label} className="card p-4">
                <div className="flex items-center gap-2 mb-1">{icon}<span className="text-xs text-[var(--text-secondary)]">{label}</span></div>
                <p className="text-2xl font-bold">{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filter */}
        <div className="flex items-center gap-1.5 mb-5">
          {['all', 'up', 'down'].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${filter === f ? 'bg-primary-600 text-white' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'}`}>
              {f === 'all' ? 'All' : f === 'up' ? '👍 Positive' : '👎 Negative'}
            </button>
          ))}
        </div>

        {/* Feedback List */}
        {loading ? (
          <div className="grid gap-4">
            {[1,2,3].map(i => <SkeletonCard key={i} rows={3} />)}
          </div>
        ) : feedback.length === 0 ? (
          <EmptyState icon={<ThumbsUp className="h-8 w-8" />} title="No feedback yet" description="Feedback will appear here when users rate AI responses" />
        ) : (
          <div className="flex flex-col gap-3">
            {feedback.map((item, i) => (
              <motion.div key={item.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="card p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{item.rating === 'up' ? '👍' : '👎'}</span>
                      <Badge variant={item.rating === 'up' ? 'success' : 'danger'}>
                        {item.rating === 'up' ? 'Helpful' : 'Not helpful'}
                      </Badge>
                      <span className="text-xs text-[var(--text-muted)] ml-auto">{formatRelative(item.created_at)}</span>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] bg-[var(--bg-secondary)] rounded-lg px-3 py-2 mb-2 italic">
                      "{item.message_content}..."
                    </p>
                    {item.comment && (
                      <div className="mt-2 p-3 bg-[var(--bg-tertiary)] rounded-lg">
                        <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">User comment:</p>
                        <p className="text-sm text-[var(--text-primary)]">{item.comment}</p>
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-2">From: {item.user_email}</p>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
