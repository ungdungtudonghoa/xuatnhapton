-- =====================================================
-- Migration: Initial Database Schema
-- Description: Create all core tables for warehouse management system
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. ORGANIZATIONS TABLE
-- =====================================================
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. USERS TABLE (extends Supabase Auth)
-- =====================================================
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    full_name VARCHAR(255),
    email VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. WAREHOUSES TABLE
-- =====================================================
CREATE TABLE warehouses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    manager_name VARCHAR(255),
    phone VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, code)
);

-- =====================================================
-- 4. SUPPLIERS TABLE
-- =====================================================
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    contact_person VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    tax_code VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, code)
);

-- =====================================================
-- 5. MATERIALS TABLE
-- =====================================================
CREATE TABLE materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    code VARCHAR(100) NOT NULL, -- Auto-generated from name + unit
    name VARCHAR(255) NOT NULL,
    unit VARCHAR(50) NOT NULL, -- ĐVT: kg, thùng, cái, etc.
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, code)
);

-- =====================================================
-- 6. DOCUMENT TYPES TABLE
-- =====================================================
CREATE TABLE document_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    -- Type: IN (nhập), OUT (xuất), TRANSFER (điều chuyển), RETURN (trả hàng)
    type VARCHAR(20) NOT NULL CHECK (type IN ('IN', 'OUT', 'TRANSFER', 'RETURN')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 7. DOCUMENTS TABLE
-- =====================================================
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    document_type_id UUID NOT NULL REFERENCES document_types(id),
    document_number VARCHAR(100) NOT NULL,
    document_date DATE NOT NULL,
    
    -- Warehouse references
    source_warehouse_id UUID REFERENCES warehouses(id), -- For OUT/TRANSFER
    destination_warehouse_id UUID REFERENCES warehouses(id), -- For IN/TRANSFER
    
    -- Supplier/Customer
    supplier_id UUID REFERENCES suppliers(id),
    
    -- Delivery info
    delivery_person VARCHAR(255),
    delivery_date DATE,
    vehicle_number VARCHAR(50),
    
    -- Document images
    image_urls TEXT[], -- Array of image URLs from Supabase Storage
    
    -- AI Processing
    ai_extracted_data JSONB, -- Raw AI extraction result
    ai_confidence_score DECIMAL(5,2), -- 0-100
    
    -- Status: draft, completed, cancelled
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'completed', 'cancelled')),
    
    -- Metadata
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(organization_id, document_number)
);

-- =====================================================
-- 8. DOCUMENT ITEMS TABLE
-- =====================================================
CREATE TABLE document_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    material_id UUID NOT NULL REFERENCES materials(id),
    quantity DECIMAL(15,3) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    notes TEXT,
    line_number INTEGER, -- Order in document
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 9. INVENTORY TABLE (Current Stock)
-- =====================================================
CREATE TABLE inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
    quantity DECIMAL(15,3) DEFAULT 0,
    unit VARCHAR(50) NOT NULL,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(warehouse_id, material_id)
);

-- =====================================================
-- 10. INVENTORY TRANSACTIONS TABLE (History)
-- =====================================================
CREATE TABLE inventory_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    material_id UUID NOT NULL REFERENCES materials(id),
    document_id UUID REFERENCES documents(id),
    document_item_id UUID REFERENCES document_items(id),
    
    -- Transaction type: IN, OUT, TRANSFER_IN, TRANSFER_OUT
    transaction_type VARCHAR(20) NOT NULL,
    
    quantity DECIMAL(15,3) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    
    -- Balance after transaction
    balance_after DECIMAL(15,3),
    
    transaction_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 11. AI PROMPTS TABLE
-- =====================================================
CREATE TABLE ai_prompts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    document_type_id UUID REFERENCES document_types(id),
    name VARCHAR(255) NOT NULL,
    prompt_text TEXT NOT NULL,
    is_system_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    version INTEGER DEFAULT 1,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 12. AI PROCESSING LOGS TABLE
-- =====================================================
CREATE TABLE ai_processing_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    ai_prompt_id UUID REFERENCES ai_prompts(id),
    
    -- Input
    image_urls TEXT[],
    prompt_used TEXT,
    
    -- Output
    raw_response JSONB,
    extracted_data JSONB,
    confidence_score DECIMAL(5,2),
    
    -- Metadata
    processing_time_ms INTEGER,
    status VARCHAR(20) CHECK (status IN ('success', 'error', 'partial')),
    error_message TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES for Performance
-- =====================================================

-- Users
CREATE INDEX idx_users_organization ON users(organization_id);
CREATE INDEX idx_users_email ON users(email);

-- Warehouses
CREATE INDEX idx_warehouses_organization ON warehouses(organization_id);
CREATE INDEX idx_warehouses_code ON warehouses(organization_id, code);

-- Materials
CREATE INDEX idx_materials_organization ON materials(organization_id);
CREATE INDEX idx_materials_code ON materials(organization_id, code);

-- Suppliers
CREATE INDEX idx_suppliers_organization ON suppliers(organization_id);

-- Documents
CREATE INDEX idx_documents_organization ON documents(organization_id);
CREATE INDEX idx_documents_type ON documents(document_type_id);
CREATE INDEX idx_documents_date ON documents(document_date);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_source_warehouse ON documents(source_warehouse_id);
CREATE INDEX idx_documents_dest_warehouse ON documents(destination_warehouse_id);

-- Document Items
CREATE INDEX idx_document_items_document ON document_items(document_id);
CREATE INDEX idx_document_items_material ON document_items(material_id);

-- Inventory
CREATE INDEX idx_inventory_organization ON inventory(organization_id);
CREATE INDEX idx_inventory_warehouse ON inventory(warehouse_id);
CREATE INDEX idx_inventory_material ON inventory(material_id);

-- Inventory Transactions
CREATE INDEX idx_transactions_organization ON inventory_transactions(organization_id);
CREATE INDEX idx_transactions_warehouse ON inventory_transactions(warehouse_id);
CREATE INDEX idx_transactions_material ON inventory_transactions(material_id);
CREATE INDEX idx_transactions_document ON inventory_transactions(document_id);
CREATE INDEX idx_transactions_date ON inventory_transactions(transaction_date);

-- AI Processing Logs
CREATE INDEX idx_ai_logs_organization ON ai_processing_logs(organization_id);
CREATE INDEX idx_ai_logs_document ON ai_processing_logs(document_id);
CREATE INDEX idx_ai_logs_created ON ai_processing_logs(created_at);

-- =====================================================
-- COMMENTS for Documentation
-- =====================================================

COMMENT ON TABLE organizations IS 'Multi-tenant organization data';
COMMENT ON TABLE users IS 'User profiles extending Supabase Auth';
COMMENT ON TABLE warehouses IS 'Warehouse master data';
COMMENT ON TABLE materials IS 'Material/Product master data with auto-generated codes';
COMMENT ON TABLE suppliers IS 'Supplier/Vendor master data';
COMMENT ON TABLE document_types IS 'Document type definitions (IN/OUT/TRANSFER/RETURN)';
COMMENT ON TABLE documents IS 'Document headers for all warehouse transactions';
COMMENT ON TABLE document_items IS 'Line items for each document';
COMMENT ON TABLE inventory IS 'Current stock levels by warehouse and material';
COMMENT ON TABLE inventory_transactions IS 'Complete transaction history';
COMMENT ON TABLE ai_prompts IS 'Customizable AI prompts for document extraction';
COMMENT ON TABLE ai_processing_logs IS 'Audit trail for AI processing';
