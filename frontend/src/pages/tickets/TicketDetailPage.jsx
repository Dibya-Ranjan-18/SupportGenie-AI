import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Send } from 'lucide-react'
import toast from 'react-hot-toast'
import CustomerLayout from '../../layouts/CustomerLayout'
import { ticketService } from '../../services'
import { useAuth } from '../../context/AuthContext'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import { Textarea } from '../../components/ui/Input'
import { formatDateTime, formatRelative } from '../../utils'
import Avatar from '../../components/ui/Avatar'

export default function TicketDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(true)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    ticketService.getTicket(id)
      .then(({ data }) => setTicket(data))
      .catch(() => navigate('/tickets'))
      .finally(() => setLoading(false))
  }, [id, navigate])

  const submitComment = async () => {
    if (!comment.trim()) return
    setSubmitting(true)
    try {
      await ticketService.addComment(id, { content: comment })
      const { data } = await ticketService.getTicket(id)
      setTicket(data)
      setComment('')
      toast.success('Comment added.')
    } catch { toast.error('Failed to add comment.') }
    finally { setSubmitting(false) }
  }

  if (loading) return <CustomerLayout><div className="flex items-center justify-center h-full"><div className="h-8 w-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" /></div></CustomerLayout>
  if (!ticket) return null

  return (
    <CustomerLayout>
      <div className="flex flex-col h-full">
        <div className="px-6 py-5 border-b border-[var(--border)] bg-[var(--bg-card)] shrink-0">
          <button onClick={() => navigate('/tickets')} className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-3">
            <ArrowLeft className="h-4 w-4" /> Back to tickets
          </button>
          <div className="flex items-start gap-3 flex-wrap">
            <div className="flex-1">
              <h1 className="text-xl font-bold text-[var(--text-primary)]">{ticket.subject}</h1>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge status={ticket.status} />
                <Badge priority={ticket.priority} />
                <span className="text-xs text-[var(--text-muted)]">#{ticket.id.slice(0,8)}</span>
                <span className="text-xs text-[var(--text-muted)]">Created {formatRelative(ticket.created_at)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 max-w-3xl">
          {/* Description */}
          <div className="card p-5 mb-6">
            <h2 className="text-sm font-semibold mb-3 text-[var(--text-secondary)] uppercase tracking-wide">Description</h2>
            <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap leading-relaxed">{ticket.description}</p>
          </div>

          {/* Comments */}
          {ticket.comments?.length > 0 && (
            <div className="flex flex-col gap-4 mb-6">
              <h2 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wide">Comments ({ticket.comment_count})</h2>
              {ticket.comments.map((c) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-3"
                >
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {c.author_name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{c.author_name}</span>
                      {c.author_role === 'admin' && (
                        <span className="badge-primary badge text-[10px]">Support Team</span>
                      )}
                      <span className="text-xs text-[var(--text-muted)]">{formatRelative(c.created_at)}</span>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)] mt-1 whitespace-pre-wrap">{c.content}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Add comment */}
          {ticket.status !== 'closed' && (
            <div className="card p-5">
              <h2 className="text-sm font-semibold mb-3">Add Comment</h2>
              <Textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Describe your question or update..."
                rows={4}
              />
              <div className="flex justify-end mt-3">
                <Button
                  variant="primary"
                  loading={submitting}
                  onClick={submitComment}
                  disabled={!comment.trim()}
                  icon={<Send className="h-4 w-4" />}
                >
                  Submit
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </CustomerLayout>
  )
}
