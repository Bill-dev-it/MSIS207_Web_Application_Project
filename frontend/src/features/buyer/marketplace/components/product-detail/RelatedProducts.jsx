
import { Link } from "react-router-dom";
import AviationComponentIllustration from "../AviationComponentIllustration";

function formatPrice(price) {
    const amount = Number(price);

    if (!Number.isFinite(amount)) return null;

    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    }).format(amount);
}

export default function RelatedProducts({ product }) {
    const relatedProducts = Array.isArray(product?.related_products)
        ? product.related_products.filter(
            (item) =>
                item &&
                item.product_id != null &&
                String(item.product_id) !== String(product?.product_id)
        )
        : [];

    if (relatedProducts.length === 0) {
        return null;
    }

    return (
        <section aria-labelledby="related-products-heading">
            <h2
                id="related-products-heading"
                className="mb-4 text-xl font-bold text-slate-900"
            >
                Related products
            </h2>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {relatedProducts.map((item) => {
                    const name =
                        item.product_name ?? item.name ?? "Unnamed product";

                    const image =
                        item.image_url ??
                        (Array.isArray(item.images) ? item.images[0] : null);

                    return (
                        <article
                            key={item.product_id}
                            className="overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:shadow-md"
                        >
                            <Link
                                to={`/marketplace/products/${item.product_id}`}
                                className="block"
                            >
                                <div className="flex aspect-[16/9] items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 p-3">
                                    {image ? (
                                        <img
                                            src={image}
                                            alt={name}
                                            loading="lazy"
                                            className="h-full w-full object-contain"
                                        />
                                    ) : (
                                        <AviationComponentIllustration
                                            category={item.category_name}
                                            productType={item.product_type}
                                            name={name}
                                            className="w-24 h-20"
                                        />
                                    )}
                                </div>

                                <div className="p-4">
                                    <p className="font-mono text-xs text-slate-500">
                                        {item.part_number || "No part number"}
                                    </p>

                                    <h3 className="mt-2 line-clamp-2 text-sm font-semibold text-slate-900">
                                        {name}
                                    </h3>

                                    <p className="mt-3 font-bold text-slate-900">
                                        {formatPrice(item.price) || "Price unavailable"}
                                    </p>

                                    <span className="mt-3 inline-block text-sm font-semibold text-sky-600">
                                        View details →
                                    </span>
                                </div>
                            </Link>
                        </article>
                    );
                })}
            </div>
        </section>
    );
}
