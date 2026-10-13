# AeroRUL – Bộ prompt Google Stitch (thiết kế lại toàn bộ Figma)

Nguồn: (1) repo MSIS207 – schema/dữ liệu gold thật; (2) bộ Figma AeroRUL hiện tại – giữ layout & phong cách; (3) UI/UX Spec V2 – IA, luật UX, scope.

## Cách dùng (quan trọng)
Stitch làm tốt nhất khi **làm từng màn hình**, không nhồi cả hệ thống vào 1 prompt.
1. Tạo project mới → dán **PROMPT 0 (Master Design System)** trước, để Stitch khóa style.
2. Mỗi màn: dán **PROMPT 0 rút gọn (khối "STYLE LOCK")** + prompt của màn đó. Nên làm theo thứ tự P0 → P1 → P2.
3. Sau khi có màn đầu, dùng "Edit/Refine" để sửa; nhờ Stitch "make the other screens consistent with this one".
4. Prompt viết tiếng Anh vì Stitch hiểu tốt hơn; nội dung UI giữ tiếng Anh (thị trường B2B hàng không).

## Điểm lệch giữa Figma cũ ↔ Spec/DB đã sửa trong prompt (nên biết)
| Figma cũ | Sửa thành | Lý do (nguồn) |
|---|---|---|
| "Escrow", "Escrow Active", "Escrow Protected" | Bỏ hoàn toàn | DB: payment chỉ là *simulated checkout*; không có escrow |
| Urgency: Normal / Plan / Monitor / Replace Soon (lẫn lộn) | **Normal · Monitor · Prepare · Prioritize** | Enum DB `rul_predictions.urgency`; ngưỡng demo 20/40/80 cycles. Nhãn hiển thị "Replace Soon" gán cho Prioritize |
| "Compatibility 98%", "Exact match" | "Compatible" + `Rank #1/#2/#3` | DB: `ranking_score` là điểm xếp hạng business, **không phải xác suất tương thích**; compatibility là mapping demo |
| "Prognostic Match… Confidence 95%" | Bỏ confidence | Model chỉ dự đoán RUL, không có confidence/fault diagnosis |
| Condition: New/Overhauled/Serviceable | **New · Refurbished · Used** | Enum `seller_listings.condition` |
| Cancel / Refund / Tax engine, Net-30 invoice "pre-approved" | Payment = "Demo payment" duy nhất; không refund/cancel | DB note: ngoài MVP |
| FAA 8130-3, CAGE code, ATA chapter, Tier-1 operator… | Giữ ở mức *thông tin mô tả*, không làm workflow | Không biến thành ERP/MRO |
| Supplier "Warehouse stock Dallas/CDG" | Chỉ "Stock quantity" của listing | Spec §8.3: không multi-warehouse |
| Category là mục sidebar (một số frame) | Category chỉ là filter trong Marketplace | Spec §4 & §14 |

---

## PROMPT 0 — MASTER DESIGN SYSTEM (dán đầu tiên)

