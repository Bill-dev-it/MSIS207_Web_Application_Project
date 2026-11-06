const express = require("express");
const checkoutController = require("../../controllers/buyer/checkout.controller");

const router = express.Router();

/**
 * @api {get} /api/v1/checkout/addresses List buyer addresses
 * @apiName GetBuyerAddresses
 * @apiGroup Buyer Checkout
 * @apiVersion 1.0.0
 * @apiDescription Requires an authenticated BUYER session. Returns saved addresses belonging to the authenticated company.
 * @apiPermission Buyer
 * @apiSuccess {Boolean} success true
 * @apiSuccess {Object[]} data Company-owned saved addresses.
 * @apiError (401 Unauthorized) UNAUTHENTICATED A Buyer session is required.
 * @apiError (403 Forbidden) BUYER_REQUIRED A Buyer account is required.
 * @apiError (500 Internal Server Error) INTERNAL_SERVER_ERROR Address list could not be read.
 * @apiSuccessExample {json} 200 OK:
 *     { "success": true, "data": [] }
 */
router.get("/addresses", checkoutController.getAddresses);

/**
 * @api {post} /api/v1/checkout/addresses Save buyer address
 * @apiName CreateBuyerAddress
 * @apiGroup Buyer Checkout
 * @apiVersion 1.0.0
 * @apiDescription Saves an address to the authenticated Buyer company. Requires X-AeroRUL-Request: 1.
 * @apiPermission Buyer
 * @apiBody {String} recipient_name Recipient/contact.
 * @apiBody {String} phone Contact phone.
 * @apiBody {String} address_line Street or facility address.
 * @apiBody {String} city City.
 * @apiBody {String} [region] State or province.
 * @apiBody {String} [postal_code] Postal code.
 * @apiBody {String} country_code Two-letter ISO country code.
 * @apiSuccess {Boolean} success true
 * @apiSuccess {Object} data Saved address.
 * @apiError (400 Bad Request) INVALID_ADDRESS Invalid address fields.
 * @apiError (401 Unauthorized) AUTH_REQUIRED Missing or expired session cookie.
 * @apiError (403 Forbidden) BUYER_REQUIRED, UNTRUSTED_REQUEST or UNTRUSTED_ORIGIN Buyer role, trusted mutation header or allowed origin is required.
 * @apiError (500 Internal Server Error) INTERNAL_SERVER_ERROR Address could not be saved.
 * @apiSuccessExample {json} 201 Created:
 *     { "success": true, "data": { "address_id": "42", "company_id": "7", "country_code": "US" } }
 */
router.post("/addresses", checkoutController.addAddress);

/**
 * @api {get} /api/v1/checkout/delivery-methods List delivery estimates
 * @apiName GetBuyerDeliveryMethods
 * @apiGroup Buyer Checkout
 * @apiVersion 1.0.0
 * @apiDescription Returns application demonstration estimates, not carrier quotes or guarantees.
 * @apiPermission Buyer
 * @apiSuccess {Boolean} success true
 * @apiSuccess {Object[]} data Supported delivery estimates.
 * @apiError (401 Unauthorized) AUTH_REQUIRED Missing or expired session cookie.
 * @apiError (403 Forbidden) BUYER_REQUIRED Session role is not BUYER.
 * @apiSuccessExample {json} 200 OK:
 *     { "success": true, "data": [{ "id": "STANDARD", "cost": "1250.00" }] }
 */
router.get("/delivery-methods", checkoutController.getDeliveryMethods);

