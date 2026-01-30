-- =====================================================
-- PHIẾU XUẤT NHẬP KHO - INITIAL SCHEMA
-- Created: 2026-01-28
-- Description: Complete database schema for warehouse management system
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLE: organizations (Multi-tenant support)
-- =====================================================
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  tax_code VARCHAR(50),
  address TEXT,
  phone VARCHAR(20),
  email VARCHAR(255),
  logo_url TEXT,
  
  -- Settings stored as JSONB for flexibility
  settings JSONB DEFAULT '{}',
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_active ON organizations(is_active);

-- Comments
COMMENT ON TABLE organizations IS 'Multi-tenant organizations (companies)';
COMMENT ON COLUMN organizations.settings IS 'JSON settings: {currency, timezone, language, etc}';

-- =====================================================
-- TABLE: users (Extends Supabase Auth)
-- =====================================================
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  avatar_url TEXT,
  
  -- Role-based access control
  role VARCHAR(50) DEFAULT 'user', -- admin, manager, user, viewer
  
  -- AI Settings (per user)
  gemini_api_key_encrypted TEXT,
  preferred_prompt_id UUID,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_organization ON users(organization_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active ON users(is_active);

-- Comments
COMMENT ON TABLE users IS 'User profiles extending Supabase Auth';
COMMENT ON COLUMN users.gemini_api_key_encrypted IS 'Encrypted Gemini API key for AI processing';

-- =====================================================
-- TABLE: warehouses
-- =====================================================
CREATE TABLE warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  code VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  manager_name VARCHAR(255),
  phone VARCHAR(20),
  
  -- Status
  status VARCHAR(20) DEFAULT 'active', -- active, inactive
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(organization_id, code)
);

-- Indexes
CREATE INDEX idx_warehouses_org ON warehouses(organization_id);
CREATE INDEX idx_warehouses_status ON warehouses(status);

-- Comments
COMMENT ON TABLE warehouses IS 'Warehouse master data';

-- =====================================================
-- TABLE: materials
-- =====================================================
CREATE TABLE materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Auto-generated code from name + unit
  code VARCHAR(255) NOT NULL,
  name VARCHAR(500) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  
  description TEXT,
  category VARCHAR(100),
  specifications TEXT,
  
  -- Status
  status VARCHAR(20) DEFAULT 'active', -- active, inactive
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(organization_id, code)
);

-- Indexes
CREATE INDEX idx_materials_org ON materials(organization_id);
CREATE INDEX idx_materials_code ON materials(organization_id, code);
CREATE INDEX idx_materials_name ON materials(name);
CREATE INDEX idx_materials_category ON materials(category);
CREATE INDEX idx_materials_status ON materials(status);

-- Comments
COMMENT ON TABLE materials IS 'Material/Product master data';
COMMENT ON COLUMN materials.code IS 'Auto-generated from name + unit (e.g., ONG_7_PVC_DEKKO_D60_MET)';

-- =====================================================
-- TABLE: suppliers
-- =====================================================
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  code VARCHAR(50),
  name VARCHAR(255) NOT NULL,
  address TEXT,
  tax_code VARCHAR(50),
  phone VARCHAR(20),
  email VARCHAR(255),
  contact_person VARCHAR(255),
  
  -- Status
  status VARCHAR(20) DEFAULT 'active', -- active, inactive
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(organization_id, code)
);

-- Indexes
CREATE INDEX idx_suppliers_org ON suppliers(organization_id);
CREATE INDEX idx_suppliers_name ON suppliers(name);
CREATE INDEX idx_suppliers_status ON suppliers(status);

-- Comments
COMMENT ON TABLE suppliers IS 'Supplier/Customer master data';

-- =====================================================
-- TABLE: document_types
-- =====================================================
CREATE TABLE document_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Transaction type affects inventory
  transaction_type VARCHAR(20) NOT NULL, -- IN, OUT, TRANSFER
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_document_types_code ON document_types(code);

-- Comments
COMMENT ON TABLE document_types IS 'Document type definitions';
COMMENT ON COLUMN document_types.transaction_type IS 'IN=increase inventory, OUT=decrease, TRANSFER=move between warehouses';

