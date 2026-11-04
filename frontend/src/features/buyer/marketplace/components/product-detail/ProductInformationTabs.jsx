
import { useState } from "react";

const TABS = [
    { id: "overview", label: "Overview" },
    { id: "specs", label: "Technical Specs" },
    { id: "compatibility", label: "Compatibility" },
    { id: "shipping", label: "Shipping" },
    { id: "supplier", label: "Supplier" },
    { id: "reviews", label: "Reviews" },
];

function displayValue(value) {
    if (value === null || value === undefined || value === "") return "Not available";
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (Array.isArray(value)) return value.length === 0 ? "None" : value.join(", ");
    if (typeof value === "object") {
        return Object.entries(value)
            .map(([k, v]) => `${k.replaceAll("_", " ")}: ${displayValue(v)}`)
            .join(" • ");
    }
    return String(value);
}

function SpecificationRows({ data }) {
    const entries =
        data && typeof data === "object" && !Array.isArray(data)
            ? Object.entries(data)
            : [];

    if (entries.length === 0) {
        return (
            <p className="text-sm text-slate-500">
                No technical specifications available.
            </p>
        );
    }

    return (
        <dl className="divide-y divide-slate-200 rounded-lg border border-slate-200">
            {entries.map(([key, value]) => (
                <div
                    key={key}
                    className="grid gap-2 px-4 py-3 sm:grid-cols-2"
                >
                    <dt className="text-sm font-medium capitalize text-slate-700">
                        {key.replaceAll("_", " ")}
                    </dt>
                    <dd className="break-words text-sm text-slate-600">
                        {displayValue(value)}
                    </dd>
                </div>
            ))}
        </dl>
    );
}

function Compatibility({ product }) {
    const engines =
        product?.compatible_engines ??
        product?.engine_models ??
        product?.compatibility ??
        [];

    const items = Array.isArray(engines)
        ? engines
        : [engines];

    if (items.length === 0) {
        return (
            <p className="text-sm text-slate-500">
                Compatibility information is not available for this catalog item.
            </p>
        );
    }

    return (
        <ul className="space-y-2">
            {items.map((engine, index) => {
                const isObj = typeof engine === "object" && engine !== null;
                const mfg = isObj ? engine.manufacturer : null;
                const model = isObj ? (engine.model_name ?? engine.engine_model_name ?? engine.name ?? engine.model) : engine;
                const engineType = isObj ? engine.engine_type : null;
                const family = isObj ? engine.engine_family : null;

                return (
                    <li
                        key={index}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-700"
                    >
                        <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
                            <span className="font-semibold text-slate-900">
                                {mfg ? `${mfg} ` : ""}{model || "Standard Engine Fitment"}
                            </span>
                            {family && (
                                <span className="text-xs text-slate-500">
                                    ({family})
                                </span>
                            )}
                        </div>

                        {engineType && (
                            <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 font-mono text-xs text-slate-600">
                                {engineType}
                            </span>
                        )}
                    </li>
                );
            })}
        </ul>
    );
}

