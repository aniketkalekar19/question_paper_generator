-- ==============================================================================
-- College CIA-P Project: AI Question Paper and Practice Test Generator
-- Database Schema: Supabase PostgreSQL (Hardened Row Level Security)
-- ==============================================================================

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. Source Documents Table
CREATE TABLE IF NOT EXISTS public.source_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  file_name TEXT NOT NULL,
  extracted_text TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3. Generated Papers Table
CREATE TABLE IF NOT EXISTS public.generated_papers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'medium',
  total_marks INT NOT NULL DEFAULT 100,
  duration_minutes INT NOT NULL DEFAULT 180,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 4. Questions Table
CREATE TABLE IF NOT EXISTS public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paper_id UUID NOT NULL REFERENCES public.generated_papers(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  marks INT NOT NULL,
  options JSONB DEFAULT '[]'::jsonb,
  correct_answer TEXT,
  explanation TEXT,
  source_reference TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 5. Test Attempts Table
CREATE TABLE IF NOT EXISTS public.test_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  paper_id UUID NOT NULL REFERENCES public.generated_papers(id) ON DELETE CASCADE,
  score NUMERIC,
  started_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  submitted_at TIMESTAMPTZ
);

-- ==============================================================================
-- Indexes for Query Performance
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_source_documents_user_id ON public.source_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_generated_papers_user_id ON public.generated_papers(user_id);
CREATE INDEX IF NOT EXISTS idx_generated_papers_created_at ON public.generated_papers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_questions_paper_id ON public.questions(paper_id);
CREATE INDEX IF NOT EXISTS idx_test_attempts_user_id ON public.test_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_test_attempts_paper_id ON public.test_attempts(paper_id);

-- ==============================================================================
-- Enable Row Level Security (RLS) on All Tables
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.source_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_attempts ENABLE ROW LEVEL SECURITY;

-- Remove legacy permissive policies and make this schema safe to re-apply.
-- PostgreSQL combines permissive policies with OR, so any old public policy
-- would otherwise bypass the ownership rules below.
DROP POLICY IF EXISTS "Allow public read generated_papers" ON public.generated_papers;
DROP POLICY IF EXISTS "Allow public insert generated_papers" ON public.generated_papers;
DROP POLICY IF EXISTS "Allow public read questions" ON public.questions;
DROP POLICY IF EXISTS "Allow public insert questions" ON public.questions;
DROP POLICY IF EXISTS "Allow public read test_attempts" ON public.test_attempts;
DROP POLICY IF EXISTS "Allow public insert test_attempts" ON public.test_attempts;

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "source_documents_select_own" ON public.source_documents;
DROP POLICY IF EXISTS "source_documents_insert_own" ON public.source_documents;
DROP POLICY IF EXISTS "source_documents_update_own" ON public.source_documents;
DROP POLICY IF EXISTS "source_documents_delete_own" ON public.source_documents;
DROP POLICY IF EXISTS "generated_papers_select_own" ON public.generated_papers;
DROP POLICY IF EXISTS "generated_papers_insert_own" ON public.generated_papers;
DROP POLICY IF EXISTS "generated_papers_update_own" ON public.generated_papers;
DROP POLICY IF EXISTS "generated_papers_delete_own" ON public.generated_papers;
DROP POLICY IF EXISTS "questions_select_via_paper" ON public.questions;
DROP POLICY IF EXISTS "questions_insert_via_paper" ON public.questions;
DROP POLICY IF EXISTS "questions_update_via_paper" ON public.questions;
DROP POLICY IF EXISTS "questions_delete_via_paper" ON public.questions;
DROP POLICY IF EXISTS "test_attempts_select_own_or_paper_owner" ON public.test_attempts;
DROP POLICY IF EXISTS "test_attempts_insert_own" ON public.test_attempts;
DROP POLICY IF EXISTS "test_attempts_update_own" ON public.test_attempts;
DROP POLICY IF EXISTS "test_attempts_delete_own" ON public.test_attempts;

-- ==============================================================================
-- 1. Profiles Policies
-- Users can only view, insert, and update their own profile record.
-- ==============================================================================
CREATE POLICY "profiles_select_own"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "profiles_insert_own"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update_own"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ==============================================================================
-- 2. Source Documents Policies
-- Users can only view, insert, update, and delete their own uploaded documents.
-- ==============================================================================
CREATE POLICY "source_documents_select_own"
  ON public.source_documents
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "source_documents_insert_own"
  ON public.source_documents
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "source_documents_update_own"
  ON public.source_documents
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "source_documents_delete_own"
  ON public.source_documents
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ==============================================================================
-- 3. Generated Papers Policies
-- Users can only view, create, update, and delete exam papers they own.
-- ==============================================================================
CREATE POLICY "generated_papers_select_own"
  ON public.generated_papers
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "generated_papers_insert_own"
  ON public.generated_papers
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "generated_papers_update_own"
  ON public.generated_papers
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "generated_papers_delete_own"
  ON public.generated_papers
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ==============================================================================
-- 4. Questions Policies
-- Access to questions is controlled strictly through ownership of the parent paper.
-- ==============================================================================
CREATE POLICY "questions_select_via_paper"
  ON public.questions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.generated_papers gp
      WHERE gp.id = questions.paper_id
        AND gp.user_id = auth.uid()
    )
  );

CREATE POLICY "questions_insert_via_paper"
  ON public.questions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.generated_papers gp
      WHERE gp.id = questions.paper_id
        AND gp.user_id = auth.uid()
    )
  );

CREATE POLICY "questions_update_via_paper"
  ON public.questions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.generated_papers gp
      WHERE gp.id = questions.paper_id
        AND gp.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.generated_papers gp
      WHERE gp.id = questions.paper_id
        AND gp.user_id = auth.uid()
    )
  );

CREATE POLICY "questions_delete_via_paper"
  ON public.questions
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.generated_papers gp
      WHERE gp.id = questions.paper_id
        AND gp.user_id = auth.uid()
    )
  );

-- ==============================================================================
-- 5. Test Attempts Policies
-- Students can manage their own test attempts; instructors can review attempts
-- submitted for their generated papers.
-- ==============================================================================
CREATE POLICY "test_attempts_select_own_or_paper_owner"
  ON public.test_attempts
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.generated_papers gp
      WHERE gp.id = test_attempts.paper_id
        AND gp.user_id = auth.uid()
    )
  );

CREATE POLICY "test_attempts_insert_own"
  ON public.test_attempts
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "test_attempts_update_own"
  ON public.test_attempts
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "test_attempts_delete_own"
  ON public.test_attempts
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
