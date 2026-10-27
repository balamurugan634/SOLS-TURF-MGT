export type UserRole = 'ADMIN' | 'TURF_OWNER' | 'CUSTOMER';
export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';

export interface User {
  id: number;
  email: string;
  name: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  must_change_password?: boolean;
  is_active: boolean;
  created_at: string;
  assigned_turf_ids?: number[];
  assigned_turfs?: { id: number; name: string; location: string }[];
}

export interface Turf {
  id: number;
  name: string;
  slug: string;
  tagline: string;
  location: string;
  city: string;
  address: string;
  rating: number;
  review_count: number;
  hourly_base_price: number;
  sports: string[];
  amenities: string[];
  description: string;
  main_image: string;
  gallery_images: string[];
  is_active: boolean;
  created_at: string;
  assigned_owners?: { id: number; name: string; email: string }[];
}

export interface PricingRule {
  id: number;
  turf: number;
  day_type: 'ALL' | 'WEEKDAY' | 'WEEKEND';
  time_slot_start: string;
  time_slot_end: string;
  price: number;
  is_peak: boolean;
  label: string;
}

export interface Slot {
  id: string;
  start_time: string;
  end_time: string;
  display_time: string;
  period: 'Morning' | 'Afternoon' | 'Evening' | 'Night';
  price: number;
  is_peak: boolean;
  label: string;
  status: 'available' | 'booked' | 'unavailable';
  block_reason?: string;
  is_weekend: boolean;
}

export interface DaySlotsData {
  turf_id: number;
  turf_name: string;
  date: string;
  day_name: string;
  is_weekend: boolean;
  base_price: number;
  slots: Slot[];
}

export interface Payment {
  id: number;
  payment_id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: 'SUCCESS' | 'PENDING' | 'FAILED' | 'REFUNDED';
  payment_method: 'UPI' | 'CARD' | 'NETBANKING';
  verified_at: string;
}

export interface Booking {
  id: number;
  booking_id: string;
  customer: number | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  turf: number;
  turf_name: string;
  turf_location: string;
  turf_image: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  sport: string;
  slot_price: number;
  taxes: number;
  total_amount: number;
  status: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  cancellation_reason?: string;
  payment?: Payment;
  created_at: string;
}

export interface Review {
  id: number;
  turf: number;
  user_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface AdminStats {
  total_turf_owners: number;
  total_customers: number;
  total_turfs: number;
  total_bookings: number;
  active_bookings: number;
  total_revenue: number;
}

export interface OwnerAnalytics {
  total_turfs: number;
  total_bookings: number;
  total_revenue: number;
  average_slot_rate: number;
  recent_bookings: Booking[];
}

export interface AuditLogItem {
  id: number;
  user_email: string;
  user_name: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: Record<string, any>;
  ip_address: string;
  timestamp: string;
}
