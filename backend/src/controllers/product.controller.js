const productService = require("../services/product.service");

async function getProducts(req, res) {
  try {
    const products = await productService.getAllProducts();

    res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    console.error("Get products failed:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve products",
    });
  }
}

async function getProductById(req, res) {
  const { productId } = req.params;
  const validId = /^[1-9]\d*$/.test(productId);

  if (!validId || BigInt(productId) > 9223372036854775807n) {
    return res.status(400).json({
      success: false,
      error: {
        code: "INVALID_PRODUCT_ID",
        message: "Product ID must be a valid positive integer.",
      },
    });
  }

  try {
    const product = await productService.getProductById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: {
          code: "PRODUCT_NOT_FOUND",
          message: "Product not found.",
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error("Get product by ID failed:", error);

    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Unable to retrieve product.",
      },
    });
  }
}

module.exports = {
  getProducts,
  getProductById,
};