-- =====================================================
-- TABLE: documents (Main transaction table)
-- =====================================================
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Document info
  document_number VARCHAR(100) NOT NULL,
  document_type_id UUID NOT NULL REFERENCES document_types(id),
  document_date DATE NOT NULL,
  
  -- Warehouse info
  warehouse_id UUID REFERENCES warehouses(id),
  warehouse_destination_id UUID REFERENCES warehouses(id), -- For transfers only
  
  -- Supplier/Customer info
  supplier_id UUID REFERENCES suppliers(id),
  supplier_name VARCHAR(255),
  supplier_address TEXT,
  supplier_phone VARCHAR(20),
  
  -- Delivery info
  delivery_person VARCHAR(255),
  delivery_address TEXT,
  delivery_phone VARCHAR(20),
  recipient_name VARCHAR(255),
  recipient_unit VARCHAR(255),
  
  -- Reference documents
  reference_number VARCHAR(100),
  reference_date DATE,
  invoice_number VARCHAR(100),
  invoice_date DATE,
  
  -- Reason & Notes
  reason TEXT,
  notes TEXT,
  
  -- Signatures
  requester_name VARCHAR(255),
  warehouse_keeper_name VARCHAR(255),
  accountant_name VARCHAR(255),
  director_name VARCHAR(255),
  handover_person_name VARCHAR(255),
  recipient_signature_name VARCHAR(255),
  
  -- Status
  status VARCHAR(50) DEFAULT 'completed', -- draft, completed, cancelled
  
  -- AI Processing metadata
  ai_processed BOOLEAN DEFAULT FALSE,
  ai_confidence_score DECIMAL(5,2),
  ai_model VARCHAR(100),
  ai_extracted_data JSONB,
  original_image_urls TEXT[],
  
  -- Audit trail
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Constraints
  UNIQUE(organization_id, document_number)
);

-- Indexes
CREATE INDEX idx_documents_org ON documents(organization_id);
CREATE INDEX idx_documents_number ON documents(document_number);
CREATE INDEX idx_documents_date ON documents(document_date);
CREATE INDEX idx_documents_type ON documents(document_type_id);
CREATE INDEX idx_documents_warehouse ON documents(warehouse_id);
CREATE INDEX idx_documents_supplier ON documents(supplier_id);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_created_by ON documents(created_by);

-- Comments
COMMENT ON TABLE documents IS 'Document headers for all transactions (nhập/xuất/điều chuyển)';
COMMENT ON COLUMN documents.ai_extracted_data IS 'Raw JSON data extracted by AI';
COMMENT ON COLUMN documents.original_image_urls IS 'Array of uploaded image URLs';

-- =====================================================
-- TABLE: document_items (Line items)
-- =====================================================
CREATE TABLE document_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  
  -- Material info
  material_id UUID REFERENCES materials(id),
  material_code VARCHAR(255),
  material_name VARCHAR(500) NOT NULL,
  material_specifications TEXT,
  
  -- Quantity
  quantity DECIMAL(15,3) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  
  -- Price (optional)
  unit_price DECIMAL(15,2),
  total_price DECIMAL(15,2),
  
  -- Additional info
  warehouse_location VARCHAR(100),
  batch_number VARCHAR(100),
  expiry_date DATE,
  notes TEXT,
  
  -- Line number for ordering
  line_number INTEGER,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_document_items_doc ON document_items(document_id);
CREATE INDEX idx_document_items_material ON document_items(material_id);
CREATE INDEX idx_document_items_line ON document_items(document_id, line_number);

-- Comments
COMMENT ON TABLE document_items IS 'Line items for each document';
COMMENT ON COLUMN document_items.material_id IS 'NULL if material not yet created, will be auto-created on document completion';

-- =====================================================
-- TABLE: inventory (Current stock levels)
-- =====================================================
CREATE TABLE inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  
  -- Stock quantity
  quantity DECIMAL(15,3) DEFAULT 0,
  unit VARCHAR(50),
  
  -- Stock value
  total_value DECIMAL(15,2) DEFAULT 0,
  average_price DECIMAL(15,2) DEFAULT 0,
  
  -- Stock alerts
  minimum_stock DECIMAL(15,3),
  maximum_stock DECIMAL(15,3),
  
  -- Last update
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(organization_id, warehouse_id, material_id)
);

-- Indexes
CREATE INDEX idx_inventory_org ON inventory(organization_id);
CREATE INDEX idx_inventory_warehouse ON inventory(warehouse_id);
CREATE INDEX idx_inventory_material ON inventory(material_id);
CREATE INDEX idx_inventory_low_stock ON inventory(quantity) WHERE quantity <= minimum_stock;

