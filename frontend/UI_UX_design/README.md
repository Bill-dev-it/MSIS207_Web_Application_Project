# AeroRUL — UI/UX Design System & Specification

User Interface (UI) and User Experience (UX) design document for the B2B e-commerce platform predicting Remaining Useful Life (RUL) for aviation engine parts & equipment — **AeroRUL Marketplace**.

---

## 1. Design Document Overview

| File / Folder | Description |
|---|---|
| `AeroRUL_UI_UX_All_Screens.pdf` | Complete high-quality UI design presentation/PDF covering all user flows. |
| `UI_UX_Frontend_Structure_RUL_Aviation_Marketplace_V2.docx` | UI/UX architecture specification, sitemap, layout structure, and detailed data field descriptions. |
| `AI_RUL_B2B_Aviation_Ecommerce_Project_Concept_VI_RUL_Replacement_V3.docx` | Project concept document detailing the logic behind integrating the AI RUL model into the B2B system. |
| `AeroRUL_Stitch_Prompts.md` | Comprehensive design prompts and UI design guidelines. |
| `screens/` | Collection of 25 core UI mockups and updated sitemap (`AeroRUL_Sitemap_V3.png`). |

---

## 2. Role-Based Layouts & Access Control

The system is designed around 4 primary user roles:

### 2.1. Public (Visitors & Authentication)
- **Home Page (`04_Home.png`)**: Platform overview, featured engines/components, and RUL AI technology integration.
- **Marketplace (`05_Marketplace.png`)**: Multi-dimensional filtering (engine types such as CFM56, GE90, Trent; RUL status; suppliers; FAA/EASA certifications).
- **Product Detail (`06_ProductDetail.png`)**: Technical specifications, flight usage (Cycles/Hours), inspection documentation, and maintenance history.
- **Authentication (`03_Login.png`, `24_Register.png`)**: Multi-role login and corporate account registration.

### 2.2. Buyer — Airlines / Maintenance Organizations (MROs)
- **Buyer Dashboard (`11_BuyerDashboard.png`)**: Fleet health overview and critical RUL engine alerts.
- **Engine Management (`16_MyEngines.png`)**: Tracked engine fleet list and RUL degradation status.
- **RUL Analysis (`12_RULAnalysis.png`)**: Detailed sensor analytics (pressure, temperature, vibration) and optimal maintenance cycle forecasting.
- **Replacement Recommendations (`13_Recommendations.png`)**: AI-driven automatic suggestions for compatible parts/engines available on the marketplace.
- **Orders & Tracking (`17_Orders.png`, `18_OrderDetail.png`)**: Purchase order history, delivery milestones, and shipment tracking.
- **Cart & Checkout (`07_Cart.png` - `10_Checkout.png`, `23_OrderConfirmation.png`)**: Standard B2B checkout flow (Shipping Address → Logistics Method → Payment Terms → Order Confirmation).

### 2.3. Supplier — OEMs / Vendors / Parts Distributors
- **Supplier Dashboard (`14_SupplierDashboard.png`)**: Revenue metrics, new order counts, and inventory status.
- **Product & Inventory Management (`20_SupplierProducts.png`, `25_SupplierProductForm.png`, `26_SupplierInventory.png`)**: Listing new parts with FAA/EASA certs, stock tracking, and part pricing.
- **Order Management (`21_SupplierOrders.png`)**: Tracking and updating order processing stages and air freight logistics.

### 2.4. Admin — Platform System Administrators
- **Admin Dashboard (`27_AdminDashboard.png`)**: Platform-wide transaction monitoring and key operational metrics.
- **Supplier & Product Moderation (`15_AdminModeration.png`)**: Verification of partner legal documentation and product listings approval.
- **System RUL Status (`44_AdminRULStatus.png`)**: Real-time status and health monitoring for the RUL inference engine.

---

## 3. Design Tokens & Typography Specifications

- **Primary Colors**: Deep Navy Blue (`#0F172A`, `#1E293B`) paired with Sky Blue (`#0284C7`), reflecting aviation industry professionalism and reliability.
- **RUL Alert Colors (Severity Levels)**:
  - 🟢 **Normal (RUL > 60 days)**: Emerald Green (`#10B981`)
  - 🟡 **Warning (30 < RUL ≤ 60 days)**: Amber (`#F59E0B`)
  - 🔴 **Critical (RUL ≤ 30 days)**: Crimson Red (`#EF4444`)
- **Typography**: Inter / Roboto sans-serif fonts, optimized for displaying dense technical telemetry and large data tables.