import {
  User, Turf, DaySlotsData, Booking,
  AdminStats, OwnerAnalytics, PricingRule, AuditLogItem
} from '../types';

const API_BASE_URL = '/api';

export const getAuthToken = (): string | null => {
  return localStorage.getItem('turfhub_token');
};

export const setAuthToken = (token: string) => {
  localStorage.setItem('turfhub_token', token);
};

export const removeAuthToken = () => {
  localStorage.removeItem('turfhub_token');
  localStorage.removeItem('turfhub_user');
};

export const getStoredUser = (): User | null => {
  const data = localStorage.getItem('turfhub_user');
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
};

export const setStoredUser = (user: User) => {
  localStorage.setItem('turfhub_user', JSON.stringify(user));
};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.error || data.detail || (typeof data === 'object' ? Object.values(data)[0] : 'Request failed');
    throw new Error(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
  }

  return data as T;
}

export const api = {
  // Auth
  login: async (credentials: { email: string; password: string; role?: string }) => {
    const res = await request<{ access: string; user: User; must_change_password: boolean }>('/auth/login/', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    setAuthToken(res.access);
    setStoredUser(res.user);
    return res;
  },

  registerCustomer: async (formData: { name: string; email: string; phone: string; password: string }) => {
    const res = await request<{ access: string; user: User; message: string }>('/auth/register/', {
      method: 'POST',
      body: JSON.stringify(formData),
    });
    setAuthToken(res.access);
    setStoredUser(res.user);
    return res;
  },

  getMe: async () => {
    const user = await request<User>('/auth/me/');
    setStoredUser(user);
    return user;
  },

  changePassword: (data: { old_password: string; new_password: string }) =>
    request<{ message: string; user: User }>('/auth/change-password/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  logout: () => {
    removeAuthToken();
  },

  // Turfs & Slots
  getTurfs: (params?: { city?: string; location?: string; sport?: string; search?: string; max_price?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.city) searchParams.set('city', params.city);
    if (params?.location) searchParams.set('location', params.location);
    if (params?.sport) searchParams.set('sport', params.sport);
    if (params?.search) searchParams.set('search', params.search);
    if (params?.max_price) searchParams.set('max_price', params.max_price.toString());
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return request<Turf[]>(`/turfs/${query}`);
  },

  getTurfDetails: (id: number | string) =>
    request<Turf & { pricing_rules: PricingRule[]; reviews: any[] }>(`/turfs/${id}/`),

  getTurfSlots: (turfId: number | string, dateStr: string) =>
    request<DaySlotsData>(`/turfs/${turfId}/slots/?date=${dateStr}`),

  // Bookings
  createBooking: (bookingData: {
    turf_id: number;
    booking_date: string;
    start_time: string;
    end_time?: string;
    sport: string;
    payment_method: string;
    customer_name?: string;
    customer_email?: string;
    customer_phone?: string;
  }) =>
    request<Booking>('/bookings/', {
      method: 'POST',
      body: JSON.stringify(bookingData),
    }),

  getMyBookings: () => request<Booking[]>('/bookings/my-bookings/'),

  cancelBooking: (id: number, reason?: string) =>
    request<{ message: string; booking: Booking }>(`/bookings/${id}/cancel/`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  // Turf Owner
  getOwnerTurfs: () => request<Turf[]>('/owner/turfs/'),

  getOwnerPricingRules: (turfId: number) =>
    request<PricingRule[]>(`/owner/turfs/${turfId}/pricing-rules/`),

  updateOwnerPricingRules: (turfId: number, rules: any[]) =>
    request<{ message: string; rules: PricingRule[] }>(`/owner/turfs/${turfId}/pricing-rules/`, {
      method: 'PUT',
      body: JSON.stringify({ rules }),
    }),

  toggleBlockSlot: (turfId: number, data: { date: string; start_time: string; is_blocked: boolean; reason?: string }) =>
    request<{ message: string; override: any }>(`/owner/turfs/${turfId}/toggle-block/`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getOwnerBookings: () => request<Booking[]>('/owner/bookings/'),

  getOwnerAnalytics: () => request<OwnerAnalytics>('/owner/analytics/'),

  // Admin
  getAdminStats: () => request<AdminStats>('/admin/stats/'),

  getAdminOwners: () => request<User[]>('/admin/owners/'),

  createTurfOwner: (data: {
    name: string;
    email: string;
    phone?: string;
    assigned_turf_ids: number[];
    status: string;
    custom_temp_password?: string;
  }) =>
    request<{ message: string; owner: User; temporary_password?: string; instructions?: string }>(
      '/admin/owners/',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    ),

  updateOwnerStatus: (id: number, data: { status?: string; assigned_turf_ids?: number[]; reset_password?: boolean }) =>
    request<{ message: string; owner: User; temporary_password?: string }>(`/admin/owners/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  getAdminTurfs: () => request<Turf[]>('/admin/turfs/'),

  createAdminTurf: (turfData: Partial<Turf>) =>
    request<Turf>('/admin/turfs/', {
      method: 'POST',
      body: JSON.stringify(turfData),
    }),

  getAdminCustomers: () =>
    request<Array<{ id: number; name: string; email: string; phone: string; status: string; booking_count: number; joined_at: string }>>(
      '/admin/customers/'
    ),

  getAdminAllBookings: () => request<Booking[]>('/admin/bookings/'),

  getAdminPayments: () =>
    request<Array<{
      id: number;
      payment_id: string;
      order_id: string;
      amount: number;
      currency: string;
      status: string;
      payment_method: string;
      booking_id: string;
      turf_name: string;
      customer_name: string;
      verified_at: string;
    }>>('/admin/payments/'),

  getAdminAuditLogs: () => request<AuditLogItem[]>('/admin/audit-logs/'),
};
