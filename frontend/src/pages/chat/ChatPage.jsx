import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send, Square, RotateCcw, Copy, ThumbsUp, ThumbsDown, Bot,
  Sparkles, ExternalLink, ChevronDown, Plus, Lightbulb, Pencil,
  Trash2, Check, X, Shield, Zap, RefreshCw, FileText,
  Volume2, VolumeX, Download, Mail
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'
import toast from 'react-hot-toast'

import CustomerLayout from '../../layouts/CustomerLayout'
import { chatService, feedbackService } from '../../services'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { cn, formatTime, copyToClipboard } from '../../utils'
import { exportChatAsTxt, exportChatAsPdf } from '../../utils/exportUtils'
import Avatar from '../../components/ui/Avatar'
import { SkeletonMessage } from '../../components/ui/Skeleton'
import ErrorBoundary from '../../components/ui/ErrorBoundary'
import ConfirmModal from '../../components/ui/ConfirmModal'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

function TypingIndicator() {
  return (
    <div className="flex gap-3.5 animate-fade-in my-2">
      <div className="h-10 w-10 rounded-2xl bg-gradient-primary flex items-center justify-center shrink-0 shadow-glow-indigo">
        <Bot className="h-5 w-5 text-white" />
      </div>
      <div className="chat-bubble-ai px-5 py-4 flex items-center gap-2">
        {[0,1,2].map(i => (
          <span key={i} className="typing-dot" style={{ animationDelay: `${i * 0.2}s` }} />
        ))}
      </div>
    </div>
  )
}

