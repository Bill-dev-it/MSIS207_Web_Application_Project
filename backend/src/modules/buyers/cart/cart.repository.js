const pool = require("../../../config/db");

class CartRepository {
  async getOrCreateCart(userId) {
    const query = `
      INSERT INTO carts (user_id)
      VALUES ($1)
      ON CONFLICT (user_id)
      DO UPDATE SET updated_at = CURRENT_TIMESTAMP
      RETURNING cart_id, user_id, updated_at;
    `;
    const result = await pool.query(query, [userId]);
    return result.rows[0];
  }

  async getCartItemsByUserId(userId) {
    const query = `
      SELECT
        ci.cart_item_id,
        ci.cart_id,
        ci.listing_id,
        ci.quantity,
        sl.price AS unit_price,
        sl.stock_quantity,
        sl.seller_sku,
        sl.condition,
        sl.status AS listing_status,
        s.supplier_id,
        s.store_name AS supplier_name,
        p.product_id,
        p.product_name,
        p.part_number,
        p.product_type,
        c.category_name,
        (ci.quantity * sl.price) AS line_total,
        rec_eng.compatible_engine_names
      FROM carts cart
      JOIN cart_items ci ON ci.cart_id = cart.cart_id
      JOIN seller_listings sl ON sl.listing_id = ci.listing_id
      JOIN suppliers s ON s.supplier_id = sl.supplier_id
      JOIN products p ON p.product_id = sl.product_id
      LEFT JOIN categories c ON c.category_id = p.category_id
      LEFT JOIN LATERAL (
        SELECT STRING_AGG(DISTINCT em.model_name, ', ') AS compatible_engine_names
        FROM product_engine_compatibility pec
        JOIN engine_models em ON em.engine_model_id = pec.engine_model_id
        WHERE pec.product_id = p.product_id
      ) rec_eng ON TRUE
      WHERE cart.user_id = $1
      ORDER BY ci.cart_item_id DESC;
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  async findListingById(listingId) {
    const query = `
      SELECT
        sl.listing_id,
        sl.product_id,
        sl.supplier_id,
        sl.seller_sku,
        sl.condition,
        sl.price,
        sl.stock_quantity,
        sl.status,
        s.store_name AS supplier_name,
        p.product_name,
        p.part_number
      FROM seller_listings sl
      JOIN suppliers s ON s.supplier_id = sl.supplier_id
      JOIN products p ON p.product_id = sl.product_id
      WHERE sl.listing_id = $1;
    `;
    const result = await pool.query(query, [listingId]);
    return result.rows[0] || null;
  }

  async upsertCartItem(cartId, listingId, quantity) {
    const query = `
      INSERT INTO cart_items (cart_id, listing_id, quantity)
      VALUES ($1, $2, $3)
      ON CONFLICT (cart_id, listing_id)
      DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity
      RETURNING cart_item_id, cart_id, listing_id, quantity;
    `;
    const result = await pool.query(query, [cartId, listingId, quantity]);
    return result.rows[0];
  }

  async updateItemQuantity(cartItemId, userId, quantity) {
    const query = `
      UPDATE cart_items ci
      SET quantity = $1
      FROM carts c
      WHERE ci.cart_item_id = $2
        AND ci.cart_id = c.cart_id
        AND c.user_id = $3
      RETURNING ci.cart_item_id, ci.cart_id, ci.listing_id, ci.quantity;
    `;
    const result = await pool.query(query, [quantity, cartItemId, userId]);
    return result.rows[0] || null;
  }

  async removeItem(cartItemId, userId) {
    const query = `
      DELETE FROM cart_items ci
      USING carts c
      WHERE ci.cart_item_id = $1
        AND ci.cart_id = c.cart_id
        AND c.user_id = $2
      RETURNING ci.cart_item_id;
    `;
    const result = await pool.query(query, [cartItemId, userId]);
    return result.rows[0] || null;
  }

  async clearCart(userId) {
    const query = `
      DELETE FROM cart_items ci
      USING carts c
      WHERE ci.cart_id = c.cart_id
        AND c.user_id = $1;
    `;
    await pool.query(query, [userId]);
  }
}

module.exports = new CartRepository();

