const cartService = require("./cart.service");

function getAuthUserId(req) {
  const headerId = req.headers["x-user-id"];
  if (headerId && /^[1-9]\d*$/.test(headerId)) {
    return Number(headerId);
  }
  return 1; // Default demo buyer: John Doe (Demo Horizon Airlines)
}

class CartController {
  async getCart(req, res) {
    try {
      const userId = getAuthUserId(req);
      const cart = await cartService.getCart(userId);
      return res.status(200).json({
        success: true,
        data: cart,
      });
    } catch (error) {
      console.error("[CartController] getCart error:", error);
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to retrieve shopping cart.",
      });
    }
  }

  async addItem(req, res) {
    try {
      const userId = getAuthUserId(req);
      const { listing_id, quantity } = req.body;

      if (!listing_id) {
        return res.status(400).json({
          success: false,
          message: "listing_id is required.",
        });
      }

      const cart = await cartService.addItem(userId, listing_id, quantity || 1);
      return res.status(200).json({
        success: true,
        message: "Item added to procurement cart.",
        data: cart,
      });
    } catch (error) {
      console.error("[CartController] addItem error:", error);
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to add item to cart.",
      });
    }
  }

  async updateQuantity(req, res) {
    try {
      const userId = getAuthUserId(req);
      const { cartItemId } = req.params;
      const { quantity } = req.body;

      if (quantity === undefined) {
        return res.status(400).json({
          success: false,
          message: "quantity is required.",
        });
      }

      const cart = await cartService.updateQuantity(userId, cartItemId, quantity);
      return res.status(200).json({
        success: true,
        message: "Cart item quantity updated.",
        data: cart,
      });
    } catch (error) {
      console.error("[CartController] updateQuantity error:", error);
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to update item quantity.",
      });
    }
  }

  async removeItem(req, res) {
    try {
      const userId = getAuthUserId(req);
      const { cartItemId } = req.params;

      const cart = await cartService.removeItem(userId, cartItemId);
      return res.status(200).json({
        success: true,
        message: "Item removed from cart.",
        data: cart,
      });
    } catch (error) {
      console.error("[CartController] removeItem error:", error);
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to remove item from cart.",
      });
    }
  }

  async clearCart(req, res) {
    try {
      const userId = getAuthUserId(req);
      const cart = await cartService.clearCart(userId);
      return res.status(200).json({
        success: true,
        message: "Cart cleared.",
        data: cart,
      });
    } catch (error) {
      console.error("[CartController] clearCart error:", error);
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to clear cart.",
      });
    }
  }
}

module.exports = new CartController();

