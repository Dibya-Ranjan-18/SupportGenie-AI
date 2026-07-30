import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, Filter } from 'lucide-react'
import toast from 'react-hot-toast'
import AdminLayout from '../../layouts/AdminLayout'
import { ticketService } from '../../services'
import { formatRelative } from '../../utils'
import Badge from '../../components/ui/Badge'
import CustomSelect from '../../components/ui/CustomSelect'
import { SkeletonTable } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import { Ticket } from 'lucide-react'

const STATUS_OPTIONS = ['all', 'pending', 'open', 'resolved', 'closed']

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('all')
  const [search, setSearch] = useState('')
  const [actionLoading, setActionLoading] = useState(null)

  const fetchTickets = async () => {
    setLoading(true)
    try {
      const params = {}
      if (status !== 'all') params.status = status
      if (search) params.search = search
      const { data } = await ticketService.getTickets(params)
      setTickets(data)
    } catch { toast.error('Failed to load tickets.') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchTickets() }, [status])
  useEffect(() => {
    const t = setTimeout(fetchTickets, 400)
    return () => clearTimeout(t)
  }, [search])

  const updateStatus = async (id, newStatus) => {
    setActionLoading(id)
    try {
      await ticketService.updateTicket(id, { status: newStatus })
      setTickets(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t))
      toast.success(`Ticket marked as ${newStatus}.`)
    } catch { toast.error('Failed to update ticket.') }
    finally { setActionLoading(null) }
  }

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-5 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold">Support Tickets</h1>
          <p className="text-[var(--text-secondary)] text-xs sm:text-sm mt-0.5">{tickets.length} tickets found</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-5">
          <div className="relative flex-1 max-w-full sm:max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)] pointer-events-none z-10" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tickets..." className="input !pl-10 w-full" />
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {STATUS_OPTIONS.map(s => (
              <button key={s} onClick={() => setStatus(s)} className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${status === s ? 'bg-primary-600 text-white' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'}`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="card overflow-hidden">
          {loading ? (
            <div className="p-6"><SkeletonTable rows={5} cols={5} /></div>
          ) : tickets.length === 0 ? (
            <EmptyState icon={<Ticket className="h-8 w-8" />} title="No tickets found" description="Adjust your filters to see more results" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--bg-secondary)]">
                    {['Ticket', 'User', 'Status', 'Priority', 'Created', 'Actions'].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((ticket, i) => (
                    <motion.tr key={ticket.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="border-b border-[var(--border)] hover:bg-[var(--bg-secondary)] transition-colors">
                      <td className="px-5 py-4 max-w-xs">
                        <p className="font-medium text-[var(--text-primary)] truncate">{ticket.subject}</p>
                        <p className="text-xs text-[var(--text-muted)]">#{ticket.id.slice(0,8)}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-xs text-[var(--text-secondary)]">{ticket.user_email}</p>
                      </td>
                      <td className="px-5 py-4"><Badge status={ticket.status} /></td>
                      <td className="px-5 py-4"><Badge priority={ticket.priority} /></td>
                      <td className="px-5 py-4 text-xs text-[var(--text-muted)]">{formatRelative(ticket.created_at)}</td>
                      <td className="px-5 py-4">
                        <div className="w-36">
                          <CustomSelect
                            value={ticket.status}
                            onChange={val => updateStatus(ticket.id, val)}
                            options={[
                              { value: 'pending', label: '⏳ Pending' },
                              { value: 'open', label: '🔓 Open' },
                              { value: 'resolved', label: '✅ Resolved' },
                              { value: 'closed', label: '🔒 Closed' },
                            ]}
                          />
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
