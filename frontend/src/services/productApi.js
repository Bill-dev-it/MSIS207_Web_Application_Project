
const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "/api"
).replace(/\/$/, "");

export async function getProducts({ signal } = {}) {
  const response = await fetch(`${API_BASE_URL}/products`, {
    signal,
  });

  if (!response.ok) {
    throw new Error(`Failed to load products (${response.status})`);
  }

  const payload = await response.json();

  const products = Array.isArray(payload)
    ? payload
    : Array.isArray(payload.data)
      ? payload.data
      : Array.isArray(payload.products)
        ? payload.products
        : null;

  if (!products) {
    throw new Error("Unexpected products API response format");
  }

  return products;
}

// Temporary lookup until GET /products/:id is implemented.
export async function getProductById(id, options) {
  const products = await getProducts(options);

  return (
    products.find(
      (product) =>
        String(product.product_id ?? product.id) === String(id)
    ) ?? null
  );
}
