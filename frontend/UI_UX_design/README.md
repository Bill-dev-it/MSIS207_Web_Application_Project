# AeroRUL — UI/UX Design System & Specification

Tài liệu thiết kế giao diện người dùng (UI) và trải nghiệm người dùng (UX) cho sàn thương mại điện tử B2B dự đoán Remaining Useful Life (RUL) phụ tùng & động cơ hàng không — **AeroRUL Marketplace**.

---

## 1. Tổng quan tài liệu thiết kế

| File / Thư mục | Mô tả |
|---|---|
| `AeroRUL_UI_UX_All_Screens.pdf` | Toàn bộ bản thiết kế giao diện dạng slide/PDF chất lượng cao cho tất cả các luồng người dùng. |
| `UI_UX_Frontend_Structure_RUL_Aviation_Marketplace_V2.docx` | Tài liệu đặc tả kiến trúc UI/UX, Sitemap, cấu trúc layout và các trường dữ liệu chi tiết. |
| `AI_RUL_B2B_Aviation_Ecommerce_Project_Concept_VI_RUL_Replacement_V3.docx` | Tài liệu ý tưởng dự án, logic tích hợp mô hình RUL AI vào hệ thống B2B. |
| `AeroRUL_Stitch_Prompts.md` | Hệ thống prompt và guideline thiết kế giao diện chi tiết. |
| `screens/` | Bộ ảnh chụp màn hình (PNG) của toàn bộ 45+ giao diện trong hệ thống. |

---

## 2. Hệ thống phân quyền người dùng (Role-based Layouts)

Hệ thống được thiết kế theo 4 phân hệ người dùng chính:

### 2.1. Public (Khách vãng lai & Đăng nhập)
- **Trang chủ (`04_Home.png`)**: Giới thiệu nền tảng, các động cơ/phụ tùng nổi bật, tích hợp công nghệ RUL AI.
- **Sàn giao dịch (`05_Marketplace.png`)**: Bộ lọc đa chiều (loại động cơ CFM56, GE90, Trent, trạng thái RUL, nhà cung cấp, chứng chỉ FAA/EASA).
- **Chi tiết sản phẩm (`06_ProductDetail.png`)**: Thông số kỹ thuật, số giờ bay (Cycles/Hours), giấy tờ kiểm định và lịch sử bảo dưỡng.
- **Xác thực (`03_Login.png`, `24_Register.png`)**: Đăng nhập đa vai trò, đăng ký tài khoản doanh nghiệp.

### 2.2. Buyer — Hãng hàng không / Đơn vị bảo dưỡng (Airlines / MRO)
- **Buyer Dashboard (`11_BuyerDashboard.png`)**: Tổng quan sức khỏe đội bay (Fleet health), cảnh báo động cơ có RUL nguy cấp.
- **Quản lý động cơ (`21_MyEngines.png`, `22_EngineDetail.png`)**: Danh sách động cơ đang theo dõi, biểu đồ RUL trend suy giảm theo thời gian.
- **Phân tích RUL (`23_RULAnalysis.png`)**: Phân tích chi tiết cảm biến (áp suất, nhiệt độ, độ rung) và dự báo chu kỳ bảo trì tối ưu.
- **Gợi ý phụ tùng thay thế (`25_Recommendations.png`)**: Hệ thống AI tự động đề xuất phụ tùng/động cơ tương thích sẵn có trên sàn.
- **Giỏ hàng & Đặt hàng (`07_Cart.png` - `10_Checkout.png`)**: Luồng checkout 4 bước chuẩn B2B (Địa chỉ giao hàng → Phương thức vận chuyển → Điều khoản thanh toán → Xác nhận).

### 2.3. Supplier — Nhà cung cấp / OEM / Đại lý phụ tùng
- **Supplier Dashboard (`31_SupplierDashboard.png`)**: Thống kê doanh thu, số đơn đặt hàng mới, phụ tùng tồn kho.
- **Quản lý sản phẩm & Kho (`32_SupplierProducts.png`)**: Đăng bán phụ tùng mới, đính kèm chứng nhận FAA Part 145 / EASA Form 1.
- **Quản lý đơn hàng (`33_SupplierOrders.png`)**: Cập nhật trạng thái xử lý đơn hàng, vận chuyển logistics hàng không.

### 2.4. Admin — Quản trị viên hệ thống sàn
- **Admin Dashboard (`41_AdminDashboard.png`)**: Giám sát giao dịch toàn sàn, cảnh báo hệ thống RUL inference.
- **Kiểm duyệt nhà cung cấp & Sản phẩm (`15_AdminModeration.png`)**: Duyệt hồ sơ pháp lý đối tác và niêm yết sản phẩm.
- **Báo cáo & Cài đặt (`43_AdminReports.png`, `45_AdminSettings.png`)**: Thống kê doanh số, cấu hình tham số hệ thống.

---

## 3. Quy chuẩn Design Tokens & Typography

- **Màu sắc chủ đạo (Primary)**: Deep Navy Blue (`#0F172A`, `#1E293B`) kết hợp Sky Blue (`#0284C7`) thể hiện tính chuyên nghiệp, công nghiệp hàng không.
- **Màu cảnh báo RUL (Severity Levels)**:
  - 🟢 **Bình thường (RUL > 60 ngày)**: Emerald Green (`#10B981`)
  - 🟡 **Cần lưu ý (30 < RUL ≤ 60 ngày)**: Amber (`#F59E0B`)
  - 🔴 **Nguy cấp (RUL ≤ 30 ngày)**: Crimson Red (`#EF4444`)
- **Typography**: Inter / Roboto font sans-serif, tối ưu hiển thị số liệu kỹ thuật và bảng dữ liệu lớn.
