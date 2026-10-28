
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

export async function getProductById(id, { signal } = {}) {
  const response = await fetch(
    `${API_BASE_URL}/v1/products/${encodeURIComponent(id)}`,
    { signal }
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(
      `Failed to load product (${response.status})`
    );
  }

  const json = await response.json();
  return json.data;
}
