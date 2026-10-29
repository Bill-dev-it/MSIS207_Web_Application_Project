const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "/api"
).replace(/\/$/, "");

export async function getProductOffers(productId, { signal } = {}) {
  const response = await fetch(
    `${API_BASE_URL}/v1/products/${encodeURIComponent(productId)}/listings`,
    { signal }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to load supplier offers (${response.status})`
    );
  }

  const json = await response.json();

  if (!json.success || !Array.isArray(json.data)) {
    throw new Error("Unexpected supplier offers response");
  }

  return json.data;
}
