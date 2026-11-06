const router = require("express").Router();
const controller = require("../../controllers/supplier/orders.controller");

/**
 * @api {get} /api/v1/supplier/orders List My Orders
 * @apiName ListSupplierOrders
 * @apiGroup Supplier Orders
 * @apiVersion 1.0.0
 * @apiDescription Returns seller_orders belonging to authenticated supplier. Each row includes its order_items; buyer_name comes from a stored company snapshot. Pre-login: always returns HTTP 401 AUTH_REQUIRED. After Login integration, endpoints must check the authenticated supplier. Do not pass supplier_id from the client.
 * @apiPermission Supplier
 * @apiSuccess {Boolean} success true
 * @apiSuccess {Number} count Number of supplier orders.
 * @apiSuccess {Object[]} data Supplier order rows with items.
 * @apiSuccess {String} data.order_number Order number.
 * @apiSuccess {String} data.status CONFIRMED, PROCESSING, SHIPPED or DELIVERED.
 * @apiSuccess {String="SIMULATION","BANK_TRANSFER"} [data.payment_method] Order payment method.
 * @apiSuccess {String="PENDING","SUCCEEDED","CANCELLED"} [data.payment_status] Order payment status.
 * @apiSuccess {String} [data.paid_at] Payment timestamp when SUCCEEDED.
 * @apiSuccess {Object[]} data.items Purchased line item snapshots.
 * @apiError (401 Unauthorized) AUTH_REQUIRED Supplier login required; all Supplier APIs return 401 before Login integration.
 * @apiError (500 Internal Server Error) INTERNAL_SERVER_ERROR Unexpected database/server error.
 * @apiSuccessExample {json} 200 OK:
 *     {
 *       "success": true,
 *       "count": 1,
 *       "data": [
 *         {
 *           "seller_order_id": "101",
 *           "order_id": "201",
 *           "supplier_id": "1",
 *           "order_number": "ORD-2026-0201",
 *           "purchase_reference": "PO-AIR-001",
 *           "buyer_name": "Demo Horizon Airlines",
 *           "status": "CONFIRMED",
 *           "created_at": "2026-10-20T09:30:00.000Z",
 *           "subtotal": "640.00",
 *           "shipping_fee": "35.00",
 *           "grand_total": "675.00",
 *           "currency": "USD",
 *           "payment_method": "BANK_TRANSFER",
 *           "payment_status": "PENDING",
 *           "paid_at": null,
 *           "items": [
 *             {
 *               "order_item_id": "301",
 *               "seller_order_id": "101",
 *               "listing_id": "1",
 *               "product_name_snapshot": "Engine Ignition Lead",
 *               "part_number_snapshot": "DEMO-PART-00001",
 *               "seller_sku_snapshot": "DEMO-S01-P0001",
 *               "condition_snapshot": "NEW",
 *               "quantity": 2,
 *               "unit_price": "320.00",
 *               "line_total": "640.00"
 *             }
 *           ]
 *         }
 *       ]
 *     }
 * @apiErrorExample {json} 401 Pre-login:
 * {
 *   "success": false,
 *   "error": { "code": "AUTH_REQUIRED", "message": "Supplier login is required." }
 * }
 */
router.get("/", controller.getAll);

/**
 * @api {get} /api/v1/supplier/orders/:sellerOrderId Get Supplier Order
 * @apiName GetSupplierOrder
 * @apiGroup Supplier Orders
 * @apiVersion 1.0.0
 * @apiDescription Returns one owned supplier order with line item snapshots and monetary totals. Pre-login: always returns HTTP 401 AUTH_REQUIRED. After Login integration, endpoints must check the authenticated supplier. Do not pass supplier_id from the client.
 * @apiPermission Supplier
 * @apiParam {String} sellerOrderId Positive BIGINT seller order identifier.
 * @apiSuccess {Boolean} success true
 * @apiSuccess {Object} data Supplier order with items.
 * @apiError (400 Bad Request) INVALID_INPUT Invalid order ID.
 * @apiError (401 Unauthorized) AUTH_REQUIRED Supplier login required; all Supplier APIs return 401 before Login integration.
 * @apiError (404 Not Found) ORDER_NOT_FOUND Missing or not owned.
 * @apiError (500 Internal Server Error) INTERNAL_SERVER_ERROR Unexpected database/server error.
 * @apiSuccessExample {json} 200 OK:
 *     {
 *       "success": true,
 *       "data": {
 *         "seller_order_id": "101",
 *         "order_id": "201",
 *         "supplier_id": "1",
 *         "order_number": "ORD-2026-0201",
 *         "purchase_reference": "PO-AIR-001",
 *         "buyer_name": "Demo Horizon Airlines",
 *         "status": "CONFIRMED",
 *         "created_at": "2026-10-20T09:30:00.000Z",
 *         "subtotal": "640.00",
 *         "shipping_fee": "35.00",
 *         "grand_total": "675.00",
 *         "currency": "USD",
 *         "payment_method": "BANK_TRANSFER",
 *         "payment_status": "PENDING",
 *         "paid_at": null,
 *         "items": [
 *           {
 *             "order_item_id": "301",
 *             "seller_order_id": "101",
 *             "listing_id": "1",
 *             "product_name_snapshot": "Engine Ignition Lead",
 *             "part_number_snapshot": "DEMO-PART-00001",
 *             "seller_sku_snapshot": "DEMO-S01-P0001",
 *             "condition_snapshot": "NEW",
 *             "quantity": 2,
 *             "unit_price": "320.00",
 *             "line_total": "640.00"
 *           }
 *         ]
 *       }
 *     }
 * @apiErrorExample {json} 401 Pre-login:
 * {
 *   "success": false,
 *   "error": { "code": "AUTH_REQUIRED", "message": "Supplier login is required." }
 * }
 */