```
Design a complete responsive web application UI called "AeroRUL" — a B2B aviation e-commerce marketplace for aircraft engines and aircraft parts, with an AI feature that predicts engine Remaining Useful Life (RUL) and links the result directly to compatible replacement products. Audience: airline and MRO procurement/fleet teams (Buyer), parts distributors (Supplier), and platform operators (Admin).

CORE CONCEPT (never violate):
RUL prediction → replacement urgency → replacement recommendation → standard e-commerce purchase (Product → Cart → Checkout → Order tracking).
AI assists but never replaces normal e-commerce: users can always browse, search and buy without RUL.
The RUL model ONLY predicts remaining cycles. Never claim fault diagnosis or say which component is failing. Recommendations are "compatible with this engine model and ranked by availability, price, delivery time and supplier rating". Do not show AI confidence percentages or "98% match".
Do NOT design ERP/MRO features: no escrow, no work orders, no upstream procurement, no warehouse transfer, no accounting, no refunds/tax engine. Payment is a clearly labelled "Demo payment – no real charge".

VISUAL STYLE: "modern B2B aviation commerce", clean enterprise but friendly to shopping — NOT an ERP console. Inspiration: Stripe Dashboard + Shopify Plus + aviation marketplaces (AviaInventory/FlyParts). Light app background, white cards with 1px slate borders and very soft shadows, generous whitespace, strong visual hierarchy, clear primary CTAs.

DESIGN TOKENS
- Primary Navy #0B1F3A (primary buttons, active sidebar item, headings)
- Accent Sky Blue #2D9CDB (links, focus, info, highlights)
- Success #27AE60, Warning #F2C94C, Critical #EB5757
- Neutrals: background #F8FAFC, border #E5E7EB, muted text #64748B, body text #0F172A
- Typography: Inter for all UI text; JetBrains Mono ONLY for technical identifiers (part numbers P/N, engine IDs like ENG-037, order IDs ORD-1004, RUL cycle values, prices in tables)
- 12-column grid, 8px spacing system, card radius 12px, button radius 10px, content max-width 1600px
- Icons: single consistent outline icon set (Lucide style)

APP SHELL (identical chrome for all roles, only sidebar content/permissions differ)
- Header 64px sticky white: Logo "AeroRUL" | global search ("Search Part Number, Engine Model, or Supplier…") | notification bell | Cart icon with item-count badge (BUYER only) | company/avatar dropdown.
- Left sidebar 256px, role-specific, logout pinned at the bottom, active item = navy filled pill.
- Buyer sidebar (exactly): Dashboard, Marketplace, My Engines, RUL Analysis, Replacement Recommendations, Wishlist, Orders, Notifications, Company Profile, Account Settings, Logout. NO "Categories" item (categories are filters inside Marketplace). Cart is a header icon, not a sidebar item.
- Supplier sidebar: Dashboard, Products, Add Product, Inventory, Orders, Reviews, Analytics, Store Profile, Notifications, Settings, Logout. No cart.
- Admin sidebar: Dashboard, Users, Companies / Buyers, Suppliers, Products, Categories, Orders, Reviews / Reports, RUL System Status, System Settings, Logout. No cart.
- Public pages: no sidebar; top nav = Logo | Marketplace | Categories | Suppliers | How It Works | search | Login | Register.

REUSABLE COMPONENTS (design with states: default / hover / disabled / loading skeleton / empty / error)
SearchBar, FilterPanel, ProductCard, SupplierBadge (verified check), ConditionBadge, StockBadge (In stock / Low stock / Out of stock), CompatibilityBadge, PriceBlock, EngineCard, RULGauge, UrgencyBadge, RULTrendChart, RecommendationCard, CartDrawer (420px), CartItem, CheckoutStepper, OrderStatusTimeline, DataTable (sortable header, pagination), EmptyState, Toast, Alert, ConfirmDialog, TextInput, Select, MultiSelect, FileUpload, Breadcrumb.

URGENCY SYSTEM (color is never the only signal — always show text label + icon)
RUL > 80 cycles → "Normal" (green) · 40–80 → "Monitor" (blue) · 20–40 → "Prepare" (amber) · < 20 → "Prioritize / Replace Soon" (red). RUL always shown as "18 cycles" in mono font with a thin progress bar.

STATUS VOCABULARY
Order timeline: Placed → Confirmed → Processing → Shipped → Delivered.
Listing condition: New · Refurbished · Used. Listing status: Active · Draft. Supplier status: Pending · Approved · Suspended.
Currency USD only.

RESPONSIVE: desktop-first for dashboards; marketplace, product, cart, checkout must work on tablet (2-col grid, collapsible sidebar drawer) and mobile (1 col, filters in drawer, stacked KPI cards, tables become cards or scroll).

SAMPLE DATA (use consistently on every screen — based on the real project dataset)
- Buyer company: "Demo Horizon Airlines" (AIRLINE), user "John Doe – Tech Procurement". Fleet: 24 aircraft/24 engines (Airbus A320-214, A321-211, Boeing 737-300/400, KC-135R) with CFM56 engines: CFM56-2B, CFM56-3B, CFM56-3B-1, CFM56-3B2, CFM56-3C, CFM56-3C1, CFM56-5B2, CFM56-5B3/3, CFM56-5B3/P, CFM56-5B4, CFM56-5B4/3, CFM56-5B4/P. Engine IDs ENG-001 … ENG-024; current cycle values between 151 and 1,485. Hero case: ENG-037 style critical engine, CFM56-7B, RUL 18 cycles, urgency Prioritize.
- Catalog: 312 products, 936 supplier listings (844 active, 92 draft), 40 suppliers (36 approved, 2 pending, 2 suspended); listing prices from $97.50 to $2,025,000; each listing has seller SKU, condition, price, stock quantity, lead time in days.
- Categories (9): Avionics, Cabin, Electrical, Engine, Fasteners, Hydraulics, Landing Gear, Structure, Replacement Engines. Product types: Engine, Module, Component.
- Example products: "CFM56-7B HPT Stage 1 Blade Set" P/N 340-001-402-0 $62,400 (Safran Certified Aerospace ✓, 4.9★, New, In stock 4, 3–5 business days); "CFM56-7B Overhauled HPT Blade Set" $41,500 (Delta TechOps Surplus, Refurbished); "HPT Rotor Module Assembly" $38,000 (GE Aviation Fleet Services, Refurbished); "CFM56 Lubrication Oil Scavenge Pump Assembly" P/N 301-789-204-0 $8,450; "CFM56 EGT Thermocouple Dual" $3,250; "Engine Starter Relay"; "Engine Mount Bolt Kit"; "Compressor Service Module".
- Orders: ORD-1004 $72,100 (2 items + $1,250 shipping), ORD-1002, ORD-0998, ORD-0995.
- Photo style for products: neutral studio/workshop photography of real aerospace parts.

OUTPUT: a connected prototype of all screens listed in the following prompts, same visual language everywhere, desktop 1440px frames plus key mobile (390px) frames.
```

