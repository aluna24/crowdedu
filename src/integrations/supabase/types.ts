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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      capacity_reminders: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          resolved_at: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          resolved_at?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          resolved_at?: string | null
        }
        Relationships: []
      }
      class_reservations: {
        Row: {
          class_id: string
          id: string
          pass_id: string
          reserved_at: string
          user_id: string
        }
        Insert: {
          class_id: string
          id?: string
          pass_id: string
          reserved_at?: string
          user_id: string
        }
        Update: {
          class_id?: string
          id?: string
          pass_id?: string
          reserved_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_reservations_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "fitness_classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_reservations_pass_id_fkey"
            columns: ["pass_id"]
            isOneToOne: false
            referencedRelation: "fitness_passes"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_tickets: {
        Row: {
          admin_notes: string | null
          created_at: string
          employee_name: string
          equipment_name: string
          equipment_number: string
          id: string
          note: string | null
          report_date: string
          reported_status: string
          resolution_status: string | null
          review_status: string
          submitted_by_user_id: string | null
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          employee_name: string
          equipment_name: string
          equipment_number: string
          id?: string
          note?: string | null
          report_date: string
          reported_status: string
          resolution_status?: string | null
          review_status?: string
          submitted_by_user_id?: string | null
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          employee_name?: string
          equipment_name?: string
          equipment_number?: string
          id?: string
          note?: string | null
          report_date?: string
          reported_status?: string
          resolution_status?: string | null
          review_status?: string
          submitted_by_user_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          created_at: string
          date_label: string
          description: string
          id: string
          priority: number
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_label?: string
          description?: string
          id?: string
          priority?: number
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_label?: string
          description?: string
          id?: string
          priority?: number
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      facility_count: {
        Row: {
          "3M": number
          "3rd floor courts": number
          "3rd floor squash courts": number
          "4th floor courts": number
          "4th floor squash courts": number
          Date: string
          Entry_num: number
          "Fitness Center": number
          "Multipurpose Room": number
          P3: number
          Pool: number
          Time: string
        }
        Insert: {
          "3M": number
          "3rd floor courts": number
          "3rd floor squash courts": number
          "4th floor courts": number
          "4th floor squash courts": number
          Date: string
          Entry_num?: number
          "Fitness Center": number
          "Multipurpose Room": number
          P3: number
          Pool: number
          Time: string
        }
        Update: {
          "3M"?: number
          "3rd floor courts"?: number
          "3rd floor squash courts"?: number
          "4th floor courts"?: number
          "4th floor squash courts"?: number
          Date?: string
          Entry_num?: number
          "Fitness Center"?: number
          "Multipurpose Room"?: number
          P3?: number
          Pool?: number
          Time?: string
        }
        Relationships: []
      }
      fitness_classes: {
        Row: {
          category: string
          created_at: string
          current_enrolled: number
          day: string
          id: string
          instructor: string
          location: string
          max_spots: number
          name: string
          status: string
          time: string
        }
        Insert: {
          category: string
          created_at?: string
          current_enrolled?: number
          day: string
          id?: string
          instructor: string
          location: string
          max_spots: number
          name: string
          status?: string
          time: string
        }
        Update: {
          category?: string
          created_at?: string
          current_enrolled?: number
          day?: string
          id?: string
          instructor?: string
          location?: string
          max_spots?: number
          name?: string
          status?: string
          time?: string
        }
        Relationships: []
      }
      fitness_passes: {
        Row: {
          classes_remaining: number | null
          id: string
          pass_type: string
          purchased_at: string
          status: string
          user_id: string
        }
        Insert: {
          classes_remaining?: number | null
          id?: string
          pass_type: string
          purchased_at?: string
          status?: string
          user_id: string
        }
        Update: {
          classes_remaining?: number | null
          id?: string
          pass_type?: string
          purchased_at?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      intramural_team_members: {
        Row: {
          created_at: string
          id: string
          invite_token: string
          member_email: string
          member_name: string
          responded_at: string | null
          status: string
          team_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invite_token?: string
          member_email: string
          member_name: string
          responded_at?: string | null
          status?: string
          team_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invite_token?: string
          member_email?: string
          member_name?: string
          responded_at?: string | null
          status?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "intramural_team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "intramural_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      intramural_teams: {
        Row: {
          approval_status: string
          captain_email: string
          captain_name: string
          captain_user_id: string
          created_at: string
          id: string
          sport_id: string
          team_name: string
        }
        Insert: {
          approval_status?: string
          captain_email: string
          captain_name: string
          captain_user_id: string
          created_at?: string
          id?: string
          sport_id: string
          team_name: string
        }
        Update: {
          approval_status?: string
          captain_email?: string
          captain_name?: string
          captain_user_id?: string
          created_at?: string
          id?: string
          sport_id?: string
          team_name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      add_team_member: {
        Args: {
          p_captain_user_id: string
          p_member_email: string
          p_member_name: string
          p_team_id: string
        }
        Returns: Json
      }
      cancel_reservation: {
        Args: { p_reservation_id: string; p_user_id: string }
        Returns: Json
      }
      delete_team_with_members: {
        Args: { p_captain_user_id: string; p_team_id: string }
        Returns: Json
      }
      get_all_rosters_admin: {
        Args: { p_user_id: string }
        Returns: {
          created_at: string
          invite_token: string
          member_email: string
          member_id: string
          member_name: string
          status: string
          team_id: string
        }[]
      }
      get_invite_by_token: {
        Args: { p_token: string }
        Returns: {
          captain_name: string
          id: string
          member_email: string
          member_name: string
          sport_id: string
          status: string
          team_name: string
        }[]
      }
      get_my_memberships: {
        Args: { p_email: string }
        Returns: {
          sport_id: string
          team_id: string
          team_name: string
        }[]
      }
      get_team_roster: {
        Args: { p_captain_user_id: string; p_team_id: string }
        Returns: {
          created_at: string
          id: string
          invite_token: string
          member_email: string
          member_name: string
          status: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      remove_team_member: {
        Args: { p_captain_user_id: string; p_member_id: string }
        Returns: Json
      }
      reserve_class: {
        Args: { p_class_id: string; p_pass_id: string; p_user_id: string }
        Returns: Json
      }
      respond_to_invite: {
        Args: { p_response: string; p_token: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "student" | "employee" | "admin"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      app_role: ["student", "employee", "admin"],
    },
  },
} as const
