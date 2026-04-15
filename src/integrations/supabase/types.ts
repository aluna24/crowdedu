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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      reserve_class: {
        Args: { p_class_id: string; p_pass_id: string; p_user_id: string }
        Returns: Json
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
    Enums: {},
  },
} as const
