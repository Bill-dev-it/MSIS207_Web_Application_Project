
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../../cart";

function formatPrice(price) {

    const amount = Number(price);

    if (!Number.isFinite(amount)) {
        return "Price unavailable";
    }

    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 2,
    }).format(amount);
}

function InfoCard({ label, value }) {
    return (
        <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-xs text-slate-500">{label}</p>
            <p className="mt-1 break-words text-sm font-semibold text-slate-800">
                {value ?? "Not available"}
            </p>
        </div>
    );
}

export default function ProductOverview({
    product,
    selectedOffer,
}) {
    const navigate = useNavigate();
    const { addItem } = useCart();
    const [isAdding, setIsAdding] = useState(false);
    const [addedFeedback, setAddedFeedback] = useState(false);

    const name = product?.product_name ?? product?.name ?? "Unnamed product";

    const price = selectedOffer?.price;
    const stock = selectedOffer?.stock_quantity;
    const condition = selectedOffer?.condition;

    const hasStock =
        Number.isFinite(Number(stock)) && Number(stock) > 0;

    async function handleAddToCart() {
        if (!selectedOffer?.listing_id) return;
        try {
            setIsAdding(true);
            await addItem(selectedOffer.listing_id, 1);
            setAddedFeedback(true);
            setTimeout(() => setAddedFeedback(false), 2500);
        } catch (err) {
            alert(err.message || "Failed to add item to cart");
        } finally {
            setIsAdding(false);
        }
    }

    async function handleBuyNow() {
        if (!selectedOffer?.listing_id) return;
        try {
            setIsAdding(true);
            await addItem(selectedOffer.listing_id, 1);
            navigate("/cart");
        } catch (err) {
            alert(err.message || "Failed to add item to cart");
        } finally {
            setIsAdding(false);
        }
    }

    return (
        <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
            <div className="flex flex-wrap gap-2">
                {condition && (
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                        {condition}
                    </span>
                )}

                {selectedOffer && (
                    <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${hasStock
                            ? "bg-sky-50 text-sky-700"
                            : "bg-red-50 text-red-700"
                            }`}
                    >
                        {hasStock ? `In stock · ${stock} available` : "Out of stock"}
                    </span>
                )}
            </div>

            <h1 className="mt-4 text-2xl font-bold leading-tight text-slate-900 sm:text-3xl">
                {name}
            </h1>

            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm">
                <span className="font-mono text-slate-600">
                    P/N {product?.part_number || "Not available"}
                </span>

                {product?.manufacturer && (
                    <span className="text-slate-500">
                        {product.manufacturer}
                    </span>
                )}
            </div>

            <div className="mt-5">
                <p className="text-3xl font-bold tracking-tight text-slate-900">
                    {selectedOffer
                        ? formatPrice(price)
                        : (product?.min_price ? `From ${formatPrice(product.min_price)}` : "Price unavailable")}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                    {selectedOffer
                        ? "USD · Selected supplier offer"
                        : (product?.min_price ? "USD · Lowest active offer" : "USD · Catalog list")}
                </p>
            </div>

            {selectedOffer && (
                <div className="mt-5 rounded-xl border border-slate-200 p-4">
                    <p className="font-semibold text-slate-900">
                        {selectedOffer.store_name || "Supplier"}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                        Seller SKU: {selectedOffer.seller_sku || "Not available"}
                    </p>
                </div>
            )}

            <div className="mt-4 grid grid-cols-2 gap-2">
                <InfoCard
                    label="Category"
                    value={product?.category_name}
                />
                <InfoCard
                    label="Product type"
                    value={product?.product_type}
                />
                <InfoCard
                    label="Condition"
                    value={condition}
                />
                <InfoCard
                    label="Available stock"
                    value={selectedOffer ? stock : "Not available"}
                />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                    type="button"
                    disabled={!selectedOffer || !hasStock || isAdding}
                    onClick={handleAddToCart}
                    className="rounded-lg bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 px-4 py-3 text-sm font-semibold text-white transition shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                >
                    {isAdding ? (
                        <span>Adding...</span>
                    ) : addedFeedback ? (
                        <span className="text-emerald-300 font-bold">✓ Added to Cart!</span>
                    ) : (
                        <span>Add to cart</span>
                    )}
                </button>

                <button
                    type="button"
                    disabled={!selectedOffer || !hasStock || isAdding}
                    onClick={handleBuyNow}
                    className="rounded-lg bg-sky-600 hover:bg-sky-700 disabled:bg-slate-200 disabled:text-slate-400 px-4 py-3 text-sm font-semibold text-white transition shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                >
                    Buy now
                </button>
            </div>

            {addedFeedback && (
                <div className="mt-2.5 text-center">
                    <button
                        type="button"
                        onClick={() => navigate("/cart")}
                        className="text-xs font-bold text-blue-600 hover:text-blue-800 underline"
                    >
                        View in Cart →
                    </button>
                </div>
            )}

            {!selectedOffer && (
                <p className="mt-3 text-xs text-amber-600 font-medium">
                    Please select a supplier quote from the table below to add this part to cart.
                </p>
            )}
        </section>
    );
}
