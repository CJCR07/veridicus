-- Veridicus Forensic Reasoning Engine Schema
-- Created: 2025-12-31
-- Apply this migration via Supabase Dashboard > SQL Editor

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgvector";

-- Cases table: Core investigation units
CREATE TABLE IF NOT EXISTS cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cache_id TEXT,
  cache_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Evidence table: Files and documents for each case
CREATE TABLE IF NOT EXISTS evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size BIGINT,
  token_count INTEGER,
  metadata JSONB DEFAULT '{}',
  embedding vector(1536),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Analyses table: Gemini reasoning sessions
CREATE TABLE IF NOT EXISTS analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  thought_signature TEXT,
  thoughts TEXT[],
  result JSONB DEFAULT '{}',
  citations JSONB DEFAULT '[]',
  token_usage JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Contradictions table: Detected evidence conflicts
CREATE TABLE IF NOT EXISTS contradictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  evidence_a_id UUID NOT NULL REFERENCES evidence(id),
  evidence_b_id UUID NOT NULL REFERENCES evidence(id),
  description TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  timestamps JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Audit logs table: Immutable action tracking for legal compliance
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_cases_user_id ON cases(user_id);
CREATE INDEX IF NOT EXISTS idx_evidence_case_id ON evidence(case_id);
CREATE INDEX IF NOT EXISTS idx_analyses_case_id ON analyses(case_id);
CREATE INDEX IF NOT EXISTS idx_contradictions_analysis_id ON contradictions(analysis_id);
CREATE INDEX IF NOT EXISTS idx_contradictions_case_id ON contradictions(case_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_case_id ON audit_logs(case_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Enable Row Level Security
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE contradictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own cases
CREATE POLICY "Users can view own cases" ON cases
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own cases" ON cases
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cases" ON cases
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cases" ON cases
  FOR DELETE USING (auth.uid() = user_id);

-- Evidence policies: Access through case ownership
CREATE POLICY "Users can view evidence in own cases" ON evidence
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM cases WHERE cases.id = evidence.case_id AND cases.user_id = auth.uid())
  );

CREATE POLICY "Users can add evidence to own cases" ON evidence
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM cases WHERE cases.id = evidence.case_id AND cases.user_id = auth.uid())
  );

CREATE POLICY "Users can delete evidence from own cases" ON evidence
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM cases WHERE cases.id = evidence.case_id AND cases.user_id = auth.uid())
  );

-- Analyses policies
CREATE POLICY "Users can view analyses in own cases" ON analyses
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM cases WHERE cases.id = analyses.case_id AND cases.user_id = auth.uid())
  );

CREATE POLICY "Users can create analyses in own cases" ON analyses
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM cases WHERE cases.id = analyses.case_id AND cases.user_id = auth.uid())
  );

-- Contradictions policies
CREATE POLICY "Users can view contradictions in own cases" ON contradictions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM cases WHERE cases.id = contradictions.case_id AND cases.user_id = auth.uid())
  );

CREATE POLICY "Users can create contradictions in own cases" ON contradictions
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM cases WHERE cases.id = contradictions.case_id AND cases.user_id = auth.uid())
  );

-- Audit logs policies (read-only for users)
CREATE POLICY "Users can view audit logs for own cases" ON audit_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM cases WHERE cases.id = audit_logs.case_id AND cases.user_id = auth.uid())
  );

-- Create function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to cases table
CREATE TRIGGER update_cases_updated_at
  BEFORE UPDATE ON cases
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
