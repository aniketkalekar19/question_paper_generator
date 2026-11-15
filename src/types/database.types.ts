export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      source_documents: {
        Row: {
          id: string;
          user_id: string | null;
          file_name: string;
          extracted_text: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          file_name: string;
          extracted_text?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          file_name?: string;
          extracted_text?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "source_documents_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      generated_papers: {
        Row: {
          id: string;
          user_id: string | null;
          title: string;
          subject: string;
          difficulty: string;
          total_marks: number;
          duration_minutes: number;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          title: string;
          subject: string;
          difficulty?: string;
          total_marks: number;
          duration_minutes: number;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          title?: string;
          subject?: string;
          difficulty?: string;
          total_marks?: number;
          duration_minutes?: number;
          status?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "generated_papers_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      questions: {
        Row: {
          id: string;
          paper_id: string;
          question_text: string;
          question_type: string;
          difficulty: string;
          marks: number;
          options: Json | null;
          correct_answer: string | null;
          explanation: string | null;
          source_reference: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          paper_id: string;
          question_text: string;
          question_type: string;
          difficulty: string;
          marks: number;
          options?: Json | null;
          correct_answer?: string | null;
          explanation?: string | null;
          source_reference?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          paper_id?: string;
          question_text?: string;
          question_type?: string;
          difficulty?: string;
          marks?: number;
          options?: Json | null;
          correct_answer?: string | null;
          explanation?: string | null;
          source_reference?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "questions_paper_id_fkey";
            columns: ["paper_id"];
            isOneToOne: false;
            referencedRelation: "generated_papers";
            referencedColumns: ["id"];
          },
        ];
      };
      test_attempts: {
        Row: {
          id: string;
          user_id: string | null;
          paper_id: string;
          score: number | null;
          started_at: string;
          submitted_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          paper_id: string;
          score?: number | null;
          started_at?: string;
          submitted_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          paper_id?: string;
          score?: number | null;
          started_at?: string;
          submitted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "test_attempts_paper_id_fkey";
            columns: ["paper_id"];
            isOneToOne: false;
            referencedRelation: "generated_papers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "test_attempts_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