function CodeBlock({ language, code, isDark }) {
  const [copied, setCopied] = useState(false)
  const safeCode = typeof code === 'string' ? code : String(code || '')

  const handleCopy = async () => {
    await copyToClipboard(safeCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="code-block-wrapper my-3 border border-[var(--border)] rounded-2xl overflow-hidden shadow-card">
      <div className="code-block-header px-4 py-2.5 bg-surface-900 text-xs flex justify-between items-center text-surface-300 border-b border-surface-800 font-mono">
        <span className="font-semibold tracking-wide uppercase text-indigo-400">{language || 'code'}</span>
        <button onClick={handleCopy} className="hover:text-white transition-colors flex items-center gap-1.5 font-medium">
          <Copy className="h-3.5 w-3.5" />
          {copied ? 'Copied!' : 'Copy Code'}
        </button>
      </div>
      <ErrorBoundary onReset={() => {}}>
        {SyntaxHighlighter ? (
          <SyntaxHighlighter
            language={language || 'text'}
            style={isDark ? oneDark : oneLight}
            customStyle={{ margin: 0, padding: '16px', fontSize: '0.825rem', background: 'transparent' }}
            showLineNumbers={safeCode.includes('\n')}
          >
            {safeCode}
          </SyntaxHighlighter>
        ) : (
          <pre className="p-4 text-xs font-mono overflow-x-auto whitespace-pre-wrap">{safeCode}</pre>
        )}
      </ErrorBoundary>
    </div>
  )
}

const getMarkdownComponents = (isDark) => ({
  code({ node, className, children, ...props }) {
    const match = /language-(\w+)/.exec(className || '')
    const codeString = String(children || '').replace(/\n$/, '')
    const isMultiLine = codeString.includes('\n')
    const isBlock = Boolean(match || isMultiLine || (className && className.includes('code-block')))

    if (isBlock) {
      return <CodeBlock language={match ? match[1] : ''} code={codeString} isDark={isDark} />
    }

    return (
      <code className="bg-primary-500/10 text-primary-600 dark:text-primary-300 px-2 py-0.5 rounded-lg text-xs font-mono font-semibold border border-primary-500/20">
        {children}
      </code>
    )
  },
  p: ({ children }) => <p className="mb-2.5 last:mb-0 leading-relaxed">{children}</p>,
  ul: ({ children }) => <ul className="list-disc ml-5 mb-2.5 space-y-1">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal ml-5 mb-2.5 space-y-1">{children}</ol>,
  strong: ({ children }) => <strong className="font-bold text-[var(--text-primary)]">{children}</strong>,
})

function MessageBubble({
  message,
  onFeedback,
  onCopy,
  onDeleteMessage,
  onEditSubmit,
  isDark,
}) {
  const isUser = message.role === 'user'
  const [feedbackGiven, setFeedbackGiven] = useState(message.feedback_rating)
  const [copied, setCopied] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(message.content || '')

  const handleFeedback = async (rating) => {
    try {
      await feedbackService.submitFeedback({ message: message.id, rating })
      setFeedbackGiven(rating)
      toast.success(rating === 'up' ? 'Thanks for your feedback!' : 'Thanks, we\'ll improve!')
    } catch { toast.error('Failed to submit feedback.') }
  }

  const handleCopy = async () => {
    await copyToClipboard(message.content || '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('Copied to clipboard!')
  }

  const handleSaveEdit = () => {
    if (!editContent.trim()) return
    setIsEditing(false)
    if (onEditSubmit) {
      onEditSubmit(message.id, editContent.trim())
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25 }}
      className={cn('flex gap-3.5 group my-1', isUser && 'flex-row-reverse')}
    >
      {/* Avatar */}
      {isUser ? (
        <div className="h-10 w-10 rounded-2xl bg-gradient-primary flex items-center justify-center shrink-0 text-white text-xs font-extrabold shadow-glow-indigo">
          You
        </div>
      ) : (
        <div className="h-10 w-10 rounded-2xl bg-gradient-primary flex items-center justify-center shrink-0 shadow-glow-indigo">
          <Bot className="h-5 w-5 text-white" />
        </div>
      )}

      <div className={cn('flex flex-col gap-2 max-w-[85%] sm:max-w-[78%]', isUser && 'items-end')}>
        {/* Bubble content or inline edit */}
        {isEditing ? (
          <div className="w-full bg-[var(--bg-card)] border-2 border-primary-500 rounded-3xl p-4 shadow-glow-indigo flex flex-col gap-3">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full bg-transparent outline-none text-sm text-[var(--text-primary)] resize-none min-h-[70px] leading-relaxed"
              autoFocus
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setIsEditing(false)}
                className="px-3.5 py-1.5 text-xs rounded-xl border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-1.5 text-xs rounded-xl bg-gradient-primary text-white font-bold shadow-glow-indigo flex items-center gap-1.5"
              >
                <Check className="h-3.5 w-3.5" /> Save & Resend
              </button>
            </div>
          </div>
        ) : (
          <div className={cn(
            'px-5 py-4 text-sm leading-relaxed rounded-3xl transition-all',
            isUser
              ? 'chat-bubble-user rounded-tr-none font-medium'
              : 'chat-bubble-ai text-[var(--text-primary)] rounded-tl-none border border-[var(--border)]'
          )}>
            {isUser ? (
              <p className="whitespace-pre-wrap">{message.content}</p>
            ) : (
              <ErrorBoundary>
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={getMarkdownComponents(isDark)}
                  >
                    {message.content || ''}
                  </ReactMarkdown>
                </div>
              </ErrorBoundary>
            )}
          </div>
        )}

        {/* ALWAYS VISIBLE ACTION TOOLBAR */}
        <div className={cn(
          'flex items-center gap-1.5 text-xs text-[var(--text-muted)] px-1 flex-wrap',
          isUser && 'justify-end'
        )}>
          {/* User message actions */}
          {isUser && (
            <>
              <button
                onClick={() => setIsEditing(true)}
                title="Edit message"
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl hover:bg-primary-500/10 hover:text-primary-500 transition-all text-[var(--text-secondary)] font-semibold border border-transparent hover:border-primary-500/20"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </button>
              <button
                onClick={handleCopy}
                title="Copy text"
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-all text-[var(--text-secondary)] font-semibold border border-transparent hover:border-[var(--border)]"
              >
                <Copy className="h-3.5 w-3.5" />
                {copied ? 'Copied' : 'Copy'}
              </button>
              <button
                onClick={() => onDeleteMessage(message)}
                title="Delete message"
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl hover:bg-red-500/10 text-red-500/80 hover:text-red-500 transition-all font-semibold border border-transparent hover:border-red-500/20"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            </>
          )}

          {/* AI assistant message actions */}
          {!isUser && (
            <>
              <button
                onClick={() => {
                  if (!('speechSynthesis' in window)) {
                    toast.error('Text-to-speech is not supported in this browser.')
                    return
                  }
                  if (window.speechSynthesis.speaking) {
                    window.speechSynthesis.cancel()
                    toast('Voice playback stopped.')
                  } else {
                    window.speechSynthesis.cancel()
                    const utterance = new SpeechSynthesisUtterance(message.content || '')
                    utterance.rate = 1.0
                    window.speechSynthesis.speak(utterance)
                    toast.success('Reading response aloud...')
                  }
                }}
                title="Listen to AI response"
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl hover:bg-primary-500/10 hover:text-primary-500 transition-all text-[var(--text-secondary)] font-semibold border border-transparent hover:border-primary-500/20"
              >
                <Volume2 className="h-3.5 w-3.5 text-primary-500" />
                Listen
              </button>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-all text-[var(--text-secondary)] font-semibold border border-transparent hover:border-[var(--border)]"
              >
                <Copy className="h-3.5 w-3.5" />
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <button
                onClick={() => handleFeedback('up')}
                title="Helpful"
                className={cn(
                  'p-1.5 rounded-xl transition-all border border-transparent',
                  feedbackGiven === 'up'
                    ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
                    : 'hover:text-emerald-500 hover:bg-emerald-500/10 text-[var(--text-secondary)] hover:border-emerald-500/20'
                )}
              >
                <ThumbsUp className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => handleFeedback('down')}
                title="Not helpful"
                className={cn(
                  'p-1.5 rounded-xl transition-all border border-transparent',
                  feedbackGiven === 'down'
                    ? 'text-red-500 bg-red-500/10 border-red-500/20'
                    : 'hover:text-red-500 hover:bg-red-500/10 text-[var(--text-secondary)] hover:border-red-500/20'
                )}
              >
                <ThumbsDown className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => onDeleteMessage(message)}
                title="Delete message"
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl hover:bg-red-500/10 text-red-500/80 hover:text-red-500 transition-all font-semibold border border-transparent hover:border-red-500/20 ml-1"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            </>
          )}

          <span className="text-[11px] text-[var(--text-muted)] ml-1 font-mono">{formatTime(message.created_at)}</span>
        </div>

        {/* Source citations */}
        {!isUser && message.sources?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-1">
            {message.sources.map((src, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-primary-500/10 text-primary-600 dark:text-primary-400 font-semibold border border-primary-500/20">
                <FileText className="h-3 w-3 text-primary-500" />
                {src.source}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}

function WelcomeScreen({ user, onSelectPrompt }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 py-12 text-center relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', duration: 0.6 }}
        className="relative mb-6"
      >
        <div className="h-24 w-24 rounded-3xl bg-gradient-primary flex items-center justify-center shadow-glow-indigo ring-8 ring-primary-500/10">
          <Bot className="h-12 w-12 text-white" />
        </div>
        <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white text-[10px] font-black shadow-glow-emerald">
          AI
        </span>
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-3xl sm:text-4xl font-extrabold gradient-text mb-3 tracking-tight"
      >
        Welcome back, {user?.first_name || user?.username}! ✨
      </motion.h2>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-[var(--text-secondary)] max-w-md text-base mb-10 leading-relaxed font-medium"
      >
        How can I help you today? Ask questions regarding your account, refunds, orders, or company knowledge.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-xl"
      >
        {[
          { icon: '📄', title: 'Refund Policy', text: 'What are your 30-day refund policies?' },
          { icon: '🔑', title: 'Password Reset', text: 'How do I reset or change my password?' },
          { icon: '📦', title: 'Track Order', text: 'How do I check my active order status?' },
          { icon: '📞', title: 'Support Contact', text: 'Is there a phone number or email to call?' },
        ].map(({ icon, title, text }) => (
          <button
            key={title}
            onClick={() => onSelectPrompt(text)}
            className="group flex flex-col text-left p-5 rounded-3xl glass-card hover:border-primary-500/50 hover:shadow-glow-indigo transition-all duration-300 relative overflow-hidden"
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl p-2 rounded-2xl bg-primary-500/10 shrink-0 group-hover:scale-110 transition-transform">
                {icon}
              </span>
              <span className="text-sm font-bold text-[var(--text-primary)] group-hover:text-primary-500 transition-colors">
                {title}
              </span>
            </div>
            <span className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium">
              {text}
            </span>
          </button>
        ))}
      </motion.div>
    </div>
  )
}

export default function ChatPage() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { isDark } = useTheme()

  const [session, setSession] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [showScrollBtn, setShowScrollBtn] = useState(false)

  // Voice speech state
  const [isListening, setIsListening] = useState(false)

  // Custom Styled Confirm Modals
  const [deletingMessage, setDeletingMessage] = useState(null)
  const [showDeleteSessionModal, setShowDeleteSessionModal] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const scrollRef = useRef(null)
  const inputRef = useRef(null)
  const abortRef = useRef(null)
  const creatingSessionIdRef = useRef(null)
  const recognitionRef = useRef(null)

  const scrollToBottom = useCallback((smooth = true) => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: smooth ? 'smooth' : 'auto'
    })
  }, [])

  // Load session messages & restore active ID
  useEffect(() => {
    if (!sessionId) {
      const lastActiveId = localStorage.getItem('last_active_session_id')
      if (lastActiveId) {
        navigate(`/chat/${lastActiveId}`, { replace: true })
        return
      }
      setSession(null)
      setMessages([])
      return
    }

    localStorage.setItem('last_active_session_id', sessionId)

    if (creatingSessionIdRef.current === sessionId) {
      creatingSessionIdRef.current = null
      chatService.getSession(sessionId).then(sRes => setSession(sRes.data)).catch(() => {})
      return
    }

    setLoading(true)
    Promise.all([
      chatService.getSession(sessionId),
      chatService.getMessages(sessionId),
    ]).then(([sRes, mRes]) => {
      setSession(sRes.data)
      setMessages(mRes.data)
    }).catch(() => {
      localStorage.removeItem('last_active_session_id')
      navigate('/chat')
    }).finally(() => setLoading(false))
  }, [sessionId])

  // Scroll on messages
  useEffect(() => { scrollToBottom() }, [messages, streamingContent])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const handleScroll = () => {
      setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 200)
    }
    el.addEventListener('scroll', handleScroll)
    return () => el.removeEventListener('scroll', handleScroll)
  }, [])

  // Setup Web Speech API
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = 'en-US'

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript
        setInput(prev => (prev ? `${prev} ${transcript}` : transcript))
        setIsListening(false)
      }

      recognition.onerror = () => setIsListening(false)
      recognition.onend = () => setIsListening(false)

      recognitionRef.current = recognition
    }
  }, [])

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      toast.error('Voice dictation is not supported in this browser.')
      return
    }
    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      try {
        recognitionRef.current.start()
        setIsListening(true)
        toast.success('Listening... Speak into your microphone.')
      } catch {
        setIsListening(false)
      }
    }
  }

  const sendMessage = async (overrideInput = null) => {
    const textToSend = overrideInput !== null ? overrideInput : input
    if (!textToSend.trim() || streaming) return

    let currentSessionId = sessionId

    if (!currentSessionId) {
      try {
        const { data } = await chatService.createSession()
        currentSessionId = data.id
        creatingSessionIdRef.current = currentSessionId
        setSession(data)
        navigate(`/chat/${currentSessionId}`, { replace: true })
      } catch {
        toast.error('Failed to create conversation.')
        return
      }
    }

    const userMsg = { id: Date.now(), role: 'user', content: textToSend, created_at: new Date().toISOString() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setSuggestions([])
    setStreaming(true)
    setStreamingContent('')
    inputRef.current?.focus()

    const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token')
    let accumulatedText = ''

    try {
      const response = await fetch(`${API_BASE}/chat/sessions/${currentSessionId}/send/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: userMsg.content }),
        signal: (abortRef.current = new AbortController()).signal,
      })

      if (!response.ok) throw new Error('Stream request failed')

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let finalMessageId = null
      let finalSources = []
      let finalSuggestions = []

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.startsWith('data:')) continue
          const data = line.slice(5).trim()
          if (data === '[DONE]') continue
          try {
            const parsed = JSON.parse(data)
            if (parsed.type === 'chunk') {
              accumulatedText += parsed.content
              setStreamingContent(accumulatedText)
            } else if (parsed.type === 'done') {
              finalMessageId = parsed.message_id
              finalSources = parsed.sources || []
              finalSuggestions = parsed.suggestions || []
              if (parsed.user_message_id) {
                setMessages(prev => prev.map(m => m.id === userMsg.id ? { ...m, id: parsed.user_message_id } : m))
              }
            }
          } catch {}
        }
      }

      setMessages(prev => [...prev, {
        id: finalMessageId || Date.now() + 1,
        role: 'assistant',
        content: accumulatedText || 'No response generated.',
        sources: finalSources,
        created_at: new Date().toISOString(),
        feedback_rating: null,
      }])
      setSuggestions(finalSuggestions)
    } catch (err) {
      if (err.name !== 'AbortError') {
        toast.error('Failed to get AI response. Please try again.')
      }
    } finally {
      setStreaming(false)
      setStreamingContent('')
    }
  }

  const handleEditSubmit = async (messageId, newContent) => {
    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, content: newContent } : m))
    toast.success('Message updated!')

    if (typeof messageId === 'string' && messageId.includes('-')) {
      try {
        await chatService.editMessage(messageId, newContent)
      } catch (e) {
        console.error('Backend edit error:', e)
      }
    }
    sendMessage(newContent)
  }

  const confirmDeleteMessage = async () => {
    if (!deletingMessage) return
    const targetId = deletingMessage.id
    setDeleteLoading(true)
    try {
      setMessages(prev => prev.filter(m => m.id !== targetId))
      setDeletingMessage(null)
      toast.success('Message deleted.')

      if (typeof targetId === 'string' && targetId.includes('-')) {
        await chatService.deleteMessage(targetId)
      }
    } catch (e) {
      console.error('Backend delete error:', e)
    } finally {
      setDeleteLoading(false)
    }
  }

  const confirmDeleteSession = async () => {
    if (!sessionId) return
    setDeleteLoading(true)
    try {
      await chatService.deleteSession(sessionId)
      localStorage.removeItem('last_active_session_id')
      toast.success('Conversation deleted.')
      setShowDeleteSessionModal(false)
      navigate('/chat')
    } catch {
      toast.error('Failed to delete conversation.')
    } finally {
      setDeleteLoading(false)
    }
  }

  const stopStreaming = () => {
    abortRef.current?.abort()
    setStreaming(false)
    if (streamingContent) {
      setMessages(prev => [...prev, {
        id: Date.now(),
        role: 'assistant',
        content: streamingContent + '\n\n*[Response stopped]*',
        sources: [],
        created_at: new Date().toISOString(),
        feedback_rating: null,
      }])
      setStreamingContent('')
    }
  }

  const regenerate = async () => {
    if (!sessionId) return
    const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token')
    setMessages(prev => prev.slice(0, -1))
    setStreaming(true)
    setStreamingContent('')
    setSuggestions([])

    let accumulatedText = ''

    try {
      const response = await fetch(`${API_BASE}/chat/sessions/${sessionId}/regenerate/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''
        for (const line of lines) {
          if (!line.startsWith('data:')) continue
          const data = line.slice(5).trim()
          if (data === '[DONE]') continue
          try {
            const parsed = JSON.parse(data)
            if (parsed.type === 'chunk') {
              accumulatedText += parsed.content
              setStreamingContent(accumulatedText)
            } else if (parsed.type === 'done') {
              setMessages(prev => [...prev, {
                id: parsed.message_id,
                role: 'assistant',
                content: accumulatedText || 'No response generated.',
                sources: parsed.sources || [],
                created_at: new Date().toISOString(),
                feedback_rating: null,
              }])
              setSuggestions(parsed.suggestions || [])
            }
          } catch {}
        }
      }
    } catch { toast.error('Regeneration failed.') }
    finally { setStreaming(false); setStreamingContent('') }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <CustomerLayout>
      <div className="flex flex-col h-full bg-[var(--bg-primary)] relative">
        {/* Chat Header */}
        {sessionId && session && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-3.5 sm:px-6 py-3 sm:py-4 border-b border-[var(--border)] bg-[var(--bg-card)] backdrop-blur-xl shrink-0 z-10 shadow-sm">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow-indigo shrink-0">
                <Bot className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm sm:text-base font-extrabold text-[var(--text-primary)] truncate max-w-xs sm:max-w-md">
                  {session.title}
                </h1>
                <div className="flex items-center gap-2 mt-0.5 text-[11px] sm:text-xs text-[var(--text-muted)] font-semibold truncate">
                  <span>{messages.length} msgs</span>
                  <span>•</span>
                  {session.is_human_takeover ? (
                    <span className="inline-flex items-center gap-1 text-amber-500 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded text-[10px] sm:text-xs">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" /> 👨‍💼 Live Agent
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-emerald-500">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> RAG Active
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto chat-scroll pb-0.5">
              <button
                onClick={() => exportChatAsTxt(session.title, messages)}
                title="Download transcript as TXT"
                className="flex items-center gap-1 text-[11px] sm:text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-2.5 py-1.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] hover:border-primary-500/40 transition-all shrink-0"
              >
                <Download className="h-3.5 w-3.5 text-primary-500" /> TXT
              </button>
              <button
                onClick={() => exportChatAsPdf(session.title, messages)}
                title="Print or save as PDF"
                className="flex items-center gap-1 text-[11px] sm:text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-2.5 py-1.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] hover:border-primary-500/40 transition-all shrink-0"
              >
                <FileText className="h-3.5 w-3.5 text-indigo-500" /> PDF
              </button>
              <button
                onClick={async () => {
                  try {
                    toast.loading('Sending email transcript...', { id: 'email-t' })
                    await chatService.emailTranscript(sessionId)
                    toast.success(`Transcript emailed!`, { id: 'email-t' })
                  } catch (err) {
                    toast.error(err.response?.data?.error || 'Failed to email transcript.', { id: 'email-t' })
                  }
                }}
                title="Email transcript to me"
                className="flex items-center gap-1 text-[11px] sm:text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-2.5 py-1.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] hover:border-primary-500/40 transition-all shrink-0"
              >
                <Mail className="h-3.5 w-3.5 text-emerald-500" /> Email
              </button>
              <button
                onClick={() => setShowDeleteSessionModal(true)}
                title="Delete Conversation"
                className="p-1.5 text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all ml-1 shrink-0"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Messages Viewport */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto chat-scroll px-4 md:px-8 py-6"
        >
          {loading ? (
            <div className="max-w-3xl mx-auto flex flex-col gap-6">
              {[1,2,3].map(i => <SkeletonMessage key={i} />)}
            </div>
          ) : messages.length === 0 && !sessionId ? (
            <WelcomeScreen user={user} onSelectPrompt={(text) => { setInput(text); inputRef.current?.focus() }} />
          ) : (
            <div className="max-w-3xl mx-auto flex flex-col gap-5">
              {messages.map(msg => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  onFeedback={() => {}}
                  onCopy={() => {}}
                  onDeleteMessage={(m) => setDeletingMessage(m)}
                  onEditSubmit={handleEditSubmit}
                  isDark={isDark}
                />
              ))}

              {/* Streaming response */}
              {streaming && streamingContent && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3.5 my-1"
                >
                  <div className="h-10 w-10 rounded-2xl bg-gradient-primary flex items-center justify-center shrink-0 shadow-glow-indigo">
                    <Bot className="h-5 w-5 text-white animate-pulse" />
                  </div>
                  <div className="chat-bubble-ai px-5 py-4 text-sm max-w-[85%] sm:max-w-[78%]">
                    <ErrorBoundary>
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={getMarkdownComponents(isDark)}
                        >
                          {streamingContent}
                        </ReactMarkdown>
                      </div>
                    </ErrorBoundary>
                    <span className="inline-block h-4 w-1 bg-primary-500 ml-1 rounded-full animate-pulse" />
                  </div>
                </motion.div>
              )}

              {/* Typing indicator */}
              {streaming && !streamingContent && <TypingIndicator />}

              {/* Suggestions */}
              {suggestions.length > 0 && !streaming && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col gap-2.5 mt-2"
                >
                  <p className="text-xs text-[var(--text-muted)] flex items-center gap-1.5 font-bold">
                    <Lightbulb className="h-4 w-4 text-amber-500 animate-pulse" /> Recommended Follow-ups
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => { setInput(s); inputRef.current?.focus() }}
                        className="text-xs px-4 py-2.5 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] hover:border-primary-500 hover:bg-primary-500/5 text-[var(--text-secondary)] hover:text-primary-600 dark:hover:text-primary-400 transition-all font-semibold shadow-sm hover:scale-[1.02]"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              <div className="h-6" />
            </div>
          )}
        </div>

        {/* Scroll Bottom Floating Button */}
        <AnimatePresence>
          {showScrollBtn && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => scrollToBottom()}
              className="absolute right-8 bottom-32 h-11 w-11 rounded-2xl glass-card shadow-glow-indigo flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all z-20"
            >
              <ChevronDown className="h-5 w-5" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Next-Gen Input Floating Dock */}
        <div className="shrink-0 px-4 md:px-8 py-5 border-t border-[var(--border)] bg-[var(--bg-card)] backdrop-blur-xl z-10">
          <div className="max-w-3xl mx-auto">
            {/* Regenerate Button */}
            {messages.length > 0 && messages[messages.length - 1]?.role === 'assistant' && !streaming && (
              <div className="flex justify-center mb-3">
                <button
                  onClick={regenerate}
                  className="flex items-center gap-2 text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-4 py-2 rounded-2xl border border-[var(--border)] hover:border-primary-500/40 bg-[var(--bg-secondary)] transition-all shadow-sm active:scale-95"
                >
                  <RotateCcw className="h-3.5 w-3.5 text-indigo-500" /> Regenerate Response
                </button>
              </div>
            )}

            {/* Input Bar */}
            <div className="flex items-end gap-3 glass-card rounded-3xl p-3 focus-within:border-primary-500 focus-within:ring-4 focus-within:ring-primary-500/15 transition-all shadow-card">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value)
                  e.target.style.height = 'auto'
                  e.target.style.height = Math.min(e.target.scrollHeight, 180) + 'px'
                }}
                onKeyDown={handleKeyDown}
                placeholder="Ask SupportGenie anything from knowledge base..."
                rows={1}
                className="flex-1 bg-transparent resize-none border-none outline-none ring-0 focus:outline-none focus:ring-0 focus:border-transparent focus-visible:outline-none focus-visible:ring-0 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] max-h-44 leading-relaxed px-2 font-medium"
                style={{ height: '26px' }}
              />

              {/* Action Buttons: Send/Stop */}
              <div className="flex items-center gap-2 shrink-0">

                {streaming ? (
                  <button
                    onClick={stopStreaming}
                    className="h-10 w-10 rounded-2xl bg-red-600 hover:bg-red-700 text-white flex items-center justify-center transition-all shadow-glow"
                  >
                    <Square className="h-4 w-4 fill-current" />
                  </button>
                ) : (
                  <button
                    onClick={() => sendMessage()}
                    disabled={!input.trim()}
                    className={cn(
                      'h-10 w-10 rounded-2xl flex items-center justify-center transition-all font-bold',
                      input.trim()
                        ? 'bg-gradient-primary text-white shadow-glow-indigo hover:opacity-95 active:scale-95'
                        : 'bg-surface-200 dark:bg-surface-800 text-surface-400 cursor-not-allowed'
                    )}
                  >
                    <Send className="h-4.5 w-4.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between px-3 mt-2.5 text-[11px] text-[var(--text-muted)] font-semibold">
              <span className="flex items-center gap-1">
                <Shield className="h-3 w-3 text-emerald-500" /> SupportGenie AI · Enterprise Protected Knowledge
              </span>
              {input.length > 0 && <span>{input.length} characters</span>}
            </div>
          </div>
        </div>

        {/* CUSTOM CONFIRMATION MODALS */}
        <ConfirmModal
          open={Boolean(deletingMessage)}
          onClose={() => setDeletingMessage(null)}
          onConfirm={confirmDeleteMessage}
          loading={deleteLoading}
          title="Delete Message?"
          description="Are you sure you want to delete this message? This action cannot be undone."
          confirmText="Delete Message"
        />

        <ConfirmModal
          open={showDeleteSessionModal}
          onClose={() => setShowDeleteSessionModal(false)}
          onConfirm={confirmDeleteSession}
          loading={deleteLoading}
          title="Delete Conversation?"
          description="Are you sure you want to delete this entire conversation? All message history will be permanently removed."
          confirmText="Delete Conversation"
        />
      </div>
    </CustomerLayout>
  )
}
