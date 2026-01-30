-- =====================================================
-- Migration: Seed Data
-- Description: Initial data for document types and default prompts
-- =====================================================

-- =====================================================
-- 1. DOCUMENT TYPES
-- =====================================================

INSERT INTO document_types (code, name, description, type) VALUES
('PN', 'Phiếu Nhập Kho', 'Phiếu nhập vật tư, hàng hóa vào kho', 'IN'),
('PX', 'Phiếu Xuất Kho', 'Phiếu xuất vật tư, hàng hóa ra khỏi kho', 'OUT'),
('PDC', 'Phiếu Điều Chuyển', 'Phiếu điều chuyển vật tư giữa các kho', 'TRANSFER'),
('PTH', 'Phiếu Trả Hàng', 'Phiếu trả hàng cho nhà cung cấp', 'RETURN');

-- =====================================================
-- 2. DEFAULT AI PROMPTS
-- =====================================================

-- Prompt for Phiếu Nhập Kho (IN)
INSERT INTO ai_prompts (document_type_id, name, prompt_text, is_system_default, is_active) 
SELECT 
    id,
    'Default Prompt - Phiếu Nhập Kho',
    'Bạn là một AI chuyên trích xuất dữ liệu từ phiếu nhập kho. Hãy phân tích ảnh phiếu nhập kho và trích xuất thông tin sau dưới dạng JSON:

{
  "document_number": "Số phiếu (ví dụ: PN-001)",
  "document_date": "Ngày phiếu (format: YYYY-MM-DD)",
  "warehouse": {
    "name": "Tên kho nhập",
    "code": "Mã kho (nếu có)"
  },
  "supplier": {
    "name": "Tên nhà cung cấp",
    "address": "Địa chỉ nhà cung cấp",
    "phone": "Số điện thoại"
  },
  "delivery": {
    "person": "Người giao hàng",
    "date": "Ngày giao (format: YYYY-MM-DD)",
    "vehicle": "Số xe (nếu có)"
  },
  "items": [
    {
      "name": "Tên vật tư",
      "quantity": số lượng (number),
      "unit": "Đơn vị tính (kg, thùng, cái, ...)",
      "notes": "Ghi chú (nếu có)"
    }
  ],
  "notes": "Ghi chú chung của phiếu",
  "confidence": điểm tin cậy từ 0-100
}

Lưu ý:
- Trích xuất chính xác số liệu
- Nếu không tìm thấy thông tin, để null
- Đảm bảo định dạng ngày đúng
- Confidence score phản ánh độ chắc chắn của bạn',
    true,
    true
FROM document_types WHERE code = 'PN';

-- Prompt for Phiếu Xuất Kho (OUT)
INSERT INTO ai_prompts (document_type_id, name, prompt_text, is_system_default, is_active)
SELECT 
    id,
    'Default Prompt - Phiếu Xuất Kho',
    'Bạn là một AI chuyên trích xuất dữ liệu từ phiếu xuất kho. Hãy phân tích ảnh phiếu xuất kho và trích xuất thông tin sau dưới dạng JSON:

{
  "document_number": "Số phiếu (ví dụ: PX-001)",
  "document_date": "Ngày phiếu (format: YYYY-MM-DD)",
  "warehouse": {
    "name": "Tên kho xuất",
    "code": "Mã kho (nếu có)"
  },
  "recipient": {
    "name": "Tên người/đơn vị nhận",
    "address": "Địa chỉ",
    "phone": "Số điện thoại"
  },
  "delivery": {
    "person": "Người nhận hàng",
    "date": "Ngày xuất (format: YYYY-MM-DD)",
    "vehicle": "Số xe (nếu có)"
  },
  "items": [
    {
      "name": "Tên vật tư",
      "quantity": số lượng (number),
      "unit": "Đơn vị tính (kg, thùng, cái, ...)",
      "notes": "Ghi chú (nếu có)"
    }
  ],
  "notes": "Ghi chú chung của phiếu",
  "confidence": điểm tin cậy từ 0-100
}

Lưu ý:
- Trích xuất chính xác số liệu
- Nếu không tìm thấy thông tin, để null
- Đảm bảo định dạng ngày đúng
- Confidence score phản ánh độ chắc chắn của bạn',
    true,
    true
FROM document_types WHERE code = 'PX';

-- Prompt for Phiếu Điều Chuyển (TRANSFER)
INSERT INTO ai_prompts (document_type_id, name, prompt_text, is_system_default, is_active)
SELECT 
    id,
    'Default Prompt - Phiếu Điều Chuyển',
    'Bạn là một AI chuyên trích xuất dữ liệu từ phiếu điều chuyển kho. Hãy phân tích ảnh phiếu điều chuyển và trích xuất thông tin sau dưới dạng JSON:

{
  "document_number": "Số phiếu (ví dụ: PDC-001)",
  "document_date": "Ngày phiếu (format: YYYY-MM-DD)",
  "source_warehouse": {
    "name": "Tên kho xuất",
    "code": "Mã kho xuất"
  },
  "destination_warehouse": {
    "name": "Tên kho nhập",
    "code": "Mã kho nhập"
  },
  "delivery": {
    "person": "Người vận chuyển",
    "date": "Ngày điều chuyển (format: YYYY-MM-DD)",
    "vehicle": "Số xe"
  },
  "items": [
    {
      "name": "Tên vật tư",
      "quantity": số lượng (number),
      "unit": "Đơn vị tính (kg, thùng, cái, ...)",
      "notes": "Ghi chú (nếu có)"
    }
  ],
  "notes": "Ghi chú chung của phiếu",
  "confidence": điểm tin cậy từ 0-100
}

Lưu ý:
- Trích xuất chính xác số liệu
- Phân biệt rõ kho xuất và kho nhập
- Nếu không tìm thấy thông tin, để null
- Đảm bảo định dạng ngày đúng
- Confidence score phản ánh độ chắc chắn của bạn',
    true,
    true
FROM document_types WHERE code = 'PDC';
