
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import PageHeader from "../../components/common/PageHeader";
import EmptyState from "../../components/common/EmptyState";
import { getProducts } from "../../services/productApi";

const PAGE_SIZE = 12;

export default function Marketplace() {
  const [searchParams, setSearchParams] = useSearchParams();

  const query = searchParams.get("q") || "";

  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState("ALL");
  const [manufacturer, setManufacturer] = useState("ALL");
  const [sort, setSort] = useState("NAME_ASC");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    getProducts({ signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted) {
          setProducts(data);
          setError("");
        }
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          setError(err.message);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, []);

  // Build options from actual product data
  const categories = [
    ...new Set(products.map((p) => p.category_name).filter(Boolean)),
  ].sort();

  const manufacturers = [
    ...new Set(products.map((p) => p.manufacturer).filter(Boolean)),
  ].sort();

  // Filter products
  const filteredProducts = products.filter((product) => {
    const keyword = query.trim().toLowerCase();

    const searchableText = [
      product.product_name,
      product.name,
      product.part_number,
      product.description,
      product.manufacturer,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const matchesSearch = searchableText.includes(keyword);

    const matchesCategory =
      category === "ALL" || product.category_name === category;

    const matchesManufacturer =
      manufacturer === "ALL" ||
      product.manufacturer === manufacturer;

    return (
      matchesSearch &&
      matchesCategory &&
      matchesManufacturer
    );
  });

  // Sort products
  const sortedProducts = [...filteredProducts];

  sortedProducts.sort((a, b) => {
    const nameA = a.product_name || a.name || "";
    const nameB = b.product_name || b.name || "";

    if (sort === "NAME_DESC") {
      return nameB.localeCompare(nameA);
    }

    if (sort === "PART_NUMBER") {
      return (a.part_number || "").localeCompare(
        b.part_number || ""
      );
    }

    return nameA.localeCompare(nameB);
  });

  // Pagination
  const totalPages = Math.max(
    1,
    Math.ceil(sortedProducts.length / PAGE_SIZE)
  );

  const currentPage = Math.min(page, totalPages);

  const startIndex = (currentPage - 1) * PAGE_SIZE;

  const visibleProducts = sortedProducts.slice(
    startIndex,
    startIndex + PAGE_SIZE
  );

  function handleSearch(event) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const value = String(formData.get("search") || "").trim();

    setSearchParams(value ? { q: value } : {});
    setPage(1);
  }

  function resetFilters() {
    setSearchParams({});
    setCategory("ALL");
    setManufacturer("ALL");
    setSort("NAME_ASC");
    setPage(1);
  }

  return (
    <div className="container-page py-8 sm:py-12">
      <PageHeader
        eyebrow="Aviation Parts Catalog"
        title="Marketplace"
        description="Explore aviation parts and components from the AeroRUL catalog."
      />

      {/* Search and filters */}
      <section
        aria-label="Product search and filters"
        className="card mb-8 p-4 sm:p-6"
      >
        <form
          role="search"
          onSubmit={handleSearch}
          className="flex flex-col gap-3 sm:flex-row"
        >
          <label htmlFor="product-search" className="sr-only">
            Search products
          </label>

          <input
            id="product-search"
            key={query}
            name="search"
            type="search"
            defaultValue={query}
            placeholder="Search products or part numbers"
            className="input min-w-0 flex-1"
          />

          <button type="submit" className="btn btn-primary">
            Search
          </button>
        </form>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label htmlFor="category" className="label">
              Category
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              className="input"
            >
              <option value="ALL">All categories</option>
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="manufacturer" className="label">
              Manufacturer
            </label>
            <select
              id="manufacturer"
              value={manufacturer}
              onChange={(e) => {
                setManufacturer(e.target.value);
                setPage(1);
              }}
              className="input"
            >
              <option value="ALL">All manufacturers</option>
              {manufacturers.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="sort" className="label">
              Sort by
            </label>
            <select
              id="sort"
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setPage(1);
              }}
              className="input"
            >
              <option value="NAME_ASC">Name: A–Z</option>
              <option value="NAME_DESC">Name: Z–A</option>
              <option value="PART_NUMBER">Part Number</option>
            </select>
          </div>
        </div>

        <button
          type="button"
          onClick={resetFilters}
          className="btn btn-ghost mt-4"
        >
          Clear Filters
        </button>
      </section>

      {loading && (
        <p role="status" className="text-neutral-500">
          Loading products...
        </p>
      )}

      {!loading && error && (
        <div role="alert" className="card p-6">
          <h2 className="font-semibold text-critical">
            Unable to load products
          </h2>
          <p className="mt-2 text-sm text-neutral-500">
            {error}
          </p>
        </div>
      )}

      {!loading && !error && (
        <>
          <p role="status" className="mb-5 text-sm text-neutral-500">
            {sortedProducts.length} products found
          </p>

          {visibleProducts.length === 0 ? (
            <EmptyState
              title="No matching products"
              description="Try another search term or clear your filters."
              action={
                <button
                  type="button"
                  onClick={resetFilters}
                  className="btn btn-secondary"
                >
                  Clear Filters
                </button>
              }
            />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {visibleProducts.map((product) => (
                <article
                  key={product.product_id}
                  className="card flex flex-col p-5 sm:p-6"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 font-bold text-primary-700">
                    AR
                  </div>

                  <p className="break-all font-mono text-xs text-neutral-500">
                    {product.part_number || "N/A"}
                  </p>

                  <h2 className="mt-2 text-lg font-semibold text-primary-800">
                    {product.product_name || product.name}
                  </h2>

                  <p className="mt-2 text-xs text-accent-600">
                    {product.category_name || "Uncategorized"}
                  </p>

                  <p className="mt-1 text-xs text-neutral-500">
                    {product.manufacturer || "Manufacturer unavailable"}
                  </p>

                  <p className="mt-4 flex-1 text-sm text-neutral-500">
                    {product.description || "No description available."}
                  </p>

                  <Link
                    to={`/marketplace/products/${product.product_id}`}
                    className="btn btn-secondary mt-5"
                  >
                    View Details
                  </Link>
                </article>
              ))}
            </div>
          )}

          {sortedProducts.length > PAGE_SIZE && (
            <nav
              aria-label="Product pagination"
              className="mt-8 flex flex-wrap items-center justify-center gap-4"
            >
              <button
                type="button"
                className="btn btn-secondary"
                disabled={currentPage === 1}
                onClick={() => setPage(currentPage - 1)}
              >
                Previous
              </button>

              <span className="text-sm text-neutral-500">
                Page {currentPage} of {totalPages}
              </span>

              <button
                type="button"
                className="btn btn-secondary"
                disabled={currentPage === totalPages}
                onClick={() => setPage(currentPage + 1)}
              >
                Next
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
