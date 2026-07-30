import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Bot, Zap, Shield, BarChart2,
  ArrowRight, Upload, Brain, Sparkles, Ticket, Sun, Moon, CheckCircle, MessageSquare
} from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

const FEATURES = [
  { icon: <Brain className="h-6 w-6" />, title: 'RAG-Powered AI', desc: 'Answers from your actual documents. No hallucinations, no guesswork.', color: 'primary' },
  { icon: <Zap className="h-6 w-6" />, title: 'Instant Responses', desc: 'Streaming answers that feel as fast as human conversation.', color: 'amber' },
  { icon: <Upload className="h-6 w-6" />, title: 'Easy Knowledge Upload', desc: 'Upload PDF, DOCX, TXT files and they\'re instantly searchable.', color: 'emerald' },
  { icon: <Shield className="h-6 w-6" />, title: 'Enterprise Security', desc: 'JWT auth, role-based access, encrypted storage.', color: 'sky' },
  { icon: <BarChart2 className="h-6 w-6" />, title: 'Analytics Dashboard', desc: 'Track usage, satisfaction, and ticket resolution rates.', color: 'violet' },
  { icon: <Ticket className="h-6 w-6" />, title: 'Ticket Management', desc: 'Seamlessly escalate from AI chat to human support.', color: 'rose' },
]


export default function LandingPage() {
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] overflow-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center gap-4 px-6 py-4 border-b border-[var(--border)] bg-[var(--bg-primary)]/80 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
            <Bot className="h-4.5 w-4.5 text-white" />
          </div>
          <span className="text-sm font-bold">SupportGenie AI</span>
        </div>
        <div className="flex-1" />
        <button onClick={toggleTheme} className="p-2 rounded-xl hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] transition-colors">
          {theme === 'dark' ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
        </button>
        <Link to="/login" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-medium px-3 py-1.5">
          Sign in
        </Link>
        <Link to="/register" className="btn-primary text-sm px-4 py-2">
          Get started free
        </Link>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-6 text-center overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-20 left-1/4 h-80 w-80 bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-40 right-1/4 h-80 w-80 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="relative z-10 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary-300/50 bg-primary-100/50 dark:bg-primary-900/20 dark:border-primary-700/50 text-primary-700 dark:text-primary-300 text-xs font-semibold mb-6">
            <Sparkles className="h-3.5 w-3.5" />
            Powered by Google Gemini + LangChain RAG
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-[var(--text-primary)] leading-tight mb-6">
            AI Support That<br />
            <span className="gradient-text">Actually Knows</span><br />
            Your Product
          </h1>

          <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto mb-10 leading-relaxed">
            SupportGenie AI answers customer questions directly from your knowledge base. No hallucinations, no generic answers — just accurate, cited responses from your documents.
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link to="/register" className="btn-primary px-8 py-3.5 text-base rounded-2xl shadow-glow">
              Start for free <ArrowRight className="h-4.5 w-4.5 ml-1" />
            </Link>
            <Link to="/login" className="btn-secondary px-8 py-3.5 text-base rounded-2xl">
              Sign in
            </Link>
          </div>

          <div className="flex items-center justify-center gap-6 mt-10 text-sm text-[var(--text-muted)] flex-wrap">
            {['No credit card required', 'Setup in 5 minutes', '10,000+ teams trust us'].map(t => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4 text-emerald-500" /> {t}
              </span>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-[var(--bg-secondary)]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-3">Everything you need for AI-powered support</h2>
            <p className="text-[var(--text-secondary)]">A complete platform built for modern customer support teams</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="card-hover p-6"
              >
                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center mb-4 bg-${f.color}-100 dark:bg-${f.color}-900/20 text-${f.color}-600 dark:text-${f.color}-400`}>
                  {f.icon}
                </div>
                <h3 className="text-base font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-3">Get started in minutes</h2>
            <p className="text-[var(--text-secondary)]">Three simple steps to AI-powered support</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {[
              { step: '01', title: 'Upload your docs', desc: 'Drop in PDF, DOCX, or TXT files. They\'re automatically chunked and embedded.', icon: <Upload className="h-6 w-6" /> },
              { step: '02', title: 'AI indexes & learns', desc: 'Our FAISS vector store indexes your content for lightning-fast semantic search.', icon: <Brain className="h-6 w-6" /> },
              { step: '03', title: 'Start answering', desc: 'Your chatbot instantly answers questions with citations from your actual documents.', icon: <MessageSquare className="h-6 w-6" /> },
            ].map((s, i) => (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="flex flex-col items-center text-center"
              >
                <div className="h-16 w-16 rounded-2xl bg-gradient-primary flex items-center justify-center text-white mb-5 shadow-glow">
                  {s.icon}
                </div>
                <span className="text-xs font-bold text-primary-500 mb-1">STEP {s.step}</span>
                <h3 className="text-lg font-bold mb-2">{s.title}</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>


      {/* CTA */}
      <section className="py-20 px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center"
        >
          <div className="h-16 w-16 rounded-2xl bg-gradient-primary flex items-center justify-center mx-auto mb-6 shadow-glow">
            <Bot className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-4xl font-black mb-4 text-[var(--text-primary)]">
            Ready to transform your support?
          </h2>
          <p className="text-[var(--text-secondary)] mb-8 text-lg">
            Join thousands of teams using SupportGenie AI to deliver instant, accurate support.
          </p>
          <Link to="/register" className="btn-primary px-10 py-4 text-base rounded-2xl shadow-glow inline-flex items-center gap-2">
            Get started free <ArrowRight className="h-5 w-5" />
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] py-8 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Bot className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-bold">SupportGenie AI</span>
          </div>
          <p className="text-xs text-[var(--text-muted)]">© 2026 SupportGenie AI. Built with Google Gemini + LangChain.</p>
          <div className="flex gap-4 text-xs text-[var(--text-secondary)]">
            <Link to="/login" className="hover:text-[var(--text-primary)]">Login</Link>
            <Link to="/register" className="hover:text-[var(--text-primary)]">Sign up</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
