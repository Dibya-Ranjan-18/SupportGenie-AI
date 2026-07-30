import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, RefreshCw } from 'lucide-react'

export default function ServerErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] px-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-md">
        <div className="text-8xl font-black text-red-500 mb-4">500</div>
        <h1 className="text-2xl font-bold mb-2">Server error</h1>
        <p className="text-[var(--text-secondary)] mb-8">Something went wrong on our end. We're working to fix it.</p>
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => window.location.reload()} className="btn-primary"><RefreshCw className="h-4 w-4" /> Try again</button>
          <Link to="/" className="btn-secondary"><Home className="h-4 w-4" /> Home</Link>
        </div>
      </motion.div>
    </div>
  )
}
