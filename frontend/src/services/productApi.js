
const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "/api"
).replace(/\/$/, "");

export async function getProducts({
  q = "",
  sort = "product_name",
  filter = [],
  page = 1,
  perPage = 12,
  signal,
} = {}) {
  const params = new URLSearchParams({
    page: String(page),
    per_page: String(perPage),
    sort,
  });

  if (q.trim()) {
    params.set("q", q.trim());
  }

  if (filter.length > 0) {
    params.set("filter", JSON.stringify(filter));
  }

  const response = await fetch(
    `${API_BASE_URL}/v1/products?${params.toString()}`,
    { signal }
  );

  if (!response.ok) {
    throw new Error(`Failed to load products (${response.status})`);
  }

  const json = await response.json();

  if (
    !json.success ||
    !Array.isArray(json.data) ||
    !json.meta ||
    typeof json.meta !== "object"
  ) {
    throw new Error("Unexpected Products API response");
  }

  return json;
}

export async function getProductFilterOptions({ signal } = {}) {
  const response = await fetch(
    `${API_BASE_URL}/v1/products/filter-options`,
    { signal }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to load filter options (${response.status})`
    );
  }

  const json = await response.json();

  if (
    !json.success ||
    !Array.isArray(json.data?.categories) ||
    !Array.isArray(json.data?.manufacturers)
  ) {
    throw new Error("Unexpected Filter Options API response");
  }

  return json.data;
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
