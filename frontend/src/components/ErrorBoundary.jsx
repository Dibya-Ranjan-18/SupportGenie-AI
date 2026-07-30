import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled UI Exception:', error, errorInfo)
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary,#090d16)] text-[var(--text-primary,#f3f4f6)] p-6">
          <div className="max-w-md w-full bg-[var(--bg-card,#111827)] border border-[var(--border,#1f2937)] rounded-3xl p-8 text-center shadow-2xl">
            <div className="h-16 w-16 mx-auto mb-6 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center border border-rose-500/20">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-extrabold text-white mb-2">Something went wrong</h2>
            <p className="text-sm text-surface-400 mb-6 font-medium leading-relaxed">
              An unexpected error occurred while rendering the page. Don't worry, your data is safe.
            </p>
            <button
              onClick={this.handleReload}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Reload Application</span>
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