/**
 * @api {get} /api/v1/checkout/company Get buyer company
 * @apiName GetBuyerCheckoutCompany
 * @apiGroup Buyer Checkout
 * @apiVersion 1.0.0
 * @apiDescription Returns the company from the authenticated Buyer session.
 * @apiPermission Buyer
 * @apiSuccess {Boolean} success true
 * @apiSuccess {Object} data Company details.
 * @apiError (401 Unauthorized) AUTH_REQUIRED Missing or expired session cookie.
 * @apiError (403 Forbidden) BUYER_REQUIRED Session role is not BUYER.
 * @apiError (404 Not Found) COMPANY_NOT_FOUND Company no longer exists.
 * @apiError (500 Internal Server Error) INTERNAL_SERVER_ERROR Company could not be read.
 * @apiSuccessExample {json} 200 OK:
 *     { "success": true, "data": { "company_id": "7", "company_name": "Example Buyer" } }
 */
router.get("/company", checkoutController.getCompany);

/**
 * @api {post} /api/v1/checkout/orders Place order
 * @apiName PlaceBuyerOrder
 * @apiGroup Buyer Checkout
 * @apiVersion 1.0.0
 * @apiDescription Places an order from the authenticated user's cart in one PostgreSQL transaction. Accepts SIMULATION (immediately SUCCEEDED) or BANK_TRANSFER (initially PENDING, paid_at = NULL); no real payment is processed. Requires X-AeroRUL-Request: 1.
 * @apiPermission Buyer
 * @apiBody {String} shipping_address_id Saved address belonging to the authenticated company.
 * @apiBody {String} [billing_address_id] Saved company address; defaults to shipping address.
 * @apiBody {String} delivery_method_id Supported delivery estimate ID.
 * @apiBody {String} [purchase_reference] Optional order reference, max 100 characters.
 * @apiBody {String="SIMULATION","BANK_TRANSFER"} payment_method Payment MVP method.
 * @apiBody {String} checkout_key Stable idempotency key for retries.
 * @apiSuccess {Boolean} success true
 * @apiSuccess {Object} data Created or idempotently returned order with payment summary.
 * @apiSuccessExample {json} 201 Created:
 *     { "success": true, "data": { "order_id": "201", "order_number": "ORD-...", "checkout_key": "buyer_...", "grand_total": "1375.00", "currency": "USD", "payment_method": "BANK_TRANSFER", "payment_status": "PENDING", "paid_at": null } }
 * @apiSuccessExample {json} 200 Idempotent retry:
 *     { "success": true, "data": { "order_id": "201", "order_number": "ORD-...", "checkout_key": "buyer_...", "grand_total": "1375.00", "currency": "USD", "payment_method": "BANK_TRANSFER", "payment_status": "PENDING", "paid_at": null } }
 * @apiError (400 Bad Request) INVALID_SHIPPING_ADDRESS Invalid or unowned address.
 * @apiError (400 Bad Request) UNSUPPORTED_PAYMENT_METHOD Only SIMULATION and BANK_TRANSFER are supported.
 * @apiError (409 Conflict) INSUFFICIENT_STOCK Listing stock changed or is insufficient.
 * @apiError (400 Bad Request) INVALID_BILLING_ADDRESS, INVALID_CHECKOUT_KEY, INVALID_PURCHASE_REFERENCE, INVALID_DELIVERY_METHOD Invalid checkout input.
 * @apiError (401 Unauthorized) AUTH_REQUIRED Missing or expired session cookie.
 * @apiError (403 Forbidden) BUYER_REQUIRED, UNTRUSTED_REQUEST or UNTRUSTED_ORIGIN Buyer role, trusted mutation header or allowed origin is required.
 * @apiError (404 Not Found) COMPANY_NOT_FOUND Buyer company not found.
 * @apiError (409 Conflict) CART_EMPTY or OFFER_UNAVAILABLE Cart is empty or an offer is no longer available.
 * @apiError (500 Internal Server Error) INTERNAL_SERVER_ERROR Transaction failed and was rolled back.
 * @apiErrorExample {json} 409 Conflict:
 *     { "success": false, "error": { "code": "INSUFFICIENT_STOCK", "message": "Requested stock is no longer available." } }
 */
router.post("/orders", checkoutController.placeOrder);

module.exports = router;
