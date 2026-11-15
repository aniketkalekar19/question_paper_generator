-- ==============================================================================
-- Migration: 20261115_fix_rls_policies.sql
-- Description: Replace permissive public RLS policies with strict,
--              authenticated-user ownership policies using auth.uid().
-- Target Tables: profiles, source_documents, generated_papers, questions, test_attempts
-- ==============================================================================

-- 1. Ensure Row Level Security is Enabled on All Target Tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.source_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_attempts ENABLE ROW LEVEL SECURITY;

-- 2. Drop Insecure Permissive / Development Policies
DROP POLICY IF EXISTS "Allow public read generated_papers" ON public.generated_papers;
DROP POLICY IF EXISTS "Allow public insert generated_papers" ON public.generated_papers;
DROP POLICY IF EXISTS "Allow public read questions" ON public.questions;
DROP POLICY IF EXISTS "Allow public insert questions" ON public.questions;
DROP POLICY IF EXISTS "Allow public read test_attempts" ON public.test_attempts;
DROP POLICY IF EXISTS "Allow public insert test_attempts" ON public.test_attempts;

-- 3. Profiles Policies
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;

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

-- 4. Source Documents Policies
DROP POLICY IF EXISTS "source_documents_select_own" ON public.source_documents;
DROP POLICY IF EXISTS "source_documents_insert_own" ON public.source_documents;
DROP POLICY IF EXISTS "source_documents_update_own" ON public.source_documents;
DROP POLICY IF EXISTS "source_documents_delete_own" ON public.source_documents;

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

-- 5. Generated Papers Policies
DROP POLICY IF EXISTS "generated_papers_select_own" ON public.generated_papers;
DROP POLICY IF EXISTS "generated_papers_insert_own" ON public.generated_papers;
DROP POLICY IF EXISTS "generated_papers_update_own" ON public.generated_papers;
DROP POLICY IF EXISTS "generated_papers_delete_own" ON public.generated_papers;

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

-- 6. Questions Policies (Inherits Ownership from Parent generated_papers)
DROP POLICY IF EXISTS "questions_select_via_paper" ON public.questions;
DROP POLICY IF EXISTS "questions_insert_via_paper" ON public.questions;
DROP POLICY IF EXISTS "questions_update_via_paper" ON public.questions;
DROP POLICY IF EXISTS "questions_delete_via_paper" ON public.questions;

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

-- 7. Test Attempts Policies
DROP POLICY IF EXISTS "test_attempts_select_own_or_paper_owner" ON public.test_attempts;
DROP POLICY IF EXISTS "test_attempts_insert_own" ON public.test_attempts;
DROP POLICY IF EXISTS "test_attempts_update_own" ON public.test_attempts;
DROP POLICY IF EXISTS "test_attempts_delete_own" ON public.test_attempts;

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
