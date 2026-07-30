import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Upload, Trash2, RefreshCw, BookOpen, FileText, Search, X, CheckCircle, AlertCircle, Clock, Loader2, Globe, Link2 } from 'lucide-react'
import toast from 'react-hot-toast'
import AdminLayout from '../../layouts/AdminLayout'
import { knowledgeService } from '../../services'
import { formatRelative } from '../../utils'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import { SkeletonCard } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'

const STATUS_ICONS = {
  indexed:    <CheckCircle className="h-4 w-4 text-emerald-500" />,
  processing: <Loader2 className="h-4 w-4 text-primary-500 animate-spin" />,
  pending:    <Clock className="h-4 w-4 text-amber-500" />,
  failed:     <AlertCircle className="h-4 w-4 text-red-500" />,
}

export default function KnowledgePage() {
  const [documents, setDocuments] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  
  // File Upload Modal State
  const [uploadModal, setUploadModal] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadTitle, setUploadTitle] = useState('')
  const [uploadFile, setUploadFile] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef()

  // URL Index Modal State
  const [urlModal, setUrlModal] = useState(false)
  const [indexingUrl, setIndexingUrl] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const [urlTitleInput, setUrlTitleInput] = useState('')

  const fetchData = async () => {
    try {
      const [docsRes, statsRes] = await Promise.all([
        knowledgeService.getDocuments(search),
        knowledgeService.getStats(),
      ])
      setDocuments(docsRes.data)
      setStats(statsRes.data)
    } catch { toast.error('Failed to load documents.') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])
  useEffect(() => {
    const timer = setTimeout(fetchData, 400)
    return () => clearTimeout(timer)
  }, [search])

  // Poll for processing documents
  useEffect(() => {
    const hasProcessing = documents.some(d => d.status === 'processing' || d.status === 'pending')
    if (!hasProcessing) return
    const interval = setInterval(fetchData, 3000)
    return () => clearInterval(interval)
  }, [documents])

  const handleUpload = async () => {
    if (!uploadTitle.trim() || !uploadFile) {
      toast.error('Please provide a title and select a file.')
      return
    }
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('title', uploadTitle.trim())
      formData.append('file', uploadFile)
      await knowledgeService.uploadDocument(formData)
      toast.success('Document uploaded! Indexing in progress...')
      setUploadModal(false)
      setUploadTitle('')
      setUploadFile(null)
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.file?.[0] || err.response?.data?.title?.[0] || 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  const handleIndexUrl = async () => {
    if (!urlInput.trim()) {
      toast.error('Please enter a valid webpage URL.')
      return
    }
    setIndexingUrl(true)
    try {
      await knowledgeService.indexUrl(urlInput.trim(), urlTitleInput.trim())
      toast.success('Webpage content scraped and indexed into RAG!')
      setUrlModal(false)
      setUrlInput('')
      setUrlTitleInput('')
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to scrape and index URL.')
    } finally {
      setIndexingUrl(false)
    }
  }

  const handleDelete = async (doc) => {
    if (!confirm(`Delete "${doc.title}"? This will remove it from the knowledge base.`)) return
    try {
      await knowledgeService.deleteDocument(doc.id)
      setDocuments(prev => prev.filter(d => d.id !== doc.id))
      toast.success('Document deleted.')
      fetchData()
    } catch { toast.error('Failed to delete.') }
  }

  const handleReindex = async (doc) => {
    try {
      await knowledgeService.reindexDocument(doc.id)
      toast.success('Re-indexing started...')
      setDocuments(prev => prev.map(d => d.id === doc.id ? { ...d, status: 'processing' } : d))
    } catch { toast.error('Failed to start re-indexing.') }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) {
      setUploadFile(f)
      if (!uploadTitle) setUploadTitle(f.name.replace(/\.[^/.]+$/, ''))
    }
  }

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Knowledge Base RAG</h1>
            <p className="text-sm text-[var(--text-secondary)] mt-0.5">Manage documents and website URLs indexed into FAISS vector store</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" icon={<Globe className="h-4 w-4" />} onClick={() => setUrlModal(true)}>
              Index Web URL
            </Button>
            <Button variant="primary" icon={<Upload className="h-4 w-4" />} onClick={() => setUploadModal(true)}>
              Upload Document
            </Button>
          </div>
        </div>

        {/* Stats Row */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary-100 dark:bg-primary-900/20 text-primary-600 flex items-center justify-center font-bold">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)] font-medium">Total Docs</p>
                <p className="text-xl font-bold">{stats.total_documents}</p>
              </div>
            </div>
            <div className="card p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 flex items-center justify-center font-bold">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)] font-medium">Indexed</p>
                <p className="text-xl font-bold">{stats.indexed}</p>
              </div>
            </div>
            <div className="card p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-900/20 text-amber-600 flex items-center justify-center font-bold">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)] font-medium">Processing</p>
                <p className="text-xl font-bold">{stats.processing}</p>
              </div>
            </div>
            <div className="card p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-violet-100 dark:bg-violet-900/20 text-violet-600 flex items-center justify-center font-bold">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)] font-medium">Total Chunks</p>
                <p className="text-xl font-bold">{stats.total_chunks}</p>
              </div>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search documents by title..."
            className="input pl-10"
          />
        </div>

        {/* Document Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <SkeletonCard /><SkeletonCard /><SkeletonCard />
          </div>
        ) : documents.length === 0 ? (
          <EmptyState
            icon={<BookOpen className="h-8 w-8" />}
            title="No documents yet"
            description="Upload PDF, DOCX, TXT files or index website URLs to build your AI knowledge base"
            action={
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setUrlModal(true)}>Index Web URL</Button>
                <Button variant="primary" onClick={() => setUploadModal(true)}>Upload Document</Button>
              </div>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((doc, i) => (
              <motion.div key={doc.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="h-10 w-10 rounded-xl bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center shrink-0">
                    {doc.file_type === 'url' ? <Globe className="h-5 w-5 text-emerald-500" /> : <FileText className="h-5 w-5 text-primary-600 dark:text-primary-400" />}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {STATUS_ICONS[doc.status]}
                    <Badge status={doc.status} />
                  </div>
                </div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1 line-clamp-2">{doc.title}</h3>
                <p className="text-xs text-[var(--text-muted)] mb-3">
                  {doc.file_type?.toUpperCase()} · {doc.file_size_display} · {doc.chunk_count} chunks
                </p>
                {doc.error_message && (
                  <p className="text-xs text-red-500 mb-3 bg-red-100 dark:bg-red-900/20 px-2 py-1 rounded-lg">{doc.error_message}</p>
                )}
                <p className="text-xs text-[var(--text-muted)] mb-4">Uploaded {formatRelative(doc.created_at)}</p>
                <div className="flex items-center gap-2">
                  {doc.status === 'failed' && doc.file_type !== 'url' && (
                    <button onClick={() => handleReindex(doc)} className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 px-2 py-1.5 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/20 transition-all">
                      <RefreshCw className="h-3.5 w-3.5" /> Retry
                    </button>
                  )}
                  {doc.status === 'indexed' && doc.file_type !== 'url' && (
                    <button onClick={() => handleReindex(doc)} className="flex items-center gap-1 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-2 py-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] transition-all">
                      <RefreshCw className="h-3.5 w-3.5" /> Re-index
                    </button>
                  )}
                  <button onClick={() => handleDelete(doc)} className="ml-auto flex items-center gap-1 text-xs text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 px-2 py-1.5 rounded-lg transition-all">
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Document Modal */}
      <Modal
        open={uploadModal}
        onClose={() => { setUploadModal(false); setUploadFile(null); setUploadTitle('') }}
        title="Upload Document"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setUploadModal(false); setUploadFile(null); setUploadTitle('') }}>Cancel</Button>
            <Button variant="primary" loading={uploading} onClick={handleUpload}>Upload & Index</Button>
          </>
        }
      >
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Document Title *</label>
            <input
              value={uploadTitle}
              onChange={e => setUploadTitle(e.target.value)}
              placeholder="e.g., Product Documentation v2.0"
              className="input"
            />
          </div>

          {/* Dropzone */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
              dragOver ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10' : 'border-[var(--border)] hover:border-primary-400'
            }`}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.docx,.txt"
              className="hidden"
              onChange={e => {
                const f = e.target.files[0]
                if (f) {
                  setUploadFile(f)
                  if (!uploadTitle) setUploadTitle(f.name.replace(/\.[^/.]+$/, ''))
                }
              }}
            />
            {uploadFile ? (
              <div className="flex items-center justify-center gap-3">
                <FileText className="h-8 w-8 text-primary-500" />
                <div className="text-left">
                  <p className="text-sm font-medium">{uploadFile.name}</p>
                  <p className="text-xs text-[var(--text-muted)]">{(uploadFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <button onClick={(e) => { e.stopPropagation(); setUploadFile(null) }} className="ml-auto text-[var(--text-muted)]">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <>
                <Upload className="h-10 w-10 text-[var(--text-muted)] mx-auto mb-3" />
                <p className="text-sm font-medium text-[var(--text-primary)]">Drop file here or click to browse</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">PDF, DOCX, TXT — Max 25MB</p>
              </>
            )}
          </div>
        </div>
      </Modal>

      {/* Index URL Modal */}
      <Modal
        open={urlModal}
        onClose={() => { setUrlModal(false); setUrlInput(''); setUrlTitleInput('') }}
        title="Index Webpage URL"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setUrlModal(false); setUrlInput(''); setUrlTitleInput('') }}>Cancel</Button>
            <Button variant="primary" loading={indexingUrl} onClick={handleIndexUrl} icon={<Globe className="h-4 w-4" />}>
              Scrape & Index URL
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="p-3 bg-primary-500/10 border border-primary-500/20 rounded-xl text-xs text-primary-700 dark:text-primary-300">
            <strong>Web Scraping RAG:</strong> SupportGenie will fetch the HTML of the website, extract the text content, and embed it into the FAISS vector database.
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Webpage URL *</label>
            <div className="relative flex items-center">
              <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
              <input
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
                placeholder="https://docs.example.com/faq"
                className="input pl-9"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Document Label (Optional)</label>
            <input
              value={urlTitleInput}
              onChange={e => setUrlTitleInput(e.target.value)}
              placeholder="e.g., Company FAQ Page (auto-detected if blank)"
              className="input"
            />
          </div>
        </div>
      </Modal>
    </AdminLayout>
  )
}