export default function ProductInformationTabs({
    product,
    selectedOffer,
}) {
    const [activeTab, setActiveTab] = useState("overview");

    const renderContent = () => {
        switch (activeTab) {
            case "overview":
                return (
                    <div className="space-y-4">
                        <h3 className="font-semibold text-slate-900">
                            Product description
                        </h3>
                        <p className="whitespace-pre-line text-sm leading-7 text-slate-600">
                            {product?.description || "No description available."}
                        </p>
                    </div>
                );

            case "specs":
                return (
                    <div className="space-y-4">
                        <h3 className="font-semibold text-slate-900">
                            Core technical specifications
                        </h3>
                        <SpecificationRows data={product?.technical_specs} />
                    </div>
                );

            case "compatibility":
                return (
                    <div className="space-y-4">
                        <h3 className="font-semibold text-slate-900">
                            Compatible engine models
                        </h3>
                        <Compatibility product={product} />
                    </div>
                );

            case "shipping":
                return (
                    <div className="space-y-4">
                        <h3 className="font-semibold text-slate-900">
                            Logistics & Delivery Estimates
                        </h3>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="rounded-lg bg-slate-50 p-4 border border-slate-100">
                                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Fulfillment Lead Time</p>
                                <p className="mt-1 text-base font-bold text-slate-900">
                                    {selectedOffer?.lead_time_days != null
                                        ? `${selectedOffer.lead_time_days} business days`
                                        : "Standard dispatch (contact supplier)"}
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                    Estimated dispatch from authorized warehouse facility.
                                </p>
                            </div>
                            <div className="rounded-lg bg-slate-50 p-4 border border-slate-100">
                                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Fulfilling Supplier</p>
                                <p className="mt-1 text-base font-bold text-slate-900">
                                    {selectedOffer?.store_name || "Select an active offer"}
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                    Verified seller listing with inventory allocation.
                                </p>
                            </div>
                        </div>
                        <div className="rounded-lg border border-slate-200 p-4 text-xs text-slate-600 bg-white">
                            <span className="font-semibold text-slate-800">Packaging Compliance:</span> Certified ATA Spec 300 Category I/II packaging for aerospace components. Airworthiness tags (FAA Form 8130-3 / EASA Form 1) must be requested directly during purchase order confirmation.
                        </div>
                    </div>
                );

            case "supplier":
                return (
                    <div className="space-y-4">
                        <h3 className="font-semibold text-slate-900">
                            Supplier Credentials & Details
                        </h3>
                        {selectedOffer ? (
                            <div className="space-y-4">
                                <dl className="grid gap-3 sm:grid-cols-2">
                                    <div className="rounded-lg bg-slate-50 p-3.5 border border-slate-100">
                                        <dt className="text-xs font-medium text-slate-500">Store Name</dt>
                                        <dd className="mt-1 text-sm font-bold text-slate-900">
                                            {selectedOffer.store_name || "Not available"}
                                        </dd>
                                    </div>
                                    <div className="rounded-lg bg-slate-50 p-3.5 border border-slate-100">
                                        <dt className="text-xs font-medium text-slate-500">Seller Part SKU</dt>
                                        <dd className="mt-1 font-mono text-sm font-bold text-slate-900">
                                            {selectedOffer.seller_sku || "Not specified"}
                                        </dd>
                                    </div>
                                    <div className="rounded-lg bg-slate-50 p-3.5 border border-slate-100">
                                        <dt className="text-xs font-medium text-slate-500">Part Condition</dt>
                                        <dd className="mt-1 text-sm font-bold text-slate-900">
                                            {selectedOffer.condition || "Standard"}
                                        </dd>
                                    </div>
                                    <div className="rounded-lg bg-slate-50 p-3.5 border border-slate-100">
                                        <dt className="text-xs font-medium text-slate-500">Vendor Verification</dt>
                                        <dd className="mt-1 text-sm font-bold text-emerald-700 flex items-center gap-1.5">
                                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                            Platform Approved Supplier
                                        </dd>
                                    </div>
                                </dl>
                            </div>
                        ) : (
                            <p className="text-sm text-slate-500">
                                Select a supplier offer from the table above to inspect seller details.
                            </p>
                        )}
                    </div>
                );

            case "reviews":
                return (
                    <div className="rounded-lg bg-slate-50 p-5">
                        <h3 className="font-semibold text-slate-900">
                            Customer reviews
                        </h3>
                        <p className="mt-2 text-sm text-slate-500">
                            Review information is not currently available from
                            the connected product API.
                        </p>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
            <div
                role="tablist"
                aria-label="Product information"
                className="flex gap-6 overflow-x-auto border-b border-slate-200"
            >
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        id={`product-tab-${tab.id}`}
                        type="button"
                        role="tab"
                        aria-selected={activeTab === tab.id}
                        aria-controls="product-tab-panel"
                        onClick={() => setActiveTab(tab.id)}
                        className={`shrink-0 border-b-2 px-1 pb-3 text-sm font-medium ${activeTab === tab.id
                            ? "border-sky-500 text-sky-600"
                            : "border-transparent text-slate-500 hover:text-slate-800"
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div
                id="product-tab-panel"
                role="tabpanel"
                aria-labelledby={`product-tab-${activeTab}`}
                tabIndex={0}
                className="pt-5"
            >
                {renderContent()}
            </div>
        </section>
    );
}
