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

async function getProductsV1(req, res) {
  const {
    q = "",
    sort = "product_name",
    filter = "[]",
    page = "1",
    per_page = "12",
  } = req.query;

  if (
    [q, sort, filter, page, per_page].some(
      (value) => typeof value !== "string"
    )
  ) {
    return res.status(400).json({
      success: false,
      error: {
        code: "INVALID_QUERY",
        message: "Query parameters must be strings.",
      },
    });
  }

  const pageNumber = Number(page);
  const perPageNumber = Number(per_page);

  if (
    !/^[1-9]\d*$/.test(page) ||
    !/^[1-9]\d*$/.test(per_page) ||
    !Number.isSafeInteger(pageNumber) ||
    !Number.isSafeInteger(perPageNumber) ||
    perPageNumber > 100 ||
    (pageNumber - 1) * perPageNumber > Number.MAX_SAFE_INTEGER
  ) {
    return res.status(400).json({
      success: false,
      error: {
        code: "INVALID_PAGINATION",
        message: "page must be positive and per_page must be 1–100.",
      },
    });
  }

  if (q.length > 200) {
    return res.status(400).json({
      success: false,
      error: {
        code: "INVALID_SEARCH",
        message: "Search text must not exceed 200 characters.",
      },
    });
  }

  const allowedSorts = [
    "product_name",
    "part_number",
    "manufacturer",
    "category_name",
  ];

  const sortFields = sort.split(",");

  if (
    sortFields.length > 4 ||
    sortFields.some((field) => {
      const name = field.replace(/^[-+]/, "");
      return !allowedSorts.includes(name);
    })
  ) {
    return res.status(400).json({
      success: false,
      error: {
        code: "INVALID_SORT",
        message: "Unsupported sorting field.",
      },
    });
  }

  let filters;

  try {
    filters = JSON.parse(filter);
  } catch {
    return res.status(400).json({
      success: false,
      error: {
        code: "INVALID_FILTER",
        message: "filter must be a valid JSON array.",
      },
    });
  }

  const allowedFilterKeys = [
    "category_name",
    "manufacturer",
    "product_type",
  ];

  const allowedOperators = ["=", "LIKE"];

  if (
    !Array.isArray(filters) ||
    filters.length > 10 ||
    filters.some(
      (item) =>
        !item ||
        typeof item !== "object" ||
        Array.isArray(item) ||
        !allowedFilterKeys.includes(item.key) ||
        !allowedOperators.includes(item.operator) ||
        typeof item.value !== "string" ||
        item.value.length > 200
    )
  ) {
    return res.status(400).json({
      success: false,
      error: {
        code: "INVALID_FILTER",
        message: "Unsupported filter field, operator or value.",
      },
    });
  }

  try {
    const result = await productService.getProductsCollection({
      q: q.trim(),
      sort,
      filter: filters,
      page: pageNumber,
      perPage: perPageNumber,
    });

    return res.status(200).json({
      success: true,
      count: result.products.length,
      meta: {
        page: pageNumber,
        per_page: perPageNumber,
        total_items: result.totalItems,
        total_pages: Math.ceil(result.totalItems / perPageNumber),
      },
      data: result.products,
    });
  } catch (error) {
    console.error("Get products collection failed:", error);

    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Unable to retrieve products.",
      },
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
  getProductsV1,
  getProductById,
};