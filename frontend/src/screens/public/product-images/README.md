# AeroRUL Public Product Image Architecture & Flow Guide

This document explains the **end-to-end architecture and code flow** of the product image system in AeroRUL. It details how the 45 physical `.webp` images in this folder are imported, resolved, and rendered across the Public Marketplace and Product Detail pages.

> [!NOTE]
> **Database Category Alignment:**  
> The 9 image collections in this directory correspond 1-to-1 with the **9 official database categories** in `categories.csv` (`Avionics`, `Cabin`, `Electrical`, `Engine`, `Fasteners`, `Hydraulics`, `LandingGear`, `Replacement Engines`, `Structure`). The `Cabin` collection provides dedicated passenger cabin interior, air filter, and control panel imagery, ensuring Cabin catalog products have their own distinct visuals and do not share imagery with airframe Structure.

---

## 1. File-to-File Flow Mapping

```
[1. ASSET REPOSITORY]
frontend/src/screens/public/product-images/*.webp (45 images across 9 official DB categories)
       │
       │ (Static ES Module Imports & Collection Arrays)
       ▼
[2. RESOLVER & MAPPING HELPER]
frontend/src/screens/public/productImages.js
       │
       │  • resolveVisualCategory(product) ──► Category & keyword routing (matches DB categories)
       │  • getStableIndex(seed, length)   ──► Deterministic polynomial hashing
       │
       ├────────────────────────────────────────┐
       │ (getProductCoverImage)                 │ (getProductGalleryImages)
       ▼                                        ▼
[3A. MARKETPLACE CATALOG GRID]           [3B. PRODUCT DETAIL PAGE]
frontend/src/screens/public/Marketplace.jsx frontend/src/screens/public/ProductDetail.jsx
       │                                        │
       ▼                                        ▼
- 16:10 Cover image on product cards    - 16:10 Hero showcase image
- Subtle "Representative image" badge   - 5 interactive thumbnail buttons
- Hover zoom & lazy loading             - State switcher: selectedImageIndex
- Fallback to <ProductVisual>           - Disclaimer caption & SVG fallback
```

---

## 2. Step-by-Step Code Implementation & Walkthrough

### Step 1: Physical Assets & Static Bundling (`productImages.js`)

All 45 WebP files are organized into 9 categories (5 images each):
- `avionics-1.webp` &ndash; `5.webp` (Cockpit avionics displays, radar, transponder, and flight instruments)
- `cabin-1.webp` &ndash; `5.webp` (Cabin environmental control panels, seating, air filters, PSUs, galley stations)
- `electrical-1.webp` &ndash; `5.webp` (Power distribution, generators, busbars, wire harnesses, breakers)
- `engine-parts-1.webp` &ndash; `5.webp` (Turbine blades, compressor rotors, combustion liners, stator vanes)
- `fasteners-1.webp` &ndash; `5.webp` (Titanium aerospace bolts, castle nuts, flush rivets, pins, lockbolts)
- `hydraulics-1.webp` &ndash; `5.webp` (Actuators, selector valves, hydraulic pumps, accumulators, cylinders)
- `landing-gear-1.webp` &ndash; `5.webp` (Oleo shock struts, torque scissor links, brake packs, wheel hubs)
- `replacement-engines-1.webp` &ndash; `5.webp` (Certified turbofans, turboprops, core turbine assemblies)
- `structure-1.webp` &ndash; `5.webp` (Access doors, inspection panels, airframe center wing box and structural spar assemblies (`structure-3.webp`), escape portals, nacelle cowls)

In `productImages.js`, these files are **statically imported** so Vite can hash and optimize them at build time:

```javascript
// frontend/src/screens/public/productImages.js

import cabin1 from "./product-images/cabin-1.webp";
import cabin2 from "./product-images/cabin-2.webp";
import cabin3 from "./product-images/cabin-3.webp";
import cabin4 from "./product-images/cabin-4.webp";
import cabin5 from "./product-images/cabin-5.webp";
// ... (imports for other 8 categories)

export const IMAGE_COLLECTIONS = {
  "cabin": [
    { src: cabin1, alt: "Commercial aircraft passenger cabin environmental control panel", label: "Cabin Control Panel" },
    { src: cabin2, alt: "Airliner passenger cabin interior seating and overhead luggage bins", label: "Cabin Interior & Seating" },
    { src: cabin3, alt: "Aircraft air conditioning recirculation HEPA filter element", label: "Cabin Air Filter" },
    { src: cabin4, alt: "Overhead passenger service unit (PSU) with reading lights and gasper vents", label: "Passenger Service Unit" },
    { src: cabin5, alt: "Flight attendant galley control station and cabin management panel", label: "Attendant Station Panel" },
  ],
  // ... (collections for other 8 categories: engine-parts, replacement-engines, avionics, electrical, hydraulics, landing-gear, fasteners, structure)
};
```

---

### Step 2: Intelligent Category Resolution (`resolveVisualCategory`)

When a product is loaded from the backend API, its metadata is passed to `resolveVisualCategory(product)`:

