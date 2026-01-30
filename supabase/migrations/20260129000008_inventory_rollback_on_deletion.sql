-- =====================================================
-- Migration: Inventory Rollback on Deletion
-- Description: Reverses inventory changes and removes transactions when a document is deleted
-- =====================================================

-- 1. ENHANCED ROLLBACK & CLEANUP FUNCTION
CREATE OR REPLACE FUNCTION master_inventory_rollback_v1()
RETURNS TRIGGER AS $$
DECLARE
    item RECORD;
BEGIN
    -- STEP A: Rollback Inventory (Only for COMPLETED documents)
    IF OLD.status = 'completed' THEN
        FOR item IN 
            SELECT di.*, dt.type as doc_trans_type
            FROM document_items di
            JOIN document_types dt ON dt.id = OLD.document_type_id
            WHERE di.document_id = OLD.id
        LOOP
            -- Logic: Undo the previous sync operation
            
            -- Phiếu Nhập (IN) hoặc Trả hàng (RETURN) -> Trừ lại số lượng trong kho
            IF item.doc_trans_type = 'IN' OR item.doc_trans_type = 'RETURN' THEN
                UPDATE inventory 
                SET quantity = inventory.quantity - item.quantity, last_updated = NOW()
                WHERE warehouse_id = OLD.destination_warehouse_id AND material_id = item.material_id;
                
            -- Phiếu Xuất (OUT) -> Cộng lại số lượng trong kho
            ELSIF item.doc_trans_type = 'OUT' THEN
                UPDATE inventory 
                SET quantity = inventory.quantity + item.quantity, last_updated = NOW()
                WHERE warehouse_id = OLD.source_warehouse_id AND material_id = item.material_id;
                
            -- Phiếu Điều chuyển (TRANSFER) -> Hoàn trả kho nguồn, thu hồi kho đích
            ELSIF item.doc_trans_type = 'TRANSFER' THEN
                -- Kho nguồn: cộng lại
                UPDATE inventory 
                SET quantity = inventory.quantity + item.quantity, last_updated = NOW()
                WHERE warehouse_id = OLD.source_warehouse_id AND material_id = item.material_id;
                -- Kho đích: trừ đi
                UPDATE inventory 
                SET quantity = inventory.quantity - item.quantity, last_updated = NOW()
                WHERE warehouse_id = OLD.destination_warehouse_id AND material_id = item.material_id;
            END IF;
        END LOOP;
    END IF;

    -- STEP B: EXPLICIT CLEANUP (Force delete children if CASCADE is slow or missing)
    -- This ensures "Dữ liệu vật tư trong phiếu" is wiped out completely.
    DELETE FROM inventory_transactions WHERE document_id = OLD.id;
    DELETE FROM document_items WHERE document_id = OLD.id;
    DELETE FROM ai_processing_logs WHERE document_id = OLD.id;

    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- 2. RE-CREATE TRIGGER
DROP TRIGGER IF EXISTS trg_inventory_rollback_on_deletion ON documents;
CREATE TRIGGER trg_inventory_rollback_on_deletion
BEFORE DELETE ON documents
FOR EACH ROW EXECUTE FUNCTION master_inventory_rollback_v1();

-- 3. ENSURE ALL COMPONENT CONSTRAINTS HAVE CASCADE
-- This is a safety net for direct table manipulation

-- fkey: inventory_transactions -> documents
ALTER TABLE inventory_transactions DROP CONSTRAINT IF EXISTS inventory_transactions_document_id_fkey;
ALTER TABLE inventory_transactions ADD CONSTRAINT inventory_transactions_document_id_fkey 
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE;

-- fkey: inventory_transactions -> document_items
ALTER TABLE inventory_transactions DROP CONSTRAINT IF EXISTS inventory_transactions_document_item_id_fkey;
ALTER TABLE inventory_transactions ADD CONSTRAINT inventory_transactions_document_item_id_fkey 
    FOREIGN KEY (document_item_id) REFERENCES document_items(id) ON DELETE CASCADE;

-- fkey: document_items -> documents
ALTER TABLE document_items DROP CONSTRAINT IF EXISTS document_items_document_id_fkey;
ALTER TABLE document_items ADD CONSTRAINT document_items_document_id_fkey 
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE;

-- fkey: ai_processing_logs -> documents
ALTER TABLE ai_processing_logs DROP CONSTRAINT IF EXISTS ai_processing_logs_document_id_fkey;
ALTER TABLE ai_processing_logs ADD CONSTRAINT ai_processing_logs_document_id_fkey 
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE;
