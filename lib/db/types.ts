/**
 * Tipos de la base de datos.
 *
 * En S0 este archivo es un placeholder minimo. Los tipos reales se generan
 * con `npm run db:types` (supabase gen types) una vez que la DB este en pie.
 *
 * Hasta entonces, las tablas se declaran manualmente en sincronia con las
 * migraciones en `lib/db/migrations/`.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      invited_users: {
        Row: {
          email: string
          invited_by: string | null
          invited_at: string
          signed_up_at: string | null
        }
        Insert: {
          email: string
          invited_by?: string | null
          invited_at?: string
          signed_up_at?: string | null
        }
        Update: {
          email?: string
          invited_by?: string | null
          invited_at?: string
          signed_up_at?: string | null
        }
      }
      course: {
        Row: {
          id: string
          user_id: string
          name: string
          deadline: string
          state: CourseState
          mode: 'examen'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          deadline: string
          state?: CourseState
          mode?: 'examen'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          deadline?: string
          state?: CourseState
          mode?: 'examen'
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

export type CourseState =
  | 'draft'
  | 'poa_captured'
  | 'corpus_loaded'
  | 'ingestion_ready'
  | 'ingesting'
  | 'active'
  | 'fail_review'
  | 'paused'
  | 'completed'
  | 'archived'
