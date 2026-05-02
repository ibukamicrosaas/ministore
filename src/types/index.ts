import type { Database } from './database'

// Types dérivés des tables
export type Salon = Database['public']['Tables']['salons']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Staff = Database['public']['Tables']['staff']['Row']
export type Service = Database['public']['Tables']['services']['Row']
export type Client = Database['public']['Tables']['clients']['Row']
export type Booking = Database['public']['Tables']['bookings']['Row']
export type Payment = Database['public']['Tables']['payments']['Row']
export type Commission = Database['public']['Tables']['commissions']['Row']
export type BlockedSlot = Database['public']['Tables']['blocked_slots']['Row']
export type NotificationLog = Database['public']['Tables']['notification_logs']['Row']

// Types de statut
export type BookingStatus = Booking['status']
export type RemunerationType = Staff['remuneration_type']
export type PaymentMethod = Payment['payment_method']
export type PaymentType = Payment['payment_type']
export type NotificationType = NotificationLog['notification_type']
export type UserRole = Profile['role']

// Types métier
export interface TimeSlot {
  time: string
  isAvailable: boolean
  availableStaffCount: number
}

export interface OpeningHours {
  monday?: DayHours
  tuesday?: DayHours
  wednesday?: DayHours
  thursday?: DayHours
  friday?: DayHours
  saturday?: DayHours
  sunday?: DayHours
}

export interface DayHours {
  open: string
  close: string
  closed: boolean
}

export interface BookingFormData {
  serviceId: string
  staffId?: string
  date: string
  time: string
  clientFirstName: string
  clientLastName?: string
  clientPhone: string
  clientWhatsapp: string
  clientEmail?: string
  notes?: string
}

export interface DashboardStats {
  revenueToday: number
  revenueWeek: number
  revenueMonth: number
  bookingsToday: number
  bookingsWeek: number
  noShowRate: number
  topService: string
  topStaff: string
}

// Types d'entrée pour les Server Actions
export interface CreateStaffInput {
  first_name: string
  last_name?: string
  phone?: string
  whatsapp?: string
  remuneration_type: RemunerationType
  commission_rate?: number
  fixed_salary?: number
  specialties?: string[]
}

export interface UpdateStaffInput extends Partial<CreateStaffInput> {
  is_active?: boolean
  photo_url?: string
}

export interface ServiceVariant {
  label: string
  price: number
}

export interface CreateServiceInput {
  name: string
  description?: string
  duration_minutes: number
  price: number
  category?: string
  staff_ids?: string[]
  display_order?: number
  deposit_percentage?: number | null
  variants?: ServiceVariant[] | null
}

export interface UpdateServiceInput extends Partial<CreateServiceInput> {
  is_active?: boolean
  photo_url?: string
}

export interface UpdateSalonInput {
  name?: string
  description?: string
  city?: string
  phone_whatsapp?: string
  email?: string
  address?: string
  opening_hours?: OpeningHours
  deposit_percentage?: number
  cancellation_hours?: number
  cancellation_refund?: boolean
  primary_color?: string
  logo_url?: string | null
  payout_wave_number?: string | null
  payout_om_number?: string | null
}

export interface Payout {
  id: string
  salon_id: string
  gross_amount: number
  commission_amount: number
  net_amount: number
  payout_method: 'wave' | 'orange_money'
  payout_number: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  bictorys_transfer_id: string | null
  notes: string | null
  requested_at: string
  completed_at: string | null
  created_at: string
  updated_at: string
}

// Réponses standard des Server Actions
export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

// Types pour les listes avec relations
export type BookingWithRelations = Booking & {
  services: Pick<Service, 'id' | 'name' | 'duration_minutes' | 'price'>
  staff: Pick<Staff, 'id' | 'first_name' | 'last_name'> | null
  clients: Pick<Client, 'id' | 'first_name' | 'last_name' | 'phone'> | null
}

export type StaffWithCommissions = Staff & {
  commissions: Commission[]
}