```javascript
// frontend/src/screens/public/productImages.js

export function resolveVisualCategory(product = {}) {
  const category = (product.category_name || product.category || "").trim().toLowerCase();
  const name = (product.product_name || product.name || "").toLowerCase();
  const partNumber = (product.part_number || "").toLowerCase();
  const fullText = `${category} ${name} ${partNumber}`;

  // Tier 1: Keyword Refinements (Highest Priority)
  if (/blade|vane|airfoil|rotor disk|stator ring/i.test(fullText)) {
    return "engine-parts";
  }

  // Tier 2: Database Category Mapping (9 Official DB Categories)
  if (category === "cabin" || /cabin|air filter|interior|seating|galley|lavatory|overhead bin/i.test(fullText)) {
    return "cabin";
  }
  if (category === "replacement engines" || category === "replacement-engines") {
    return "replacement-engines";
  }
  if (category === "landinggear" || category === "landing gear" || /gear|strut|brake|wheel|tire/i.test(fullText)) {
    return "landing-gear";
  }
  if (category === "avionics" || /avionics|display|flight director|instrument|radar|autopilot/i.test(fullText)) {
    return "avionics";
  }
  if (category === "electrical" || /electric|generator|wire|harness|breaker|relay|inverter/i.test(fullText)) {
    return "electrical";
  }
  if (category === "hydraulics" || /hydraulic|actuator|cylinder|valve|pump|fluid/i.test(fullText)) {
    return "hydraulics";
  }
  if (category === "fasteners" || /fastener|bolt|rivet|screw|nut|pin|washer|hi-lok|cleco/i.test(fullText)) {
    return "fasteners";
  }
  if (category === "structure" || /structure|panel|door|cowl|fairing|hatch|frame|bracket|spar|wing box/i.test(fullText)) {
    return "structure";
  }
  if (category === "engine" || /engine|propulsion|combustor|fuel nozzle/i.test(fullText)) {
    return "engine-parts";
  }

  // Tier 3: Safe Fallback
  return "engine-parts";
}
```

---

### Step 3: Deterministic Hashing (`getStableIndex`)

To prevent images from changing randomly on page refresh, filter changes, or pagination, AeroRUL uses a deterministic polynomial hash based on `product.product_id` (or `part_number`):

```javascript
// frontend/src/screens/public/productImages.js

export function getStableIndex(seed, length) {
  if (!seed || length <= 0) return 0;
  const str = String(seed);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0; // Convert to 32-bit integer
  }
  return Math.abs(hash) % length;
}
```

**Why this matters:** Product `#2` (`Cabin Control Panel 002`) will **always** receive image index `2`, producing a stable catalog appearance for users without visual jitter.

---

### Step 4: The Public Image Helper Functions

`productImages.js` exports two primary helper functions:

```javascript
// frontend/src/screens/public/productImages.js

// 1. Returns a single cover image for catalog cards
export function getProductCoverImage(product) {
  if (!product) return null;
  const categoryKey = resolveVisualCategory(product);
  const collection = IMAGE_COLLECTIONS[categoryKey];
  if (!collection || collection.length === 0) return null;

  const seed = product.product_id || product.id || product.part_number || product.product_name || "0";
  const index = getStableIndex(seed, collection.length);
  const item = collection[index];

  return {
    src: item.src,
    alt: `${product.product_name || product.name || "Aviation component"} - ${item.alt}`,
    label: item.label,
    categoryKey,
    isRepresentative: true,
  };
}

// 2. Returns an array of 5 rotated images for the Product Detail gallery
export function getProductGalleryImages(product) {
  if (!product) return [];
  const categoryKey = resolveVisualCategory(product);
  const collection = IMAGE_COLLECTIONS[categoryKey];
  if (!collection || collection.length === 0) return [];

  const seed = product.product_id || product.id || product.part_number || product.product_name || "0";
  const startIndex = getStableIndex(seed, collection.length);

  const gallery = [];
  for (let i = 0; i < collection.length; i++) {
    const item = collection[(startIndex + i) % collection.length];
    gallery.push({
      src: item.src,
      alt: `${product.product_name || product.name || "Aviation component"} - ${item.alt}`,
      label: item.label,
      categoryKey,
      isRepresentative: true,
    });
  }
  return gallery;
}
```

---

### Step 5: How `Marketplace.jsx` Uses `getProductCoverImage`

In `Marketplace.jsx`, as products are mapped into the catalog grid, each product card requests its cover image:

```jsx
// frontend/src/screens/public/Marketplace.jsx

import { getProductCoverImage } from "./productImages";
import ProductVisual from "../../components/public-marketplace/ProductVisual";

// Inside the product loop:
{products.map((product) => {
  const coverImage = getProductCoverImage(product);
  const detailUrl = `/marketplace/products/${encodeURIComponent(product.product_id)}`;

  return (
    <article key={product.product_id} className="group bg-white rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between overflow-hidden">
      <div>
        {/* 16:10 Image Container */}
        <Link to={detailUrl} className="block relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
          {coverImage?.src ? (
            <img
              src={coverImage.src}
              alt={coverImage.alt}
              loading="lazy"
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center p-4">
              <ProductVisual product={product} size="md" />
            </div>
          )}

          {/* Discreet Representative Badge */}
          <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-900/70 text-slate-200 backdrop-blur-xs">
            Representative image
          </span>
        </Link>

        {/* Product Details & Action Button... */}
      </div>
    </article>
  );
})}
```

