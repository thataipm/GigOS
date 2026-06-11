-- GigOS Feature Expansion Migration
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard → SQL Editor)

-- ─────────────────────────────────────────────────────────────
-- 1. Add invoice + notification columns to djs table
-- ─────────────────────────────────────────────────────────────
ALTER TABLE djs
  ADD COLUMN IF NOT EXISTS gstin TEXT,
  ADD COLUMN IF NOT EXISTS business_address TEXT,
  ADD COLUMN IF NOT EXISTS push_token TEXT;

-- ─────────────────────────────────────────────────────────────
-- 2. Expenses table
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS expenses (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  dj_id        UUID        REFERENCES djs(id)  ON DELETE CASCADE NOT NULL,
  gig_id       UUID        REFERENCES gigs(id) ON DELETE SET NULL,
  amount       NUMERIC     NOT NULL CHECK (amount > 0),
  category     TEXT        NOT NULL DEFAULT 'other',
  description  TEXT,
  date         DATE        NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "DJs manage own expenses" ON expenses;
CREATE POLICY "DJs manage own expenses" ON expenses
  FOR ALL
  USING    (dj_id = (SELECT id FROM djs WHERE user_id = auth.uid()))
  WITH CHECK (dj_id = (SELECT id FROM djs WHERE user_id = auth.uid()));

-- ─────────────────────────────────────────────────────────────
-- 3. Gig documents table
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gig_documents (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  gig_id        UUID        REFERENCES gigs(id) ON DELETE CASCADE NOT NULL,
  dj_id         UUID        REFERENCES djs(id)  ON DELETE CASCADE NOT NULL,
  file_name     TEXT        NOT NULL,
  storage_path  TEXT        NOT NULL,
  file_type     TEXT,
  file_size     INTEGER,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE gig_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "DJs manage own documents" ON gig_documents;
CREATE POLICY "DJs manage own documents" ON gig_documents
  FOR ALL
  USING    (dj_id = (SELECT id FROM djs WHERE user_id = auth.uid()))
  WITH CHECK (dj_id = (SELECT id FROM djs WHERE user_id = auth.uid()));

-- ─────────────────────────────────────────────────────────────
-- 4. Supabase Storage — run AFTER creating bucket in dashboard
--    Storage → New Bucket → Name: gig-documents → Private
-- ─────────────────────────────────────────────────────────────
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('gig-documents', 'gig-documents', false)
-- ON CONFLICT DO NOTHING;

-- DROP POLICY IF EXISTS "DJs access own gig documents" ON storage.objects;
-- CREATE POLICY "DJs access own gig documents" ON storage.objects
--   FOR ALL
--   USING    (bucket_id = 'gig-documents' AND auth.uid()::text = (storage.foldername(name))[1])
--   WITH CHECK (bucket_id = 'gig-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
