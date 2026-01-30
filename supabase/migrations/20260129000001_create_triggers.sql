-- =====================================================
-- Migration: Database Triggers
-- Description: Auto-update triggers and inventory management
-- =====================================================

-- =====================================================
-- 1. AUTO-UPDATE TIMESTAMPS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_warehouses_updated_at BEFORE UPDATE ON warehouses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_materials_updated_at BEFORE UPDATE ON materials
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_document_items_updated_at BEFORE UPDATE ON document_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_prompts_updated_at BEFORE UPDATE ON ai_prompts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 2. AUTO-GENERATE MATERIAL CODE
-- =====================================================

CREATE OR REPLACE FUNCTION generate_material_code()
RETURNS TRIGGER AS $$
BEGIN
    -- Generate code from name + unit (e.g., "Xi măng PCB40_Bao")
    IF NEW.code IS NULL OR NEW.code = '' THEN
        NEW.code := UPPER(REGEXP_REPLACE(NEW.name || '_' || NEW.unit, '[^a-zA-Z0-9_]', '', 'g'));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_generate_material_code BEFORE INSERT ON materials
    FOR EACH ROW EXECUTE FUNCTION generate_material_code();

-- =====================================================
-- 3. AUTO-UPDATE INVENTORY ON DOCUMENT COMPLETION
-- =====================================================

CREATE OR REPLACE FUNCTION update_inventory_on_document_complete()
RETURNS TRIGGER AS $$
DECLARE
    item RECORD;
    warehouse_id_to_update UUID;
    transaction_type_value VARCHAR(20);
BEGIN
    -- Only process when status changes to 'completed'
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        
        -- Loop through all document items
        FOR item IN 
            SELECT di.*, dt.type as doc_type
            FROM document_items di
            JOIN documents d ON d.id = di.document_id
            JOIN document_types dt ON dt.id = d.document_type_id
            WHERE di.document_id = NEW.id
        LOOP
            -- Determine warehouse and transaction type based on document type
            IF item.doc_type = 'IN' THEN
                warehouse_id_to_update := NEW.destination_warehouse_id;
                transaction_type_value := 'IN';
                
                -- Update or insert inventory (increase)
                INSERT INTO inventory (organization_id, warehouse_id, material_id, quantity, unit, last_updated)
                VALUES (NEW.organization_id, warehouse_id_to_update, item.material_id, item.quantity, item.unit, NOW())
                ON CONFLICT (warehouse_id, material_id)
                DO UPDATE SET 
                    quantity = inventory.quantity + item.quantity,
                    last_updated = NOW();
                    
            ELSIF item.doc_type = 'OUT' THEN
                warehouse_id_to_update := NEW.source_warehouse_id;
                transaction_type_value := 'OUT';
                
                -- Update inventory (decrease)
                INSERT INTO inventory (organization_id, warehouse_id, material_id, quantity, unit, last_updated)
                VALUES (NEW.organization_id, warehouse_id_to_update, item.material_id, -item.quantity, item.unit, NOW())
                ON CONFLICT (warehouse_id, material_id)
                DO UPDATE SET 
                    quantity = inventory.quantity - item.quantity,
                    last_updated = NOW();
                    
            ELSIF item.doc_type = 'TRANSFER' THEN
                -- Decrease from source
                INSERT INTO inventory (organization_id, warehouse_id, material_id, quantity, unit, last_updated)
                VALUES (NEW.organization_id, NEW.source_warehouse_id, item.material_id, -item.quantity, item.unit, NOW())
                ON CONFLICT (warehouse_id, material_id)
                DO UPDATE SET 
                    quantity = inventory.quantity - item.quantity,
                    last_updated = NOW();
                
                -- Increase to destination
                INSERT INTO inventory (organization_id, warehouse_id, material_id, quantity, unit, last_updated)
                VALUES (NEW.organization_id, NEW.destination_warehouse_id, item.material_id, item.quantity, item.unit, NOW())
                ON CONFLICT (warehouse_id, material_id)
                DO UPDATE SET 
                    quantity = inventory.quantity + item.quantity,
                    last_updated = NOW();
                    
                -- Create two transactions
                INSERT INTO inventory_transactions (
                    organization_id, warehouse_id, material_id, document_id, document_item_id,
                    transaction_type, quantity, unit, balance_after, transaction_date
                )
                SELECT 
                    NEW.organization_id,
                    NEW.source_warehouse_id,
                    item.material_id,
                    NEW.id,
                    item.id,
                    'TRANSFER_OUT',
                    -item.quantity,
                    item.unit,
                    i.quantity,
                    NOW()
                FROM inventory i
                WHERE i.warehouse_id = NEW.source_warehouse_id AND i.material_id = item.material_id;
                
                INSERT INTO inventory_transactions (
                    organization_id, warehouse_id, material_id, document_id, document_item_id,
                    transaction_type, quantity, unit, balance_after, transaction_date
                )
                SELECT 
                    NEW.organization_id,
                    NEW.destination_warehouse_id,
                    item.material_id,
                    NEW.id,
                    item.id,
                    'TRANSFER_IN',
                    item.quantity,
                    item.unit,
                    i.quantity,
                    NOW()
                FROM inventory i
                WHERE i.warehouse_id = NEW.destination_warehouse_id AND i.material_id = item.material_id;
                
                CONTINUE; -- Skip the single transaction insert below
            END IF;
            
            -- Create inventory transaction record (for IN/OUT)
            IF item.doc_type IN ('IN', 'OUT') THEN
                INSERT INTO inventory_transactions (
                    organization_id, warehouse_id, material_id, document_id, document_item_id,
                    transaction_type, quantity, unit, balance_after, transaction_date
                )
                SELECT 
                    NEW.organization_id,
                    warehouse_id_to_update,
                    item.material_id,
                    NEW.id,
                    item.id,
                    transaction_type_value,
                    CASE WHEN item.doc_type = 'IN' THEN item.quantity ELSE -item.quantity END,
                    item.unit,
                    i.quantity,
                    NOW()
                FROM inventory i
                WHERE i.warehouse_id = warehouse_id_to_update AND i.material_id = item.material_id;
            END IF;
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_inventory_on_complete
    AFTER UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION update_inventory_on_document_complete();

-- =====================================================
-- 4. AUTO-CREATE USER PROFILE ON AUTH SIGNUP
-- =====================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    org_id UUID;
BEGIN
    -- Create a default organization for the user if none exists
    -- In production, you might want to assign users to existing orgs
    INSERT INTO organizations (name)
    VALUES (COALESCE(NEW.raw_user_meta_data->>'organization_name', 'My Organization'))
    RETURNING id INTO org_id;
    
    -- Create user profile
    INSERT INTO users (id, organization_id, full_name, email, avatar_url)
    VALUES (
        NEW.id,
        org_id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'User'),
        NEW.email,
        NEW.raw_user_meta_data->>'avatar_url'
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users table
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();
