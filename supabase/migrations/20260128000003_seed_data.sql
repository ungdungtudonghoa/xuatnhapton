-- =====================================================
-- SEED DATA
-- Created: 2026-01-28
-- Description: Initial data for document types and system prompts
-- =====================================================

-- =====================================================
-- SEED: document_types
-- =====================================================
INSERT INTO document_types (code, name, description, transaction_type) VALUES
  ('NHAP_KHO', 'Phiếu Nhập Kho', 'Phiếu nhập hàng vào kho từ nhà cung cấp', 'IN'),
  ('XUAT_KHO', 'Phiếu Xuất Kho', 'Phiếu xuất hàng ra khỏi kho', 'OUT'),
  ('GIAO_HANG', 'Phiếu Giao Hàng', 'Phiếu giao hàng cho khách hàng', 'OUT'),
  ('DIEU_CHUYEN', 'Phiếu Điều Chuyển Kho', 'Phiếu điều chuyển hàng giữa các kho', 'TRANSFER'),
  ('TRA_HANG', 'Phiếu Trả Hàng', 'Phiếu trả hàng về kho', 'IN'),
  ('YEU_CAU_NHAP_XUAT', 'Yêu Cầu Nhập Xuất Kho', 'Phiếu yêu cầu nhập hoặc xuất kho', 'OUT')
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- SEED: ai_prompts (System prompts)
-- =====================================================

-- Default system prompt for all document types
INSERT INTO ai_prompts (
  organization_id,
  name,
  description,
  document_type_id,
  prompt_template,
  is_default,
  is_active,
  is_system
) VALUES (
  NULL,
  'Default Document Extraction Prompt',
  'Prompt mặc định cho việc trích xuất dữ liệu từ phiếu nhập xuất kho',
  NULL,
  'Bạn là một AI chuyên gia phân tích phiếu nhập xuất kho của doanh nghiệp Việt Nam.

Nhiệm vụ của bạn:
1. Phân tích ảnh phiếu được cung cấp
2. Xác định loại phiếu (Nhập kho, Xuất kho, Giao hàng, Điều chuyển, Trả hàng)
3. Trích xuất CHÍNH XÁC tất cả thông tin
4. Trả về dữ liệu dưới dạng JSON chuẩn

QUY TẮC QUAN TRỌNG:
- Đọc kỹ TỪNG dòng vật tư, không bỏ sót
- Tên vật tư thường dài và có ký tự đặc biệt, phải ghi chép CHÍNH XÁC 100%
- Số lượng có thể là số thập phân (ví dụ: 10.5)
- Nếu không thấy thông tin, để giá trị null
- Confidence score từ 0-1, phản ánh độ chắc chắn

ĐỊNH DẠNG JSON TRẢ VỀ:
{
  "document_type": "NHAP_KHO | XUAT_KHO | GIAO_HANG | DIEU_CHUYEN | TRA_HANG | YEU_CAU_NHAP_XUAT",
  "document_number": "Số phiếu",
  "document_date": "YYYY-MM-DD",
  "warehouse": {
    "code": "Mã kho",
    "name": "Tên kho"
  },
  "warehouse_destination": {
    "code": "Mã kho đích (nếu là điều chuyển)",
    "name": "Tên kho đích"
  },
  "supplier": {
    "name": "Tên nhà cung cấp/khách hàng",
    "address": "Địa chỉ",
    "phone": "Số điện thoại",
    "tax_code": "Mã số thuế"
  },
  "delivery_info": {
    "person": "Người giao hàng",
    "address": "Địa chỉ giao hàng",
    "phone": "Số điện thoại",
    "recipient_name": "Người nhận hàng",
    "recipient_unit": "Đơn vị nhận"
  },
  "reference": {
    "number": "Số tham chiếu/PO/Lý do xuất",
    "date": "YYYY-MM-DD",
    "invoice_number": "Số hóa đơn",
    "invoice_date": "YYYY-MM-DD"
  },
  "reason": "Lý do xuất/nhập kho",
  "items": [
    {
      "line_number": 1,
      "material_name": "Tên vật tư ĐẦY ĐỦ, CHÍNH XÁC",
      "specifications": "Thông số kỹ thuật (nếu có)",
      "quantity": 10.5,
      "unit": "ĐVT (MÉT, Cái, Bộ, Kg, ...)",
      "unit_price": 0,
      "total_price": 0,
      "notes": "Ghi chú (nếu có)"
    }
  ],
  "signatures": {
    "requester": "Người lập phiếu",
    "handover_person": "Bàn giao",
    "warehouse_keeper": "Thủ kho",
    "recipient": "Người nhận hàng",
    "accountant": "Kế toán",
    "director": "Giám đốc/Thủ trưởng đơn vị"
  },
  "notes": "Ghi chú chung của phiếu",
  "confidence_score": 0.95
}

LƯU Ý ĐẶC BIỆT:
- Với các phiếu XUẤT KHO hoặc GIAO HÀNG: Tập trung vào thông tin người nhận, địa chỉ giao hàng
- Với các phiếu NHẬP KHO: Tập trung vào thông tin nhà cung cấp, số hóa đơn
- Với các phiếu ĐIỀU CHUYỂN: Phải có cả kho nguồn và kho đích
- Tên vật tư có thể rất dài (>100 ký tự), đừng cắt ngắn
- Đơn vị tính viết HOA (MÉT, CÁI, BỘ, KG)

Hãy trả về CHÍNH XÁC JSON như định dạng trên, không thêm text giải thích.',
  TRUE,
  TRUE,
  TRUE
);

