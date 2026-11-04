const marketplaceService = require("./marketplace.service");

/**
 * GET /api/products
 *
 * API Legacy: giữ response dạng success/count/data.
 */
async function getProducts(req, res) {
  try {
    const products = await marketplaceService.getAllProducts();

    return res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    console.error("[Marketplace] getProducts error:", error);

    return res.status(500).json({
      success: false,
      message: "Không thể lấy danh sách sản phẩm.",
    });
  }
}

/**
 * GET /api/v1/products
 *
 * Hỗ trợ đồng thời:
 * q/search, per_page/limit, page, sort, filter.
 *
 * Response có cả meta và pagination.
 */
async function getProductsV1(req, res) {
  try {
    const result = await marketplaceService.getProductsV1(req.query);

    return res.status(200).json({
      success: true,
      count: result.data.length,
      data: result.data,
      meta: result.meta,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("[Marketplace V1] getProductsV1 error:", error);

    const statusCode = error.statusCode || 500;

    return res.status(statusCode).json({
      success: false,
      message: statusCode === 500
        ? "Không thể lấy danh sách sản phẩm."
        : error.message,
    });
  }
}

/**
 * GET /api/v1/products/filter-options
 */
async function getProductFilterOptions(req, res) {
  try {
    const options = await marketplaceService.getProductFilterOptions();

    return res.status(200).json({
      success: true,
      data: options,
    });
  } catch (error) {
    console.error("[Marketplace V1] getProductFilterOptions error:", error);

    return res.status(500).json({
      success: false,
      message: "Không thể lấy dữ liệu bộ lọc sản phẩm.",
    });
  }
}

/**
 * GET /api/v1/products/:id
 */
async function getProductById(req, res) {
  try {
    const productId = req.params.productId ?? req.params.id;

    if (!/^[1-9]\d*$/.test(productId)) {
      return res.status(400).json({
        success: false,
        message: "productId phải là số nguyên dương.",
      });
    }

    const product = await marketplaceService.getProductById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy sản phẩm.",
      });
    }

    return res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error("[Marketplace V1] getProductById error:", error);

    return res.status(500).json({
      success: false,
      message: "Không thể lấy thông tin sản phẩm.",
    });
  }
}

module.exports = {
  getProducts,
  getProductsV1,
  getProductFilterOptions,
  getProductById,
};