---

## STYLE LOCK (khối rút gọn – dán kèm mỗi prompt màn hình)

```
Continue the AeroRUL design system: navy #0B1F3A primary, sky blue #2D9CDB accent, success #27AE60, warning #F2C94C, critical #EB5757, neutrals #F8FAFC/#E5E7EB/#64748B. Inter for UI, JetBrains Mono only for P/N, engine IDs, order IDs, RUL values and prices. 8px grid, 12px radius, white cards on #F8FAFC. App shell: 64px sticky header (logo, global search, bell, cart badge for Buyer, avatar menu) + 256px role sidebar with logout at bottom. Urgency labels: Normal / Monitor / Prepare / Prioritize (text + icon + color). No escrow, no ERP workflows, no fault diagnosis, no AI confidence %. Payment is "Demo payment". USD. Desktop 1440px + a mobile 390px variant.
```

---

## P0 — Màn hình ưu tiên

### S1. Login / Register  (`/auth/login`, `/auth/register`)
```
Design a split-screen Login & Register page. Left (navy, subtle jet-engine line art): "AeroRUL – Aviation Marketplace", headline "Aviation parts marketplace with RUL-based replacement planning", 3 feature rows: Predictive Replacement Planning (link engine RUL to compatible catalog parts), Verified Suppliers, Fast B2B Procurement with multi-stage order tracking. Right (white): Sign In / Register tabs, "Enterprise Account Sign In", Business Email, Password with show/hide, Remember me, Forgot password?, primary Sign In button, "Continue with Corporate SSO" secondary button, link "Browse marketplace as guest". Include variants: inline error alert state ("Invalid corporate email or password"), loading state, and a Register tab with fields: Full name, Business email, Password, Company name, Company type (Airline / MRO / Supplier), Country, Business/Tax ID, and role selector Buyer / Supplier. Show after-login routing hint in a note: Buyer → /buyer/dashboard, Supplier → /supplier/dashboard, Admin → /admin/dashboard. Remove any "escrow" wording.
```

