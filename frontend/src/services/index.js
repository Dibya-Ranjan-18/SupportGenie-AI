import api from './api'

export const authService = {
  register: (data) => api.post('/auth/register/', data),
  login: (data) => api.post('/auth/login/', data),
  logout: () => api.post('/auth/logout/'),  // refresh_token sent via HttpOnly cookie automatically
  getProfile: () => api.get('/auth/profile/'),
  updateProfile: (data) => {
    const formData = new FormData()
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) formData.append(key, value)
    })
    return api.patch('/auth/profile/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  changePassword: (data) => api.post('/auth/change-password/', data),
  forgotPassword: (email) => api.post('/auth/forgot-password/', { email }),
  verifyOTP: (email, otp) => api.post('/auth/verify-otp/', { email, otp }),
  resetPassword: (data) => api.post('/auth/reset-password/', data),
}

export const chatService = {
  getSessions: (search = '') => api.get(`/chat/sessions/${search ? `?search=${search}` : ''}`),
  createSession: (title = 'New Conversation') => api.post('/chat/sessions/', { title }),
  getSession: (id) => api.get(`/chat/sessions/${id}/`),
  renameSession: (id, title) => api.patch(`/chat/sessions/${id}/`, { title }),
  deleteSession: (id) => api.delete(`/chat/sessions/${id}/`),
  getMessages: (sessionId) => api.get(`/chat/sessions/${sessionId}/messages/`),
  deleteMessage: (messageId) => api.delete(`/chat/messages/${messageId}/`),
  editMessage: (messageId, content) => api.patch(`/chat/messages/${messageId}/`, { content }),
  emailTranscript: (sessionId) => api.post(`/chat/sessions/${sessionId}/email/`),
  toggleTakeover: (sessionId) => api.post(`/chat/admin/sessions/${sessionId}/takeover/`),
  sendAgentMessage: (sessionId, content) => api.post(`/chat/admin/sessions/${sessionId}/agent-message/`, { content }),
}

export const knowledgeService = {
  getDocuments: (search = '') => api.get(`/knowledge/documents/${search ? `?search=${search}` : ''}`),
  uploadDocument: (formData) => api.post('/knowledge/documents/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  deleteDocument: (id) => api.delete(`/knowledge/documents/${id}/`),
  reindexDocument: (id) => api.post(`/knowledge/documents/${id}/reindex/`),
  indexUrl: (url, title = '') => api.post('/knowledge/documents/index-url/', { url, title }),
  getStats: () => api.get('/knowledge/stats/'),
}

export const ticketService = {
  getTickets: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return api.get(`/tickets/${query ? `?${query}` : ''}`)
  },
  createTicket: (data) => api.post('/tickets/', data),
  getTicket: (id) => api.get(`/tickets/${id}/`),
  updateTicket: (id, data) => api.patch(`/tickets/${id}/`, data),
  deleteTicket: (id) => api.delete(`/tickets/${id}/`),
  addComment: (id, data) => api.post(`/tickets/${id}/comments/`, data),
}

export const feedbackService = {
  submitFeedback: (data) => api.post('/feedback/', data),
  getFeedback: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return api.get(`/feedback/${query ? `?${query}` : ''}`)
  },
  getStats: () => api.get('/feedback/stats/'),
}

export const analyticsService = {
  getOverview: () => api.get('/analytics/overview/'),
  getChats: (params = {}) => api.get('/analytics/chats/', { params }),
  getUsers: (params = {}) => api.get('/analytics/users/', { params }),
  getTickets: (params = {}) => api.get('/analytics/tickets/', { params }),
  getFeedbackAnalytics: (params = {}) => api.get('/analytics/feedback/', { params }),
}

export const dashboardService = {
  getStats: () => api.get('/dashboard/stats/'),
}

export const adminService = {
  getUsers: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return api.get(`/auth/admin/users/${query ? `?${query}` : ''}`)
  },
  getUser: (id) => api.get(`/auth/admin/users/${id}/`),
  updateUser: (id, data) => api.patch(`/auth/admin/users/${id}/`, data),
  deleteUser: (id) => api.delete(`/auth/admin/users/${id}/`),
}

export const notificationService = {
  getNotifications: () => api.get('/notifications/'),
  markAllRead: () => api.patch('/notifications/'),
  markRead: (id) => api.patch(`/notifications/${id}/`),
}