-- Specific prompt for NHAP_KHO
INSERT INTO ai_prompts (
  organization_id,
  name,
  description,
  document_type_id,
  prompt_template,
  is_default,
  is_active,
  is_system
) VALUES (
  NULL,
  'Nhập Kho - Detailed Extraction',
  'Prompt chuyên biệt cho phiếu nhập kho, tập trung vào thông tin nhà cung cấp và giá trị',
  (SELECT id FROM document_types WHERE code = 'NHAP_KHO'),
  'Phân tích PHIẾU NHẬP KHO và trích xuất thông tin.

Tập trung đặc biệt vào:
- Thông tin nhà cung cấp (tên, địa chỉ, MST, điện thoại)
- Số hóa đơn và ngày hóa đơn
- Giá trị hàng hóa (đơn giá, thành tiền)
- Thông tin kho nhận hàng

Trả về JSON theo format chuẩn với đầy đủ thông tin giá trị.',
  FALSE,
  TRUE,
  TRUE
);

-- Specific prompt for XUAT_KHO / GIAO_HANG
INSERT INTO ai_prompts (
  organization_id,
  name,
  description,
  document_type_id,
  prompt_template,
  is_default,
  is_active,
  is_system
) VALUES (
  NULL,
  'Xuất Kho / Giao Hàng - Detailed Extraction',
  'Prompt chuyên biệt cho phiếu xuất kho và giao hàng',
  (SELECT id FROM document_types WHERE code = 'XUAT_KHO'),
  'Phân tích PHIẾU XUẤT KHO / GIAO HÀNG và trích xuất thông tin.

Tập trung đặc biệt vào:
- Thông tin người nhận hàng (tên, đơn vị, địa chỉ)
- Địa chỉ giao hàng chi tiết
- Lý do xuất kho
- Danh sách vật tư xuất (tên, số lượng, đơn vị)
- Người giao hàng, thủ kho

Trả về JSON theo format chuẩn.',
  FALSE,
  TRUE,
  TRUE
);

-- Specific prompt for DIEU_CHUYEN
INSERT INTO ai_prompts (
  organization_id,
  name,
  description,
  document_type_id,
  prompt_template,
  is_default,
  is_active,
  is_system
) VALUES (
  NULL,
  'Điều Chuyển Kho - Detailed Extraction',
  'Prompt chuyên biệt cho phiếu điều chuyển kho',
  (SELECT id FROM document_types WHERE code = 'DIEU_CHUYEN'),
  'Phân tích PHIẾU ĐIỀU CHUYỂN KHO và trích xuất thông tin.

Tập trung đặc biệt vào:
- Kho nguồn (warehouse)
- Kho đích (warehouse_destination)
- Lý do điều chuyển
- Danh sách vật tư điều chuyển

LƯU Ý: Phải có đầy đủ thông tin cả 2 kho (nguồn và đích).

Trả về JSON theo format chuẩn.',
  FALSE,
  TRUE,
  TRUE
);

-- =====================================================
-- SEED DATA COMPLETE
-- =====================================================

-- Display summary
DO $$
DECLARE
  v_doc_types_count INTEGER;
  v_prompts_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_doc_types_count FROM document_types;
  SELECT COUNT(*) INTO v_prompts_count FROM ai_prompts WHERE is_system = TRUE;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'SEED DATA SUMMARY';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Document Types: %', v_doc_types_count;
  RAISE NOTICE 'System Prompts: %', v_prompts_count;
  RAISE NOTICE '========================================';
END $$;
