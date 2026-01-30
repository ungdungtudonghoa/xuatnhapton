-- =====================================================
-- TRIGGERS & FUNCTIONS
-- Created: 2026-01-28
-- Description: Auto-update triggers for inventory management
-- =====================================================

-- =====================================================
-- FUNCTION: Auto-generate material code
-- =====================================================
CREATE OR REPLACE FUNCTION generate_material_code()
RETURNS TRIGGER AS $$
BEGIN
  -- Generate code from name + unit
  -- Remove special characters, keep alphanumeric and underscore
  -- Convert to uppercase
  -- Limit to 255 characters
  NEW.code := UPPER(
    SUBSTRING(
      REGEXP_REPLACE(
        CONCAT(
          SUBSTRING(NEW.name, 1, 200),
          '_',
          NEW.unit
        ),
        '[^A-Za-z0-9_]',
        '',
        'g'
      ),
      1,
      255
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-generate material code on INSERT/UPDATE
CREATE TRIGGER trg_generate_material_code
BEFORE INSERT OR UPDATE ON materials
FOR EACH ROW
EXECUTE FUNCTION generate_material_code();

COMMENT ON FUNCTION generate_material_code IS 'Auto-generates material code from name + unit';

-- =====================================================
-- FUNCTION: Update updated_at timestamp
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at column
CREATE TRIGGER trg_organizations_updated_at
BEFORE UPDATE ON organizations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_warehouses_updated_at
BEFORE UPDATE ON warehouses
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_materials_updated_at
BEFORE UPDATE ON materials
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_suppliers_updated_at
BEFORE UPDATE ON suppliers
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_documents_updated_at
BEFORE UPDATE ON documents
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_document_items_updated_at
BEFORE UPDATE ON document_items
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_ai_prompts_updated_at
BEFORE UPDATE ON ai_prompts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

COMMENT ON FUNCTION update_updated_at_column IS 'Auto-updates updated_at timestamp on row modification';

-- =====================================================
-- FUNCTION: Auto-create material from document item
-- =====================================================
CREATE OR REPLACE FUNCTION auto_create_material(
  p_organization_id UUID,
  p_material_name VARCHAR(500),
  p_unit VARCHAR(50)
)
RETURNS UUID AS $$
DECLARE
  v_material_id UUID;
  v_material_code VARCHAR(255);
BEGIN
  -- Generate material code
  v_material_code := UPPER(
    SUBSTRING(
      REGEXP_REPLACE(
        CONCAT(
          SUBSTRING(p_material_name, 1, 200),
          '_',
          p_unit
        ),
        '[^A-Za-z0-9_]',
        '',
        'g'
      ),
      1,
      255
    )
  );
  
  -- Try to find existing material
  SELECT id INTO v_material_id
  FROM materials
  WHERE organization_id = p_organization_id
    AND code = v_material_code;
  
  -- If not found, create new material
  IF v_material_id IS NULL THEN
    INSERT INTO materials (organization_id, name, unit, code)
    VALUES (p_organization_id, p_material_name, p_unit, v_material_code)
    RETURNING id INTO v_material_id;
  END IF;
  
  RETURN v_material_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION auto_create_material IS 'Auto-creates material if not exists, returns material_id';

-- =====================================================
-- FUNCTION: Update inventory on document completion
-- =====================================================
CREATE OR REPLACE FUNCTION update_inventory_on_document()
RETURNS TRIGGER AS $$
DECLARE
  v_doc_type_code VARCHAR(50);
  v_trans_type VARCHAR(20);
  v_item RECORD;
  v_material_id UUID;
  v_qty_before DECIMAL(15,3);
  v_qty_after DECIMAL(15,3);
BEGIN
  -- Only process when status changes to 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    
    -- Get document type info
    SELECT dt.code, dt.transaction_type INTO v_doc_type_code, v_trans_type
    FROM document_types dt
    WHERE dt.id = NEW.document_type_id;
    
    -- Process each document item
    FOR v_item IN 
      SELECT * FROM document_items WHERE document_id = NEW.id
    LOOP
      -- Ensure material exists
      IF v_item.material_id IS NULL THEN
        -- Auto-create material
        v_material_id := auto_create_material(
          NEW.organization_id,
          v_item.material_name,
          v_item.unit
        );
        
        -- Update document_item with material_id
        UPDATE document_items 
        SET material_id = v_material_id 
        WHERE id = v_item.id;
      ELSE
        v_material_id := v_item.material_id;
      END IF;
      
      -- Get current quantity before transaction
      SELECT COALESCE(quantity, 0) INTO v_qty_before
      FROM inventory
      WHERE organization_id = NEW.organization_id
        AND warehouse_id = NEW.warehouse_id
        AND material_id = v_material_id;
      
      -- Update inventory based on transaction type
      IF v_trans_type = 'IN' THEN
        -- INCREASE inventory (nhập kho)
        INSERT INTO inventory (organization_id, warehouse_id, material_id, quantity, unit, last_updated)
        VALUES (NEW.organization_id, NEW.warehouse_id, v_material_id, v_item.quantity, v_item.unit, NOW())
        ON CONFLICT (organization_id, warehouse_id, material_id) 
        DO UPDATE SET 
          quantity = inventory.quantity + EXCLUDED.quantity,
          last_updated = NOW();
        
        -- Calculate quantity after
        v_qty_after := COALESCE(v_qty_before, 0) + v_item.quantity;
        
        -- Log transaction
        INSERT INTO inventory_transactions (
          organization_id, document_id, document_item_id, warehouse_id, material_id,
          transaction_type, quantity, unit, quantity_before, quantity_after,
          unit_price, total_value, transaction_date
        ) VALUES (
          NEW.organization_id, NEW.id, v_item.id, NEW.warehouse_id, v_material_id,
          'IN', v_item.quantity, v_item.unit, v_qty_before, v_qty_after,
          v_item.unit_price, v_item.total_price, NEW.document_date
        );
        
      ELSIF v_trans_type = 'OUT' THEN
        -- DECREASE inventory (xuất kho)
        INSERT INTO inventory (organization_id, warehouse_id, material_id, quantity, unit, last_updated)
        VALUES (NEW.organization_id, NEW.warehouse_id, v_material_id, -v_item.quantity, v_item.unit, NOW())
        ON CONFLICT (organization_id, warehouse_id, material_id) 
        DO UPDATE SET 
          quantity = inventory.quantity - v_item.quantity,
          last_updated = NOW();
        
        -- Calculate quantity after
        v_qty_after := COALESCE(v_qty_before, 0) - v_item.quantity;
        
        -- Log transaction
        INSERT INTO inventory_transactions (
          organization_id, document_id, document_item_id, warehouse_id, material_id,
          transaction_type, quantity, unit, quantity_before, quantity_after,
          unit_price, total_value, transaction_date
        ) VALUES (
          NEW.organization_id, NEW.id, v_item.id, NEW.warehouse_id, v_material_id,
          'OUT', v_item.quantity, v_item.unit, v_qty_before, v_qty_after,
          v_item.unit_price, v_item.total_price, NEW.document_date
        );
        
      ELSIF v_trans_type = 'TRANSFER' THEN
        -- TRANSFER between warehouses
        
        -- Get quantity before at source warehouse
        SELECT COALESCE(quantity, 0) INTO v_qty_before
        FROM inventory
        WHERE organization_id = NEW.organization_id
          AND warehouse_id = NEW.warehouse_id
          AND material_id = v_material_id;
        
        -- Decrease from source warehouse
        UPDATE inventory 
        SET quantity = quantity - v_item.quantity, last_updated = NOW()
        WHERE organization_id = NEW.organization_id 
          AND warehouse_id = NEW.warehouse_id 
          AND material_id = v_material_id;
        
        v_qty_after := v_qty_before - v_item.quantity;
        
        -- Log TRANSFER_OUT
        INSERT INTO inventory_transactions (
          organization_id, document_id, document_item_id, warehouse_id, material_id,
          transaction_type, quantity, unit, quantity_before, quantity_after,
          transaction_date
        ) VALUES (
          NEW.organization_id, NEW.id, v_item.id, NEW.warehouse_id, v_material_id,
          'TRANSFER_OUT', v_item.quantity, v_item.unit, v_qty_before, v_qty_after,
          NEW.document_date
        );
        
        -- Get quantity before at destination warehouse
        SELECT COALESCE(quantity, 0) INTO v_qty_before
        FROM inventory
        WHERE organization_id = NEW.organization_id
          AND warehouse_id = NEW.warehouse_destination_id
          AND material_id = v_material_id;
        
        -- Increase to destination warehouse
        INSERT INTO inventory (organization_id, warehouse_id, material_id, quantity, unit, last_updated)
        VALUES (NEW.organization_id, NEW.warehouse_destination_id, v_material_id, v_item.quantity, v_item.unit, NOW())
        ON CONFLICT (organization_id, warehouse_id, material_id) 
        DO UPDATE SET 
          quantity = inventory.quantity + EXCLUDED.quantity,
          last_updated = NOW();
        
        v_qty_after := COALESCE(v_qty_before, 0) + v_item.quantity;
        
        -- Log TRANSFER_IN
        INSERT INTO inventory_transactions (
          organization_id, document_id, document_item_id, warehouse_id, material_id,
          transaction_type, quantity, unit, quantity_before, quantity_after,
          transaction_date
        ) VALUES (
          NEW.organization_id, NEW.id, v_item.id, NEW.warehouse_destination_id, v_material_id,
          'TRANSFER_IN', v_item.quantity, v_item.unit, v_qty_before, v_qty_after,
          NEW.document_date
        );
      END IF;
    END LOOP;
    
    -- Update completed_at timestamp
    NEW.completed_at := NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update inventory when document is completed
CREATE TRIGGER trg_update_inventory
BEFORE UPDATE ON documents
FOR EACH ROW
EXECUTE FUNCTION update_inventory_on_document();

COMMENT ON FUNCTION update_inventory_on_document IS 'Auto-updates inventory when document status changes to completed';

-- =====================================================
-- FUNCTION: Validate warehouse for transfer documents
-- =====================================================
CREATE OR REPLACE FUNCTION validate_transfer_warehouses()
RETURNS TRIGGER AS $$
DECLARE
  v_trans_type VARCHAR(20);
BEGIN
  -- Get transaction type
  SELECT transaction_type INTO v_trans_type
  FROM document_types
  WHERE id = NEW.document_type_id;
  
  -- For TRANSFER documents, both warehouses must be specified and different
  IF v_trans_type = 'TRANSFER' THEN
    IF NEW.warehouse_id IS NULL OR NEW.warehouse_destination_id IS NULL THEN
      RAISE EXCEPTION 'Both source and destination warehouses must be specified for transfer documents';
    END IF;
    
    IF NEW.warehouse_id = NEW.warehouse_destination_id THEN
      RAISE EXCEPTION 'Source and destination warehouses must be different';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Validate transfer warehouses
CREATE TRIGGER trg_validate_transfer_warehouses
BEFORE INSERT OR UPDATE ON documents
FOR EACH ROW
EXECUTE FUNCTION validate_transfer_warehouses();

COMMENT ON FUNCTION validate_transfer_warehouses IS 'Validates that transfer documents have valid source and destination warehouses';

-- =====================================================
-- TRIGGERS COMPLETE
-- =====================================================
