-- =====================================================
-- DEFINITIVE MASTER SYNC V3: Resolving Schema, Trigger & Column Conflicts
-- Description: Standardizes names and REPLACES ALL LEGACY TRIGGERS
-- =====================================================

DO $$ 
BEGIN 
    -- 1. DROP ALL POTENTIAL LEGACY TRIGGERS (Cleanup)
    DROP TRIGGER IF EXISTS trg_update_inventory ON documents;
    DROP TRIGGER IF EXISTS trigger_update_inventory_on_complete ON documents;
    DROP TRIGGER IF EXISTS master_inventory_sync_trigger ON documents;
    DROP TRIGGER IF EXISTS master_inventory_sync_v2 ON documents;
    DROP TRIGGER IF EXISTS trg_validate_transfer_warehouses ON documents;
    DROP TRIGGER IF EXISTS trg_documents_updated_at ON documents;
    DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;
    DROP TRIGGER IF EXISTS trg_document_items_updated_at ON document_items;
    DROP TRIGGER IF EXISTS update_document_items_updated_at ON document_items;
    DROP TRIGGER IF EXISTS trg_generate_material_code ON materials;
    DROP TRIGGER IF EXISTS auto_generate_material_code ON materials;
    DROP TRIGGER IF EXISTS trg_materials_updated_at ON materials;
    DROP TRIGGER IF EXISTS update_materials_updated_at ON materials;
    DROP TRIGGER IF EXISTS trg_organizations_updated_at ON organizations;
    DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
    DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
    DROP TRIGGER IF EXISTS update_users_updated_at ON users;
    DROP TRIGGER IF EXISTS trg_warehouses_updated_at ON warehouses;
    DROP TRIGGER IF EXISTS update_warehouses_updated_at ON warehouses;
    DROP TRIGGER IF EXISTS trg_suppliers_updated_at ON suppliers;
    DROP TRIGGER IF EXISTS update_suppliers_updated_at ON suppliers;
    DROP TRIGGER IF EXISTS trg_ai_prompts_updated_at ON ai_prompts;
    DROP TRIGGER IF EXISTS update_ai_prompts_updated_at ON ai_prompts;
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

    -- 2. STANDARDIZE COLUMNS
    -- document_types: transaction_type -> type
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='document_types' AND column_name='transaction_type') THEN
        ALTER TABLE document_types RENAME COLUMN transaction_type TO type;
    END IF;

    -- inventory_transactions: transaction_type -> type
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='inventory_transactions' AND column_name='transaction_type') THEN
        ALTER TABLE inventory_transactions RENAME COLUMN transaction_type TO type;
    END IF;

    -- inventory_transactions: quantity_after -> balance_after
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='inventory_transactions' AND column_name='quantity_after') THEN
        ALTER TABLE inventory_transactions RENAME COLUMN quantity_after TO balance_after;
    END IF;

    -- documents: warehouse naming
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='documents' AND column_name='warehouse_id') THEN
        ALTER TABLE documents RENAME COLUMN warehouse_id TO destination_warehouse_id; 
    END IF;

    -- document_items: material_name NOT NULL fix (January 28th conflict)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='document_items' AND column_name='material_name') THEN
        ALTER TABLE document_items ALTER COLUMN material_name DROP NOT NULL;
    END IF;

    -- 3. REMOVE ORGANIZATION_ID (Global Mode)
    ALTER TABLE users DROP COLUMN IF EXISTS organization_id CASCADE;
    ALTER TABLE warehouses DROP COLUMN IF EXISTS organization_id CASCADE;
    ALTER TABLE suppliers DROP COLUMN IF EXISTS organization_id CASCADE;
    ALTER TABLE materials DROP COLUMN IF EXISTS organization_id CASCADE;
    ALTER TABLE documents DROP COLUMN IF EXISTS organization_id CASCADE;
    ALTER TABLE inventory DROP COLUMN IF EXISTS organization_id CASCADE;
    ALTER TABLE inventory_transactions DROP COLUMN IF EXISTS organization_id CASCADE;
    ALTER TABLE ai_prompts DROP COLUMN IF EXISTS organization_id CASCADE;
    ALTER TABLE ai_processing_logs DROP COLUMN IF EXISTS organization_id CASCADE;
    DROP TABLE IF EXISTS organizations CASCADE;

END $$;

-- 4. RE-INSERT CORE DATA
TRUNCATE TABLE document_types CASCADE;
INSERT INTO document_types (code, name, type) VALUES
('PN', 'Phiếu Nhập Kho', 'IN'),
('PX', 'Phiếu Xuất Kho', 'OUT'),
('PDC', 'Phiếu Điều Chuyển', 'TRANSFER'),
('PTH', 'Phiếu Trả Hàng', 'RETURN');

-- 5. FINAL MASTER INVENTORY TRIGGER (Optimized)
CREATE OR REPLACE FUNCTION master_inventory_sync_v3()
RETURNS TRIGGER AS $$
DECLARE
    item RECORD;
BEGIN
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        FOR item IN 
            SELECT di.*, dt.type as doc_trans_type
            FROM document_items di
            JOIN documents d ON d.id = di.document_id
            JOIN document_types dt ON dt.id = d.document_type_id
            WHERE di.document_id = NEW.id
        LOOP
            -- Nhập kho (IN)
            IF item.doc_trans_type = 'IN' THEN
                INSERT INTO inventory (warehouse_id, material_id, quantity, unit, last_updated)
                VALUES (NEW.destination_warehouse_id, item.material_id, item.quantity, item.unit, NOW())
                ON CONFLICT (warehouse_id, material_id)
                DO UPDATE SET quantity = inventory.quantity + item.quantity, last_updated = NOW();
                
            -- Xuất kho (OUT)
            ELSIF item.doc_trans_type = 'OUT' THEN
                INSERT INTO inventory (warehouse_id, material_id, quantity, unit, last_updated)
                VALUES (NEW.source_warehouse_id, item.material_id, -item.quantity, item.unit, NOW())
                ON CONFLICT (warehouse_id, material_id)
                DO UPDATE SET quantity = inventory.quantity - item.quantity, last_updated = NOW();
            END IF;
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER master_inventory_sync_v3
AFTER UPDATE ON documents
FOR EACH ROW EXECUTE FUNCTION master_inventory_sync_v3();

-- 6. RLS RESET
DO $$ 
DECLARE
    t text;
BEGIN
    FOR t IN (SELECT table_name FROM information_schema.tables WHERE table_schema = 'public') LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
        EXECUTE format('DROP POLICY IF EXISTS "Auth Access" ON %I', t);
        EXECUTE format('CREATE POLICY "Auth Access" ON %I FOR ALL TO authenticated USING (true) WITH CHECK (true)', t);
    END LOOP;
END $$;
