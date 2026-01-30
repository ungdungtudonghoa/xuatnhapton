-- =====================================================
-- Migration: Fix Inventory Transaction History
-- Description: Updates trigger to record transactions and backfills history
-- =====================================================

-- 1. UPDATE MASTER SYNC TRIGGER TO RECORD TRANSACTIONS
CREATE OR REPLACE FUNCTION master_inventory_sync_v3()
RETURNS TRIGGER AS $$
DECLARE
    item RECORD;
    warehouse_id UUID;
    v_type VARCHAR(20);
BEGIN
    -- Only process when document is marked as 'completed'
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        FOR item IN 
            SELECT di.*, dt.type as doc_trans_type, dt.name as doc_type_name
            FROM document_items di
            JOIN documents d ON d.id = di.document_id
            JOIN document_types dt ON dt.id = d.document_type_id
            WHERE di.document_id = NEW.id
        LOOP
            -- Determine warehouse and type
            IF item.doc_trans_type = 'IN' THEN
                warehouse_id := NEW.destination_warehouse_id;
                v_type := 'IN';
            ELSIF item.doc_trans_type = 'OUT' THEN
                warehouse_id := NEW.source_warehouse_id;
                v_type := 'OUT';
            ELSIF item.doc_trans_type = 'TRANSFER' THEN
                -- Handle Transfer: OUT from source, IN to destination
                -- (Implementation for Transfer can be added if needed, 
                -- for now focusing on primary IN/OUT movements)
            END IF;

            IF warehouse_id IS NOT NULL THEN
                -- A. Update Inventory (Current Stock)
                INSERT INTO inventory (warehouse_id, material_id, quantity, unit, last_updated)
                VALUES (warehouse_id, item.material_id, 
                    CASE WHEN v_type = 'IN' THEN item.quantity ELSE -item.quantity END, 
                    item.unit, NOW()
                )
                ON CONFLICT (warehouse_id, material_id)
                DO UPDATE SET 
                    quantity = inventory.quantity + (CASE WHEN v_type = 'IN' THEN item.quantity ELSE -item.quantity END),
                    last_updated = NOW();

                -- B. Record Transaction History
                INSERT INTO inventory_transactions (
                    warehouse_id, 
                    material_id, 
                    document_id, 
                    document_item_id, 
                    type, 
                    quantity, 
                    unit,
                    created_at
                ) VALUES (
                    warehouse_id,
                    item.material_id,
                    NEW.id,
                    item.id,
                    v_type,
                    item.quantity,
                    item.unit,
                    NEW.created_at -- Use document creation time for history consistency
                );
            END IF;
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. BACKFILL HISTORY FOR EXISTING COMPLETED DOCUMENTS
DO $$
DECLARE
    doc RECORD;
    item RECORD;
    warehouse_id UUID;
    v_type VARCHAR(20);
BEGIN
    -- Clear existing transactions to avoid duplicates during backfill
    TRUNCATE TABLE inventory_transactions;

    FOR doc IN SELECT * FROM documents WHERE status = 'completed' LOOP
        FOR item IN 
            SELECT di.*, dt.type as doc_trans_type
            FROM document_items di
            JOIN documents d ON d.id = di.document_id
            JOIN document_types dt ON dt.id = d.document_type_id
            WHERE di.document_id = doc.id
        LOOP
             IF item.doc_trans_type = 'IN' THEN
                warehouse_id := doc.destination_warehouse_id;
                v_type := 'IN';
            ELSIF item.doc_trans_type = 'OUT' THEN
                warehouse_id := doc.source_warehouse_id;
                v_type := 'OUT';
            END IF;

            IF warehouse_id IS NOT NULL THEN
                INSERT INTO inventory_transactions (
                    warehouse_id, material_id, document_id, document_item_id, 
                    type, quantity, unit, created_at
                ) VALUES (
                    warehouse_id, item.material_id, doc.id, item.id,
                    v_type, item.quantity, item.unit, doc.created_at
                );
            END IF;
        END LOOP;
    END LOOP;
END $$;
