import { useState } from "react";
import AviationComponentIllustration from "../AviationComponentIllustration";

/**
 * ProductGallery
 * Renders the product visual assets with multi-view technical inspection.
 * When photographic assets are not present in the catalog database,
 * falls back to high-fidelity CAD/schematic diagrams with multiple view angles.
 */
export default function ProductGallery({ product }) {
  const images = Array.isArray(product?.images) && product.images.length > 0
    ? product.images
    : product?.image_url
      ? [product.image_url]
      : [];

  const [activeIndex, setActiveIndex] = useState(0);
  const [schematicView, setSchematicView] = useState("isometric");

  const hasPhotos = images.length > 0;

  const SCHEMATIC_VIEWS = [
    {
      id: "isometric",
      label: "Isometric View",
      description: "3D CAD angle projection",
    },
    {
      id: "blueprint",
      label: "Profile Blueprint",
      description: "Orthogonal dimension guide",
    },
    {
      id: "spec",
      label: "Component Schematic",
      description: "Sub-assembly fitment layout",
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      {/* Main Visual Display Frame */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-b from-slate-50 to-slate-100/80 shadow-xs flex items-center justify-center p-6 sm:p-8">
        {/* Technical Grid Pattern Background */}
        <div
          className="absolute inset-0 opacity-40 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(#94A3B8 0.75px, transparent 0.75px), radial-gradient(#94A3B8 0.75px, #F8FAFC 0.75px)",
            backgroundSize: "24px 24px",
            backgroundPosition: "0 0, 12px 12px",
          }}
          aria-hidden="true"
        />

        {/* Status & Part Watermark Badge */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1">
          <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-200/80 bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow-xs backdrop-blur-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-500 animate-pulse" />
            {hasPhotos ? "Catalog Photography" : "Technical CAD Schematic"}
          </span>
          {product?.part_number && (
            <span className="font-mono text-[10px] text-slate-400 bg-white/60 px-1.5 py-0.5 rounded border border-slate-100">
              P/N: {product.part_number}
            </span>
          )}
        </div>

        {/* Zoom / View Badge */}
        <div className="absolute top-3 right-3 z-10">
          <span className="rounded-md border border-slate-200/80 bg-white/90 px-2 py-0.5 font-mono text-[11px] text-slate-500 shadow-xs backdrop-blur-xs">
            {product?.product_type || "AIRCRAFT PART"}
          </span>
        </div>

        {/* Center Visual Content */}
        {hasPhotos ? (
          <img
            src={images[activeIndex]}
            alt={product?.product_name || "Aircraft product view"}
            className="h-full w-full object-contain relative z-10"
          />
        ) : (
          <div className="relative z-10 flex flex-col items-center justify-center text-center">
            <AviationComponentIllustration
              category={product?.category_name}
              productType={product?.product_type}
              name={product?.product_name}
              className="w-48 h-40 sm:w-60 sm:h-48 drop-shadow-sm transition-transform duration-300"
              viewMode={schematicView}
            />

            <p className="mt-2 text-xs font-medium text-slate-400 tracking-wide uppercase">
              {SCHEMATIC_VIEWS.find((v) => v.id === schematicView)?.description || "Technical Representation"}
            </p>
          </div>
        )}

        {/* Fitment Indicator Stamp */}
        <div className="absolute bottom-3 left-3 z-10">
          <span className="text-[10px] font-mono text-slate-400">
            AERORUL CATALOG VERIFIED • ATA SPEC
          </span>
        </div>
      </div>

      {/* Thumbnails Selector Strip */}
      {hasPhotos ? (
        <div
          role="tablist"
          aria-label="Product image thumbnails"
          className="flex gap-2 overflow-x-auto pb-1"
        >
          {images.map((img, idx) => (
            <button
              key={idx}
              type="button"
              role="tab"
              aria-selected={activeIndex === idx}
              onClick={() => setActiveIndex(idx)}
              className={`relative h-18 w-20 shrink-0 overflow-hidden rounded-lg border-2 bg-slate-50 transition-all ${
                activeIndex === idx
                  ? "border-sky-600 ring-2 ring-sky-200"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <img
                src={img}
                alt={`Thumbnail ${idx + 1}`}
                className="h-full w-full object-contain p-1"
              />
            </button>
          ))}
        </div>
      ) : (
        <div
          role="tablist"
          aria-label="Schematic view angles"
          className="grid grid-cols-3 gap-2"
        >
          {SCHEMATIC_VIEWS.map((view) => {
            const isSelected = schematicView === view.id;
            return (
              <button
                key={view.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => setSchematicView(view.id)}
                className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-center transition-all ${
                  isSelected
                    ? "border-sky-500 bg-sky-50/60 text-sky-800 shadow-xs ring-1 ring-sky-400"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <span className="text-xs font-bold leading-snug">
                  {view.label}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                  {view.id === "isometric" ? "Angle" : view.id === "blueprint" ? "Grid" : "Fitment"}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

