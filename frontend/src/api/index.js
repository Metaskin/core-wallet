import client from './client';

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authAPI = {
  register:       (data) => client.post('/auth/register', data),
  login:          (data) => client.post('/auth/login', data),
  verifyOtp:      (data) => client.post('/auth/verify-otp', data),
  me:             ()     => client.get('/auth/me'),
  changePassword: (data) => client.post('/auth/change-password', data),
  changeEmail:    (data) => client.patch('/auth/change-email', data),
  forgotPassword: (data) => client.post('/auth/forgot-password', data),
  resetPassword:  (data) => client.post('/auth/reset-password', data),
};

// ─── Account ─────────────────────────────────────────────────────────────────
export const accountAPI = {
  getMe: () => client.get('/accounts/me'),
};

// ─── Transactions ─────────────────────────────────────────────────────────────
export const transactionAPI = {
  send:       (data)              => client.post('/transactions/send', data),
  getMine:    (page = 1, limit = 20) => client.get(`/transactions?page=${page}&limit=${limit}`),
  deleteById: (id)                => client.delete(`/transactions/${id}`),
};

// ─── Cards ────────────────────────────────────────────────────────────────────
export const cardAPI = {
  getAll:        ()              => client.get('/cards'),
  issue:         (data)          => client.post('/cards', data),
  secureDetails: (cardId, pin)   => client.post(`/cards/${cardId}/secure-details`, { pin }),
  toggleFreeze:  (cardId)        => client.patch(`/cards/${cardId}/freeze`),
};

// ─── Security ─────────────────────────────────────────────────────────────────
export const securityAPI = {
  hasPin:    ()      => client.get('/security/has-pin'),
  setPin:    (pin)   => client.post('/security/set-pin',    { pin }),
  verifyPin: (pin)   => client.post('/security/verify-pin', { pin }),
};

// ─── Support ──────────────────────────────────────────────────────────────────
export const supportAPI = {
  createTicket:  (data)              => client.post('/support/tickets', data),
  getTickets:    ()                  => client.get('/support/tickets'),
  getTicket:     (id)                => client.get(`/support/tickets/${id}`),
  sendMessage:   (id, message)       => client.post(`/support/tickets/${id}/messages`, { message }),
  // admin
  adminTickets:  ()                  => client.get('/support/admin/tickets'),
  adminSetStatus:(id, status)        => client.patch(`/support/admin/tickets/${id}/status`, { status }),
  adminReply:    (id, message)       => client.post(`/support/admin/tickets/${id}/messages`, { message }),
};

// ─── Notifications ────────────────────────────────────────────────────────────
export const notificationAPI = {
  getAll:       (limit = 50, offset = 0) => client.get(`/notifications?limit=${limit}&offset=${offset}`),
  getUnreadCount: ()                     => client.get('/notifications/unread-count'),
  markRead:     (id)                     => client.patch(`/notifications/${id}/read`),
  markAllRead:  ()                       => client.patch('/notifications/read-all'),
  delete:       (id)                     => client.delete(`/notifications/${id}`),
};

// ─── Admin ────────────────────────────────────────────────────────────────────
export const adminAPI = {
  getUsers:     ()        => client.get('/admin/users'),
  createUser:   (data)    => client.post('/admin/users', data),
  credit:       (data)    => client.post('/admin/credit', data),
  debit:        (data)    => client.post('/admin/debit', data),
  toggleStatus: (accId)   => client.patch(`/admin/accounts/${accId}/toggle-status`),
  getTransactions: (page = 1) => client.get(`/admin/transactions?page=${page}`),
};
