import type { Database } from './database'

// Types dérivés des tables
export type Shop             = Database['public']['Tables']['shops']['Row']
export type Profile          = Database['public']['Tables']['profiles']['Row']
export type Product          = Database['public']['Tables']['products']['Row']
export type Client           = Database['public']['Tables']['clients']['Row']
export type Order            = Database['public']['Tables']['orders']['Row']
export type OrderItem        = Database['public']['Tables']['order_items']['Row']
export type Payment          = Database['public']['Tables']['payments']['Row']
export type NotificationLog  = Database['public']['Tables']['notification_logs']['Row']
export type Payout           = Database['public']['Tables']['payouts']['Row']

// Types de statut
export type OrderStatus      = Order['status']
export type DeliveryType     = Order['delivery_type']
export type PaymentType      = Order['payment_type']
export type PaymentMethod    = Order['payment_method']
export type PayoutStatus     = Payout['status']
export type UserRole         = Profile['role']

// Types métier

export interface ProductVariant {
  label: string
  price: number
}

export interface ProductPhoto {
  url: string
  is_primary: boolean
}

export interface DeliveryOptions {
  home_delivery: boolean
  store_pickup: boolean
}

export interface DeliveryZone {
  id: string
  name: string
  price: number
}

export interface OrderFormItem {
  product_id: string
  product_name: string
  variant_label?: string
  unit_price: number
  quantity: number
}

export interface OrderFormData {
  items: OrderFormItem[]
  delivery_date?: string
  client_first_name: string
  client_last_name?: string
  client_phone: string
  client_whatsapp?: string
  delivery_type: DeliveryType
  delivery_address?: string
  notes?: string
  payment_type: 'online_full' | 'online_deposit' | 'on_delivery' | 'on_site'
}

export interface DashboardStats {
  revenueToday: number
  revenueWeek: number
  ordersToday: number
  ordersWeek: number
  pendingOrders: number
  topProduct: string
}

// Types d'entrée pour les Server Actions
export interface CreateProductInput {
  name: string
  description?: string
  price: number
  category?: string
  photos?: ProductPhoto[]
  video_url?: string | null
  image_ratio?: 'square' | 'portrait' | null
  deposit_percentage?: number | null
  variants?: ProductVariant[] | null
  stock_count?: number | null
  display_order?: number
  is_featured?: boolean | null
}

export interface UpdateProductInput extends Partial<CreateProductInput> {
  is_active?: boolean
}

export interface UpdateShopInput {
  name?: string
  description?: string
  city?: string
  phone_whatsapp?: string
  email?: string
  address?: string
  delivery_options?: DeliveryOptions
  available_days?: string[]
  deposit_percentage?: number
  primary_color?: string
  logo_url?: string | null
  accept_online_payment?: boolean
  payout_wave_number?: string | null
  payout_om_number?: string | null
  delivery_zones?: DeliveryZone[]
  bictorys_secret_key?: string | null
  bictorys_webhook_secret?: string | null
  accept_cash_on_delivery?: boolean
}

// Réponses standard des Server Actions
export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

// Types pour les listes avec relations
export type OrderWithItems = Order & {
  order_items: (OrderItem & {
    products: Pick<Product, 'id' | 'name' | 'price'> | null
  })[]
  clients: Pick<Client, 'id' | 'first_name' | 'last_name' | 'phone'> | null
}

export type OrderWithRelations = Order & {
  order_items: OrderItem[]
  clients: Pick<Client, 'id' | 'first_name' | 'last_name' | 'phone' | 'whatsapp'> | null
}