---

### Step 6: How `ProductDetail.jsx` Uses `getProductGalleryImages`

In `ProductDetail.jsx`, the screen requests the complete 5-image gallery and manages the active image via React state:

```jsx
// frontend/src/screens/public/ProductDetail.jsx

import { useState } from "react";
import { getProductGalleryImages } from "./productImages";
import ProductVisual from "../../components/public-marketplace/ProductVisual";

export default function ProductDetail() {
  const [product, setProduct] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Retrieve gallery deterministically
  const gallery = product ? getProductGalleryImages(product) : [];
  const activeImage = gallery[selectedImageIndex] || gallery[0] || null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Product Image Gallery Area */}
      {activeImage ? (
        <div className="space-y-3.5">
          {/* Main Hero View (aspect 16:10) */}
          <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/80">
            <img
              src={activeImage.src}
              alt={activeImage.alt}
              className="w-full h-full object-cover object-center transition-all duration-200"
            />
            <span className="absolute bottom-3 right-3 px-2.5 py-1 rounded-md text-[10px] font-medium bg-slate-900/75 text-slate-200 backdrop-blur-xs">
              Representative image
            </span>
          </div>

          {/* Interactive Thumbnails */}
          {gallery.length > 1 && (
            <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
              {gallery.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`relative w-24 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                    selectedImageIndex === idx
                      ? "border-[#0B1F3A] ring-2 ring-[#0B1F3A]/30 shadow-xs"
                      : "border-slate-200 hover:border-slate-400 opacity-70 hover:opacity-100"
                  }`}
                >
                  <img src={img.src} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Legal Compliance Caption */}
          <p className="text-[11px] text-slate-400 italic">
            Representative component imagery. Actual item specifications may vary.
          </p>
        </div>
      ) : (
        <ProductVisual product={product} size="lg" />
      )}
    </div>
  );
}
```

---

## 3. Real-World Execution Traces

### Example 1: Cabin Product (`Cabin Control Panel 002`)

1. **API Response Payload:**
   ```json
   {
     "product_id": "2",
     "product_name": "Cabin Control Panel 002",
     "category_name": "Cabin",
     "part_number": "DEMO-PART-00002"
   }
   ```
2. **Resolver Step (`resolveVisualCategory`):**
   - Matches `category === "cabin"` &rarr; returns `"cabin"`.
3. **Hashing Step (`getStableIndex`):**
   - `getStableIndex("2", 5)` calculates `hash("2") % 5` &rarr; index `0`.
4. **Marketplace Card:**
   - Selects `IMAGE_COLLECTIONS["cabin"][0]` (`cabin-1.webp`).
   - Renders `cabin-1.webp` (Cabin environmental control panel) on the catalog card with category tag `CABIN`.
5. **Product Detail Page:**
   - Rotates starting from index 0: `[cabin-1, cabin-2, cabin-3, cabin-4, cabin-5]`.
   - Main view displays `cabin-1.webp`.
   - The 5 thumbnails display cabin control panels, passenger seating, air filter, and PSU units.

---

### Example 2: Cabin Air Filter Product (`Cabin Air Filter 005`)

1. **API Response Payload:**
   ```json
   {
     "product_id": "5",
     "product_name": "Cabin Air Filter 005",
     "category_name": "Cabin",
     "part_number": "DEMO-PART-00005"
   }
   ```
2. **Resolver Step (`resolveVisualCategory`):**
   - Scans text `"cabin cabin air filter 005 demo-part-00005"`.
   - Matches `category === "cabin"` and keyword `air filter` &rarr; returns `"cabin"`.
3. **Hashing Step (`getStableIndex`):**
   - `getStableIndex("5", 5)` calculates `hash("5") % 5` &rarr; deterministic index `3`.
4. **Outcome:**
   - Renders `cabin-4.webp` as cover and full cabin gallery rotation on Product Detail.
   - Distinct from airframe `Structure` panels.

---

### Example 3: Fallback Handling

1. **API Response Payload:**
   ```json
   {
     "product_id": "999",
     "product_name": "Experimental Fixture",
     "category_name": "UnregisteredCategory",
     "part_number": "EXP-999"
   }
   ```
2. **Tier 3 Fallback:**
   - `resolveVisualCategory` does not find a match &rarr; defaults safely to `"engine-parts"`.
   - Returns a valid, professional component image from the `engine-parts` collection.
3. **Network / Asset Fallback:**
   - If an image fails to load or `coverImage` is `null`, JSX renders `<ProductVisual product={product} />`, displaying an SVG vector illustration rather than a broken image box.
