-- =====================================================
-- Migration: Row Level Security (RLS) Policies
-- Description: Security policies for multi-tenant data isolation
-- =====================================================

-- =====================================================
-- ENABLE RLS ON ALL TABLES
-- =====================================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_processing_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- HELPER FUNCTION: Get User's Organization ID
-- =====================================================

CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS UUID AS $$
BEGIN
    RETURN (SELECT organization_id FROM users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ORGANIZATIONS POLICIES
-- =====================================================

-- Users can view all organizations (required for onboarding and selection)
DROP POLICY IF EXISTS "Users can view own organization" ON organizations;
CREATE POLICY "Users can view organizations"
    ON organizations FOR SELECT
    TO authenticated
    USING (true);

-- Users can update their own organization
CREATE POLICY "Users can update own organization"
    ON organizations FOR UPDATE
    USING (id = get_user_organization_id());

-- Allow authenticated users to create a new organization (for onboarding)
DROP POLICY IF EXISTS "Authenticated users can create organization" ON organizations;
CREATE POLICY "Authenticated users can create organization"
    ON organizations FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- =====================================================
-- USERS POLICIES
-- =====================================================

-- Users can view their own profile (required for onboarding)
DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile"
    ON users FOR SELECT
    TO authenticated
    USING (id = auth.uid());

-- Users can view others in their organization
DROP POLICY IF EXISTS "Users can view own organization users" ON users;
CREATE POLICY "Users can view organization members"
    ON users FOR SELECT
    USING (organization_id = get_user_organization_id());

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON users FOR UPDATE
    USING (id = auth.uid());

-- Users can insert their own profile (for onboarding)
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
CREATE POLICY "Users can insert own profile"
    ON users FOR INSERT
    TO authenticated
    WITH CHECK (id = auth.uid());

-- =====================================================
-- WAREHOUSES POLICIES
-- =====================================================

CREATE POLICY "Users can view own organization warehouses"
    ON warehouses FOR SELECT
    USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can insert own organization warehouses"
    ON warehouses FOR INSERT
    WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Users can update own organization warehouses"
    ON warehouses FOR UPDATE
    USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can delete own organization warehouses"
    ON warehouses FOR DELETE
    USING (organization_id = get_user_organization_id());

-- =====================================================
-- SUPPLIERS POLICIES
-- =====================================================

CREATE POLICY "Users can view own organization suppliers"
    ON suppliers FOR SELECT
    USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can insert own organization suppliers"
    ON suppliers FOR INSERT
    WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Users can update own organization suppliers"
    ON suppliers FOR UPDATE
    USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can delete own organization suppliers"
    ON suppliers FOR DELETE
    USING (organization_id = get_user_organization_id());

-- =====================================================
-- MATERIALS POLICIES
-- =====================================================

CREATE POLICY "Users can view own organization materials"
    ON materials FOR SELECT
    USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can insert own organization materials"
    ON materials FOR INSERT
    WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Users can update own organization materials"
    ON materials FOR UPDATE
    USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can delete own organization materials"
    ON materials FOR DELETE
    USING (organization_id = get_user_organization_id());

-- =====================================================
-- DOCUMENTS POLICIES
-- =====================================================

CREATE POLICY "Users can view own organization documents"
    ON documents FOR SELECT
    USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can insert own organization documents"
    ON documents FOR INSERT
    WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Users can update own organization documents"
    ON documents FOR UPDATE
    USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can delete own organization documents"
    ON documents FOR DELETE
    USING (organization_id = get_user_organization_id());

-- =====================================================
-- DOCUMENT ITEMS POLICIES
-- =====================================================

CREATE POLICY "Users can view own organization document items"
    ON document_items FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM documents d 
        WHERE d.id = document_items.document_id 
        AND d.organization_id = get_user_organization_id()
    ));

CREATE POLICY "Users can insert own organization document items"
    ON document_items FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM documents d 
        WHERE d.id = document_items.document_id 
        AND d.organization_id = get_user_organization_id()
    ));

CREATE POLICY "Users can update own organization document items"
    ON document_items FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM documents d 
        WHERE d.id = document_items.document_id 
        AND d.organization_id = get_user_organization_id()
    ));

CREATE POLICY "Users can delete own organization document items"
    ON document_items FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM documents d 
        WHERE d.id = document_items.document_id 
        AND d.organization_id = get_user_organization_id()
    ));

-- =====================================================
-- INVENTORY POLICIES
-- =====================================================

CREATE POLICY "Users can view own organization inventory"
    ON inventory FOR SELECT
    USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can insert own organization inventory"
    ON inventory FOR INSERT
    WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Users can update own organization inventory"
    ON inventory FOR UPDATE
    USING (organization_id = get_user_organization_id());

-- =====================================================
-- INVENTORY TRANSACTIONS POLICIES
-- =====================================================

CREATE POLICY "Users can view own organization transactions"
    ON inventory_transactions FOR SELECT
    USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can insert own organization transactions"
    ON inventory_transactions FOR INSERT
    WITH CHECK (organization_id = get_user_organization_id());

-- =====================================================
-- AI PROMPTS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view system and own organization prompts" ON ai_prompts;
CREATE POLICY "Users can view system and own organization prompts"
    ON ai_prompts FOR SELECT
    USING (
        is_system_default = true 
        OR organization_id = get_user_organization_id()
    );

CREATE POLICY "Users can insert own organization prompts"
    ON ai_prompts FOR INSERT
    WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Users can update own organization prompts"
    ON ai_prompts FOR UPDATE
    USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can delete own organization prompts"
    ON ai_prompts FOR DELETE
    USING (organization_id = get_user_organization_id());

-- =====================================================
-- AI PROCESSING LOGS POLICIES
-- =====================================================

CREATE POLICY "Users can view own organization AI logs"
    ON ai_processing_logs FOR SELECT
    USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can insert own organization AI logs"
    ON ai_processing_logs FOR INSERT
    WITH CHECK (organization_id = get_user_organization_id());
