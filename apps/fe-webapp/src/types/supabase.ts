export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      audio_transcriptions: {
        Row: {
          audio_file_name: string | null
          audio_file_size: number | null
          audio_url: string | null
          created_at: string | null
          duration: number | null
          id: string
          language: string | null
          note_id: string | null
          source: string | null
          text: string
          user_id: string
        }
        Insert: {
          audio_file_name?: string | null
          audio_file_size?: number | null
          audio_url?: string | null
          created_at?: string | null
          duration?: number | null
          id?: string
          language?: string | null
          note_id?: string | null
          source?: string | null
          text: string
          user_id: string
        }
        Update: {
          audio_file_name?: string | null
          audio_file_size?: number | null
          audio_url?: string | null
          created_at?: string | null
          duration?: number | null
          id?: string
          language?: string | null
          note_id?: string | null
          source?: string | null
          text?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audio_transcriptions_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audio_transcriptions_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audio_transcriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_audio_transcriptions_note"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_audio_transcriptions_note"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_audio_transcriptions_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      memory: {
        Row: {
          category: string | null
          created_at: string | null
          id: number
          note_id: string | null
          source: string | null
          source_type: string | null
          text: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: number
          note_id?: string | null
          source?: string | null
          source_type?: string | null
          text: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: number
          note_id?: string | null
          source?: string | null
          source_type?: string | null
          text?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "memory_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memory_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memory_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      memory_chunk: {
        Row: {
          chunk_index: number
          chunk_text: string
          created_at: string | null
          embedding: string | null
          id: number
          memory_id: number
        }
        Insert: {
          chunk_index: number
          chunk_text: string
          created_at?: string | null
          embedding?: string | null
          id?: number
          memory_id: number
        }
        Update: {
          chunk_index?: number
          chunk_text?: string
          created_at?: string | null
          embedding?: string | null
          id?: number
          memory_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_memory_chunk_memory"
            columns: ["memory_id"]
            isOneToOne: false
            referencedRelation: "memory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_memory_chunk_memory"
            columns: ["memory_id"]
            isOneToOne: false
            referencedRelation: "memory_connections"
            referencedColumns: ["source_id"]
          },
          {
            foreignKeyName: "fk_memory_chunk_memory"
            columns: ["memory_id"]
            isOneToOne: false
            referencedRelation: "memory_connections"
            referencedColumns: ["target_id"]
          },
        ]
      }
      memory_edge: {
        Row: {
          created_at: string | null
          source_id: number
          target_id: number
          weight: number
        }
        Insert: {
          created_at?: string | null
          source_id: number
          target_id: number
          weight: number
        }
        Update: {
          created_at?: string | null
          source_id?: number
          target_id?: number
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_memory_edge_source"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "memory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_memory_edge_source"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "memory_connections"
            referencedColumns: ["source_id"]
          },
          {
            foreignKeyName: "fk_memory_edge_source"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "memory_connections"
            referencedColumns: ["target_id"]
          },
          {
            foreignKeyName: "fk_memory_edge_target"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "memory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_memory_edge_target"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "memory_connections"
            referencedColumns: ["source_id"]
          },
          {
            foreignKeyName: "fk_memory_edge_target"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "memory_connections"
            referencedColumns: ["target_id"]
          },
        ]
      }
      note_backlinks: {
        Row: {
          created_at: string | null
          source_note_id: string
          target_note_id: string
        }
        Insert: {
          created_at?: string | null
          source_note_id: string
          target_note_id: string
        }
        Update: {
          created_at?: string | null
          source_note_id?: string
          target_note_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "note_backlinks_source_note_id_fkey"
            columns: ["source_note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "note_backlinks_source_note_id_fkey"
            columns: ["source_note_id"]
            isOneToOne: false
            referencedRelation: "notes_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "note_backlinks_target_note_id_fkey"
            columns: ["target_note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "note_backlinks_target_note_id_fkey"
            columns: ["target_note_id"]
            isOneToOne: false
            referencedRelation: "notes_full"
            referencedColumns: ["id"]
          },
        ]
      }
      note_tags: {
        Row: {
          created_at: string | null
          note_id: string
          tag_id: string
        }
        Insert: {
          created_at?: string | null
          note_id: string
          tag_id: string
        }
        Update: {
          created_at?: string | null
          note_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "note_tags_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "note_tags_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "note_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      note_templates: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_default: boolean | null
          name: string
          project_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          project_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          project_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "note_templates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "note_templates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_pinned: boolean | null
          memory_id: number | null
          project_id: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_pinned?: boolean | null
          memory_id?: number | null
          project_id?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_pinned?: boolean | null
          memory_id?: number | null
          project_id?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_notes_memory"
            columns: ["memory_id"]
            isOneToOne: false
            referencedRelation: "memory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_notes_memory"
            columns: ["memory_id"]
            isOneToOne: false
            referencedRelation: "memory_connections"
            referencedColumns: ["source_id"]
          },
          {
            foreignKeyName: "fk_notes_memory"
            columns: ["memory_id"]
            isOneToOne: false
            referencedRelation: "memory_connections"
            referencedColumns: ["target_id"]
          },
          {
            foreignKeyName: "notes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          color: string | null
          created_at: string | null
          icon: string | null
          id: string
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          color: string | null
          created_at: string | null
          id: string
          name: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: string
          name: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tags_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      test: {
        Row: {
          created_at: string
          id: number
        }
        Insert: {
          created_at?: string
          id?: number
        }
        Update: {
          created_at?: string
          id?: number
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          id: string
          last_login_at: string | null
          name: string | null
          notes_count_current_month: number | null
          notes_limit: number | null
          plan: string | null
          storage_limit: number | null
          storage_used: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          last_login_at?: string | null
          name?: string | null
          notes_count_current_month?: number | null
          notes_limit?: number | null
          plan?: string | null
          storage_limit?: number | null
          storage_used?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          last_login_at?: string | null
          name?: string | null
          notes_count_current_month?: number | null
          notes_limit?: number | null
          plan?: string | null
          storage_limit?: number | null
          storage_used?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      audio_transcriptions_full: {
        Row: {
          audio_file_name: string | null
          audio_file_size: number | null
          audio_url: string | null
          created_at: string | null
          duration: number | null
          id: string | null
          language: string | null
          note_id: string | null
          note_title: string | null
          source: string | null
          text: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audio_transcriptions_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audio_transcriptions_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audio_transcriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_audio_transcriptions_note"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_audio_transcriptions_note"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_audio_transcriptions_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      memory_chunk_details: {
        Row: {
          category: string | null
          chunk_created_at: string | null
          chunk_id: number | null
          chunk_index: number | null
          chunk_text: string | null
          full_memory_text: string | null
          memory_created_at: string | null
          memory_id: number | null
          source: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_memory_chunk_memory"
            columns: ["memory_id"]
            isOneToOne: false
            referencedRelation: "memory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_memory_chunk_memory"
            columns: ["memory_id"]
            isOneToOne: false
            referencedRelation: "memory_connections"
            referencedColumns: ["source_id"]
          },
          {
            foreignKeyName: "fk_memory_chunk_memory"
            columns: ["memory_id"]
            isOneToOne: false
            referencedRelation: "memory_connections"
            referencedColumns: ["target_id"]
          },
        ]
      }
      memory_connections: {
        Row: {
          similarity_score: number | null
          source_category: string | null
          source_id: number | null
          source_text: string | null
          target_category: string | null
          target_id: number | null
          target_text: string | null
        }
        Relationships: []
      }
      notes_full: {
        Row: {
          backlinks_count: number | null
          content: string | null
          created_at: string | null
          id: string | null
          is_pinned: boolean | null
          memory_id: number | null
          project_color: string | null
          project_id: string | null
          project_name: string | null
          similar_notes_count: number | null
          tags: string[] | null
          title: string | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_notes_memory"
            columns: ["memory_id"]
            isOneToOne: false
            referencedRelation: "memory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_notes_memory"
            columns: ["memory_id"]
            isOneToOne: false
            referencedRelation: "memory_connections"
            referencedColumns: ["source_id"]
          },
          {
            foreignKeyName: "fk_notes_memory"
            columns: ["memory_id"]
            isOneToOne: false
            referencedRelation: "memory_connections"
            referencedColumns: ["target_id"]
          },
          {
            foreignKeyName: "notes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      show_limit: { Args: Record<string, never>; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
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