router.get("/:sellerOrderId", controller.getOne);

/**
 * @api {patch} /api/v1/supplier/orders/:sellerOrderId/status Advance Order Status
 * @apiName UpdateSupplierOrderStatus
 * @apiGroup Supplier Orders
 * @apiVersion 1.0.0
 * @apiDescription Only one step forward: CONFIRMED to PROCESSING, PROCESSING to SHIPPED, SHIPPED to DELIVERED. DELIVERED is terminal; transition is conditional to avoid concurrent state races. Pre-login: always returns HTTP 401 AUTH_REQUIRED. After Login integration, endpoints must check the authenticated supplier. Do not pass supplier_id from the client.
 * @apiPermission Supplier
 * @apiSampleRequest off
 * @apiParam {String} sellerOrderId Positive BIGINT seller order identifier.
 * @apiBody {String="PROCESSING","SHIPPED","DELIVERED"} status Next state in the permitted sequence.
 * @apiSuccess {Boolean} success true
 * @apiSuccess {Object} data Updated supplier order with items.
 * @apiError (400 Bad Request) INVALID_INPUT Invalid ID/body/next status.
 * @apiError (401 Unauthorized) AUTH_REQUIRED Supplier login required; all Supplier APIs return 401 before Login integration.
 * @apiError (404 Not Found) ORDER_NOT_FOUND Missing or not owned.
 * @apiError (409 Conflict) INVALID_TRANSITION Not the next permitted status.
 * @apiError (409 Conflict) PAYMENT_PENDING or PAYMENT_CANCELLED Order payment is not SUCCEEDED.
 * @apiError (409 Conflict) ORDER_CHANGED Order changed concurrently.
 * @apiError (500 Internal Server Error) INTERNAL_SERVER_ERROR Unexpected database/server error.
 * @apiSuccessExample {json} 200 OK:
 *     {
 *       "success": true,
 *       "data": {
 *         "seller_order_id": "101",
 *         "order_id": "201",
 *         "supplier_id": "1",
 *         "order_number": "ORD-2026-0201",
 *         "purchase_reference": "PO-AIR-001",
 *         "buyer_name": "Demo Horizon Airlines",
 *         "status": "PROCESSING",
 *         "created_at": "2026-10-20T09:30:00.000Z",
 *         "subtotal": "640.00",
 *         "shipping_fee": "35.00",
 *         "grand_total": "675.00",
 *         "currency": "USD",
 *         "payment_method": "BANK_TRANSFER",
 *         "payment_status": "PENDING",
 *         "paid_at": null,
 *         "items": [
 *           {
 *             "order_item_id": "301",
 *             "seller_order_id": "101",
 *             "listing_id": "1",
 *             "product_name_snapshot": "Engine Ignition Lead",
 *             "part_number_snapshot": "DEMO-PART-00001",
 *             "seller_sku_snapshot": "DEMO-S01-P0001",
 *             "condition_snapshot": "NEW",
 *             "quantity": 2,
 *             "unit_price": "320.00",
 *             "line_total": "640.00"
 *           }
 *         ]
 *       }
 *     }
 * @apiErrorExample {json} 401 Pre-login:
 * {
 *   "success": false,
 *   "error": { "code": "AUTH_REQUIRED", "message": "Supplier login is required." }
 * }
 */
router.patch("/:sellerOrderId/status", controller.updateStatus);
module.exports = router;
