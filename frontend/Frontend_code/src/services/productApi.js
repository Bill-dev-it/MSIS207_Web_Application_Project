import { PRODUCTS, SUPPLIERS, CATEGORIES, delay } from "./mockData";

// TODO(backend): replace with GET /products, GET /products/:id, etc.
export const productApi = {
  async list(filters = {}) {
    await delay();
    let results = [...PRODUCTS];
    if (filters.query) {
      const q = filters.query.toLowerCase();
      results = results.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.partNumber.toLowerCase().includes(q) ||
          p.compatibility.some((c) => c.toLowerCase().includes(q))
      );
    }
    if (filters.categoryId) {
      results = results.filter((p) => p.categoryId === filters.categoryId);
    }
    if (filters.engineModel) {
      results = results.filter((p) => p.compatibility.includes(filters.engineModel));
    }
    if (filters.supplierId) {
      results = results.filter((p) => p.supplierId === filters.supplierId);
    }
    if (filters.maxPrice) {
      results = results.filter((p) => p.price <= filters.maxPrice);
    }
    return results.map(withSupplier);
  },

  async getById(id) {
    await delay();
    const product = PRODUCTS.find((p) => p.id === id);
    return product ? withSupplier(product) : null;
  },

  async listCategories() {
    await delay(100);
    return CATEGORIES;
  },

  async listBySupplier(supplierId) {
    await delay();
    return PRODUCTS.filter((p) => p.supplierId === supplierId).map(withSupplier);
  },
};

function withSupplier(product) {
  return { ...product, supplier: SUPPLIERS.find((s) => s.id === product.supplierId) };
}
