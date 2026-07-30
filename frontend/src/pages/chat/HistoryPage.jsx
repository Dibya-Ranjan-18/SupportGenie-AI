import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, MessageSquare, Trash2, Pencil, Plus, History, X, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import CustomerLayout from '../../layouts/CustomerLayout'
import { chatService } from '../../services'
import { cn, formatRelative, debounce } from '../../utils'
import { SkeletonCard } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import Button from '../../components/ui/Button'
import ConfirmModal from '../../components/ui/ConfirmModal'

export default function HistoryPage() {
  const navigate = useNavigate()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [deletingId, setDeletingId] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const fetchSessions = useCallback(async (q = '') => {
    setLoading(true)
    try {
      const { data } = await chatService.getSessions(q)
      setSessions(data)
    } catch { toast.error('Failed to load chat history.') }
    finally { setLoading(false) }
  }, [])

  const debouncedSearch = useCallback(debounce(fetchSessions, 400), [fetchSessions])

  useEffect(() => { fetchSessions() }, [fetchSessions])

  const handleSearch = (e) => {
    setSearch(e.target.value)
    debouncedSearch(e.target.value)
  }

  const confirmDelete = async () => {
    if (!deletingId) return
    setDeleteLoading(true)
    try {
      await chatService.deleteSession(deletingId)
      setSessions(prev => prev.filter(s => s.id !== deletingId))
      toast.success('Conversation deleted.')
      setDeletingId(null)
    } catch {
      toast.error('Failed to delete conversation.')
    } finally {
      setDeleteLoading(false)
    }
  }

  const startEdit = (session) => {
    setEditingId(session.id)
    setEditTitle(session.title)
  }

  const saveEdit = async (id) => {
    if (!editTitle.trim()) return
    try {
      await chatService.renameSession(id, editTitle.trim())
      setSessions(prev => prev.map(s => s.id === id ? { ...s, title: editTitle.trim() } : s))
      setEditingId(null)
    } catch { toast.error('Failed to rename.') }
  }

  return (
    <CustomerLayout>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[var(--border)] bg-[var(--bg-card)] shrink-0">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-xl font-bold text-[var(--text-primary)]">Chat History</h1>
              <p className="text-sm text-[var(--text-secondary)]">{sessions.length} conversations</p>
            </div>
            <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={() => navigate('/chat')}>
              New Chat
            </Button>
          </div>
          <div className="mt-4 relative max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)] pointer-events-none z-10" />
            <input
              value={search}
              onChange={handleSearch}
              placeholder="Search conversations..."
              className="input !pl-10 w-full"
            />
          </div>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="grid gap-3">
              {[1,2,3,4,5].map(i => <SkeletonCard key={i} rows={2} />)}
            </div>
          ) : sessions.length === 0 ? (
            <EmptyState
              icon={<History className="h-8 w-8" />}
              title={search ? 'No results found' : 'No conversations yet'}
              description={search ? 'Try a different search term' : 'Start a new chat to see your history here'}
              action={<Button variant="primary" onClick={() => navigate('/chat')}>Start Chatting</Button>}
            />
          ) : (
            <div className="flex flex-col gap-2 max-w-3xl">
              {sessions.map((session, i) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="card-hover p-4 cursor-pointer group"
                  onClick={() => navigate(`/chat/${session.id}`)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex gap-3 flex-1 min-w-0">
                      <div className="h-9 w-9 rounded-xl bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center shrink-0">
                        <MessageSquare className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        {editingId === session.id ? (
                          <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                            <input
                              value={editTitle}
                              onChange={e => setEditTitle(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') saveEdit(session.id)
                                if (e.key === 'Escape') setEditingId(null)
                              }}
                              className="input text-sm py-1"
                              autoFocus
                            />
                            <button onClick={() => saveEdit(session.id)} className="text-emerald-500"><Check className="h-4 w-4" /></button>
                            <button onClick={() => setEditingId(null)} className="text-[var(--text-muted)]"><X className="h-4 w-4" /></button>
                          </div>
                        ) : (
                          <p className="text-sm font-medium text-[var(--text-primary)] truncate">{session.title}</p>
                        )}
                        <p className="text-xs text-[var(--text-muted)] mt-0.5 truncate">
                          {session.last_message_preview || 'No messages yet'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-[var(--text-muted)]">{formatRelative(session.updated_at)}</span>
                      {/* ALWAYS VISIBLE ACTIONS */}
                      <div className="flex items-center gap-1 ml-2" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => startEdit(session)}
                          title="Rename chat"
                          className="p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingId(session.id)}
                          title="Delete conversation"
                          className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 text-red-500/80 hover:text-red-500 transition-all"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-2 ml-12">
                    <span className="text-xs text-[var(--text-muted)]">{session.message_count} messages</span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Custom Styled Delete Confirmation Modal */}
        <ConfirmModal
          open={Boolean(deletingId)}
          onClose={() => setDeletingId(null)}
          onConfirm={confirmDelete}
          loading={deleteLoading}
          title="Delete Conversation?"
          description="Are you sure you want to delete this conversation? All message history will be permanently deleted."
          confirmText="Delete Conversation"
        />
      </div>
    </CustomerLayout>
  )
}
