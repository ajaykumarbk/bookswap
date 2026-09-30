const API_BASE = '/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('bookswap_token');
}

export function setAuthToken(token: string) {
  localStorage.setItem('bookswap_token', token);
}

export function removeAuthToken() {
  localStorage.removeItem('bookswap_token');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'API Request failed');
  }

  return data as T;
}

export const api = {
  // Auth
  register: (body: any) => request<any>('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body: any) => request<any>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  googleLogin: (body: any) => request<any>('/auth/google', { method: 'POST', body: JSON.stringify(body) }),
  getCurrentUser: () => request<any>('/auth/me'),

  // User
  updateProfile: (body: any) => request<any>('/users/me', { method: 'PUT', body: JSON.stringify(body) }),
  getPublicProfile: (id: string) => request<any>(`/users/${id}`),
  blockUser: (id: string) => request<any>(`/users/${id}/block`, { method: 'POST' }),

  // Books
  getBooks: (params: Record<string, any>) => {
    const query = new URLSearchParams();
    Object.keys(params).forEach(k => {
      if (params[k] !== undefined && params[k] !== null && params[k] !== '') {
        query.append(k, params[k]);
      }
    });
    return request<any>(`/books?${query.toString()}`);
  },
  getNearbyBooks: (lat: number, lng: number, radius: number = 10, limit: number = 20) =>
    request<any>(`/books/nearby?lat=${lat}&lng=${lng}&radius=${radius}&limit=${limit}`),
  getRecommendedBooks: (lat: number, lng: number, radius: number = 25) =>
    request<any>(`/books/recommended?lat=${lat}&lng=${lng}&radius=${radius}`),
  getBookById: (id: string) => request<any>(`/books/${id}`),
  createBook: (body: any) => request<any>('/books', { method: 'POST', body: JSON.stringify(body) }),
  updateBook: (id: string, body: any) => request<any>(`/books/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteBook: (id: string) => request<any>(`/books/${id}`, { method: 'DELETE' }),
  lookupISBN: (isbn: string) => request<any>(`/books/isbn/${isbn}`),

  // Wishlist
  getWishlist: () => request<any>('/wishlist'),
  addToWishlist: (body: any) => request<any>('/wishlist', { method: 'POST', body: JSON.stringify(body) }),
  removeFromWishlist: (id: string) => request<any>(`/wishlist/${id}`, { method: 'DELETE' }),

  // Swaps
  createSwap: (body: any) => request<any>('/swaps', { method: 'POST', body: JSON.stringify(body) }),
  getSwaps: (type?: string, status?: string) => {
    const query = new URLSearchParams();
    if (type) query.append('type', type);
    if (status) query.append('status', status);
    return request<any>(`/swaps?${query.toString()}`);
  },
  getSwapById: (id: string) => request<any>(`/swaps/${id}`),
  acceptSwap: (id: string) => request<any>(`/swaps/${id}/accept`, { method: 'POST' }),
  rejectSwap: (id: string) => request<any>(`/swaps/${id}/reject`, { method: 'POST' }),
  counterOfferSwap: (id: string, body: any) => request<any>(`/swaps/${id}/counter`, { method: 'POST', body: JSON.stringify(body) }),
  arrangeMeetup: (id: string, body: any) => request<any>(`/swaps/${id}/meetup`, { method: 'POST', body: JSON.stringify(body) }),
  confirmMeetup: (id: string) => request<any>(`/swaps/${id}/meetup/confirm`, { method: 'POST' }),
  completeExchange: (id: string) => request<any>(`/swaps/${id}/complete`, { method: 'POST' }),
  cancelSwap: (id: string) => request<any>(`/swaps/${id}/cancel`, { method: 'POST' }),

  // Chat
  getUserChats: () => request<any>('/chats'),
  getSwapMessages: (swapId: string) => request<any>(`/chats/${swapId}/messages`),
  sendMessage: (swapId: string, message: string, attachmentUrl?: string) =>
    request<any>(`/chats/${swapId}/messages`, { method: 'POST', body: JSON.stringify({ message, attachment_url: attachmentUrl }) }),

  // Reviews
  createReview: (body: any) => request<any>('/reviews', { method: 'POST', body: JSON.stringify(body) }),
  getUserReviews: (userId: string) => request<any>(`/reviews/user/${userId}`),

  // Notifications
  getNotifications: () => request<any>('/notifications'),
  markAllNotificationsRead: () => request<any>('/notifications/read-all', { method: 'POST' }),
  markNotificationRead: (id: string) => request<any>(`/notifications/${id}/read`, { method: 'PUT' }),

  // Reports
  createReport: (body: any) => request<any>('/reports', { method: 'POST', body: JSON.stringify(body) }),

  // Admin
  getAdminStats: () => request<any>('/admin/stats'),
  getAdminUsers: () => request<any>('/admin/users'),
  toggleSuspendUser: (id: string, is_suspended: boolean, admin_notes?: string) =>
    request<any>(`/admin/users/${id}/suspend`, { method: 'POST', body: JSON.stringify({ is_suspended, admin_notes }) }),
  getAdminBooks: () => request<any>('/admin/books'),
  adminRemoveBook: (id: string, reason: string) =>
    request<any>(`/admin/books/${id}`, { method: 'DELETE', body: JSON.stringify({ reason }) }),
  getAdminReports: () => request<any>('/admin/reports'),
  resolveReport: (id: string, status: string, admin_notes: string) =>
    request<any>(`/admin/reports/${id}/resolve`, { method: 'POST', body: JSON.stringify({ status, admin_notes }) }),
  getAdminAuditLogs: () => request<any>('/admin/audit-logs'),
};
