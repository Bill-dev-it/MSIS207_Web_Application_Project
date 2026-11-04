const pool = require("../../../config/db");

const DELIVERY_METHODS = [
  {
    id: "STANDARD",
    name: "Standard Freight (3-5 Business Days)",
    carrier: "FedEx Aerospace Priority",
    cost: 1250.0,
    lead_time: "3-5 business days",
    description: "Vibration-damped containerization with standard tarmac transit handling.",
  },
  {
    id: "EXPRESS",
    name: "AOG Expedited (24-48 Hours)",
    carrier: "DHL Global Aviation Express",
    cost: 2900.0,
    lead_time: "24-48 hours",
    description: "Aircraft-On-Ground emergency courier dispatch with priority ramp clearance.",
  },
];

async function getAddressesByCompanyId(companyId) {
  const query = `
    SELECT
      address_id,
      company_id,
      recipient_name,
      phone,
      address_line,
      city,
      region,
      postal_code,
      country_code
    FROM addresses
    WHERE company_id = $1
    ORDER BY address_id ASC
  `;
  const result = await pool.query(query, [companyId]);
  return result.rows;
}

async function createAddress(companyId, addressData) {
  const query = `
    INSERT INTO addresses (
      company_id,
      recipient_name,
      phone,
      address_line,
      city,
      region,
      postal_code,
      country_code
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `;
  const values = [
    companyId,
    addressData.recipient_name || "Procurement Receiving Facility",
    addressData.phone || "+1-555-0199",
    addressData.address_line,
    addressData.city,
    addressData.region || addressData.state_province || "HQ",
    addressData.postal_code,
    addressData.country_code || "USA",
  ];
  const result = await pool.query(query, values);
  return result.rows[0];
}

async function getCompanyById(companyId) {
  const query = `
    SELECT company_id, company_name, company_type, tax_id, country_code
    FROM companies
    WHERE company_id = $1
  `;
  const result = await pool.query(query, [companyId]);
  return result.rows[0] || null;
}

function getDeliveryMethods() {
  return DELIVERY_METHODS;
}

function findDeliveryMethod(id) {
  return DELIVERY_METHODS.find((m) => m.id === id) || null;
}

/**
 * Execute transactional order creation
 */
