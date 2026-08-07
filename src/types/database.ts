// Types auto-générés depuis le schéma TekkiShop — ne pas modifier manuellement
// Régénérer avec : npx supabase gen types typescript --project-id fvkamhditdyvadljjrvn > src/types/database.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    PostgrestVersion: '12'
    Tables: {
      admin_withdrawals: {
        Row: {
          id:                   string
          amount:               number
          method:               string
          phone_number:         string
          status:               'processing' | 'completed' | 'failed'
          bictorys_transfer_id: string | null
          notes:                string | null
          withdrawn_at:         string
          created_at:           string
        }
        Insert: {
          id?:                   string
          amount:                number
          method:                string
          phone_number:          string
          status?:               'processing' | 'completed' | 'failed'
          bictorys_transfer_id?: string | null
          notes?:                string | null
          withdrawn_at?:         string
          created_at?:           string
        }
        Update: {
          id?:                   string
          amount?:               number
          method?:               string
          phone_number?:         string
          status?:               'processing' | 'completed' | 'failed'
          bictorys_transfer_id?: string | null
          notes?:                string | null
          withdrawn_at?:         string
          created_at?:           string
        }
        Relationships: []
      }
      shops: {
        Row: {
          id: string
          slug: string
          name: string
          description: string | null
          logo_url: string | null
          primary_color: string
          address: string | null
          city: string | null
          country: string
          phone_whatsapp: string | null
          email: string | null
          delivery_options: Json
          available_days: Json
          deposit_percentage: number
          plan: string
          trial_ends_at: string
          stripe_customer_id: string | null
          moneroo_api_key: string | null
          stripe_account_id: string | null
          stripe_connect_enabled: boolean
          currency: string
          stripe_subscription_id: string | null
          is_active: boolean
          business_type: string | null
          specialty: string | null
          specialty_custom: string | null
          onboarding_completed: boolean
          onboarding_completed_at: string | null
          accept_online_payment: boolean
          payout_wave_number: string | null
          payout_om_number: string | null
          delivery_zones: Json
          bictorys_secret_key: string | null
          bictorys_webhook_secret: string | null
          accept_cash_on_delivery: boolean
          subscription_ends_at: string | null
          hide_branding: boolean
          custom_domain: string | null
          previous_slug: string | null
          product_layout: 'list' | 'grid' | null
          status: 'draft' | 'trial' | 'active' | 'expired'
          seller_stage: 'A' | 'B' | 'C' | null
          selling_channel: 'whatsapp' | 'social' | 'physique' | null
          pain_point: 'clients' | 'auto' | 'gestion' | 'paiement' | null
          specialty_other: string | null
          trial_model: 'legacy' | 'free_orders'
          trial_started_at: string | null
          trial_extended_at: string | null
          free_orders_used: number
          free_orders_quota: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          name: string
          description?: string | null
          logo_url?: string | null
          primary_color?: string
          address?: string | null
          city?: string | null
          country?: string
          phone_whatsapp?: string | null
          email?: string | null
          delivery_options?: Json
          available_days?: Json
          deposit_percentage?: number
          plan?: string
          trial_ends_at?: string
          stripe_customer_id?: string | null
          moneroo_api_key?: string | null
          stripe_account_id?: string | null
          stripe_connect_enabled?: boolean
          currency?: string
          stripe_subscription_id?: string | null
          is_active?: boolean
          business_type?: string | null
          specialty?: string | null
          specialty_custom?: string | null
          onboarding_completed?: boolean
          onboarding_completed_at?: string | null
          accept_online_payment?: boolean
          payout_wave_number?: string | null
          payout_om_number?: string | null
          delivery_zones?: Json
          bictorys_secret_key?: string | null
          bictorys_webhook_secret?: string | null
          accept_cash_on_delivery?: boolean
          subscription_ends_at?: string | null
          product_layout?: 'list' | 'grid' | null
          status?: 'draft' | 'trial' | 'active' | 'expired'
          seller_stage?: 'A' | 'B' | 'C' | null
          selling_channel?: 'whatsapp' | 'social' | 'physique' | null
          pain_point?: 'clients' | 'auto' | 'gestion' | 'paiement' | null
          specialty_other?: string | null
          trial_model?: 'legacy' | 'free_orders'
          trial_started_at?: string | null
          trial_extended_at?: string | null
          free_orders_used?: number
          free_orders_quota?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          name?: string
          description?: string | null
          logo_url?: string | null
          primary_color?: string
          address?: string | null
          city?: string | null
          country?: string
          phone_whatsapp?: string | null
          email?: string | null
          delivery_options?: Json
          available_days?: Json
          deposit_percentage?: number
          plan?: string
          trial_ends_at?: string
          stripe_customer_id?: string | null
          moneroo_api_key?: string | null
          stripe_account_id?: string | null
          stripe_connect_enabled?: boolean
          currency?: string
          stripe_subscription_id?: string | null
          is_active?: boolean
          business_type?: string | null
          specialty?: string | null
          specialty_custom?: string | null
          onboarding_completed?: boolean
          onboarding_completed_at?: string | null
          accept_online_payment?: boolean
          payout_wave_number?: string | null
          payout_om_number?: string | null
          delivery_zones?: Json
          bictorys_secret_key?: string | null
          bictorys_webhook_secret?: string | null
          accept_cash_on_delivery?: boolean
          subscription_ends_at?: string | null
          hide_branding?: boolean
          custom_domain?: string | null
          previous_slug?: string | null
          product_layout?: 'list' | 'grid' | null
          status?: 'draft' | 'trial' | 'active' | 'expired'
          seller_stage?: 'A' | 'B' | 'C' | null
          selling_channel?: 'whatsapp' | 'social' | 'physique' | null
          pain_point?: 'clients' | 'auto' | 'gestion' | 'paiement' | null
          specialty_other?: string | null
          trial_model?: 'legacy' | 'free_orders'
          trial_started_at?: string | null
          trial_extended_at?: string | null
          free_orders_used?: number
          free_orders_quota?: number
          created_at?: string
          updated_at?: string
        }
      Relationships: []
      }
      profiles: {
        Row: {
          id: string
          shop_id: string | null
          role: 'owner' | 'admin'
          first_name: string | null
          last_name: string | null
          phone: string | null
          whatsapp: string | null
          avatar_url: string | null
          is_active: boolean
          onboarding_step: number
          onboarding_completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          shop_id?: string | null
          role?: 'owner' | 'admin'
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          whatsapp?: string | null
          avatar_url?: string | null
          is_active?: boolean
          onboarding_step?: number
          onboarding_completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          shop_id?: string | null
          role?: 'owner' | 'admin'
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          whatsapp?: string | null
          avatar_url?: string | null
          is_active?: boolean
          onboarding_step?: number
          onboarding_completed?: boolean
          created_at?: string
          updated_at?: string
        }
      Relationships: []
      }
      products: {
        Row: {
          id: string
          shop_id: string
          name: string
          description: string | null
          price: number
          photo_url: string | null
          photos: Json
          video_url: string | null
          image_ratio: string | null
          is_featured: boolean | null
          category: string | null
          is_active: boolean
          display_order: number
          deposit_percentage: number | null
          variants: Json | null
          stock_count: number | null
          created_at: string
          updated_at: string
          product_type?: 'physical' | 'digital' | null
          digital_file_path?: string | null
          digital_file_name?: string | null
          digital_file_size?: number | null
          cost_price?: number | null
          quantity_discounts?: Json | null
        }
        Insert: {
          id?: string
          shop_id: string
          name: string
          description?: string | null
          price: number
          photo_url?: string | null
          photos?: Json
          video_url?: string | null
          image_ratio?: string | null
          is_featured?: boolean | null
          category?: string | null
          is_active?: boolean
          display_order?: number
          deposit_percentage?: number | null
          variants?: Json | null
          stock_count?: number | null
          created_at?: string
          updated_at?: string
          product_type?: 'physical' | 'digital' | null
          digital_file_path?: string | null
          digital_file_name?: string | null
          digital_file_size?: number | null
          cost_price?: number | null
          quantity_discounts?: Json | null
        }
        Update: {
          id?: string
          shop_id?: string
          name?: string
          description?: string | null
          price?: number
          photo_url?: string | null
          photos?: Json
          video_url?: string | null
          image_ratio?: string | null
          is_featured?: boolean | null
          category?: string | null
          is_active?: boolean
          display_order?: number
          deposit_percentage?: number | null
          variants?: Json | null
          stock_count?: number | null
          created_at?: string
          updated_at?: string
          product_type?: 'physical' | 'digital' | null
          digital_file_path?: string | null
          digital_file_name?: string | null
          digital_file_size?: number | null
          cost_price?: number | null
          quantity_discounts?: Json | null
        }
      Relationships: []
      }
      download_tokens: {
        Row: {
          id: string
          order_id: string
          product_id: string
          shop_id: string
          token: string
          expires_at: string
          download_count: number
          max_downloads: number
          downloaded_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          shop_id: string
          token?: string
          expires_at: string
          download_count?: number
          max_downloads?: number
          downloaded_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string
          shop_id?: string
          token?: string
          expires_at?: string
          download_count?: number
          max_downloads?: number
          downloaded_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          id: string
          shop_id: string
          first_name: string
          last_name: string | null
          phone: string
          whatsapp: string | null
          email: string | null
          notes: string | null
          total_orders: number
          total_spent: number
          last_order_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          shop_id: string
          first_name: string
          last_name?: string | null
          phone: string
          whatsapp?: string | null
          email?: string | null
          notes?: string | null
          total_orders?: number
          total_spent?: number
          last_order_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          shop_id?: string
          first_name?: string
          last_name?: string | null
          phone?: string
          whatsapp?: string | null
          email?: string | null
          notes?: string | null
          total_orders?: number
          total_spent?: number
          last_order_at?: string | null
          created_at?: string
          updated_at?: string
        }
      Relationships: []
      }
      orders: {
        Row: {
          id: string
          shop_id: string
          client_id: string | null
          status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled' | 'completed'
          delivery_type: 'home_delivery' | 'store_pickup'
          delivery_address: string | null
          delivery_date: string | null
          payment_method: 'wave_money' | 'orange_money' | 'maxit' | 'on_delivery' | 'on_site' | null
          payment_type: 'online_full' | 'online_deposit' | 'on_delivery' | 'on_site'
          deposit_amount: number
          deposit_paid: boolean
          total_price: number
          notes: string | null
          internal_notes: string | null
          cancellation_reason: string | null
          cancelled_by: 'shop' | 'client' | null
          delivery_zone_name: string | null
          delivery_price: number
          client_token: string
          reminder_sent_at: string | null
          delivered_at: string | null
          review_request_sent_at: string | null
          is_held: boolean
          held_notified_at: string | null
          released_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          shop_id: string
          client_id?: string | null
          status?: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled' | 'completed'
          delivery_type?: 'home_delivery' | 'store_pickup'
          delivery_address?: string | null
          delivery_date?: string | null
          payment_method?: 'wave_money' | 'orange_money' | 'maxit' | 'on_delivery' | 'on_site' | null
          payment_type?: 'online_full' | 'online_deposit' | 'on_delivery' | 'on_site'
          deposit_amount?: number
          deposit_paid?: boolean
          total_price?: number
          notes?: string | null
          internal_notes?: string | null
          cancellation_reason?: string | null
          cancelled_by?: 'shop' | 'client' | null
          delivery_zone_name?: string | null
          delivery_price?: number
          client_token?: string
          reminder_sent_at?: string | null
          delivered_at?: string | null
          review_request_sent_at?: string | null
          is_held?: boolean
          held_notified_at?: string | null
          released_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          shop_id?: string
          client_id?: string | null
          status?: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled' | 'completed'
          delivery_type?: 'home_delivery' | 'store_pickup'
          delivery_address?: string | null
          delivery_date?: string | null
          payment_method?: 'wave_money' | 'orange_money' | 'maxit' | 'on_delivery' | 'on_site' | null
          payment_type?: 'online_full' | 'online_deposit' | 'on_delivery' | 'on_site'
          deposit_amount?: number
          deposit_paid?: boolean
          total_price?: number
          notes?: string | null
          internal_notes?: string | null
          cancellation_reason?: string | null
          cancelled_by?: 'shop' | 'client' | null
          delivery_zone_name?: string | null
          delivery_price?: number
          client_token?: string
          reminder_sent_at?: string | null
          delivered_at?: string | null
          review_request_sent_at?: string | null
          is_held?: boolean
          held_notified_at?: string | null
          released_at?: string | null
          created_at?: string
          updated_at?: string
        }
      Relationships: []
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string | null
          product_name: string
          variant_label: string | null
          unit_price: number
          quantity: number
          line_total: number
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          product_id?: string | null
          product_name: string
          variant_label?: string | null
          unit_price: number
          quantity?: number
          line_total: number
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string | null
          product_name?: string
          variant_label?: string | null
          unit_price?: number
          quantity?: number
          line_total?: number
          created_at?: string
        }
      Relationships: []
      }
      payments: {
        Row: {
          id: string
          order_id: string
          shop_id: string
          amount: number
          currency: string
          payment_method: 'bictorys' | 'cash' | 'wave_money' | 'orange_money' | 'maxit'
          payment_type: 'deposit' | 'balance' | 'full' | 'refund'
          provider_payment_id: string | null
          status: 'pending' | 'completed' | 'failed' | 'refunded'
          paid_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          shop_id: string
          amount: number
          currency?: string
          payment_method: 'bictorys' | 'cash' | 'wave_money' | 'orange_money' | 'maxit'
          payment_type?: 'deposit' | 'balance' | 'full' | 'refund'
          provider_payment_id?: string | null
          status?: 'pending' | 'completed' | 'failed' | 'refunded'
          paid_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          shop_id?: string
          amount?: number
          currency?: string
          payment_method?: 'bictorys' | 'cash' | 'wave_money' | 'orange_money' | 'maxit'
          payment_type?: 'deposit' | 'balance' | 'full' | 'refund'
          provider_payment_id?: string | null
          status?: 'pending' | 'completed' | 'failed' | 'refunded'
          paid_at?: string | null
          created_at?: string
        }
      Relationships: []
      }
      notification_logs: {
        Row: {
          id: string
          shop_id: string
          order_id: string | null
          recipient_phone: string
          notification_type: 'order_confirmation' | 'order_reminder' | 'cancellation' | 'new_order_shop'
          channel: string
          message: string
          status: 'sent' | 'failed' | 'pending'
          error_message: string | null
          sent_at: string
        }
        Insert: {
          id?: string
          shop_id: string
          order_id?: string | null
          recipient_phone: string
          notification_type: 'order_confirmation' | 'order_reminder' | 'cancellation' | 'new_order_shop'
          channel?: string
          message: string
          status?: 'sent' | 'failed' | 'pending'
          error_message?: string | null
          sent_at?: string
        }
        Update: {
          id?: string
          shop_id?: string
          order_id?: string | null
          recipient_phone?: string
          notification_type?: 'order_confirmation' | 'order_reminder' | 'cancellation' | 'new_order_shop'
          channel?: string
          message?: string
          status?: 'sent' | 'failed' | 'pending'
          error_message?: string | null
          sent_at?: string
        }
      Relationships: []
      }
      payouts: {
        Row: {
          id: string
          shop_id: string
          gross_amount: number
          commission_amount: number
          net_amount: number
          payout_method: 'wave' | 'orange_money' | 'mtn' | 'moov' | 'tmoney' | 'flooz' | 'mobicash' | 'maxit' | 'airtel' | 'mvola'
          payout_number: string
          status: 'pending' | 'processing' | 'completed' | 'failed'
          bictorys_transfer_id: string | null
          notes: string | null
          requested_at: string
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          shop_id: string
          gross_amount: number
          commission_amount?: number
          net_amount: number
          payout_method: 'wave' | 'orange_money' | 'mtn' | 'moov' | 'tmoney' | 'flooz' | 'mobicash' | 'maxit' | 'airtel' | 'mvola'
          payout_number: string
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          bictorys_transfer_id?: string | null
          notes?: string | null
          requested_at?: string
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          shop_id?: string
          gross_amount?: number
          commission_amount?: number
          net_amount?: number
          payout_method?: 'wave' | 'orange_money' | 'mtn' | 'moov' | 'tmoney' | 'flooz' | 'mobicash' | 'maxit' | 'airtel' | 'mvola'
          payout_number?: string
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          bictorys_transfer_id?: string | null
          notes?: string | null
          requested_at?: string
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      Relationships: []
      }
      pin_resets: {
        Row: {
          id: string
          phone_email: string
          token: string
          expires_at: string
          used: boolean
          created_at: string
        }
        Insert: {
          id?: string
          phone_email: string
          token: string
          expires_at: string
          used?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          phone_email?: string
          token?: string
          expires_at?: string
          used?: boolean
          created_at?: string
        }
      Relationships: []
      }
      login_attempts: {
        Row: {
          id: string
          identifier: string
          attempt_type: string
          success: boolean
          attempted_at: string
        }
        Insert: {
          id?: string
          identifier: string
          attempt_type: string
          success?: boolean
          attempted_at?: string
        }
        Update: {
          id?: string
          identifier?: string
          attempt_type?: string
          success?: boolean
          attempted_at?: string
        }
      Relationships: []
      }
      promo_codes: {
        Row: {
          id: string
          shop_id: string
          code: string
          discount_pct: number
          max_uses: number | null
          used_count: number
          expires_at: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          shop_id: string
          code: string
          discount_pct: number
          max_uses?: number | null
          used_count?: number
          expires_at?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          shop_id?: string
          code?: string
          discount_pct?: number
          max_uses?: number | null
          used_count?: number
          expires_at?: string | null
          is_active?: boolean
          created_at?: string
        }
      Relationships: []
      }
      shop_events: {
        Row: {
          id: string
          shop_id: string
          event_name: string
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          shop_id: string
          event_name: string
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          shop_id?: string
          event_name?: string
          metadata?: Json
          created_at?: string
        }
      Relationships: []
      }
      shop_visits: {
        Row: {
          shop_id: string
          day: string
          views: number
        }
        Insert: {
          shop_id: string
          day: string
          views?: number
        }
        Update: {
          shop_id?: string
          day?: string
          views?: number
        }
      Relationships: []
      }
      waitlist: {
        Row: {
          id: string
          country: string
          phone: string
          source: string
          notified_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          country: string
          phone: string
          source?: string
          notified_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          country?: string
          phone?: string
          source?: string
          notified_at?: string | null
          created_at?: string
        }
      Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      get_my_shop_id: {
        Args: Record<string, never>
        Returns: string
      }
      get_my_role: {
        Args: Record<string, never>
        Returns: string
      }
      expire_pending_orders: {
        Args: Record<string, never>
        Returns: number
      }
      purge_draft_shops: {
        Args: Record<string, never>
        Returns: number
      }
      activate_free_orders_shop: {
        Args: { p_shop_id: string }
        Returns: { released_count: number; released_total: number; released_funds_gross: number }[]
      }
      increment_shop_visit: {
        Args: { p_shop_id: string }
        Returns: undefined
      }
      upsert_client_from_order: {
        Args: {
          p_shop_id: string
          p_first_name: string
          p_last_name: string
          p_phone: string
          p_whatsapp: string
          p_email: string
        }
        Returns: string
      }
      cleanup_pin_resets: {
        Args: Record<string, never>
        Returns: undefined
      }
      decrement_product_stock: {
        Args: {
          p_product_id: string
          p_shop_id: string
          p_quantity: number
        }
        Returns: boolean
      }
      increment_product_stock: {
        Args: {
          p_product_id: string
          p_shop_id: string
          p_quantity: number
        }
        Returns: undefined
      }
      decrement_variant_stock: {
        Args: {
          p_product_id: string
          p_shop_id: string
          p_variant_label: string
          p_quantity: number
        }
        Returns: boolean
      }
      increment_variant_stock: {
        Args: {
          p_product_id: string
          p_shop_id: string
          p_variant_label: string
          p_quantity: number
        }
        Returns: undefined
      }
      increment_promo_used_count: {
        Args: { p_promo_id: string }
        Returns: undefined
      }
    }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}