### S2. Public Home / Landing  (`/`)
```
Design the public Home page (no sidebar, public header). Goal: in 5–10 seconds a visitor understands this is an aviation parts marketplace with AI/RUL-assisted replacement decisions. Sections in order: 1) Hero — headline about RUL-based replacement + marketplace, CTAs "Explore Marketplace" (primary) and "Analyze Engine" (secondary), supporting visual of an engine with a floating RUL gauge card ("ENG-037 · RUL 18 cycles · Prioritize"). 2) Global product search with 3 quick-filter chips: Keyword, Part Number, Engine Model. 3) Featured Categories grid: Engine, Avionics, Electrical, Hydraulics, Landing Gear, Structure, Fasteners, Cabin, Replacement Engines (icon + product count). 4) Featured/Recommended Products (4 ProductCards). 5) Verified Suppliers (cards with logo, rating, region, "Verified" badge). 6) "How RUL-Based Replacement Works" 4 steps: Predict → Understand → Recommend → Purchase, with a note that RUL estimates remaining cycles and compatibility comes from catalog rules. 7) Marketplace Benefits (3–4 cards). 8) Footer (Company, Support, Terms, Privacy, Contact). Product cards for guests show price but button "Sign in to purchase".
```

### S3. App Shell – 3 role mockups  (`BuyerLayout / SupplierLayout / AdminLayout`)
```
Create one presentation frame showing the three role shells side by side (Buyer, Supplier, Admin) with identical 64px header and 256px sidebar, differing only in menu items and header widgets, using the exact sidebar lists from the design system. Buyer: cart icon with badge 2 + fleet status chip "24 engines active" above the menu; Supplier: no cart, Orders badge 14; Admin: no cart, "RUL System Status" item with a green live dot. Below, annotate guardrails: no Categories in Buyer sidebar, cart only in header, logout bottom, Inter + JetBrains Mono discipline, zero layout shift between routes.
```

### S4. Marketplace Listing  (`/marketplace`)
```
Design the Marketplace listing page (works for guests with public header and for Buyers inside the app shell). Top: search + Sort dropdown (Recommended, Price low→high, Delivery time, Rating) + grid/list toggle. Active filter chips row with "Clear all". Left filter panel: Category (Avionics, Cabin, Electrical, Engine, Fasteners, Hydraulics, Landing Gear, Structure, Replacement Engines, with counts), Engine Model (CFM56-5B4, CFM56-3C1, CFM56-7B…), Part Number, Supplier, Price range (min/max USD), Stock/Availability, Compatibility, Condition (New / Refurbished / Used), Rating, Delivery time. Product grid 3–4 columns of ProductCards: image, name, P/N (mono chip), price, supplier with verified badge, stock badge, "Compatible: CFM56-7B" badge, condition badge, rating, buttons View Details + Add to Cart. Pagination with items-per-page. Variants: (a) normal, (b) opened from a Replacement Recommendation with a banner "Showing options compatible with ENG-037 (CFM56-7B) · Prioritize" and filter pre-applied, (c) loading skeleton, (d) empty results, (e) mobile with filter drawer.
```

### S5. Product Detail  (`/product/:id`)
```
Design the Product Detail page. Breadcrumb Marketplace › Category › Product. Left: image gallery with 4 thumbnails. Right: name "CFM56-7B HPT Stage 1 Blade Set", P/N 340-001-402-0 (mono chip), rating 4.9 (128 reviews), price $62,400 USD, supplier card (Safran Certified Aerospace, verified badge, rating, city), info tiles: Compatibility (CFM56-7B series), Condition (New), Stock (In stock – 4), Delivery estimate (3–5 business days), Warranty. Buttons: Add to Cart (primary navy), Buy Now (sky blue), Add to Wishlist (outline). Because one product can have several supplier offers, add an "Other seller offers" mini-table (supplier, condition, price, stock, lead time, Add to cart). Tabs: Overview | Technical Specs | Compatibility | Shipping | Supplier | Reviews — Technical Specs as a key-value table; Compatibility tab lists compatible engine models as chips. "AI Recommendation Context" banner at top ONLY when arriving from a recommendation: "Recommended because ENG-037 has low predicted RUL (18 cycles · Prioritize) and this product is compatible with CFM56-7B." + "Back to Recommendations". Related products row of 3 cards.
```

