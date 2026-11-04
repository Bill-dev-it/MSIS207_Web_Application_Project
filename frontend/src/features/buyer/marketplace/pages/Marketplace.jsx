import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import productService from "../services/productService";
import { useAuth } from "../../../../contexts/AuthContext";
import { useCart } from "../../cart";
import AviationComponentIllustration from "../components/AviationComponentIllustration";


const ITEMS_PER_PAGE = 12;

export default function Marketplace() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    // Data state
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Filter & Search states
    const [search, setSearch] = useState("");
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [selectedEngineModels, setSelectedEngineModels] = useState(["CFM56-7B"]);
    const [selectedConditions, setSelectedConditions] = useState(["NEW", "REFURBISHED"]);
    const [inStockOnly, setInStockOnly] = useState(true);
    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");
    const [sortBy, setSortBy] = useState("RECOMMENDED");
    const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'list'
    const [page, setPage] = useState(1);

    // Recommendation Banner visibility
    const [showRecommendationBanner, setShowRecommendationBanner] = useState(true);
    const [showAllCategories, setShowAllCategories] = useState(false);

    // Cart state from real CartContext
    const { itemCount: cartCount } = useCart();
    const [toastMessage, setToastMessage] = useState("");

    // 1. Fetch real PostgreSQL data through backend Express API
    useEffect(() => {
        let active = true;

        async function loadProducts() {
            try {
                setLoading(true);
                setError("");
                const result = await productService.getProducts();

                if (active) {
                    setProducts(result || []);
                }
            } catch (err) {
                if (active) {
                    setError(err.message || "Failed to load products from database.");
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

    // 2. Extract dynamic distinct categories with exact counts from real records
    const categoryCounts = useMemo(() => {
        const counts = {};
        for (const item of products) {
            if (item.category_name) {
                counts[item.category_name] = (counts[item.category_name] || 0) + 1;
            }
        }
        return counts;
    }, [products]);

    const availableCategories = useMemo(() => {
        return Object.keys(categoryCounts).sort();
    }, [categoryCounts]);

    // Safe helpers for compatibility engines and conditions
    const getEngineModels = (item) => {
        if (!item?.compatible_engines) return [];
        if (Array.isArray(item.compatible_engines)) {
            return item.compatible_engines
                .map((e) => (typeof e === "object" ? e.model_name : String(e)))
                .filter(Boolean);
        }
        return String(item.compatible_engines)
            .split(",")
            .map((m) => m.trim())
            .filter(Boolean);
    };

    const formatEngineString = (engines) => {
        if (!engines) return "";
        if (Array.isArray(engines)) {
            return engines
                .map((e) => (typeof e === "object" ? (e.model_name || e.name) : String(e)))
                .filter(Boolean)
                .join(", ");
        }
        return String(engines);
    };

    // 3. Extract dynamic engine models from real compatibility data
    const engineModelCounts = useMemo(() => {
        const counts = {};
        for (const item of products) {
            const models = getEngineModels(item);
            for (const m of models) {
                counts[m] = (counts[m] || 0) + 1;
            }
        }
        return counts;
    }, [products]);

    const availableEngineModels = useMemo(() => {
        return Object.keys(engineModelCounts).sort();
    }, [engineModelCounts]);

    // 4. Condition counts from seller_listings
    const conditionCounts = useMemo(() => {
        const counts = { NEW: 0, REFURBISHED: 0, USED: 0 };
        for (const item of products) {
            const condStr = Array.isArray(item.conditions)
                ? item.conditions.join(", ").toUpperCase()
                : String(item.conditions || "").toUpperCase();
            if (condStr.includes("NEW")) counts.NEW++;
            if (condStr.includes("REFURBISHED")) counts.REFURBISHED++;
            if (condStr.includes("USED")) counts.USED++;
        }
        return counts;
    }, [products]);

    // 5. Total listings calculation from real data
    const totalListingsInCatalog = useMemo(() => {
        return products.reduce((acc, curr) => acc + (Number(curr.listing_count) || 0), 0);
    }, [products]);

    // 6. Handle filter toggles
    const toggleCategory = (cat) => {
        setPage(1);
        setSelectedCategories((prev) =>
            prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
        );
    };

    const toggleEngineModel = (model) => {
        setPage(1);
        setSelectedEngineModels((prev) =>
            prev.includes(model) ? prev.filter((m) => m !== model) : [...prev, model]
        );
    };

    const toggleCondition = (cond) => {
        setPage(1);
        setSelectedConditions((prev) =>
            prev.includes(cond) ? prev.filter((c) => c !== cond) : [...prev, cond]
        );
    };

    const clearAllFilters = () => {
        setSearch("");
        setSelectedCategories([]);
        setSelectedEngineModels([]);
        setSelectedConditions([]);
        setInStockOnly(false);
        setMinPrice("");
        setMaxPrice("");
        setShowRecommendationBanner(false);
        setPage(1);
    };

    // 7. Filter & Search logic
    const filteredProducts = useMemo(() => {
        const keyword = search.trim().toLowerCase();

        return products.filter((product) => {
            // Text Search
            if (keyword) {
                const matches = [
                    product.product_name,
                    product.part_number,
                    product.manufacturer,
                    product.category_name,
                    product.product_type,
                    product.compatible_engines,
                    product.suppliers,
                ]
                    .filter(Boolean)
                    .some((val) => String(val).toLowerCase().includes(keyword));

                if (!matches) return false;
            }

            // Category filter
            if (selectedCategories.length > 0) {
                if (!selectedCategories.includes(product.category_name)) {
                    return false;
                }
            }

            // Engine Model Compatibility filter
            if (selectedEngineModels.length > 0) {
                const itemEngines = getEngineModels(product).map((e) => e.toLowerCase());
                const matchesAny = selectedEngineModels.some((m) =>
                    itemEngines.includes(m.toLowerCase())
                );
                if (!matchesAny) return false;
            }

            // Condition filter
            if (selectedConditions.length > 0) {
                const itemConditions = Array.isArray(product.conditions)
                    ? product.conditions.map((c) => String(c).toUpperCase())
                    : String(product.conditions || "").toUpperCase();
                const matchesCondition = selectedConditions.some((c) =>
                    Array.isArray(itemConditions)
                        ? itemConditions.includes(c)
                        : itemConditions.includes(c)
                );
                if (!matchesCondition) return false;
            }

            // Stock filter
            if (inStockOnly && (Number(product.total_stock) || 0) <= 0) {
                return false;
            }

            // Price filter
            const price = Number(product.min_price) || 0;
            if (minPrice && price < Number(minPrice)) return false;
            if (maxPrice && price > Number(maxPrice)) return false;

            return true;
        });
    }, [
        products,
        search,
        selectedCategories,
        selectedEngineModels,
        selectedConditions,
        inStockOnly,
        minPrice,
        maxPrice,
    ]);

    // 8. Sorting logic
    const sortedProducts = useMemo(() => {
        const list = [...filteredProducts];

        switch (sortBy) {
            case "PRICE_ASC":
                return list.sort((a, b) => (Number(a.min_price) || 0) - (Number(b.min_price) || 0));
            case "PRICE_DESC":
                return list.sort((a, b) => (Number(b.min_price) || 0) - (Number(a.min_price) || 0));
            case "NAME_ASC":
                return list.sort((a, b) => a.product_name.localeCompare(b.product_name));
            case "NAME_DESC":
                return list.sort((a, b) => b.product_name.localeCompare(a.product_name));
            case "PART_NUMBER":
                return list.sort((a, b) => (a.part_number || "").localeCompare(b.part_number || ""));
            case "RECOMMENDED":
            default:
                // Prioritize compatible engines and active listing count
                return list.sort((a, b) => (Number(b.listing_count) || 0) - (Number(a.listing_count) || 0));
        }
    }, [filteredProducts, sortBy]);

    // 9. Pagination calculations
    const totalPages = Math.ceil(sortedProducts.length / ITEMS_PER_PAGE) || 1;
    const paginatedProducts = useMemo(() => {
        const start = (page - 1) * ITEMS_PER_PAGE;
        return sortedProducts.slice(start, start + ITEMS_PER_PAGE);
    }, [sortedProducts, page]);

    const handleAddToCart = (product) => {
        navigate(`/marketplace/products/${product.product_id}`);
    };

    // Helper to format currency
    const formatPrice = (val) => {
        const num = Number(val);
        if (!num || isNaN(num)) return "Request Quote";
        return `$${num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-800">
            {/* TOAST ALERT */}
            {toastMessage && (
                <div className="fixed bottom-6 right-6 z-50 bg-[#0B192C] text-white px-5 py-3 rounded-xl shadow-lg border border-slate-700 flex items-center gap-3 animate-fade-in">
                    <span className="text-emerald-400">✓</span>
                    <span className="text-sm font-medium">{toastMessage}</span>
                </div>
            )}

            <div className="flex flex-1">
                {/* ======================================================== */}
                {/* 1. LEFT NAVIGATION SIDEBAR (Buyer Portal Shell)          */}
                {/* ======================================================== */}
                <aside className="w-64 bg-white border-r border-slate-200/90 flex flex-col justify-between flex-shrink-0 min-h-screen">
                    <div>
                        {/* AeroRUL Logo */}
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <Link to="/" className="text-2xl font-black tracking-tight text-slate-900">
                                Aero<span className="text-blue-600">RUL</span>
                            </Link>
                        </div>

                        {/* Fleet Status Badge */}
                        <div className="px-5 mt-5">
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                FLEET STATUS
                            </p>
                            <div className="mt-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200/70 rounded-lg flex items-center justify-between">
                                <span className="font-mono text-xs font-semibold text-slate-700">
                                    24 engines active
                                </span>
                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            </div>
                        </div>

                        {/* Navigation Links */}
                        <nav className="px-3 mt-5 space-y-1">
                            <Link
                                to="/buyer"
                                className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                            >
                                <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                </svg>
                                Dashboard
                            </Link>

                            <Link
                                to="/marketplace"
                                className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-semibold bg-[#0B192C] text-white shadow-sm"
                            >
                                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                </svg>
                                Marketplace
                            </Link>
                        </nav>
                    </div>

                    {/* Logout Footer */}
                    <div className="p-4 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={() => {
                                logout();
                                navigate("/login");
                            }}
                            className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-red-600 transition-colors w-full px-3 py-2 rounded-lg hover:bg-slate-50"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Logout
                        </button>
                    </div>
                </aside>

                {/* ======================================================== */}
                {/* 2. MAIN MARKETPLACE CONTENT AREA                         */}
                {/* ======================================================== */}
                <div className="flex-1 flex flex-col min-w-0">
                    {/* TOP HEADER BAR */}
                    <header className="h-16 bg-white border-b border-slate-200/90 px-8 flex items-center justify-between gap-6 sticky top-0 z-20">
                        {/* Wide Search Bar */}
                        <div className="max-w-2xl w-full relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </span>
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setPage(1);
                                }}
                                placeholder="Search Part Number, Engine Model, or Supplier"
                                className="w-full pl-10 pr-4 py-2 bg-slate-50/80 border border-slate-200 rounded-full text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                            />
                        </div>

                        {/* Top Right: Notifications, Cart, User Profile */}
                        <div className="flex items-center gap-5 flex-shrink-0">
                            {/* Notification Bell */}
                            <button
                                type="button"
                                aria-label="Notifications"
                                className="relative text-slate-600 hover:text-slate-900 transition-colors p-1.5 rounded-full hover:bg-slate-100"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                            </button>

                            {/* Cart Icon with Counter */}
                            <div className="relative">
                                <Link
                                    to="/cart"
                                    aria-label="Procurement Cart"
                                    className="text-slate-600 hover:text-slate-900 transition-colors p-1.5 rounded-full hover:bg-slate-100 block"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                    </svg>
                                </Link>
                                {cartCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-[#0B192C] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center pointer-events-none">
                                        {cartCount}
                                    </span>
                                )}
                            </div>

                            {/* User Profile Pill */}
                            <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
                                <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center font-bold text-xs text-slate-700">
                                    {(user?.email?.[0] || "J").toUpperCase()}
                                </div>
                                <div className="hidden sm:block text-left leading-tight">
                                    <p className="text-xs font-bold text-slate-900">
                                        {user?.email?.split("@")[0] || "John Doe"}
                                    </p>
                                    <p className="text-[11px] text-slate-500">
                                        Demo Horizon Airlines
                                    </p>
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* MAIN SCROLLABLE CONTENT */}
                    <main className="p-8 max-w-7xl w-full mx-auto">
                        {/* Recommendation Urgency Banner */}
                        {showRecommendationBanner && (
                            <section className="bg-blue-50/90 border border-blue-200/90 rounded-xl p-4 mb-6 flex items-start justify-between gap-4 shadow-xs">
                                <div>
                                    <h2 className="text-sm font-semibold text-slate-900">
                                        Showing options compatible with{" "}
                                        <span className="font-bold text-blue-900">ENG-037 (CFM56-7B)</span>
                                        {" "}• urgency{" "}
                                        <span className="text-red-600 font-bold">Prioritize</span>
                                    </h2>
                                    <p className="text-xs text-slate-600 mt-0.5">
                                        Filter applied from your replacement recommendation. Normal browsing is always available.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowRecommendationBanner(false);
                                        setSelectedEngineModels([]);
                                    }}
                                    className="text-xs font-semibold text-blue-700 hover:text-blue-900 whitespace-nowrap transition-colors"
                                >
                                    Clear filter ✕
                                </button>
                            </section>
                        )}

                        {/* Search and Toolbar Row */}
                        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-4">
                            {/* Inner Search Box */}
                            <div className="relative flex-1 max-w-xl">
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => {
                                        setSearch(e.target.value);
                                        setPage(1);
                                    }}
                                    placeholder="Filter by keyword, model, or part number..."
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-xs"
                                />
                                {search && (
                                    <button
                                        type="button"
                                        onClick={() => setSearch("")}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>

                            {/* Sort & Grid/List Toolbar */}
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2 bg-white px-3 py-1.5 border border-slate-200 rounded-lg shadow-xs">
                                    <span className="text-xs font-medium text-slate-500">Sort</span>
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                        className="text-xs font-bold text-slate-800 bg-transparent border-none focus:outline-none cursor-pointer"
                                    >
                                        <option value="RECOMMENDED">Recommended</option>
                                        <option value="PRICE_ASC">Price: Low to High</option>
                                        <option value="PRICE_DESC">Price: High to Low</option>
                                        <option value="NAME_ASC">Name: A to Z</option>
                                        <option value="NAME_DESC">Name: Z to A</option>
                                        <option value="PART_NUMBER">Part Number</option>
                                    </select>
                                </div>

                                {/* View Mode Buttons */}
                                <div className="flex items-center bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
                                    <button
                                        type="button"
                                        onClick={() => setViewMode("grid")}
                                        className={`px-3 py-2 text-xs font-semibold transition-colors ${viewMode === "grid"
                                                ? "bg-[#0B192C] text-white"
                                                : "text-slate-600 hover:bg-slate-50"
                                            }`}
                                    >
                                        Grid
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setViewMode("list")}
                                        className={`px-3 py-2 text-xs font-semibold transition-colors ${viewMode === "list"
                                                ? "bg-[#0B192C] text-white"
                                                : "text-slate-600 hover:bg-slate-50"
                                            }`}
                                    >
                                        List
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Active Filter Indicators Row */}
                        {(selectedCategories.length > 0 ||
                            selectedEngineModels.length > 0 ||
                            selectedConditions.length > 0 ||
                            inStockOnly ||
                            search) && (
                                <div className="flex flex-wrap items-center gap-2 mb-4 text-xs">
                                    <span className="font-semibold text-slate-500 uppercase tracking-wider text-[11px]">
                                        Active filters
                                    </span>

                                    {selectedEngineModels.map((model) => (
                                        <span
                                            key={model}
                                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-full font-medium text-slate-700 shadow-xs"
                                        >
                                            Compatible: {model}
                                            <button
                                                type="button"
                                                onClick={() => toggleEngineModel(model)}
                                                className="text-slate-400 hover:text-slate-600 font-bold"
                                            >
                                                ✕
                                            </button>
                                        </span>
                                    ))}

                                    {selectedCategories.map((cat) => (
                                        <span
                                            key={cat}
                                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-full font-medium text-slate-700 shadow-xs"
                                        >
                                            {cat}
                                            <button
                                                type="button"
                                                onClick={() => toggleCategory(cat)}
                                                className="text-slate-400 hover:text-slate-600 font-bold"
                                            >
                                                ✕
                                            </button>
                                        </span>
                                    ))}

                                    {selectedConditions.map((cond) => (
                                        <span
                                            key={cond}
                                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-full font-medium text-slate-700 shadow-xs"
                                        >
                                            Condition: {cond.toLowerCase()}
                                            <button
                                                type="button"
                                                onClick={() => toggleCondition(cond)}
                                                className="text-slate-400 hover:text-slate-600 font-bold"
                                            >
                                                ✕
                                            </button>
                                        </span>
                                    ))}

                                    {inStockOnly && (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-full font-medium text-slate-700 shadow-xs">
                                            In stock
                                            <button
                                                type="button"
                                                onClick={() => setInStockOnly(false)}
                                                className="text-slate-400 hover:text-slate-600 font-bold"
                                            >
                                                ✕
                                            </button>
                                        </span>
                                    )}

                                    <button
                                        type="button"
                                        onClick={clearAllFilters}
                                        className="text-blue-600 hover:text-blue-800 font-bold ml-1 transition-colors"
                                    >
                                        Clear all
                                    </button>
                                </div>
                            )}

                        {/* Result Count and Database Total Banner */}
                        <div className="flex items-center justify-between text-xs text-slate-500 mb-6 pb-2 border-b border-slate-200">
                            <div>
                                <span className="font-bold text-slate-900 text-sm">
                                    {filteredProducts.length} listings
                                </span>{" "}
                                match your filters
                            </div>
                            <div className="font-mono text-slate-500 text-[11px]">
                                {products.length} products • {totalListingsInCatalog} listings in catalog
                            </div>
                        </div>

                        {/* ======================================================== */}
                        {/* 3. TWO-COLUMN LAYOUT: SIDEBAR FILTERS + PRODUCTS GRID    */}
                        {/* ======================================================== */}
                        <div className="flex flex-col lg:flex-row gap-8 items-start">
                            {/* LEFT SIDEBAR FILTERS */}
                            <aside className="w-full lg:w-64 bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs space-y-6 flex-shrink-0">
                                {/* CATEGORY FILTER */}
                                <div>
                                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                                        CATEGORY
                                    </h3>
                                    <div className="space-y-2">
                                        {(showAllCategories
                                            ? availableCategories
                                            : availableCategories.slice(0, 6)
                                        ).map((cat) => (
                                            <label
                                                key={cat}
                                                className="flex items-center justify-between text-xs text-slate-700 cursor-pointer select-none group"
                                            >
                                                <div className="flex items-center gap-2.5">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedCategories.includes(cat)}
                                                        onChange={() => toggleCategory(cat)}
                                                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                    />
                                                    <span className="group-hover:text-slate-900">{cat}</span>
                                                </div>
                                                <span className="font-mono text-slate-400 text-[11px]">
                                                    {categoryCounts[cat] || 0}
                                                </span>
                                            </label>
                                        ))}

                                        {availableCategories.length > 6 && (
                                            <button
                                                type="button"
                                                onClick={() => setShowAllCategories((prev) => !prev)}
                                                className="text-xs font-semibold text-blue-600 hover:text-blue-800 pt-1"
                                            >
                                                {showAllCategories
                                                    ? "Show less"
                                                    : `Show all ${availableCategories.length}`}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* ENGINE MODEL COMPATIBILITY */}
                                <div className="pt-4 border-t border-slate-100">
                                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                                        ENGINE MODEL
                                    </h3>
                                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                        {availableEngineModels.slice(0, 8).map((model) => (
                                            <label
                                                key={model}
                                                className="flex items-center justify-between text-xs text-slate-700 cursor-pointer select-none group"
                                            >
                                                <div className="flex items-center gap-2.5">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedEngineModels.includes(model)}
                                                        onChange={() => toggleEngineModel(model)}
                                                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                    />
                                                    <span className="group-hover:text-slate-900">{model}</span>
                                                </div>
                                                <span className="font-mono text-slate-400 text-[11px]">
                                                    {engineModelCounts[model] || 0}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* CONDITION */}
                                <div className="pt-4 border-t border-slate-100">
                                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                                        CONDITION
                                    </h3>
                                    <div className="space-y-2">
                                        {[
                                            { key: "NEW", label: "New" },
                                            { key: "REFURBISHED", label: "Refurbished" },
                                            { key: "USED", label: "Used" },
                                        ].map(({ key, label }) => (
                                            <label
                                                key={key}
                                                className="flex items-center justify-between text-xs text-slate-700 cursor-pointer select-none group"
                                            >
                                                <div className="flex items-center gap-2.5">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedConditions.includes(key)}
                                                        onChange={() => toggleCondition(key)}
                                                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                    />
                                                    <span className="group-hover:text-slate-900">{label}</span>
                                                </div>
                                                <span className="font-mono text-slate-400 text-[11px]">
                                                    {conditionCounts[key] || 0}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* PRICE (USD) */}
                                <div className="pt-4 border-t border-slate-100">
                                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                                        PRICE (USD)
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            placeholder="Min"
                                            value={minPrice}
                                            onChange={(e) => {
                                                setMinPrice(e.target.value);
                                                setPage(1);
                                            }}
                                            className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        />
                                        <span className="text-slate-400 text-xs">-</span>
                                        <input
                                            type="number"
                                            placeholder="Max"
                                            value={maxPrice}
                                            onChange={(e) => {
                                                setMaxPrice(e.target.value);
                                                setPage(1);
                                            }}
                                            className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>

                                {/* AVAILABILITY & DELIVERY */}
                                <div className="pt-4 border-t border-slate-100">
                                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                                        AVAILABILITY & DELIVERY
                                    </h3>
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer select-none">
                                            <input
                                                type="checkbox"
                                                checked={inStockOnly}
                                                onChange={(e) => {
                                                    setInStockOnly(e.target.checked);
                                                    setPage(1);
                                                }}
                                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span>In stock</span>
                                        </label>
                                    </div>
                                </div>
                            </aside>

                            {/* RIGHT MAIN PRODUCTS COLUMN */}
                            <div className="flex-1 w-full min-w-0">
                                {/* LOADING STATE */}
                                {loading && (
                                    <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
                                        <div className="inline-block animate-spin w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full mb-3"></div>
                                        <p className="text-sm font-semibold text-slate-800">
                                            Loading PostgreSQL catalog data...
                                        </p>
                                        <p className="text-xs text-slate-400 mt-1">
                                            Retrieving products, compatibility and stock from aerorul_dev
                                        </p>
                                    </div>
                                )}

                                {/* ERROR STATE */}
                                {!loading && error && (
                                    <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center shadow-xs">
                                        <p className="text-sm font-bold text-red-800">
                                            Error retrieving catalog:
                                        </p>
                                        <p className="text-xs text-red-600 mt-1 font-mono">{error}</p>
                                        <button
                                            type="button"
                                            onClick={() => window.location.reload()}
                                            className="mt-4 px-4 py-2 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700"
                                        >
                                            Retry Query
                                        </button>
                                    </div>
                                )}

                                {/* EMPTY STATE */}
                                {!loading && !error && paginatedProducts.length === 0 && (
                                    <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
                                        <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                        </div>
                                        <h4 className="text-base font-bold text-slate-800">
                                            No matching products found
                                        </h4>
                                        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                                            Try adjusting your filter parameters or search keyword to broaden your query.
                                        </p>
                                        <button
                                            type="button"
                                            onClick={clearAllFilters}
                                            className="mt-4 px-4 py-2 bg-[#0B192C] text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors"
                                        >
                                            Reset all filters
                                        </button>
                                    </div>
                                )}

                                {/* GRID VIEW */}
                                {!loading && !error && viewMode === "grid" && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {paginatedProducts.map((product) => {
                                            const condStr = Array.isArray(product.conditions)
                                                ? product.conditions.join(", ").toUpperCase()
                                                : String(product.conditions || "").toUpperCase();
                                            const primaryCondition = condStr.includes("NEW")
                                                ? "New"
                                                : condStr.includes("REFURBISHED")
                                                    ? "Refurbished"
                                                    : "Used";

                                            return (
                                                <article
                                                    key={product.product_id}
                                                    className="bg-white rounded-xl border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between overflow-hidden group"
                                                >
                                                    {/* Image Box */}
                                                    <div className="h-44 bg-gradient-to-b from-slate-50 to-slate-100/90 border-b border-slate-100 flex items-center justify-center p-4 relative">
                                                        {/* Condition Badge */}
                                                        <span
                                                            className={`absolute top-3 left-3 text-[11px] font-bold px-2 py-0.5 rounded border ${primaryCondition === "New"
                                                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                                    : primaryCondition === "Refurbished"
                                                                        ? "bg-sky-50 text-sky-700 border-sky-200"
                                                                        : "bg-amber-50 text-amber-700 border-amber-200"
                                                                }`}
                                                        >
                                                            {primaryCondition}
                                                        </span>

                                                        {/* Vector Illustration Placeholder */}
                                                        <AviationComponentIllustration
                                                            category={product.category_name}
                                                            productType={product.product_type}
                                                            name={product.product_name}
                                                        />
                                                    </div>

                                                    {/* Card Content Body */}
                                                    <div className="p-4 flex-1 flex flex-col justify-between">
                                                        <div>
                                                            <h4 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors">
                                                                {product.product_name}
                                                            </h4>

                                                            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                                                                <span className="font-mono text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                                                                    {product.part_number}
                                                                </span>
                                                            </div>

                                                            {/* Compatibility Info */}
                                                            {product.compatible_engines && formatEngineString(product.compatible_engines) ? (
                                                                <p className="mt-2 text-xs font-semibold text-emerald-600 flex items-center gap-1 line-clamp-1">
                                                                    <span className="text-[10px]">●</span>
                                                                    Compatible: {formatEngineString(product.compatible_engines)}
                                                                </p>
                                                            ) : (
                                                                <p className="mt-2 text-xs text-slate-400">
                                                                    Standard fitment
                                                                </p>
                                                            )}

                                                            {/* Manufacturer & Stock */}
                                                            <p className="mt-1 text-xs text-slate-500 line-clamp-1">
                                                                {product.manufacturer}
                                                                {product.total_stock > 0 && (
                                                                    <span className="text-slate-400">
                                                                        {" "}• In stock ({product.total_stock})
                                                                    </span>
                                                                )}
                                                            </p>
                                                        </div>

                                                        {/* Price and Action Buttons */}
                                                        <div className="mt-4 pt-3 border-t border-slate-100">
                                                            <p className="text-xl font-black text-slate-900">
                                                                {formatPrice(product.min_price)}
                                                            </p>

                                                            <div className="flex items-center gap-2 mt-3">
                                                                <Link
                                                                    to={`/marketplace/products/${product.product_id}`}
                                                                    className="flex-1 text-center py-2 px-3 text-xs font-bold rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
                                                                >
                                                                    View details
                                                                </Link>

                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleAddToCart(product)}
                                                                    className="flex-1 text-center py-2 px-3 text-xs font-bold rounded-lg bg-[#0B192C] hover:bg-[#1E3E62] text-white shadow-xs transition-colors"
                                                                >
                                                                    Add to cart
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </article>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* LIST VIEW */}
                                {!loading && !error && viewMode === "list" && (
                                    <div className="space-y-4">
                                        {paginatedProducts.map((product) => {
                                            const condStr = Array.isArray(product.conditions)
                                                ? product.conditions.join(", ").toUpperCase()
                                                : String(product.conditions || "").toUpperCase();
                                            const primaryCondition = condStr.includes("NEW")
                                                ? "New"
                                                : condStr.includes("REFURBISHED")
                                                    ? "Refurbished"
                                                    : "Used";

                                            return (
                                                <article
                                                    key={product.product_id}
                                                    className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
                                                >
                                                    {/* Left: Thumbnail Illustration */}
                                                    <div className="w-28 h-28 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center flex-shrink-0 relative">
                                                        <span
                                                            className={`absolute top-1.5 left-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded border ${primaryCondition === "New"
                                                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                                    : primaryCondition === "Refurbished"
                                                                        ? "bg-sky-50 text-sky-700 border-sky-200"
                                                                        : "bg-amber-50 text-amber-700 border-amber-200"
                                                                }`}
                                                        >
                                                            {primaryCondition}
                                                        </span>
                                                        <AviationComponentIllustration
                                                            category={product.category_name}
                                                            productType={product.product_type}
                                                            name={product.product_name}
                                                        />
                                                    </div>

                                                    {/* Center: Details */}
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-bold text-slate-900 text-base leading-snug">
                                                            {product.product_name}
                                                        </h4>
                                                        <div className="mt-1 flex flex-wrap items-center gap-2">
                                                            <span className="font-mono text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                                                                {product.part_number}
                                                            </span>
                                                            <span className="text-xs text-slate-500 font-medium">
                                                                Category: {product.category_name}
                                                            </span>
                                                            <span className="text-xs text-slate-400">
                                                                • Type: {product.product_type}
                                                            </span>
                                                        </div>

                                                        {product.compatible_engines && formatEngineString(product.compatible_engines) && (
                                                            <p className="mt-1.5 text-xs font-semibold text-emerald-600">
                                                                Compatible: {formatEngineString(product.compatible_engines)}
                                                            </p>
                                                        )}

                                                        <p className="mt-1 text-xs text-slate-500 line-clamp-1">
                                                            Manufacturer: {product.manufacturer} • In stock:{" "}
                                                            {product.total_stock} units
                                                        </p>
                                                    </div>

                                                    {/* Right: Price & Actions */}
                                                    <div className="text-right flex-shrink-0 w-full md:w-48">
                                                        <p className="text-2xl font-black text-slate-900">
                                                            {formatPrice(product.min_price)}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-3">
                                                            <Link
                                                                to={`/marketplace/products/${product.product_id}`}
                                                                className="flex-1 text-center py-2 px-3 text-xs font-bold rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
                                                            >
                                                                Details
                                                            </Link>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleAddToCart(product)}
                                                                className="flex-1 text-center py-2 px-3 text-xs font-bold rounded-lg bg-[#0B192C] hover:bg-[#1E3E62] text-white shadow-xs transition-colors"
                                                            >
                                                                Cart
                                                            </button>
                                                        </div>
                                                    </div>
                                                </article>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* ======================================================== */}
                                {/* 4. PAGINATION CONTROLS                                   */}
                                {/* ======================================================== */}
                                {!loading && !error && sortedProducts.length > 0 && (
                                    <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-200">
                                        <p className="text-xs text-slate-500">
                                            Items per page <span className="font-bold text-slate-800">12</span> •{" "}
                                            Showing{" "}
                                            <span className="font-semibold text-slate-800">
                                                {(page - 1) * ITEMS_PER_PAGE + 1}
                                            </span>{" "}
                                            to{" "}
                                            <span className="font-semibold text-slate-800">
                                                {Math.min(page * ITEMS_PER_PAGE, sortedProducts.length)}
                                            </span>{" "}
                                            of{" "}
                                            <span className="font-bold text-slate-800">
                                                {sortedProducts.length}
                                            </span>
                                        </p>

                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                disabled={page === 1}
                                                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                                                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${page === 1
                                                        ? "border-slate-200 text-slate-300 cursor-not-allowed bg-slate-50"
                                                        : "border-slate-200 text-slate-700 hover:bg-white bg-white shadow-xs"
                                                    }`}
                                            >
                                                Previous
                                            </button>

                                            {/* Dynamic Page Buttons */}
                                            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                                const pNum = i + 1;
                                                return (
                                                    <button
                                                        key={pNum}
                                                        type="button"
                                                        onClick={() => setPage(pNum)}
                                                        className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${page === pNum
                                                                ? "bg-[#0B192C] text-white"
                                                                : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs"
                                                            }`}
                                                    >
                                                        {pNum}
                                                    </button>
                                                );
                                            })}

                                            <button
                                                type="button"
                                                disabled={page === totalPages}
                                                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                                                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${page === totalPages
                                                        ? "border-slate-200 text-slate-300 cursor-not-allowed bg-slate-50"
                                                        : "border-slate-200 text-slate-700 hover:bg-white bg-white shadow-xs"
                                                    }`}
                                            >
                                                Next
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}
