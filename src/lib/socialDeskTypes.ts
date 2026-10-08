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
      boosts: {
        Row: {
          budget: number
          campaign_name: string
          client_id: string
          content_id: string | null
          created_at: string
          end_date: string | null
          engagements: number
          followers_after: number | null
          followers_before: number | null
          id: string
          impressions: number
          link_clicks: number
          objective: string | null
          platform: string | null
          post_url: string | null
          profile_visits: number
          reach: number
          remarks: string | null
          spent: number
          start_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          budget?: number
          campaign_name: string
          client_id: string
          content_id?: string | null
          created_at?: string
          end_date?: string | null
          engagements?: number
          followers_after?: number | null
          followers_before?: number | null
          id?: string
          impressions?: number
          link_clicks?: number
          objective?: string | null
          platform?: string | null
          post_url?: string | null
          profile_visits?: number
          reach?: number
          remarks?: string | null
          spent?: number
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          budget?: number
          campaign_name?: string
          client_id?: string
          content_id?: string | null
          created_at?: string
          end_date?: string | null
          engagements?: number
          followers_after?: number | null
          followers_before?: number | null
          id?: string
          impressions?: number
          link_clicks?: number
          objective?: string | null
          platform?: string | null
          post_url?: string | null
          profile_visits?: number
          reach?: number
          remarks?: string | null
          spent?: number
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "boosts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boosts_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          ad_budget: number
          assigned_to: string | null
          business_name: string | null
          category: string | null
          code: number
          contact_person: string | null
          contract_start: string | null
          created_at: string
          email: string | null
          facebook: string | null
          group_target: number
          id: string
          instagram: string | null
          logo_url: string | null
          mobile: string | null
          name: string
          notes: string | null
          other_links: string | null
          post_target: number
          reel_target: number
          status: string
          updated_at: string
        }
        Insert: {
          ad_budget?: number
          assigned_to?: string | null
          business_name?: string | null
          category?: string | null
          code?: number
          contact_person?: string | null
          contract_start?: string | null
          created_at?: string
          email?: string | null
          facebook?: string | null
          group_target?: number
          id?: string
          instagram?: string | null
          logo_url?: string | null
          mobile?: string | null
          name: string
          notes?: string | null
          other_links?: string | null
          post_target?: number
          reel_target?: number
          status?: string
          updated_at?: string
        }
        Update: {
          ad_budget?: number
          assigned_to?: string | null
          business_name?: string | null
          category?: string | null
          code?: number
          contact_person?: string | null
          contract_start?: string | null
          created_at?: string
          email?: string | null
          facebook?: string | null
          group_target?: number
          id?: string
          instagram?: string | null
          logo_url?: string | null
          mobile?: string | null
          name?: string
          notes?: string | null
          other_links?: string | null
          post_target?: number
          reel_target?: number
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      content_items: {
        Row: {
          assigned_to: string | null
          client_id: string
          content_type: string
          created_at: string
          description: string | null
          group_share_count: number
          id: string
          platform: string | null
          published_date: string | null
          remarks: string | null
          scheduled_date: string | null
          status: string
          title: string
          updated_at: string
          url: string | null
        }
        Insert: {
          assigned_to?: string | null
          client_id: string
          content_type?: string
          created_at?: string
          description?: string | null
          group_share_count?: number
          id?: string
          platform?: string | null
          published_date?: string | null
          remarks?: string | null
          scheduled_date?: string | null
          status?: string
          title: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          assigned_to?: string | null
          client_id?: string
          content_type?: string
          created_at?: string
          description?: string | null
          group_share_count?: number
          id?: string
          platform?: string | null
          published_date?: string | null
          remarks?: string | null
          scheduled_date?: string | null
          status?: string
          title?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_items_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          agency_name: string
          contact: string | null
          currency: string
          default_group_target: number
          default_post_target: number
          default_reel_target: number
          id: number
          low_balance_threshold: number
          timezone: string
          updated_at: string
        }
        Insert: {
          agency_name?: string
          contact?: string | null
          currency?: string
          default_group_target?: number
          default_post_target?: number
          default_reel_target?: number
          id?: number
          low_balance_threshold?: number
          timezone?: string
          updated_at?: string
        }
        Update: {
          agency_name?: string
          contact?: string | null
          currency?: string
          default_group_target?: number
          default_post_target?: number
          default_reel_target?: number
          id?: number
          low_balance_threshold?: number
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          boost_id: string | null
          client_id: string
          created_at: string
          id: string
          notes: string | null
          payment_method: string | null
          reference: string | null
          txn_date: string
          txn_type: string
          updated_at: string
        }
        Insert: {
          amount: number
          boost_id?: string | null
          client_id: string
          created_at?: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          reference?: string | null
          txn_date?: string
          txn_type?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          boost_id?: string | null
          client_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          reference?: string | null
          txn_date?: string
          txn_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_boost_id_fkey"
            columns: ["boost_id"]
            isOneToOne: false
            referencedRelation: "boosts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
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
      is_staff: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "member"
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
      app_role: ["admin", "member"],
    },
  },
} as const
