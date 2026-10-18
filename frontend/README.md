# Frontend Module — AeroRUL Marketplace

Thư mục này chứa toàn bộ tài nguyên phát triển giao diện người dùng và thiết kế UI/UX cho nền tảng B2B E-Commerce dự đoán RUL phụ tùng & động cơ hàng không (**AeroRUL**).

---

## Cấu trúc thư mục

```
frontend/
├── Frontend_code/       # Mã nguồn ứng dụng Web Frontend (React + Vite + Tailwind CSS)
│   ├── src/             # Mã nguồn giao diện, components, pages, routes, services
│   ├── public/          # Assets tĩnh
│   ├── package.json     # Quản lý dependencies (React 18, React Router, Recharts, Tailwind)
│   ├── vite.config.js   # Cấu hình Vite build tool
│   └── README.md        # Hướng dẫn chạy và cấu trúc chi tiết của mã nguồn Frontend
│
└── UI_UX_design/        # Tài liệu thiết kế giao diện và trải nghiệm người dùng
    ├── screens/         # 25 ảnh chụp màn hình (PNG) và sitemap của hệ thống
    ├── AeroRUL_UI_UX_All_Screens.pdf  # Toàn bộ slide thiết kế dạng PDF
    ├── UI_UX_Frontend_Structure_RUL_Aviation_Marketplace_V2.docx # Tài liệu đặc tả UI/UX
    ├── AI_RUL_B2B_Aviation_Ecommerce_Project_Concept_VI_RUL_Replacement_V3.docx # Concept dự án
    └── README.md        # Hướng dẫn và đặc tả chi tiết về hệ thống UI/UX
```

---

## 1. Khởi chạy mã nguồn (`Frontend_code`)

Để chạy mã nguồn frontend trên môi trường local:

```bash
cd frontend/Frontend_code
npm install
npm run dev
```

Ứng dụng hỗ trợ đăng nhập giả lập cho 3 vai trò:
- **Buyer**: Quản lý động cơ, theo dõi biểu đồ suy giảm RUL, nhận đề xuất thay thế phụ tùng, đặt hàng.
- **Supplier**: Quản lý tồn kho, đăng bán phụ tùng, quản lý đơn hàng.
- **Admin**: Kiểm duyệt nhà cung cấp, kiểm duyệt sản phẩm, thống kê toàn sàn.

---

## 2. Tài liệu thiết kế (`UI_UX_design`)

Xem chi tiết trong thư mục [`UI_UX_design`](./UI_UX_design/README.md) để tra cứu:
- Thiết kế Wireframe & UI High-Fidelity cho tất cả các luồng người dùng (Public, Buyer, Supplier, Admin).
- Chuẩn màu sắc (Design Tokens), hệ thống cảnh báo RUL (Severity Level Indicators).
- Danh mục màn hình hoàn chỉnh dạng PDF và hình ảnh trực quan.