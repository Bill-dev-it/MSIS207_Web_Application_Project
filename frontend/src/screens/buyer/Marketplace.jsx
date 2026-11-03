
import { useEffect, useMemo, useState } from "react";
import productService from "../../services/productService";

const ITEMS_PER_PAGE = 12;

export default function Marketplace() {
    const [products, setProducts] = useState([]);
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("ALL");
    const [manufacturer, setManufacturer] = useState("ALL");
    const [page, setPage] = useState(1);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Load real products from PostgreSQL through Express API.
    useEffect(() => {
        let active = true;

        async function loadProducts() {
            try {
                setLoading(true);
                setError("");

                const result = await productService.getProducts();

                if (active) {
                    setProducts(result);
                }
            } catch (err) {
                if (active) {
                    setError(err.message || "Unable to load products.");
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        }

        loadProducts();

        return () => {
            active = false;
        };
    }, []);

    // Build filters from actual database records.
    const categories = useMemo(() => {
        return [
            ...new Set(
                products
                    .map((item) => item.category_name)
                    .filter(Boolean)
            ),
        ].sort();
    }, [products]);

    const manufacturers = useMemo(() => {
        return [
            ...new Set(
                products
                    .map((item) => item.manufacturer)
                    .filter(Boolean)
            ),
        ].sort();
    }, [products]);

    // Client-side filtering over the actual API response.
    const filteredProducts = useMemo(() => {
        const keyword = search.trim().toLowerCase();

        return products.filter((product) => {
            const matchesSearch =
                !keyword ||
                [
                    product.product_name,
                    product.part_number,
                    product.manufacturer,
                    product.product_type,
                    product.category_name,
                ]
                    .filter(Boolean)
                    .some((value) =>
                        String(value).toLowerCase().includes(keyword)
                    );

            const matchesCategory =
                category === "ALL" ||
                product.category_name === category;

            const matchesManufacturer =
                manufacturer === "ALL" ||
                product.manufacturer === manufacturer;

            return (
                matchesSearch &&
                matchesCategory &&
                matchesManufacturer
            );
        });
    }, [products, search, category, manufacturer]);

    const totalPages = Math.ceil(
        filteredProducts.length / ITEMS_PER_PAGE
    );

    const currentProducts = filteredProducts.slice(
        (page - 1) * ITEMS_PER_PAGE,
        page * ITEMS_PER_PAGE
    );

    function resetFilters() {
        setSearch("");
        setCategory("ALL");
        setManufacturer("ALL");
        setPage(1);
    }

    function updateSearch(value) {
        setSearch(value);
        setPage(1);
    }

    function updateCategory(value) {
        setCategory(value);
        setPage(1);
    }

    function updateManufacturer(value) {
        setManufacturer(value);
        setPage(1);
    }

    return (
        <main className="min-h-screen bg-neutral-50">
            <div className="container-page py-8">

                {/* Page heading */}
                <div className="mb-6">
                    <p className="text-sm font-medium text-accent">
                        AERORUL / PROCUREMENT
                    </p>

                    <h1 className="mt-2 text-3xl font-bold text-primary-900">
                        Aviation Parts Marketplace
                    </h1>

                    <p className="mt-2 text-sm text-neutral-500">
                        Browse aviation parts available in the catalog.
                    </p>
                </div>

                {/* Search */}
                <section className="card mb-6 p-4">
                    <label
                        htmlFor="product-search"
                        className="label"
                    >
                        Search products
                    </label>

                    <input
                        id="product-search"
                        type="search"
                        value={search}
                        onChange={(event) =>
                            updateSearch(event.target.value)
                        }
                        placeholder="Search product name, part number, manufacturer..."
                        className="input"
                    />

                    <div className="mt-3 flex flex-wrap gap-3">
                        <div className="min-w-[200px] flex-1">
                            <label
                                htmlFor="category-filter"
                                className="label"
                            >
                                Category
                            </label>

                            <select
                                id="category-filter"
                                value={category}
                                onChange={(event) =>
                                    updateCategory(event.target.value)
                                }
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

                        <div className="min-w-[200px] flex-1">
                            <label
                                htmlFor="manufacturer-filter"
                                className="label"
                            >
                                Manufacturer
                            </label>

                            <select
                                id="manufacturer-filter"
                                value={manufacturer}
                                onChange={(event) =>
                                    updateManufacturer(event.target.value)
                                }
                                className="input"
                            >
                                <option value="ALL">
                                    All manufacturers
                                </option>

                                {manufacturers.map((item) => (
                                    <option key={item} value={item}>
                                        {item}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-end">
                            <button
                                type="button"
                                onClick={resetFilters}
                                className="btn-secondary"
                            >
                                Clear filters
                            </button>
                        </div>
                    </div>
                </section>

                {/* Loading */}
                {loading && (
                    <div className="card p-10 text-center">
                        <p className="text-neutral-600">
                            Loading products from PostgreSQL...
                        </p>
                    </div>
                )}

                {/* Error */}
                {!loading && error && (
                    <div className="rounded-card border border-red-200 bg-red-50 p-6">
                        <h2 className="font-semibold text-red-700">
                            Unable to load marketplace
                        </h2>

                        <p className="mt-2 text-sm text-red-600">
                            {error}
                        </p>

                        <button
                            type="button"
                            onClick={() => window.location.reload()}
                            className="btn-secondary mt-4"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {/* Product results */}
                {!loading && !error && (
                    <>
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="font-semibold text-primary-900">
                                Product Catalog
                            </h2>

                            <span className="text-sm text-neutral-500">
                                {filteredProducts.length} products found
                            </span>
                        </div>

                        {currentProducts.length === 0 ? (
                            <div className="card p-10 text-center">
                                <h3 className="font-semibold text-primary-900">
                                    No products found
                                </h3>

                                <p className="mt-2 text-sm text-neutral-500">
                                    Try changing your search or filters.
                                </p>

                                <button
                                    type="button"
                                    onClick={resetFilters}
                                    className="btn-primary mt-4"
                                >
                                    Reset filters
                                </button>
                            </div>
                        ) : (
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {currentProducts.map((product) => (
                                    <article
                                        key={product.product_id}
                                        className="card flex flex-col p-5 transition-shadow hover:shadow-dropdown"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <span className="rounded-md bg-primary-50 px-2 py-1 text-xs font-medium text-primary-700">
                                                {product.category_name || "Uncategorized"}
                                            </span>

                                            <span className="text-xs text-green-700">
                                                Active
                                            </span>
                                        </div>

                                        <h3 className="mt-4 text-lg font-semibold text-primary-900">
                                            {product.product_name}
                                        </h3>

                                        <div className="mt-3 space-y-2 text-sm">
                                            <div>
                                                <span className="text-neutral-500">
                                                    Part number:
                                                </span>

                                                <p className="mono mt-1 text-primary-800">
                                                    {product.part_number || "Not provided"}
                                                </p>
                                            </div>

                                            <div>
                                                <span className="text-neutral-500">
                                                    Manufacturer:
                                                </span>

                                                <p className="mt-1 font-medium text-primary-800">
                                                    {product.manufacturer || "Not provided"}
                                                </p>
                                            </div>

                                            <div>
                                                <span className="text-neutral-500">
                                                    Product type:
                                                </span>

                                                <p className="mt-1 text-primary-800">
                                                    {product.product_type || "Not specified"}
                                                </p>
                                            </div>
                                        </div>

                                        <p className="mt-4 line-clamp-3 text-sm text-neutral-500">
                                            {product.description ||
                                                "No product description available."}
                                        </p>
                                    </article>
                                ))}
                            </div>
                        )}

                        {/* Local pagination over the fetched database records */}
                        {totalPages > 1 && (
                            <div className="mt-8 flex items-center justify-center gap-4">
                                <button
                                    type="button"
                                    disabled={page === 1}
                                    onClick={() =>
                                        setPage((current) => current - 1)
                                    }
                                    className="btn-secondary"
                                >
                                    Previous
                                </button>

                                <span className="text-sm text-neutral-600">
                                    Page {page} of {totalPages}
                                </span>

                                <button
                                    type="button"
                                    disabled={page === totalPages}
                                    onClick={() =>
                                        setPage((current) => current + 1)
                                    }
                                    className="btn-secondary"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </main>
    );
}
