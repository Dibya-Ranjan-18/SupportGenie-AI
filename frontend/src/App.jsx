import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { Suspense, lazy } from 'react'

import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { SkeletonCard } from './components/ui/Skeleton'

// Auth pages
const LandingPage    = lazy(() => import('./pages/LandingPage'))
const LoginPage      = lazy(() => import('./pages/auth/LoginPage'))
const RegisterPage   = lazy(() => import('./pages/auth/RegisterPage'))
const ForgotPwPage   = lazy(() => import('./pages/auth/ForgotPasswordPage'))
const ResetPwPage    = lazy(() => import('./pages/auth/ResetPasswordPage'))

// Customer pages
const ChatPage       = lazy(() => import('./pages/chat/ChatPage'))
const HistoryPage    = lazy(() => import('./pages/chat/HistoryPage'))
const TicketsPage    = lazy(() => import('./pages/tickets/TicketsPage'))
const NewTicketPage  = lazy(() => import('./pages/tickets/NewTicketPage'))
const TicketDetail   = lazy(() => import('./pages/tickets/TicketDetailPage'))
const ProfilePage    = lazy(() => import('./pages/ProfilePage'))
const SettingsPage   = lazy(() => import('./pages/SettingsPage'))

// Admin pages
const AdminDashboard = lazy(() => import('./pages/admin/DashboardPage'))
const AdminUsers     = lazy(() => import('./pages/admin/UsersPage'))
const AdminKnowledge = lazy(() => import('./pages/admin/KnowledgePage'))
const AdminTickets   = lazy(() => import('./pages/admin/AdminTicketsPage'))
const AdminAnalytics = lazy(() => import('./pages/admin/AnalyticsPage'))
const AdminFeedback  = lazy(() => import('./pages/admin/FeedbackPage'))

// Error pages
const NotFoundPage   = lazy(() => import('./pages/NotFoundPage'))
const ServerErrorPage = lazy(() => import('./pages/ServerErrorPage'))

// Route guards
function BlockedPage() {
  const { logout } = useAuth()
  return (
    <div className="flex items-center justify-center h-screen bg-[var(--bg-primary)]">
      <div className="text-center max-w-sm px-6">
        <div className="h-16 w-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-5">
          <span className="text-3xl">🚫</span>
        </div>
        <h1 className="text-xl font-extrabold text-[var(--text-primary)] mb-2">Account Suspended</h1>
        <p className="text-sm text-[var(--text-secondary)] mb-6 leading-relaxed">
          Your account has been suspended by an administrator. Please contact our support team for assistance.
        </p>
        <a
          href="mailto:support@supportgenie.ai"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-bold hover:bg-primary-700 transition-all"
        >
          Contact Support
        </a>
        <button
          onClick={logout}
          className="block mx-auto mt-3 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] underline transition-colors"
        >
          Sign out
        </button>
      </div>
    </div>
  )
}

function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth()
  if (loading) return <PageLoader />
  if (!user) return <Navigate to="/login" replace />
  if (user.is_blocked) return <BlockedPage />
  if (role && user.role !== role) {
    return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/chat'} replace />
  }
  return children
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <PageLoader />
  if (user) return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/chat'} replace />
  return children
}

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="flex flex-col gap-2 items-center">
        <div className="h-8 w-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-[var(--text-muted)]">Loading...</p>
      </div>
    </div>
  )
}

function SuspensePage({ children }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<SuspensePage><LandingPage /></SuspensePage>} />
      <Route path="/login" element={<PublicRoute><SuspensePage><LoginPage /></SuspensePage></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><SuspensePage><RegisterPage /></SuspensePage></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><SuspensePage><ForgotPwPage /></SuspensePage></PublicRoute>} />
      <Route path="/reset-password/:token" element={<SuspensePage><ResetPwPage /></SuspensePage>} />

      {/* Customer */}
      <Route path="/chat" element={<ProtectedRoute role="customer"><SuspensePage><ChatPage /></SuspensePage></ProtectedRoute>} />
      <Route path="/chat/:sessionId" element={<ProtectedRoute role="customer"><SuspensePage><ChatPage /></SuspensePage></ProtectedRoute>} />
      <Route path="/history" element={<ProtectedRoute role="customer"><SuspensePage><HistoryPage /></SuspensePage></ProtectedRoute>} />
      <Route path="/tickets" element={<ProtectedRoute role="customer"><SuspensePage><TicketsPage /></SuspensePage></ProtectedRoute>} />
      <Route path="/tickets/new" element={<ProtectedRoute role="customer"><SuspensePage><NewTicketPage /></SuspensePage></ProtectedRoute>} />
      <Route path="/tickets/:id" element={<ProtectedRoute role="customer"><SuspensePage><TicketDetail /></SuspensePage></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><SuspensePage><ProfilePage /></SuspensePage></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute role="customer"><SuspensePage><SettingsPage /></SuspensePage></ProtectedRoute>} />

      {/* Admin */}
      <Route path="/admin/dashboard" element={<ProtectedRoute role="admin"><SuspensePage><AdminDashboard /></SuspensePage></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute role="admin"><SuspensePage><AdminUsers /></SuspensePage></ProtectedRoute>} />
      <Route path="/admin/knowledge" element={<ProtectedRoute role="admin"><SuspensePage><AdminKnowledge /></SuspensePage></ProtectedRoute>} />
      <Route path="/admin/tickets" element={<ProtectedRoute role="admin"><SuspensePage><AdminTickets /></SuspensePage></ProtectedRoute>} />
      <Route path="/admin/analytics" element={<ProtectedRoute role="admin"><SuspensePage><AdminAnalytics /></SuspensePage></ProtectedRoute>} />
      <Route path="/admin/feedback" element={<ProtectedRoute role="admin"><SuspensePage><AdminFeedback /></SuspensePage></ProtectedRoute>} />

      {/* Errors */}
      <Route path="/500" element={<SuspensePage><ServerErrorPage /></SuspensePage>} />
      <Route path="*" element={<SuspensePage><NotFoundPage /></SuspensePage>} />
    </Routes>
  )
}

import ErrorBoundary from './components/ui/ErrorBoundary'

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <ErrorBoundary>
            <AppRoutes />
          </ErrorBoundary>
          <Toaster
            position="top-right"
            toastOptions={{
              className: '!bg-[var(--bg-card)] !text-[var(--text-primary)] !border !border-[var(--border)] !shadow-card',
              duration: 4000,
              success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
              error: { iconTheme: { primary: '#f43f5e', secondary: '#fff' } },
            }}
          />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