### S6. Cart (page + drawer)  (`/buyer/cart`)
```
Design the Cart page and the Cart Drawer. Page: CheckoutStepper (1 Cart · 2 Shipping & Delivery · 3 Payment · 4 Review), cart item cards (image, name, P/N chip, supplier verified, condition, unit price, quantity stepper, remove, small tag "Recommended for ENG-037" when applicable), right Order Summary card (subtotal, shipping "calculated at next step", total in mono USD, optional Purchase reference field, "Proceed to Checkout", "Continue shopping"). Drawer (420px slide-over): items list, subtotal, "View cart" + "Proceed to Checkout". Empty state: icon, "Your cart is empty", "Browse Marketplace", link "Check your My Engines RUL recommendations". Remove any "Prognostic match / confidence" text.
```

### S7. Checkout (steps 2–4)  (`/buyer/checkout`)
```
Design the 3 checkout steps with the same stepper and sticky Order Summary on the right. Step 2 Shipping & Delivery: saved company addresses (radio cards with recipient, phone, address, city, country) + "Add new address", delivery method options (Standard 3–5 business days, Express 24–48h) with price, B2B fields: Company name, Business/Tax ID, Purchase reference. Step 3 Payment: single option "Demo payment" with notice "Demo payment. No real charge will be made."; no escrow, no card form. Step 4 Review & Place Order: items, shipping block, company details, payment block, Terms checkbox, "Place Order ($72,100.00)". Then Order Confirmation: success icon, "Order ORD-1004 placed", Track order / Continue shopping, 5-step OrderStatusTimeline with only "Placed" completed. Add error state: "Item no longer available in requested quantity" (stock re-checked at checkout).
```

### S8. Buyer Dashboard  (`/buyer/dashboard`)
```
Design the Buyer Dashboard as an overview page (not a product list) connecting engine health, replacement decision and shopping status. Welcome header "Welcome, Demo Horizon Airlines". 4 KPI cards: Engines 24, Active Orders 6, RUL Alerts 1 (critical styling), Wishlist 8. Critical alert banner: "ENG-037 · CFM56-7B · Predicted RUL 18 cycles · Urgency: Prioritize" with buttons "View Replacement Options" (primary) and "View RUL Details". Engine Health Overview table: Engine ID, Model, Current Cycle, Latest RUL (value + progress bar), Urgency badge, Action — rows ENG-037 (18, Prioritize), ENG-002 (47, Monitor), ENG-022 (38, Prepare), ENG-001 (92, Normal). Right column "Recent Orders / Shipment Status" with ORD-88219-style card and 5-step mini timeline plus "Track Order". No "confidence %". Include loading and empty (no engines yet → "Add your first engine / upload sensor data") states.
```

### S9. My Engines + Engine Detail  (`/buyer/engines`, `/buyer/engines/:id`)
```
Design My Engines: header with search and filter by urgency; DataTable columns Engine ID, Engine Model, Aircraft (registration/model), Current Cycle, Latest RUL, Urgency, Last Analysis timestamp, Actions (View / Analyze / Recommendations); toggle to card view (EngineCard). Then Engine Detail page: Engine Information card (engine code, serial number, engine model, aircraft, current cycle), latest prediction card with RULGauge + UrgencyBadge, RUL history line chart (RULTrendChart) with threshold bands at 20/40/80 cycles, sensor upload history table (file, date, status Uploaded/Validated/Failed), primary CTA "View Replacement Recommendations".
```

