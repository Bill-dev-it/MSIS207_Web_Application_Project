const cartRepository = require("./cart.repository");

class CartService {
  async getCart(userId) {
    await cartRepository.getOrCreateCart(userId);
    const items = await cartRepository.getCartItemsByUserId(userId);

    const subtotal = items.reduce((acc, item) => {
      return acc + (Number(item.line_total) || 0);
    }, 0);

    const totalItems = items.reduce((acc, item) => {
      return acc + (Number(item.quantity) || 0);
    }, 0);

    return {
      items,
      subtotal: Number(subtotal.toFixed(2)),
      total_items: totalItems,
    };
  }

  async addItem(userId, listingId, quantity = 1) {
    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty <= 0) {
      const err = new Error("Quantity must be a positive integer.");
      err.statusCode = 400;
      throw err;
    }

    const listing = await cartRepository.findListingById(listingId);
    if (!listing) {
      const err = new Error("Supplier listing not found.");
      err.statusCode = 404;
      throw err;
    }

    if (listing.status !== "ACTIVE") {
      const err = new Error("This supplier offer is currently inactive.");
      err.statusCode = 400;
      throw err;
    }

    if (listing.stock_quantity < qty) {
      const err = new Error(`Only ${listing.stock_quantity} units available in stock.`);
      err.statusCode = 400;
      throw err;
    }

    const cart = await cartRepository.getOrCreateCart(userId);
    await cartRepository.upsertCartItem(cart.cart_id, listingId, qty);

    return this.getCart(userId);
  }

  async updateQuantity(userId, cartItemId, quantity) {
    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty <= 0) {
      const err = new Error("Quantity must be a positive integer.");
      err.statusCode = 400;
      throw err;
    }

    const updated = await cartRepository.updateItemQuantity(cartItemId, userId, qty);
    if (!updated) {
      const err = new Error("Cart item not found or unauthorized.");
      err.statusCode = 404;
      throw err;
    }

    return this.getCart(userId);
  }

  async removeItem(userId, cartItemId) {
    const removed = await cartRepository.removeItem(cartItemId, userId);
    if (!removed) {
      const err = new Error("Cart item not found or unauthorized.");
      err.statusCode = 404;
      throw err;
    }

    return this.getCart(userId);
  }

  async clearCart(userId) {
    await cartRepository.clearCart(userId);
    return {
      items: [],
      subtotal: 0,
      total_items: 0,
    };
  }
}

module.exports = new CartService();

