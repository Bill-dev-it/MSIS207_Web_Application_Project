# Public & Supplier Frontend — Implementation Rules

Scope: Public and Supplier modules of AeroRUL. Buyer and Admin screens remain owned by the teammate. This file documents conventions; it is not a claim that all workflows are implemented.

## Ownership & boundaries
- Public: `/`, `/marketplace`, `/marketplace/products/:productId`.
- Supplier: `/supplier` and new supplier routes only after corresponding screens exist.
- Shared changes to `src/app/router.jsx`, `src/styles/index.css`, `src/components/common/` require regression checks for Buyer and Admin before merging.
- Never implement a second header/sidebar inside a Supplier screen; `SupplierLayout` owns the shell.

## Design contracts
- Keep the existing AeroRUL Tailwind tokens: primary #0B1F3A, accent #2D9CDB, surface #F8FAFC.
- Prefer existing `container-page`, `card`, `btn`, `input` utilities. Do not introduce page-specific copies of common styles.
- Design mobile first (small viewport), then tablet, then desktop. Navigation must remain usable without horizontal scroll.
- Use React Router `Link`/`NavLink`, accessible labels, visible keyboard focus, and meaningful loading/empty/error states.
- New screens can use `PageHeader` and `EmptyState` from `src/components/common/`.

## Data contracts & integration
- `products` describe canonical parts; `seller_listings` describe supplier-specific offers, price, and inventory. Do not treat products and listings as equivalent.
- UI fixtures and placeholders must be labeled as demo/planned; no fictional KPI may masquerade as a live API response.
- Keep HTTP requests in `src/services/`, never embedded in presentation components.
- API documentation currently uses `/api/v1` while existing product frontend service defaults to `/api`; confirm the backend runtime before changing URLs.
- Product detail currently resolves an item by requesting the full product catalog. Replace with a product-detail endpoint only when the backend implements it.
- Supplier mutations require actual authenticated backend endpoints. Do not build success-looking client-only save actions.

## Screen definition of done
1. Route resolves to its intended screen, including direct refresh.
2. Consistent layout and styles; no duplicated role navigation.
3. Keyboard usable and accessible headings/form labels.
4. Loading, empty and failure states wherever async data is involved.
5. Verify 375px, 768px and 1440px; no horizontal overflow.
6. Explicitly mark mock versus live integration status.
7. `npm run build` succeeds; smoke-test Public, Supplier, Buyer and Admin routes before PR merge.

## Initial flow
Supplier listing management -> published supplier offer -> Public product offers -> Buyer procurement. The cross-role integration is an approved target flow, not currently verified end-to-end.
