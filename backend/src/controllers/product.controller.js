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

module.exports = {
  getProducts,
};