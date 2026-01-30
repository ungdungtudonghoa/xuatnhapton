-- =====================================================
-- Migration: Simplify Schema (Remove Organizations)
-- Description: Transition to single-tenant global system
-- =====================================================

-- 1. DROP RLS POLICIES (to re-apply simplified ones later)
DROP POLICY IF EXISTS "Users can view organizations" ON organizations;
DROP POLICY IF EXISTS "Authenticated users can create organization" ON organizations;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can view system and own organization prompts" ON ai_prompts;

-- 2. DROP FOREIGN KEYS & COLUMNS
ALTER TABLE users DROP COLUMN IF EXISTS organization_id CASCADE;
ALTER TABLE warehouses DROP COLUMN IF EXISTS organization_id CASCADE;
ALTER TABLE suppliers DROP COLUMN IF EXISTS organization_id CASCADE;
ALTER TABLE materials DROP COLUMN IF EXISTS organization_id CASCADE;
ALTER TABLE documents DROP COLUMN IF EXISTS organization_id CASCADE;
ALTER TABLE inventory DROP COLUMN IF EXISTS organization_id CASCADE;
ALTER TABLE inventory_transactions DROP COLUMN IF EXISTS organization_id CASCADE;
ALTER TABLE ai_prompts DROP COLUMN IF EXISTS organization_id CASCADE;
ALTER TABLE ai_processing_logs DROP COLUMN IF EXISTS organization_id CASCADE;

-- 3. DROP ORGANIZATIONS TABLE
DROP TABLE IF EXISTS organizations CASCADE;

-- 4. FIX UNIQUE CONSTRAINTS
ALTER TABLE warehouses DROP CONSTRAINT IF EXISTS warehouses_organization_id_code_key;
ALTER TABLE warehouses ADD CONSTRAINT warehouses_code_key UNIQUE (code);

ALTER TABLE suppliers DROP CONSTRAINT IF EXISTS suppliers_organization_id_code_key;
ALTER TABLE suppliers ADD CONSTRAINT suppliers_code_key UNIQUE (code);

ALTER TABLE materials DROP CONSTRAINT IF EXISTS materials_organization_id_code_key;
ALTER TABLE materials ADD CONSTRAINT materials_code_key UNIQUE (code);

ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_organization_id_document_number_key;
ALTER TABLE documents ADD CONSTRAINT documents_document_number_key UNIQUE (document_number);

-- 5. ENSURE DOCUMENT TYPES
INSERT INTO document_types (code, name, type)
VALUES 
    ('PN', 'Phiếu Nhập Kho', 'IN'),
    ('PX', 'Phiếu Xuất Kho', 'OUT')
ON CONFLICT (code) DO UPDATE SET 
    name = EXCLUDED.name,
    type = EXCLUDED.type;

-- 6. SIMPLIFIED RLS POLICIES (Allow all authenticated users)
-- All tables: Fully open to authenticated users
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read" ON users;
CREATE POLICY "Public Read" ON users FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Self Update" ON users;
CREATE POLICY "Self Update" ON users FOR UPDATE TO authenticated USING (id = auth.uid());
DROP POLICY IF EXISTS "Self Insert" ON users;
CREATE POLICY "Self Insert" ON users FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

-- All other tables: Fully open to authenticated users
ALTER TABLE warehouses DISABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers DISABLE ROW LEVEL SECURITY;
ALTER TABLE materials DISABLE ROW LEVEL SECURITY;
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE document_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventory DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE ai_prompts DISABLE ROW LEVEL SECURITY;
ALTER TABLE ai_processing_logs DISABLE ROW LEVEL SECURITY;

-- re-enable and add basic policies
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth Access" ON warehouses FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth Access" ON suppliers FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth Access" ON materials FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth Access" ON documents FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE document_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth Access" ON document_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth Access" ON inventory FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth Access" ON inventory_transactions FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE ai_prompts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth Access" ON ai_prompts FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE ai_processing_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth Access" ON ai_processing_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);
