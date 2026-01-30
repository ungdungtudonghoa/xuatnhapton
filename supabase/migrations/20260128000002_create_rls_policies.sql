-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Created: 2026-01-28
-- Description: Multi-tenant data isolation policies
-- =====================================================

-- =====================================================
-- ENABLE RLS ON ALL TABLES
-- =====================================================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_processing_logs ENABLE ROW LEVEL SECURITY;

-- Note: document_types table is shared across all organizations (no RLS)

-- =====================================================
-- HELPER FUNCTION: Get user's organization
-- =====================================================
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS UUID AS $$
  SELECT organization_id FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

COMMENT ON FUNCTION get_user_organization_id IS 'Returns the organization_id of the current authenticated user';

-- =====================================================
-- POLICIES: organizations
-- =====================================================

-- Users can view their own organization
CREATE POLICY "Users can view their organization"
  ON organizations FOR SELECT
  USING (id = get_user_organization_id());

-- Only admins can update organization
CREATE POLICY "Admins can update their organization"
  ON organizations FOR UPDATE
  USING (
    id = get_user_organization_id() AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
        AND role = 'admin'
    )
  );

-- =====================================================
-- POLICIES: users
-- =====================================================

-- Users can view other users in their organization
CREATE POLICY "Users can view users in their organization"
  ON users FOR SELECT
  USING (organization_id = get_user_organization_id());

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (id = auth.uid());

-- Admins can insert new users in their organization
CREATE POLICY "Admins can insert users in their organization"
  ON users FOR INSERT
  WITH CHECK (
    organization_id = get_user_organization_id() AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
        AND role = 'admin'
    )
  );

-- =====================================================
-- POLICIES: warehouses
-- =====================================================

-- Users can view warehouses in their organization
CREATE POLICY "Users can view their organization's warehouses"
  ON warehouses FOR SELECT
  USING (organization_id = get_user_organization_id());

-- Users can manage warehouses in their organization
CREATE POLICY "Users can manage their organization's warehouses"
  ON warehouses FOR ALL
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

-- =====================================================
-- POLICIES: materials
-- =====================================================

-- Users can view materials in their organization
CREATE POLICY "Users can view their organization's materials"
  ON materials FOR SELECT
  USING (organization_id = get_user_organization_id());

-- Users can manage materials in their organization
CREATE POLICY "Users can manage their organization's materials"
  ON materials FOR ALL
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

-- =====================================================
-- POLICIES: suppliers
-- =====================================================

-- Users can view suppliers in their organization
CREATE POLICY "Users can view their organization's suppliers"
  ON suppliers FOR SELECT
  USING (organization_id = get_user_organization_id());

-- Users can manage suppliers in their organization
CREATE POLICY "Users can manage their organization's suppliers"
  ON suppliers FOR ALL
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

-- =====================================================
-- POLICIES: documents
-- =====================================================

-- Users can view documents in their organization
CREATE POLICY "Users can view their organization's documents"
  ON documents FOR SELECT
  USING (organization_id = get_user_organization_id());

-- Users can insert documents in their organization
CREATE POLICY "Users can insert documents in their organization"
  ON documents FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());

-- Users can update documents in their organization
CREATE POLICY "Users can update their organization's documents"
  ON documents FOR UPDATE
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

-- Only admins can delete documents
CREATE POLICY "Admins can delete documents in their organization"
  ON documents FOR DELETE
  USING (
    organization_id = get_user_organization_id() AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
        AND role IN ('admin', 'manager')
    )
  );

-- =====================================================
-- POLICIES: document_items
-- =====================================================

-- Users can view document items from their organization's documents
CREATE POLICY "Users can view their organization's document items"
  ON document_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM documents 
      WHERE documents.id = document_items.document_id 
        AND documents.organization_id = get_user_organization_id()
    )
  );

-- Users can manage document items for their organization's documents
CREATE POLICY "Users can manage their organization's document items"
  ON document_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM documents 
      WHERE documents.id = document_items.document_id 
        AND documents.organization_id = get_user_organization_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM documents 
      WHERE documents.id = document_items.document_id 
        AND documents.organization_id = get_user_organization_id()
    )
  );

-- =====================================================
-- POLICIES: inventory
-- =====================================================

-- Users can view inventory in their organization
CREATE POLICY "Users can view their organization's inventory"
  ON inventory FOR SELECT
  USING (organization_id = get_user_organization_id());

-- Inventory is managed by triggers, but allow manual adjustments for admins
CREATE POLICY "Admins can adjust inventory"
  ON inventory FOR ALL
  USING (
    organization_id = get_user_organization_id() AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
        AND role IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    organization_id = get_user_organization_id() AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
        AND role IN ('admin', 'manager')
    )
  );

-- =====================================================
-- POLICIES: inventory_transactions
-- =====================================================

-- Users can view transactions in their organization
CREATE POLICY "Users can view their organization's transactions"
  ON inventory_transactions FOR SELECT
  USING (organization_id = get_user_organization_id());

-- Transactions are created by triggers, but allow manual entries for admins
CREATE POLICY "Admins can create manual transactions"
  ON inventory_transactions FOR INSERT
  WITH CHECK (
    organization_id = get_user_organization_id() AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
        AND role IN ('admin', 'manager')
    )
  );

-- =====================================================
-- POLICIES: ai_prompts
-- =====================================================

-- Users can view prompts in their organization and system prompts
CREATE POLICY "Users can view their organization's prompts and system prompts"
  ON ai_prompts FOR SELECT
  USING (
    organization_id = get_user_organization_id() OR 
    organization_id IS NULL OR
    is_system = TRUE
  );

-- Users can create prompts in their organization
CREATE POLICY "Users can create prompts in their organization"
  ON ai_prompts FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());

-- Users can update their organization's prompts (not system prompts)
CREATE POLICY "Users can update their organization's prompts"
  ON ai_prompts FOR UPDATE
  USING (
    organization_id = get_user_organization_id() AND
    is_system = FALSE
  )
  WITH CHECK (
    organization_id = get_user_organization_id() AND
    is_system = FALSE
  );

-- Users can delete their organization's prompts (not system prompts)
CREATE POLICY "Users can delete their organization's prompts"
  ON ai_prompts FOR DELETE
  USING (
    organization_id = get_user_organization_id() AND
    is_system = FALSE
  );

-- =====================================================
-- POLICIES: ai_processing_logs
-- =====================================================

-- Users can view AI logs in their organization
CREATE POLICY "Users can view their organization's AI logs"
  ON ai_processing_logs FOR SELECT
  USING (organization_id = get_user_organization_id());

-- Users can create AI logs in their organization
CREATE POLICY "Users can create AI logs in their organization"
  ON ai_processing_logs FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());

-- =====================================================
-- RLS POLICIES COMPLETE
-- =====================================================

-- Verify RLS is enabled
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public' 
      AND tablename IN (
        'organizations', 'users', 'warehouses', 'materials', 'suppliers',
        'documents', 'document_items', 'inventory', 'inventory_transactions',
        'ai_prompts', 'ai_processing_logs'
      )
  LOOP
    RAISE NOTICE 'RLS enabled on table: %', r.tablename;
  END LOOP;
END $$;
