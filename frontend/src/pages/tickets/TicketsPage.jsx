import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, Ticket, Clock, CheckCircle, AlertCircle, Search, Filter } from 'lucide-react'
import toast from 'react-hot-toast'
import CustomerLayout from '../../layouts/CustomerLayout'
import { ticketService } from '../../services'
import { cn, formatRelative } from '../../utils'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import { SkeletonCard } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'

const STATUS_TABS = ['all', 'pending', 'open', 'resolved', 'closed']

export default function TicketsPage() {
  const navigate = useNavigate()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    const fetchTickets = async () => {
      setLoading(true)
      try {
        const params = {}
        if (activeTab !== 'all') params.status = activeTab
        if (search) params.search = search
        const { data } = await ticketService.getTickets(params)
        setTickets(data)
      } catch { toast.error('Failed to load tickets.') }
      finally { setLoading(false) }
    }
    fetchTickets()
  }, [activeTab, search])

  return (
    <CustomerLayout>
      <div className="flex flex-col h-full">
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-[var(--border)] bg-[var(--bg-card)] shrink-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div>
              <h1 className="text-lg sm:text-xl font-bold">Support Tickets</h1>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)]">Track and manage your support requests</p>
            </div>
            <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={() => navigate('/tickets/new')} className="w-full sm:w-auto">
              New Ticket
            </Button>
          </div>

          {/* Search */}
          <div className="mt-4 relative max-w-full sm:max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)] pointer-events-none z-10" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search tickets..."
              className="input !pl-10 w-full"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 mt-4 overflow-x-auto chat-scroll pb-1">
            {STATUS_TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium capitalize whitespace-nowrap transition-all',
                  activeTab === tab
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {loading ? (
            <div className="grid gap-3">
              {[1,2,3].map(i => <SkeletonCard key={i} />)}
            </div>
          ) : tickets.length === 0 ? (
            <EmptyState
              icon={<Ticket className="h-8 w-8" />}
              title="No tickets found"
              description="Create a support ticket if you need help with something specific"
              action={<Button variant="primary" onClick={() => navigate('/tickets/new')}>Create Ticket</Button>}
            />
          ) : (
            <div className="flex flex-col gap-3 max-w-3xl">
              {tickets.map((ticket, i) => (
                <motion.div
                  key={ticket.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => navigate(`/tickets/${ticket.id}`)}
                  className="card-hover p-5 cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="text-sm font-semibold text-[var(--text-primary)] truncate">{ticket.subject}</h3>
                        <Badge status={ticket.status} />
                        <Badge priority={ticket.priority} />
                      </div>
                      <p className="text-xs text-[var(--text-secondary)] line-clamp-2">{ticket.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-3 text-xs text-[var(--text-muted)]">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {formatRelative(ticket.created_at)}
                    </span>
                    <span>{ticket.comment_count} comments</span>
                    <span className="text-xs">#{ticket.id.slice(0,8)}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </CustomerLayout>
  )
}
