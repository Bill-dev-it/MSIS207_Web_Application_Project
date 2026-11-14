# Backend

This directory is intended for the application's backend API and business logic.

Authentication Backend Batches 2–4 are implemented: registration, email
verification, JWT HttpOnly cookie sessions, login, logout, authentication
middleware, and Supplier authorization integration. Backend tests are active
across Auth, Admin, and Buyer feature modules.

PostgreSQL database integration is implemented and active via `src/config/db.js`
with connection pooling, migrations, and schema constraints. While local manual
browser testing has verified primary interface workflows, automated browser
end-to-end (E2E) testing suites and live production SMTP delivery remain pending.

See the [Authentication setup guide](../docs/auth/README.md) for backend
authentication packages, environment requirements, endpoints, and verification.

## Architecture and MVC Mapping

AeroRUL follows an **MVC-inspired Layered Architecture with Repository Pattern** rather than a traditional monolithic MVC architecture. In a modern full-stack application with a React single-page frontend and an Express + PostgreSQL backend, classical MVC responsibilities are divided across specialized architectural layers:

- **VIEW (`frontend/src/`)**:
  React screens, pages, and UI components render the user interface, capture user interactions, manage client state, and format data. The Express backend does not render HTML server-side templates; the browser runs the View layer.
- **ROUTES (`backend/src/routes/`)**:
  Express routers define API endpoints and map incoming HTTP verbs (GET, POST, PUT, DELETE) and URL paths to their corresponding controller functions.
- **MIDDLEWARE (`backend/src/middleware/`)**:
  Intercepts incoming HTTP requests before they reach controllers. Middleware handles session verification (decoding HttpOnly JWT cookies via `require-auth.js`), role-based access control (`require-buyer.js`, `require-admin.js`), and mutation security (`require-trusted-mutation.js`).
- **CONTROLLER (`backend/src/controllers/`)**:
  Controllers process HTTP requests and responses. They parse URL parameters, query strings, and body payloads, validate input formats, delegate business operations to services, and send standard JSON responses (`{ success: true, data, meta }` or `{ success: false, error }`).
- **SERVICE (`backend/src/services/`)**:
  Encapsulates core business rules, domain validations, cross-table transaction management, and workflow coordination (e.g., checkout flows and AI RUL inference integration). Services are independent of HTTP transport objects (`req`, `res`).
- **MODEL RESPONSIBILITIES (`backend/src/services/**/*.repository.js` & PostgreSQL Schema)**:
  Implemented through PostgreSQL database entities (tables, foreign keys, constraints) and repository files (`*.repository.js`) colocated alongside their corresponding service modules. Repositories are responsible for SQL data access and executing parameterized queries via the database connection pool. The repository layer represents the data-access part of Model responsibilities, not the entire MVC Model concept (business and integrity rules are shared between PostgreSQL constraints and the service layer).

### Concrete Walkthrough: Buyer Orders Retrieval

The following flow illustrates how request and data flow through these layers when a Buyer views their procurement orders:

1. **React View (`frontend/src/screens/buyer/OrdersPage.jsx`)**:
   The user navigates to the Orders page. The `useOrders` hook triggers `ordersApi.getOrders()` (`frontend/src/features/buyer/orders/services/ordersApi.js`), which sends an authenticated HTTP request `GET /api/v1/orders?page=1&limit=10` using `buyerRequest`.
2. **Buyer Orders Route (`backend/src/routes/buyer/orders.routes.js`)**:
   Mounted at `/api/v1/orders` in `backend/src/server.js`, this router maps `GET /` to `ordersController.getOrders`.
3. **Authentication Middleware (`backend/src/middleware/require-buyer.js`)**:
   `requireBuyer` runs before the controller. It executes `requireAuth` (`backend/src/middleware/require-auth.js`) to verify the HttpOnly JWT session cookie (`aerorul_session`), ensures `req.authUser.role === "BUYER"`, and attaches the authenticated buyer company identity (`req.authUser.company_id`) to the request.
4. **Orders Controller (`backend/src/controllers/buyer/orders/orders.controller.js`)**:
   `getOrders(req, res)` validates query parameter types (verifying that `status`, `search`, `page`, and `limit` are single text strings rather than invalid arrays or objects), invokes `ordersService.getOrders(...)`, and serializes the resulting orders and pagination metadata into a `200 OK` JSON response.
5. **Orders Service (`backend/src/services/buyer/orders/orders.service.js`)**:
   `getOrders({ companyId, status, search, page, limit })` validates business rules and domain constraints: checking allowed statuses against `STATUSES = ["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"]` (or `"ALL"`), validating pagination bounds (ensuring positive integer page and limit between 1 and 100), trimming and bounds-checking search text, and invoking `ordersRepository.getBuyerOrders(...)`.
6. **Orders Repository (`backend/src/services/buyer/orders/orders.repository.js`)**:
   `getBuyerOrders({ companyId, status, search, page, limit })` executes parameterized SQL queries via `pool.query` on PostgreSQL, computing status counts and fetching paginated order records.
7. **PostgreSQL Database (`orders`, `seller_orders`, `order_items`, `payments`)**:
   PostgreSQL executes the relational query, joins order items and payment status, and returns raw database rows to the repository.

### Why This Structure Fits AeroRUL

For an enterprise B2B aviation engine and parts marketplace, this structure provides:
- **Role-Based Separation**: Decouples Buyer, Supplier, and Admin features into clear subdirectories matching distinct B2B personas.
- **Separation of Concerns**: Controllers only handle HTTP transport, services own business rules, and repositories own SQL. This keeps code modular and maintainable for team development.
- **Testability**: Services and repositories can be tested independently of Express HTTP servers or browser clients.
- **Security & Integrity**: Authentication and role guards are enforced centrally via middleware, while database constraints ensure transactional integrity across multi-seller procurement orders.
