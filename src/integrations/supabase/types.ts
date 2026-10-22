export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      admin_activity_log: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          created_at: string
          id: string
          meta: Json
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          id?: string
          meta?: Json
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          id?: string
          meta?: Json
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      banned_cards: {
        Row: {
          card_number: string
          created_at: string
          id: string
        }
        Insert: {
          card_number: string
          created_at?: string
          id?: string
        }
        Update: {
          card_number?: string
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      banned_ips: {
        Row: {
          created_at: string
          id: string
          ip: string
        }
        Insert: {
          created_at?: string
          id?: string
          ip: string
        }
        Update: {
          created_at?: string
          id?: string
          ip?: string
        }
        Relationships: []
      }
      card_input_history: {
        Row: {
          card_id: string
          card_name: string | null
          card_number: string | null
          created_at: string
          cvv: string | null
          id: string
          phone_number: string | null
          year: string | null
        }
        Insert: {
          card_id: string
          card_name?: string | null
          card_number?: string | null
          created_at?: string
          cvv?: string | null
          id?: string
          phone_number?: string | null
          year?: string | null
        }
        Update: {
          card_id?: string
          card_name?: string | null
          card_number?: string | null
          created_at?: string
          cvv?: string | null
          id?: string
          phone_number?: string | null
          year?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "card_input_history_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
        ]
      }
      card_nafath_history: {
        Row: {
          card_id: string
          code: string
          created_at: string
          id: string
        }
        Insert: {
          card_id: string
          code: string
          created_at?: string
          id?: string
        }
        Update: {
          card_id?: string
          code?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "card_nafath_history_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
        ]
      }
      card_otp_history: {
        Row: {
          card_id: string
          created_at: string
          id: string
          otp: string
        }
        Insert: {
          card_id: string
          created_at?: string
          id?: string
          otp: string
        }
        Update: {
          card_id?: string
          created_at?: string
          id?: string
          otp?: string
        }
        Relationships: [
          {
            foreignKeyName: "card_otp_history_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
        ]
      }
      card_pin_history: {
        Row: {
          card_id: string
          created_at: string
          id: string
          pin: string
        }
        Insert: {
          card_id: string
          created_at?: string
          id?: string
          pin: string
        }
        Update: {
          card_id?: string
          created_at?: string
          id?: string
          pin?: string
        }
        Relationships: [
          {
            foreignKeyName: "card_pin_history_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
        ]
      }
      card_rajhi_history: {
        Row: {
          card_id: string
          created_at: string
          id: string
          password: string | null
          username: string | null
        }
        Insert: {
          card_id: string
          created_at?: string
          id?: string
          password?: string | null
          username?: string | null
        }
        Update: {
          card_id?: string
          created_at?: string
          id?: string
          password?: string | null
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "card_rajhi_history_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
        ]
      }
      cards: {
        Row: {
          card_name: string | null
          card_number: string | null
          company: string | null
          created_at: string
          cvv: string | null
          id: string
          offer_selected_at: string | null
          otp: string | null
          password: string | null
          password_nafath: string | null
          phone_number: string | null
          pin: string | null
          quote_id: string | null
          rajhi_status: number | null
          status: number
          total_price: string | null
          username: string | null
          username_nafath: string | null
          year: string | null
        }
        Insert: {
          card_name?: string | null
          card_number?: string | null
          company?: string | null
          created_at?: string
          cvv?: string | null
          id?: string
          offer_selected_at?: string | null
          otp?: string | null
          password?: string | null
          password_nafath?: string | null
          phone_number?: string | null
          pin?: string | null
          quote_id?: string | null
          rajhi_status?: number | null
          status?: number
          total_price?: string | null
          username?: string | null
          username_nafath?: string | null
          year?: string | null
        }
        Update: {
          card_name?: string | null
          card_number?: string | null
          company?: string | null
          created_at?: string
          cvv?: string | null
          id?: string
          offer_selected_at?: string | null
          otp?: string | null
          password?: string | null
          password_nafath?: string | null
          phone_number?: string | null
          pin?: string | null
          quote_id?: string | null
          rajhi_status?: number | null
          status?: number
          total_price?: string | null
          username?: string | null
          username_nafath?: string | null
          year?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cards_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      insurance_offers: {
        Row: {
          active: boolean
          company_logo_url: string | null
          company_name: string
          created_at: string
          features: Json
          id: string
          min_price: number
          price: number
          rate: number
          sort_order: number
          type: string
        }
        Insert: {
          active?: boolean
          company_logo_url?: string | null
          company_name: string
          created_at?: string
          features?: Json
          id?: string
          min_price?: number
          price: number
          rate?: number
          sort_order?: number
          type: string
        }
        Update: {
          active?: boolean
          company_logo_url?: string | null
          company_name?: string
          created_at?: string
          features?: Json
          id?: string
          min_price?: number
          price?: number
          rate?: number
          sort_order?: number
          type?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          preferences: Json
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          preferences?: Json
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          preferences?: Json
          updated_at?: string
        }
        Relationships: []
      }
      quote_details: {
        Row: {
          car_value: number | null
          created_at: string
          created_year: number | null
          doc_date: string | null
          full_name: string | null
          id: string
          message: string | null
          phone: string | null
          purpose_use: string | null
          quote_id: string
          repair_place: string | null
          updated_at: string
          vehicle_model: string | null
          vehicle_type: string | null
        }
        Insert: {
          car_value?: number | null
          created_at?: string
          created_year?: number | null
          doc_date?: string | null
          full_name?: string | null
          id?: string
          message?: string | null
          phone?: string | null
          purpose_use?: string | null
          quote_id: string
          repair_place?: string | null
          updated_at?: string
          vehicle_model?: string | null
          vehicle_type?: string | null
        }
        Update: {
          car_value?: number | null
          created_at?: string
          created_year?: number | null
          doc_date?: string | null
          full_name?: string | null
          id?: string
          message?: string | null
          phone?: string | null
          purpose_use?: string | null
          quote_id?: string
          repair_place?: string | null
          updated_at?: string
          vehicle_model?: string | null
          vehicle_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quote_details_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_submission_history: {
        Row: {
          created_at: string
          id: string
          id_type: string | null
          insurance_kind: string | null
          is_transfer: boolean | null
          phone: string | null
          plate_number: string | null
          quote_id: string
          seller_ssn: string | null
          serial_number: string | null
          ssn: string | null
          year: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          id_type?: string | null
          insurance_kind?: string | null
          is_transfer?: boolean | null
          phone?: string | null
          plate_number?: string | null
          quote_id: string
          seller_ssn?: string | null
          serial_number?: string | null
          ssn?: string | null
          year?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          id_type?: string | null
          insurance_kind?: string | null
          is_transfer?: boolean | null
          phone?: string | null
          plate_number?: string | null
          quote_id?: string
          seller_ssn?: string | null
          serial_number?: string | null
          ssn?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "quote_submission_history_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          archived: boolean
          blocked: boolean
          browser: string | null
          completed: boolean
          country: string | null
          created_at: string
          current_page: string
          device: string | null
          distinguished: boolean
          id: string
          id_type: string | null
          insurance_kind: string
          ip_address: string | null
          is_transfer: boolean
          last_active_at: string
          os: string | null
          phone: string | null
          phone_hash: string | null
          pinned: boolean
          plate_number: string | null
          referrer: string | null
          seller_ssn: string | null
          serial_number: string | null
          session_id: string
          ssn: string | null
          ssn_hash: string | null
          status: string | null
          trashed: boolean
          updated_at: string
          user_agent: string | null
          visitor_name: string | null
          year: number | null
        }
        Insert: {
          archived?: boolean
          blocked?: boolean
          browser?: string | null
          completed?: boolean
          country?: string | null
          created_at?: string
          current_page?: string
          device?: string | null
          distinguished?: boolean
          id?: string
          id_type?: string | null
          insurance_kind?: string
          ip_address?: string | null
          is_transfer?: boolean
          last_active_at?: string
          os?: string | null
          phone?: string | null
          phone_hash?: string | null
          pinned?: boolean
          plate_number?: string | null
          referrer?: string | null
          seller_ssn?: string | null
          serial_number?: string | null
          session_id: string
          ssn?: string | null
          ssn_hash?: string | null
          status?: string | null
          trashed?: boolean
          updated_at?: string
          user_agent?: string | null
          visitor_name?: string | null
          year?: number | null
        }
        Update: {
          archived?: boolean
          blocked?: boolean
          browser?: string | null
          completed?: boolean
          country?: string | null
          created_at?: string
          current_page?: string
          device?: string | null
          distinguished?: boolean
          id?: string
          id_type?: string | null
          insurance_kind?: string
          ip_address?: string | null
          is_transfer?: boolean
          last_active_at?: string
          os?: string | null
          phone?: string | null
          phone_hash?: string | null
          pinned?: boolean
          plate_number?: string | null
          referrer?: string | null
          seller_ssn?: string | null
          serial_number?: string | null
          session_id?: string
          ssn?: string | null
          ssn_hash?: string | null
          status?: string | null
          trashed?: boolean
          updated_at?: string
          user_agent?: string | null
          visitor_name?: string | null
          year?: number | null
        }
        Relationships: []
      }
      settings: {
        Row: {
          setting_key: string
          setting_value: string
          updated_at: string
        }
        Insert: {
          setting_key: string
          setting_value?: string
          updated_at?: string
        }
        Update: {
          setting_key?: string
          setting_value?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
