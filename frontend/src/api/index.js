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
  getMe:            ()                                                   => client.get('/accounts/me'),
  getAll:           ()                                                   => client.get('/accounts/me'),
  createSavings:    ()                                                   => client.post('/accounts/savings'),
  internalTransfer: (fromAccountId, toAccountId, amount, description)   =>
    client.post('/accounts/internal-transfer', { fromAccountId, toAccountId, amount, description }),
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

// ─── Statements ───────────────────────────────────────────────────────────────
export const statementAPI = {
  download: () => client.get('/statements/me', { responseType: 'blob' }),
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

// ─── Autopay ──────────────────────────────────────────────────────────────────
export const autopayAPI = {
  getAll:  ()         => client.get('/autopay'),
  create:  (data)     => client.post('/autopay', data),
  update:  (id, data) => client.patch(`/autopay/${id}`, data),
  delete:  (id)       => client.delete(`/autopay/${id}`),
};

// ─── Loans ────────────────────────────────────────────────────────────────────
export const loanAPI = {
  getAll:      ()          => client.get('/loans'),
  getOne:      (id)        => client.get(`/loans/${id}`),
  makePayment: (id, data)  => client.post(`/loans/${id}/payment`, data),
};

// ─── Investments ──────────────────────────────────────────────────────────────
export const investmentAPI = {
  getOverview:     ()     => client.get('/investments'),
  transfer:        (data) => client.post('/investments/transfer', data),
  getTransactions: ()     => client.get('/investments/transactions'),
};

// ─── Beneficiaries ────────────────────────────────────────────────────────────
export const beneficiaryAPI = {
  getAll:  ()         => client.get('/beneficiaries'),
  create:  (data)     => client.post('/beneficiaries', data),
  update:  (id, data) => client.patch(`/beneficiaries/${id}`, data),
  delete:  (id)       => client.delete(`/beneficiaries/${id}`),
};

// ─── Travel Notices ───────────────────────────────────────────────────────────
export const travelNoticeAPI = {
  getAll:  ()         => client.get('/travel-notices'),
  create:  (data)     => client.post('/travel-notices', data),
  update:  (id, data) => client.patch(`/travel-notices/${id}`, data),
  cancel:  (id)       => client.delete(`/travel-notices/${id}`),
};

// ─── Check Deposits ───────────────────────────────────────────────────────────
export const checkDepositAPI = {
  getAll:  ()     => client.get('/check-deposits'),
  submit:  (data) => client.post('/check-deposits', data),
  getOne:  (id)   => client.get(`/check-deposits/${id}`),
};

// ─── Wire Transfers ───────────────────────────────────────────────────────────
export const wireTransferAPI = {
  getAll:   ()     => client.get('/wire-transfers'),
  initiate: (data) => client.post('/wire-transfers', data),
  getOne:   (id)   => client.get(`/wire-transfers/${id}`),
  cancel:   (id)   => client.patch(`/wire-transfers/${id}/cancel`),
};

// ─── Bill Pay ─────────────────────────────────────────────────────────────────
export const billPayAPI = {
  getBillers:      ()         => client.get('/bill-pay/billers'),
  addBiller:       (data)     => client.post('/bill-pay/billers', data),
  removeBiller:    (id)       => client.delete(`/bill-pay/billers/${id}`),
  getPayments:     ()         => client.get('/bill-pay/payments'),
  schedulePayment: (data)     => client.post('/bill-pay/payments', data),
  cancelPayment:   (id)       => client.delete(`/bill-pay/payments/${id}`),
};

// ─── Credit Score ─────────────────────────────────────────────────────────────
export const creditScoreAPI = {
  getScore: () => client.get('/credit-score'),
};

// ─── Cashback ─────────────────────────────────────────────────────────────────
export const cashbackAPI = {
  getOverview:     ()     => client.get('/cashback'),
  getTransactions: ()     => client.get('/cashback/transactions'),
  redeem:          (data) => client.post('/cashback/redeem', data),
};

// ─── Card Replacement ─────────────────────────────────────────────────────────
export const cardReplacementAPI = {
  requestReplacement: (cardId, data) => client.post(`/cards/${cardId}/replace`, data),
  getStatus:          (cardId)       => client.get(`/cards/${cardId}/replacement`),
};