### S10. RUL Analysis  (`/buyer/rul-analysis`)
```
Design RUL Analysis as a guided 5-step flow on one page: 1) Select Engine (dropdown/search), 2) Upload Sensor Data (CSV drag-and-drop; show required format hint "latest 30-cycle sensor window", file validation states: validating / valid / error with message), 3) Run Prediction (button + progress state), 4) Result card: Predicted RUL "18 cycles" in large mono type, RULGauge, Urgency "Prioritize", plain-language interpretation "Plan replacement soon", small footnote "Prediction estimates remaining useful life only; it does not identify a specific failed component.", 5) CTA "View Compatible Replacement Options". Also RUL trend chart with 20/40/80 threshold bands and previous predictions list. States: no data uploaded, running, failed (retry), success.
```

### S11. Replacement Recommendations — signature page  (`/buyer/recommendations`)
```
Design the signature page that links AI to e-commerce. Context card: "Based on: ENG-037 · CFM56-7B · Predicted RUL 18 cycles · Prioritize" with note "Compatible with CFM56-7B and ranked by availability, price, delivery time and supplier rating." + "Back to My Engines". Top Recommendation hero card (badge "Top recommendation · Rank #1"): image, P/N, name, supplier verified + rating, tiles Condition / Stock / Delivery / Warranty, price, buttons View Product + Add to Cart. Alternatives: 2 cards (Option B, Option C) each with P/N, supplier, condition, stock, delivery, price, "Add to compare" + "Add to cart". "Compare Options" side-by-side table (Price, Supplier, Compatibility, Stock, Delivery, Condition, Rating, Lead time) with top pick column highlighted. Sticky bottom bar: "1 item selected · $62,400 · Continue to cart". Compatibility shown as a "Compatible" badge, never a percentage. Empty state: "No compatible listings in stock — browse marketplace".
```

---

## P1

### S12. Orders & Order Detail  (`/buyer/orders`, `/buyer/orders/:id`)
```
Design Orders list: search by order ID, filters (status, date range), DataTable (Order ID mono, date, items, supplier(s), total, status badge, action). Order Detail: header ORD-1004 + status badge, 5-step OrderStatusTimeline (Placed → Confirmed → Processing → Shipped → Delivered) with timestamps, items list per seller (a single order can split into seller orders — show grouped by supplier with each supplier's own shipment status), totals, shipping address, estimated delivery, payment block ("Demo payment – Succeeded", PO reference), "Contact supplier" link, and after delivery a "Write review" per item. No cancel/refund buttons.
```

### S13. Supplier Dashboard  (`/supplier/dashboard`)
```
Design Supplier Dashboard in the Supplier shell. Title "Supplier Dashboard" + button "+ Add Product". 4 KPI cards: Revenue (last 30 days) $1,842,500 (+14.8%), Active Orders 14 (8 Processing, 4 Shipped, 2 New), Active Listings 348, Low-Stock Alerts 4. Sales Trend area chart (6 months, tooltip). Top Products list (image, name, P/N, orders, revenue). Recent Orders table (Order ID, Buyer, Total, Status, View). Low-Stock Alerts list with "Update stock" buttons. Use only listing stock quantity — no warehouse or replenishment concepts.
```

### S14. Supplier Products + Add/Edit Product + Inventory  (`/supplier/products`, `/supplier/products/new`, `/supplier/inventory`)
```
Design three Supplier screens. (a) Products: table with image, name, P/N/seller SKU, category, condition, price, stock, status (Active/Draft/Hidden), actions (edit, hide, deactivate), search + status filter + bulk actions. (b) Add/Edit Product form in sections: Basic (name, P/N/SKU, category select, description), Technical specs (structured key-value rows), Engine compatibility (multi-select tags of engine models), Commercial (price USD, stock quantity, condition New/Refurbished/Used, shipping estimate / lead time days), Images (upload grid), Status (Draft/Active/Hidden); sticky Save draft / Publish. (c) Inventory: simple table of listings with inline editable stock quantity and a Low-stock filter — explicitly no purchasing, transfers or goods receipt.
```