-- Comments
COMMENT ON TABLE inventory IS 'Current inventory levels by warehouse and material';
COMMENT ON COLUMN inventory.quantity IS 'Current stock quantity (auto-updated by triggers)';

-- =====================================================
-- TABLE: inventory_transactions (Audit trail)
-- =====================================================
CREATE TABLE inventory_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Reference to source document
  document_id UUID REFERENCES documents(id),
  document_item_id UUID REFERENCES document_items(id),
  
  -- Transaction details
  warehouse_id UUID NOT NULL REFERENCES warehouses(id),
  material_id UUID NOT NULL REFERENCES materials(id),
  
  -- Transaction type
  transaction_type VARCHAR(50) NOT NULL, -- IN, OUT, TRANSFER_IN, TRANSFER_OUT, ADJUSTMENT
  
  -- Quantity change
  quantity DECIMAL(15,3) NOT NULL,
  unit VARCHAR(50),
  
  -- Balance tracking
  quantity_before DECIMAL(15,3),
  quantity_after DECIMAL(15,3),
  
  -- Value
  unit_price DECIMAL(15,2),
  total_value DECIMAL(15,2),
  
  -- Transaction timestamp
  transaction_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_inv_trans_org ON inventory_transactions(organization_id);
CREATE INDEX idx_inv_trans_warehouse ON inventory_transactions(warehouse_id);
CREATE INDEX idx_inv_trans_material ON inventory_transactions(material_id);
CREATE INDEX idx_inv_trans_date ON inventory_transactions(transaction_date);
CREATE INDEX idx_inv_trans_doc ON inventory_transactions(document_id);
CREATE INDEX idx_inv_trans_type ON inventory_transactions(transaction_type);

-- Comments
COMMENT ON TABLE inventory_transactions IS 'Complete audit trail of all inventory movements';
COMMENT ON COLUMN inventory_transactions.transaction_type IS 'IN, OUT, TRANSFER_IN, TRANSFER_OUT, ADJUSTMENT';

-- =====================================================
-- TABLE: ai_prompts (Customizable AI prompts)
-- =====================================================
CREATE TABLE ai_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Optional: specific to document type
  document_type_id UUID REFERENCES document_types(id),
  
  -- The actual prompt template
  prompt_template TEXT NOT NULL,
  
  -- Flags
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  is_system BOOLEAN DEFAULT FALSE, -- System prompts cannot be deleted
  
  -- Audit
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_prompts_org ON ai_prompts(organization_id);
CREATE INDEX idx_prompts_type ON ai_prompts(document_type_id);
CREATE INDEX idx_prompts_default ON ai_prompts(is_default) WHERE is_default = TRUE;
CREATE INDEX idx_prompts_active ON ai_prompts(is_active);

-- Comments
COMMENT ON TABLE ai_prompts IS 'Customizable AI prompt templates';
COMMENT ON COLUMN ai_prompts.is_system IS 'System prompts are read-only for users';

-- =====================================================
-- TABLE: ai_processing_logs (AI processing audit)
-- =====================================================
CREATE TABLE ai_processing_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- References
  document_id UUID REFERENCES documents(id),
  user_id UUID REFERENCES users(id),
  
  -- AI details
  ai_model VARCHAR(100),
  prompt_id UUID REFERENCES ai_prompts(id),
  prompt_used TEXT,
  
  -- Input
  image_urls TEXT[],
  
  -- Output
  raw_response JSONB,
  extracted_data JSONB,
  
  -- Metrics
  confidence_score DECIMAL(5,2),
  processing_time_ms INTEGER,
  
  -- Status
  status VARCHAR(50), -- success, failed, partial
  error_message TEXT,
  
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_ai_logs_org ON ai_processing_logs(organization_id);
CREATE INDEX idx_ai_logs_doc ON ai_processing_logs(document_id);
CREATE INDEX idx_ai_logs_user ON ai_processing_logs(user_id);
CREATE INDEX idx_ai_logs_status ON ai_processing_logs(status);
CREATE INDEX idx_ai_logs_created ON ai_processing_logs(created_at);

-- Comments
COMMENT ON TABLE ai_processing_logs IS 'Complete audit trail of AI processing requests';
COMMENT ON COLUMN ai_processing_logs.raw_response IS 'Raw JSON response from AI model';
COMMENT ON COLUMN ai_processing_logs.extracted_data IS 'Parsed and structured data';

-- =====================================================
-- INITIAL SCHEMA COMPLETE
-- =====================================================
