const http = require("http");

const BASE_URL = "http://localhost:3000/api/v1";

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on("error", reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log("=== STARTING FULL AERORUL CART, CHECKOUT & ORDERS TEST SUITE ===");

  // 1. Initial Cart State
  console.log("\n[TEST 1] Testing GET /cart...");
  const cart1 = await request("GET", "/cart");
  console.log("Status:", cart1.status, "Success:", cart1.data.success);
  if (cart1.status !== 200 || !cart1.data.success) {
    throw new Error("Failed GET /cart");
  }

  // 2. Add Item 1 (listing_id = 1)
  console.log("\n[TEST 2] Testing POST /cart/items (listing_id = 1, qty = 2)...");
  const add1 = await request("POST", "/cart/items", { listing_id: 1, quantity: 2 });
  console.log("Status:", add1.status, "Items in cart:", add1.data.data?.items?.length);
  if (add1.status !== 200 && add1.status !== 201) {
    throw new Error("Failed adding item 1 to cart");
  }
  const cartItemId1 = add1.data.data.items[0].cart_item_id;

  // 3. Add Item 2 (listing_id = 4)
  console.log("\n[TEST 3] Testing POST /cart/items (listing_id = 4, qty = 1)...");
  const add2 = await request("POST", "/cart/items", { listing_id: 4, quantity: 1 });
  console.log("Status:", add2.status, "Total subtotal:", add2.data.data?.subtotal);

  // 4. Update quantity
  console.log("\n[TEST 4] Testing PUT /cart/items/:id (update qty to 3)...");
  const updateRes = await request("PUT", `/cart/items/${cartItemId1}`, { quantity: 3 });
  console.log("Status:", updateRes.status, "Updated subtotal:", updateRes.data.data?.subtotal);

  // 5. Checkout Addresses
  console.log("\n[TEST 5] Testing GET /checkout/addresses...");
  const addrsRes = await request("GET", "/checkout/addresses");
  console.log("Status:", addrsRes.status, "Addresses found:", addrsRes.data.data?.length);
  if (addrsRes.data.data?.length === 0) {
    throw new Error("Expected at least 1 address");
  }
  const shippingAddress = addrsRes.data.data[0];

  // 6. Delivery Methods
  console.log("\n[TEST 6] Testing GET /checkout/delivery-methods...");
  const methodsRes = await request("GET", "/checkout/delivery-methods");
  console.log("Status:", methodsRes.status, "Delivery methods available:", methodsRes.data.data?.length);

  // 7. Place Transactional Order
  console.log("\n[TEST 7] Testing POST /checkout/orders (Atomic PostgreSQL Transaction)...");
  const orderPayload = {
    shipping_address: shippingAddress,
    billing_address: shippingAddress,
    delivery_method_id: "STANDARD",
    purchase_reference: "PO-VERIFY-2026",
    payment_method: "SIMULATION",
    checkout_key: `chk_test_${Date.now()}`,
  };
  const orderRes = await request("POST", "/checkout/orders", orderPayload);
  console.log("Status:", orderRes.status, "Created Order:", orderRes.data.data?.order_number, "Grand Total:", orderRes.data.data?.grand_total);
  if (orderRes.status !== 201 || !orderRes.data.data?.order_id) {
    throw new Error("Order creation failed: " + JSON.stringify(orderRes.data));
  }
  const createdOrderId = orderRes.data.data.order_id;

  // 8. Order Confirmation
  console.log(`\n[TEST 8] Testing GET /orders/${createdOrderId}/confirmation...`);
  const confirmRes = await request("GET", `/orders/${createdOrderId}/confirmation`);
  console.log("Status:", confirmRes.status, "Confirmed Order #:", confirmRes.data.data?.order_number, "Status:", confirmRes.data.data?.primary_status);
  if (confirmRes.status !== 200 || confirmRes.data.data?.order_number !== orderRes.data.data.order_number) {
    throw new Error("Confirmation retrieval mismatch");
  }

  // 9. Order Detail
  console.log(`\n[TEST 9] Testing GET /orders/${createdOrderId} (Full Hierarchy)...`);
  const detailRes = await request("GET", `/orders/${createdOrderId}`);
  console.log("Status:", detailRes.status, "Seller Orders Count:", detailRes.data.data?.seller_orders?.length, "Payment:", detailRes.data.data?.payment?.status);
  if (detailRes.status !== 200 || !detailRes.data.data?.seller_orders?.length) {
    throw new Error("Order detail retrieval failed");
  }

  // 10. Orders Listing & Counts
  console.log("\n[TEST 10] Testing GET /orders (Listing & Dynamic Status Badges)...");
  const listRes = await request("GET", "/orders");
  console.log("Status:", listRes.status, "Total Orders in Catalog:", listRes.data.data?.counts?.ALL, "Confirmed Count:", listRes.data.data?.counts?.CONFIRMED);
  if (listRes.status !== 200 || listRes.data.data?.counts?.ALL < 1) {
    throw new Error("Orders list failed");
  }

  // 11. Search by Order Number
  console.log(`\n[TEST 11] Testing GET /orders?search=${orderRes.data.data.order_number}...`);
  const searchRes = await request("GET", `/orders?search=${orderRes.data.data.order_number}`);
  console.log("Status:", searchRes.status, "Matching orders:", searchRes.data.data?.orders?.length);
  if (searchRes.status !== 200 || searchRes.data.data?.orders?.length !== 1) {
    throw new Error("Order search failed");
  }

  // 12. Verify Cart Cleared
  console.log("\n[TEST 12] Testing GET /cart (Verifying cart items cleared post-order)...");
  const cartPost = await request("GET", "/cart");
  console.log("Status:", cartPost.status, "Cart items remaining:", cartPost.data.data?.items?.length);
  if (cartPost.data.data?.items?.length !== 0) {
    throw new Error("Expected cart to be empty post-order");
  }

  console.log("\n✅ ALL 12 INTEGRATION TESTS PASSED WITH 100% SUCCESS!");
}

runTests().catch((err) => {
  console.error("\n❌ TEST SUITE FAILED:", err);
  process.exit(1);
});