### S15. Supplier Orders  (`/supplier/orders`)
```
Design Supplier Orders as a table with status filter tabs (New, Confirmed, Processing, Shipped, Delivered), columns Order ID, Buyer company, items, total, date, status, action. Order drawer/detail: items, shipping address, status stepper with buttons to advance (Confirm → Processing → Mark as Shipped with tracking number field). Provide an optional Kanban view toggle with the same 5 columns.
```

### S16. Admin Dashboard  (`/admin/dashboard`)
```
Design Admin Dashboard. 5 KPI cards: Users, Suppliers (36 approved / 2 pending / 2 suspended), Orders, Revenue, Products (312). Sales/Order trend chart. "New Supplier Requests" list with Approve/Reject. "Reported Products / Reviews" list. "System / RUL Service Status" card (service online, last inference time, recent prediction success rate) with live status dot. Admin only observes orders; no operational ERP tools.
```

### S17. Admin Moderation  (`/admin/suppliers`, `/admin/products`)
```
Design Supplier & Product Moderation with 3 tabs: Supplier requests (n), Product approvals (n), Reported items (n). Master–detail layout: left queue list (search, status filter; each item P/N, supplier, price, time), right detail panel: title, status chip "Awaiting admin decision", condition, compatible engines chips, stock, price & supplier cards, description, attached documents list (View/Download), reviewer notes textarea, checklist (information complete, price reasonable, documents attached). Actions: Suspend supplier (text, red), Reject (outline red), Request changes, Approve and publish (primary). Also design Categories management table (add/edit/delete category with slug and description) and RUL System Status page (service health, model version, latest predictions table).
```

---

## P2

### S18. Wishlist, Notifications, Reviews, Analytics, Company Profile, Settings
```
Design these secondary screens in the same system: Buyer Wishlist (saved ProductCards, move to cart); Notifications (list grouped by Today/Earlier with types: RUL alert, order status update, low stock; each with action link and read/unread state); Supplier Reviews (rating summary + review list with reply box; one verified review per purchased item); Supplier Analytics (sales by product, top buyers, orders by status charts); Supplier Store Profile (store name, slug, logo upload, description, status chip Pending/Approved/Suspended); Buyer Company Profile (company name, type Airline/MRO, Tax ID, country, saved addresses, aircraft list); Account Settings (profile, password, notification preferences). Include empty/loading/error states.
```

### S19. Public: Supplier Store, How It Works, Categories
```
Design public Supplier Store page (banner, logo, verified badge, rating, description, product grid with filters), a "How It Works" page (4-step explainer Predict → Understand → Recommend → Purchase with an honest note on RUL scope and a small FAQ), and a Categories directory (9 category tiles with icon, description, product count, linking to Marketplace pre-filtered).
```

---

## Prompt kết nối prototype (chạy cuối cùng)
```
Link all generated screens into one clickable prototype that follows the happy path: Buyer logs in → Buyer Dashboard shows ENG-037 RUL 18 cycles (Prioritize) → "View Replacement Options" → Replacement Recommendations → Product Detail (with AI context banner) → Compare → Add to Cart → Cart → Checkout → Place Order → Order Confirmation → Supplier Orders (Processing → Shipped) → Buyer Order Detail shows Shipped. Make sure sidebar active states, header cart badge, breadcrumbs and back-links are consistent, and check every screen against the style lock (no escrow, no confidence %, urgency labels Normal/Monitor/Prepare/Prioritize).
```

## Checklist nghiệm thu (theo Spec §19)
☐ Sitemap riêng Public/Buyer/Supplier/Admin ☐ Mỗi page có CTA chính + trạng thái empty/loading/error ☐ Buyer đủ Marketplace→Product→Cart→Checkout→Orders ☐ RUL không claim fault diagnosis ☐ Recommendation dẫn sang product ☐ Supplier có Products+Inventory+Orders+Store Profile ☐ Admin có moderation ☐ Category/filter nằm trong Marketplace ☐ Cart ở header, order status rõ ☐ Có responsive ☐ Một design system duy nhất ☐ Không có workflow ERP/escrow
