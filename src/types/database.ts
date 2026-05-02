// Types auto-générés depuis Supabase — ne pas modifier manuellement
// Régénérer avec : npx supabase gen types typescript --project-id <id> > src/types/database.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      salons: {
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
          opening_hours: Json
          deposit_percentage: number
          cancellation_hours: number
          cancellation_refund: boolean
          plan: string
          trial_ends_at: string
          stripe_customer_id: string | null
          moneroo_api_key: string | null
          stripe_account_id: string | null
          is_active: boolean
          business_type: 'independent' | 'salon' | null
          specialty: 'hair' | 'nails' | 'makeup' | 'beauty' | 'fashion' | 'other' | null
          specialty_custom: string | null
          onboarding_completed: boolean
          onboarding_completed_at: string | null
          payout_wave_number: string | null
          payout_om_number: string | null
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
          opening_hours?: Json
          deposit_percentage?: number
          cancellation_hours?: number
          cancellation_refund?: boolean
          plan?: string
          trial_ends_at?: string
          stripe_customer_id?: string | null
          moneroo_api_key?: string | null
          stripe_account_id?: string | null
          is_active?: boolean
          business_type?: 'independent' | 'salon' | null
          specialty?: 'hair' | 'nails' | 'makeup' | 'beauty' | 'fashion' | 'other' | null
          specialty_custom?: string | null
          onboarding_completed?: boolean
          onboarding_completed_at?: string | null
          payout_wave_number?: string | null
          payout_om_number?: string | null
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
          opening_hours?: Json
          deposit_percentage?: number
          cancellation_hours?: number
          cancellation_refund?: boolean
          plan?: string
          trial_ends_at?: string
          stripe_customer_id?: string | null
          moneroo_api_key?: string | null
          stripe_account_id?: string | null
          is_active?: boolean
          business_type?: 'independent' | 'salon' | null
          specialty?: 'hair' | 'nails' | 'makeup' | 'beauty' | 'fashion' | 'other' | null
          specialty_custom?: string | null
          onboarding_completed?: boolean
          onboarding_completed_at?: string | null
          payout_wave_number?: string | null
          payout_om_number?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          salon_id: string | null
          role: string
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
          salon_id?: string | null
          role?: string
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
          salon_id?: string | null
          role?: string
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          whatsapp?: string | null
          avatar_url?: string | null
          is_active?: boolean
          onboarding_step?: number
          onboarding_completed?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      staff: {
        Row: {
          id: string
          salon_id: string
          user_id: string | null
          first_name: string
          last_name: string
          phone: string | null
          whatsapp: string | null
          photo_url: string | null
          remuneration_type: string
          commission_rate: number | null
          fixed_salary: number | null
          specialties: string[] | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          salon_id: string
          user_id?: string | null
          first_name: string
          last_name?: string
          phone?: string | null
          whatsapp?: string | null
          photo_url?: string | null
          remuneration_type?: string
          commission_rate?: number | null
          fixed_salary?: number | null
          specialties?: string[] | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          salon_id?: string
          user_id?: string | null
          first_name?: string
          last_name?: string
          phone?: string | null
          whatsapp?: string | null
          photo_url?: string | null
          remuneration_type?: string
          commission_rate?: number | null
          fixed_salary?: number | null
          specialties?: string[] | null
          is_active?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          }
        ]
      }
      services: {
        Row: {
          id: string
          salon_id: string
          name: string
          description: string | null
          duration_minutes: number
          price: number
          photo_url: string | null
          category: string | null
          staff_ids: string[] | null
          deposit_percentage: number | null
          variants: { label: string; price: number }[] | null
          is_active: boolean
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          salon_id: string
          name: string
          description?: string | null
          duration_minutes?: number
          price: number
          photo_url?: string | null
          category?: string | null
          staff_ids?: string[] | null
          deposit_percentage?: number | null
          variants?: { label: string; price: number }[] | null
          is_active?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          salon_id?: string
          name?: string
          description?: string | null
          duration_minutes?: number
          price?: number
          photo_url?: string | null
          category?: string | null
          staff_ids?: string[] | null
          deposit_percentage?: number | null
          variants?: { label: string; price: number }[] | null
          is_active?: boolean
          display_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          }
        ]
      }
      clients: {
        Row: {
          id: string
          salon_id: string
          first_name: string
          last_name: string | null
          phone: string
          whatsapp: string | null
          email: string | null
          notes: string | null
          total_visits: number
          total_spent: number
          last_visit_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          salon_id: string
          first_name: string
          last_name?: string | null
          phone: string
          whatsapp?: string | null
          email?: string | null
          notes?: string | null
          total_visits?: number
          total_spent?: number
          last_visit_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          first_name?: string
          last_name?: string | null
          phone?: string
          whatsapp?: string | null
          email?: string | null
          notes?: string | null
          total_visits?: number
          total_spent?: number
          last_visit_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          }
        ]
      }
      bookings: {
        Row: {
          id: string
          salon_id: string
          client_id: string | null
          service_id: string
          staff_id: string | null
          booking_date: string
          booking_time: string
          duration_minutes: number
          total_price: number
          deposit_amount: number
          deposit_paid: boolean
          remaining_amount: number
          status: string
          cancellation_reason: string | null
          cancelled_by: string | null
          refund_amount: number
          refund_status: string | null
          notes: string | null
          internal_notes: string | null
          client_token: string | null
          reminder_sent_at: string | null
          confirmation_sent_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          salon_id: string
          client_id?: string | null
          service_id: string
          staff_id?: string | null
          booking_date: string
          booking_time: string
          duration_minutes: number
          total_price: number
          deposit_amount?: number
          deposit_paid?: boolean
          status?: string
          cancellation_reason?: string | null
          cancelled_by?: string | null
          refund_amount?: number
          refund_status?: string | null
          notes?: string | null
          internal_notes?: string | null
          client_token?: string | null
          reminder_sent_at?: string | null
          confirmation_sent_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          service_id?: string
          staff_id?: string | null
          booking_date?: string
          booking_time?: string
          duration_minutes?: number
          total_price?: number
          deposit_amount?: number
          deposit_paid?: boolean
          status?: string
          cancellation_reason?: string | null
          cancelled_by?: string | null
          refund_amount?: number
          refund_status?: string | null
          notes?: string | null
          internal_notes?: string | null
          client_token?: string | null
          reminder_sent_at?: string | null
          confirmation_sent_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          }
        ]
      }
      payments: {
        Row: {
          id: string
          booking_id: string
          salon_id: string
          amount: number
          currency: string
          payment_method: string
          payment_type: string
          provider_payment_id: string | null
          status: string
          paid_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          salon_id: string
          amount: number
          currency?: string
          payment_method: string
          payment_type?: string
          provider_payment_id?: string | null
          status?: string
          paid_at?: string | null
          created_at?: string
        }
        Update: {
          status?: string
          provider_payment_id?: string | null
          paid_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          }
        ]
      }
      commissions: {
        Row: {
          id: string
          salon_id: string
          staff_id: string
          booking_id: string
          service_price: number
          commission_rate: number | null
          commission_amount: number
          week_number: number
          year: number
          is_paid: boolean
          paid_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          salon_id: string
          staff_id: string
          booking_id: string
          service_price: number
          commission_rate?: number | null
          commission_amount: number
          week_number: number
          year: number
          is_paid?: boolean
          paid_at?: string | null
          created_at?: string
        }
        Update: {
          is_paid?: boolean
          paid_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commissions_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          }
        ]
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
          used?: boolean
        }
        Relationships: []
      }
      blocked_slots: {
        Row: {
          id: string
          salon_id: string
          staff_id: string | null
          blocked_date: string
          start_time: string
          end_time: string
          reason: string | null
          created_at: string
        }
        Insert: {
          id?: string
          salon_id: string
          staff_id?: string | null
          blocked_date: string
          start_time: string
          end_time: string
          reason?: string | null
          created_at?: string
        }
        Update: {
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blocked_slots_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          }
        ]
      }
      notification_logs: {
        Row: {
          id: string
          salon_id: string
          booking_id: string | null
          recipient_phone: string
          notification_type: string
          channel: string
          message: string
          status: string
          error_message: string | null
          sent_at: string
        }
        Insert: {
          id?: string
          salon_id: string
          booking_id?: string | null
          recipient_phone: string
          notification_type: string
          channel?: string
          message: string
          status?: string
          error_message?: string | null
          sent_at?: string
        }
        Update: {
          status?: string
          error_message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_logs_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          }
        ]
      }
      payouts: {
        Row: {
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
        Insert: {
          id?: string
          salon_id: string
          gross_amount: number
          commission_amount?: number
          net_amount: number
          payout_method: 'wave' | 'orange_money'
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
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          bictorys_transfer_id?: string | null
          notes?: string | null
          completed_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payouts_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_available_slots: {
        Args: { p_salon_id: string; p_service_id: string; p_date: string }
        Returns: { slot_time: string; is_available: boolean; available_staff_count: number }[]
      }
      calculate_and_insert_commission: {
        Args: { p_booking_id: string }
        Returns: undefined
      }
      expire_pending_bookings: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      upsert_client_from_booking: {
        Args: {
          p_salon_id: string
          p_first_name: string
          p_last_name: string
          p_phone: string
          p_whatsapp: string
          p_email: string
        }
        Returns: string
      }
      get_my_salon_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_my_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