async function placeOrderTransaction({
  userId,
  companyId,
  shippingAddress,
  billingAddress,
  deliveryMethodId,
  purchaseReference,
  paymentMethod,
  checkoutKey,
}) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Get or verify company
    const companyRes = await client.query(
      `SELECT company_id, company_name, tax_id FROM companies WHERE company_id = $1`,
      [companyId]
    );
    if (companyRes.rows.length === 0) {
      throw new Error("Company profile not found in database.");
    }
    const company = companyRes.rows[0];

    // 2. Get buyer's active cart
    const cartRes = await client.query(
      `SELECT cart_id FROM carts WHERE user_id = $1 LIMIT 1`,
      [userId]
    );
    if (cartRes.rows.length === 0) {
      throw new Error("No active procurement cart found.");
    }
    const cartId = cartRes.rows[0].cart_id;

    // 3. Lock cart items and listings with FOR UPDATE
    const itemsQuery = `
      SELECT
        ci.cart_item_id,
        ci.quantity,
        sl.listing_id,
        sl.price AS unit_price,
        sl.stock_quantity,
        sl.seller_sku,
        sl.condition,
        sl.status,
        sl.supplier_id,
        s.store_name AS supplier_name,
        p.product_id,
        p.product_name,
        p.part_number
      FROM cart_items ci
      JOIN seller_listings sl ON ci.listing_id = sl.listing_id
      JOIN suppliers s ON sl.supplier_id = s.supplier_id
      JOIN products p ON sl.product_id = p.product_id
      WHERE ci.cart_id = $1
      FOR UPDATE OF sl
    `;
    const itemsRes = await client.query(itemsQuery, [cartId]);

    if (itemsRes.rows.length === 0) {
      throw new Error("Your cart is empty. Please add parts before placing an order.");
    }

    const cartItems = itemsRes.rows;

    // 4. Validate stock and active status
    let calculatedSubtotal = 0;
    for (const item of cartItems) {
      if (item.status && item.status !== "ACTIVE") {
        throw new Error(
          `Listing for "${item.product_name}" is no longer active.`
        );
      }
      if (item.quantity > item.stock_quantity) {
        throw new Error(
          `Insufficient stock for "${item.product_name}" (Requested: ${item.quantity}, Available: ${item.stock_quantity}).`
        );
      }
      calculatedSubtotal += Number(item.unit_price) * item.quantity;
    }

    // 5. Calculate delivery fees
    const deliveryMethod = findDeliveryMethod(deliveryMethodId) || DELIVERY_METHODS[0];
    const shippingTotal = deliveryMethod.cost;
    const grandTotal = calculatedSubtotal + shippingTotal;

    // 6. Generate unique Order Number
    const countRes = await client.query(`SELECT COUNT(*) as total FROM orders`);
    const nextNum = 1000 + Number(countRes.rows[0].total) + 1;
    const orderNumber = `ORD-${nextNum}`;

    // 7. Insert Master Order
    const insertOrderQuery = `
      INSERT INTO orders (
        buyer_company_id,
        placed_by,
        order_number,
        currency,
        checkout_key,
        purchase_reference,
        company_name_snapshot,
        tax_id_snapshot,
        shipping_address_snapshot,
        billing_address_snapshot,
        subtotal,
        shipping_total,
        grand_total,
        created_at
      )
      VALUES ($1, $2, $3, 'USD', $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
      RETURNING *
    `;
    const orderValues = [
      companyId,
      userId,
      orderNumber,
      checkoutKey || `chk_${Date.now()}_${userId}`,
      purchaseReference || null,
      company.company_name,
      company.tax_id || null,
      JSON.stringify(shippingAddress),
      JSON.stringify(billingAddress || shippingAddress),
      calculatedSubtotal,
      shippingTotal,
      grandTotal,
    ];
    const orderRes = await client.query(insertOrderQuery, orderValues);
    const createdOrder = orderRes.rows[0];

    // 8. Group items by supplier for seller_orders
    const itemsBySupplier = {};
    for (const item of cartItems) {
      if (!itemsBySupplier[item.supplier_id]) {
        itemsBySupplier[item.supplier_id] = {
          supplier_id: item.supplier_id,
          supplier_name: item.supplier_name,
          items: [],
          subtotal: 0,
        };
      }
      itemsBySupplier[item.supplier_id].items.push(item);
      itemsBySupplier[item.supplier_id].subtotal +=
        Number(item.unit_price) * item.quantity;
    }

    // 9. Insert seller_orders and order_items
    const supplierCount = Object.keys(itemsBySupplier).length;
    const splitShippingFee = Math.round((shippingTotal / supplierCount) * 100) / 100;

    for (const supId of Object.keys(itemsBySupplier)) {
      const group = itemsBySupplier[supId];
      const supSubtotal = group.subtotal;
      const supGrandTotal = supSubtotal + splitShippingFee;

      const insertSellerOrderQuery = `
        INSERT INTO seller_orders (
          order_id,
          supplier_id,
          supplier_name_snapshot,
          status,
          subtotal,
          shipping_fee,
          grand_total,
          created_at
        )
        VALUES ($1, $2, $3, 'CONFIRMED', $4, $5, $6, NOW())
        RETURNING seller_order_id
      `;
      const soRes = await client.query(insertSellerOrderQuery, [
        createdOrder.order_id,
        group.supplier_id,
        group.supplier_name,
        supSubtotal,
        splitShippingFee,
        supGrandTotal,
      ]);
      const sellerOrderId = soRes.rows[0].seller_order_id;

      // Insert each order_item
      for (const item of group.items) {
        const lineTotal = Number(item.unit_price) * item.quantity;
        const insertOrderItemQuery = `
          INSERT INTO order_items (
            seller_order_id,
            listing_id,
            quantity,
            unit_price,
            line_total,
            condition_snapshot,
            product_name_snapshot,
            part_number_snapshot,
            seller_sku_snapshot
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `;
        await client.query(insertOrderItemQuery, [
          sellerOrderId,
          item.listing_id,
          item.quantity,
          item.unit_price,
          lineTotal,
          item.condition,
          item.product_name,
          item.part_number,
          item.seller_sku,
        ]);

        // Decrement stock in seller_listings
        await client.query(
          `UPDATE seller_listings
           SET stock_quantity = stock_quantity - $1
           WHERE listing_id = $2`,
          [item.quantity, item.listing_id]
        );
      }
    }

    // 10. Record payment
    const insertPaymentQuery = `
      INSERT INTO payments (
        order_id,
        amount,
        payment_method,
        status,
        paid_at
      )
      VALUES ($1, $2, $3, 'SUCCEEDED', NOW())
    `;
    await client.query(insertPaymentQuery, [
      createdOrder.order_id,
      grandTotal,
      paymentMethod || "SIMULATION",
    ]);

    // 11. Clear cart items
    await client.query(`DELETE FROM cart_items WHERE cart_id = $1`, [cartId]);

    await client.query("COMMIT");

    return createdOrder;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  getAddressesByCompanyId,
  createAddress,
  getCompanyById,
  getDeliveryMethods,
  findDeliveryMethod,
  placeOrderTransaction,
};
