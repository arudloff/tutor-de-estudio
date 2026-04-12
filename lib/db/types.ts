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
      learner_objective_profile: {
        Row: {
          id: string
          course_id: string
          state: PoaState
          learner_role: string | null
          discipline: string | null
          program: string | null
          phase: 'starting' | 'middle' | 'closing' | 'postdoctoral' | null
          research_field: string | null
          target_challenge: string | null
          target_capability: string | null
          success_signal: string | null
          target_deadline: string | null
          known_authors: string[] | null
          prior_readings: string[] | null
          prior_ideas: string | null
          theoretical_traditions: string[] | null
          confirmed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          course_id: string
          state?: PoaState
          learner_role?: string | null
          discipline?: string | null
          program?: string | null
          phase?: 'starting' | 'middle' | 'closing' | 'postdoctoral' | null
          research_field?: string | null
          target_challenge?: string | null
          target_capability?: string | null
          success_signal?: string | null
          target_deadline?: string | null
          known_authors?: string[] | null
          prior_readings?: string[] | null
          prior_ideas?: string | null
          theoretical_traditions?: string[] | null
          confirmed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          state?: PoaState
          learner_role?: string | null
          discipline?: string | null
          program?: string | null
          phase?: 'starting' | 'middle' | 'closing' | 'postdoctoral' | null
          research_field?: string | null
          target_challenge?: string | null
          target_capability?: string | null
          success_signal?: string | null
          target_deadline?: string | null
          known_authors?: string[] | null
          prior_readings?: string[] | null
          prior_ideas?: string | null
          theoretical_traditions?: string[] | null
          confirmed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      message_log: {
        Row: {
          id: string
          course_id: string
          session_id: string | null
          agent: 'a4' | 'a12' | 'a11' | 'learner'
          role: 'user' | 'assistant' | 'system'
          content: string
          tokens: number | null
          latency_ms: number | null
          created_at: string
        }
        Insert: {
          id?: string
          course_id: string
          session_id?: string | null
          agent: 'a4' | 'a12' | 'a11' | 'learner'
          role: 'user' | 'assistant' | 'system'
          content: string
          tokens?: number | null
          latency_ms?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          session_id?: string | null
          agent?: 'a4' | 'a12' | 'a11' | 'learner'
          role?: 'user' | 'assistant' | 'system'
          content?: string
          tokens?: number | null
          latency_ms?: number | null
          created_at?: string
        }
      }
      pdf: {
        Row: {
          id: string
          course_id: string
          filename: string
          size_bytes: number
          mime_type: string
          storage_path: string
          role: PdfRole
          state: PdfState
          full_text: string | null
          toc: Json | null
          length_pp: number | null
          ingestion_iter: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          course_id: string
          filename: string
          size_bytes: number
          mime_type?: string
          storage_path: string
          role?: PdfRole
          state?: PdfState
          full_text?: string | null
          toc?: Json | null
          length_pp?: number | null
          ingestion_iter?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          filename?: string
          size_bytes?: number
          mime_type?: string
          storage_path?: string
          role?: PdfRole
          state?: PdfState
          full_text?: string | null
          toc?: Json | null
          length_pp?: number | null
          ingestion_iter?: number
          created_at?: string
          updated_at?: string
        }
      }
      sense_unit: {
        Row: {
          id: string
          course_id: string
          pdf_id: string
          name: string
          description: string
          unit_type: string
          source_spans: Json
          state: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          course_id: string
          pdf_id: string
          name: string
          description: string
          unit_type?: string
          source_spans: Json
          state?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          pdf_id?: string
          name?: string
          description?: string
          unit_type?: string
          source_spans?: Json
          state?: string
          created_at?: string
          updated_at?: string
        }
      }
      prerequisite_edge: {
        Row: { from_unit: string; to_unit: string }
        Insert: { from_unit: string; to_unit: string }
        Update: { from_unit?: string; to_unit?: string }
      }
      coverage_report: {
        Row: {
          id: string
          pdf_id: string
          iter: number
          coverage_pct: number
          orphan_count: number
          orphan_paragraphs: Json
          non_coverable: Json
          pass: boolean
          created_at: string
        }
        Insert: {
          id?: string
          pdf_id: string
          iter?: number
          coverage_pct: number
          orphan_count: number
          orphan_paragraphs?: Json
          non_coverable?: Json
          pass: boolean
          created_at?: string
        }
        Update: {
          id?: string
          pdf_id?: string
          iter?: number
          coverage_pct?: number
          orphan_count?: number
          orphan_paragraphs?: Json
          non_coverable?: Json
          pass?: boolean
          created_at?: string
        }
      }
      ingestion_job: {
        Row: {
          id: string
          course_id: string
          state: string
          current_step: string | null
          progress_pct: number
          error_msg: string | null
          started_at: string | null
          completed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          course_id: string
          state?: string
          current_step?: string | null
          progress_pct?: number
          error_msg?: string | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          state?: string
          current_step?: string | null
          progress_pct?: number
          error_msg?: string | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
        }
      }
      productive_failure_problem: {
        Row: { id: string; unit_id: string; content: string; created_at: string }
        Insert: { id?: string; unit_id: string; content: string; created_at?: string }
        Update: { id?: string; unit_id?: string; content?: string; created_at?: string }
      }
      canonical_instruction: {
        Row: { id: string; unit_id: string; content: string; cited_spans: Json; created_at: string }
        Insert: { id?: string; unit_id: string; content: string; cited_spans?: Json; created_at?: string }
        Update: { id?: string; unit_id?: string; content?: string; cited_spans?: Json; created_at?: string }
      }
      rubric: {
        Row: { id: string; unit_id: string; items: Json; created_at: string }
        Insert: { id?: string; unit_id: string; items: Json; created_at?: string }
        Update: { id?: string; unit_id?: string; items?: Json; created_at?: string }
      }
      misconception_catalog: {
        Row: { id: string; unit_id: string; items: Json; created_at: string }
        Insert: { id?: string; unit_id: string; items: Json; created_at?: string }
        Update: { id?: string; unit_id?: string; items?: Json; created_at?: string }
      }
      generative_task: {
        Row: { id: string; unit_id: string; tier: number; format: string; prompt: string; max_words: number; created_at: string }
        Insert: { id?: string; unit_id: string; tier: number; format: string; prompt: string; max_words: number; created_at?: string }
        Update: { id?: string; unit_id?: string; tier?: number; format?: string; prompt?: string; max_words?: number; created_at?: string }
      }
      audit_report: {
        Row: { id: string; unit_id: string; agent: string; iter: number; cite_results: Json; pass: boolean; created_at: string }
        Insert: { id?: string; unit_id: string; agent: string; iter?: number; cite_results: Json; pass: boolean; created_at?: string }
        Update: { id?: string; unit_id?: string; agent?: string; iter?: number; cite_results?: Json; pass?: boolean; created_at?: string }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

export type PdfRole = 'principal' | 'equivalente' | 'complementario' | 'referencial' | 'contrapunto'

export type PdfState =
  | 'uploaded' | 'structure_known' | 'role_assigned' | 'ready_to_ingest'
  | 'text_extracted' | 'analyzed' | 'coverage_ok' | 'coverage_fail'
  | 'ready' | 'fail_review'

export type PoaState =
  | 'empty'
  | 'in_interview'
  | 'captured'
  | 'confirmed_by_learner'
  | 'updating'

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
