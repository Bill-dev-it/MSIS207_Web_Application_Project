/**
 * AeroRUL Representative Product Image Collection & Mapping Helper
 *
 * Provides deterministic mapping from database products/categories to high-quality
 * representative aerospace component photographs.
 *
 * NOTE: These are representative category photographs for visual clarity and catalog
 * browsing, not verified exact SKU photographs of specific serialized inventory.
 */

// 1. Engine Parts
import engine1 from "./product-images/engine-parts-1.webp";
import engine2 from "./product-images/engine-parts-2.webp";
import engine3 from "./product-images/engine-parts-3.webp";
import engine4 from "./product-images/engine-parts-4.webp";
import engine5 from "./product-images/engine-parts-5.webp";

// 2. Replacement Engines
import replEng1 from "./product-images/replacement-engines-1.webp";
import replEng2 from "./product-images/replacement-engines-2.webp";
import replEng3 from "./product-images/replacement-engines-3.webp";
import replEng4 from "./product-images/replacement-engines-4.webp";
import replEng5 from "./product-images/replacement-engines-5.webp";

// 3. Avionics
import avionics1 from "./product-images/avionics-1.webp";
import avionics2 from "./product-images/avionics-2.webp";
import avionics3 from "./product-images/avionics-3.webp";
import avionics4 from "./product-images/avionics-4.webp";
import avionics5 from "./product-images/avionics-5.webp";

// 4. Electrical
import elec1 from "./product-images/electrical-1.webp";
import elec2 from "./product-images/electrical-2.webp";
import elec3 from "./product-images/electrical-3.webp";
import elec4 from "./product-images/electrical-4.webp";
import elec5 from "./product-images/electrical-5.webp";

// 5. Hydraulics
import hyd1 from "./product-images/hydraulics-1.webp";
import hyd2 from "./product-images/hydraulics-2.webp";
import hyd3 from "./product-images/hydraulics-3.webp";
import hyd4 from "./product-images/hydraulics-4.webp";
import hyd5 from "./product-images/hydraulics-5.webp";

// 6. Landing Gear
import lg1 from "./product-images/landing-gear-1.webp";
import lg2 from "./product-images/landing-gear-2.webp";
import lg3 from "./product-images/landing-gear-3.webp";
import lg4 from "./product-images/landing-gear-4.webp";
import lg5 from "./product-images/landing-gear-5.webp";

// 7. Fasteners
import fast1 from "./product-images/fasteners-1.webp";
import fast2 from "./product-images/fasteners-2.webp";
import fast3 from "./product-images/fasteners-3.webp";
import fast4 from "./product-images/fasteners-4.webp";
import fast5 from "./product-images/fasteners-5.webp";

// 8. Cabin
import cabin1 from "./product-images/cabin-1.webp";
import cabin2 from "./product-images/cabin-2.webp";
import cabin3 from "./product-images/cabin-3.webp";
import cabin4 from "./product-images/cabin-4.webp";
import cabin5 from "./product-images/cabin-5.webp";

// 9. Structure / Access Panels
import struct1 from "./product-images/structure-1.webp";
import struct2 from "./product-images/structure-2.webp";
import struct3 from "./product-images/structure-3.webp";
import struct4 from "./product-images/structure-4.webp";
import struct5 from "./product-images/structure-5.webp";

export const IMAGE_COLLECTIONS = {
  "engine-parts": [
    { src: engine1, alt: "High-pressure turbine compressor blade on inspection table", label: "Turbine Blade" },
    { src: engine2, alt: "Axial flow compressor case with rotor blade stages and stator vanes", label: "Compressor Stator" },
    { src: engine3, alt: "Staged multi-disk axial compressor rotor assembly", label: "Compressor Rotor" },
    { src: engine4, alt: "Variable stator guide vanes (VSV) actuation casing", label: "Guide Vanes" },
    { src: engine5, alt: "Turbine exhaust nozzle guide vane ring assembly", label: "Exhaust Nozzle" },
  ],
  "replacement-engines": [
    { src: replEng1, alt: "Complete CFM56 commercial high-bypass turbofan powerplant on transport stand", label: "CFM56 Powerplant" },
    { src: replEng2, alt: "Pratt & Whitney PW4000 turbofan engine with cowls open", label: "PW4000 Powerplant" },
    { src: replEng3, alt: "General Electric CF6 high-bypass turbofan powerplant on cradle", label: "GE CF6 Powerplant" },
    { src: replEng4, alt: "Klimov RD-33 afterburning turbofan engine on test stand", label: "RD-33 Powerplant" },
    { src: replEng5, alt: "Eurojet EJ200 multi-spool turbofan engine on assembly rig", label: "EJ200 Powerplant" },
  ],
  "avionics": [
    { src: avionics1, alt: "Electronic Flight Instrument System (EFIS) Primary Flight Display (PFD)", label: "Primary Flight Display" },
    { src: avionics2, alt: "Boeing 737-800 glass cockpit flight instrument display unit", label: "Cockpit Navigation Display" },
    { src: avionics3, alt: "Multi-Function Display (MFD) flight computer unit", label: "Multi-Function Display" },
    { src: avionics4, alt: "Integrated flight management system (FMS) control and display suite", label: "Flight Management Suite" },
    { src: avionics5, alt: "Aircraft digital autopilot and radar avionics module", label: "Autopilot Guidance Module" },
  ],
  "electrical": [
    { src: elec1, alt: "Aircraft starter-generator power feed lines and clamp assembly", label: "Starter-Generator Unit" },
    { src: elec2, alt: "Aircraft thermal circuit breaker bus distribution panel", label: "Circuit Breaker Bus" },
    { src: elec3, alt: "Cockpit overhead electrical control and switching panel", label: "Overhead Distribution Panel" },
    { src: elec4, alt: "Aircraft production wiring loom, braided harness, and terminal connectors", label: "Wiring Harness" },
    { src: elec5, alt: "Aircraft power distribution harness and terminal board assembly", label: "Power Distribution Board" },
  ],
  "hydraulics": [
    { src: hyd1, alt: "High-pressure aircraft dual-acting hydraulic actuator cylinder", label: "Hydraulic Actuator Cylinder" },
    { src: hyd2, alt: "Primary flight control surface electro-hydraulic servo actuator", label: "Servo Actuator Unit" },
    { src: hyd3, alt: "Aircraft hydraulic shop flight control servo actuator overhaul", label: "Actuator Manifold" },
    { src: hyd4, alt: "Engine-driven 3,000 PSI aircraft variable-displacement hydraulic pump", label: "Hydraulic Power Pump" },
    { src: hyd5, alt: "Aircraft main hydraulic supply pump with titanium manifold fittings", label: "Main Supply Pump" },
  ],
  "landing-gear": [
    { src: lg1, alt: "Aircraft landing gear oleo-pneumatic shock strut and steering linkage", label: "Oleo Shock Strut" },
    { src: lg2, alt: "Oleo trailing-link main landing gear shock absorber and torque links", label: "Trailing-Link Strut" },
    { src: lg3, alt: "A220 nose landing gear strut with dual wheels and retraction arm", label: "Forward Landing Gear" },
    { src: lg4, alt: "Aircraft wheel rim and multi-rotor carbon brake heat pack assembly", label: "Brake Rotor Heat Pack" },
    { src: lg5, alt: "Landing gear geometric downlock strut and hydraulic actuator", label: "Downlock Strut" },
  ],
  "fasteners": [
    { src: fast1, alt: "Aerospace temporary skin sheet-metal Cleco fastener pin", label: "Cleco Skin Fastener" },
    { src: fast2, alt: "Calibrated 3.2mm and 4.8mm aerospace airframe skin fasteners", label: "Airframe Fastener Pins" },
    { src: fast3, alt: "Aircraft skin retention fastener installation assembly", label: "Fastener Retention Tooling" },
    { src: fast4, alt: "Precision aircraft flush rivets and structural rivets", label: "Structural Flush Rivets" },
    { src: fast5, alt: "Safety-wired aerospace castellated hex bolts and locking hardware", label: "Castellated Locking Hardware" },
  ],
  "cabin": [
    { src: cabin1, alt: "Commercial aircraft passenger cabin environmental control panel", label: "Cabin Control Panel" },
    { src: cabin2, alt: "Airliner passenger cabin interior seating and overhead luggage bins", label: "Cabin Interior & Seating" },
    { src: cabin3, alt: "Aircraft air conditioning recirculation HEPA filter element", label: "Cabin Air Filter" },
    { src: cabin4, alt: "Overhead passenger service unit (PSU) with reading lights and gasper vents", label: "Passenger Service Unit" },
    { src: cabin5, alt: "Flight attendant galley control station and cabin management panel", label: "Attendant Station Panel" },
  ],
  "structure": [
    { src: struct1, alt: "Airframe servicing access panel door with flush lever latch", label: "Access Panel Door" },
    { src: struct2, alt: "Aircraft fuselage structural access panel with composite border", label: "Structural Inspection Panel" },
    { src: struct3, alt: "Aircraft airframe center wing box and structural spar assembly on maintenance jig", label: "Wing Root Structural Assembly" },
    { src: struct4, alt: "Upper fuselage structural escape hatch and sealed access portal", label: "Upper Deck Access Portal" },
    { src: struct5, alt: "Aircraft engine nacelle hinged fan cowl door structure", label: "Engine Nacelle Cowl Door" },
  ],
};

/**
 * Deterministic string hash function for consistent image assignment.
 * Returns an index in [0, length - 1].
 */
function getStableIndex(key, length) {
  if (!key || length <= 1) return 0;
  let hash = 0;
  const str = String(key);
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % length;
}

/**
 * Resolves a product to its appropriate visual category collection key.
 * Handles database categories, aliases, and name/part keywords.
 */
export function resolveVisualCategory(product = {}) {
  const category = (product.category_name || product.category || "").trim().toLowerCase();
  const name = (product.product_name || product.name || "").toLowerCase();
  const partNumber = (product.part_number || "").toLowerCase();
  const fullText = `${category} ${name} ${partNumber}`;

  // 1. High-priority keyword refinements
  if (/blade|vane|airfoil|rotor disk|stator ring/i.test(fullText)) {
    return "engine-parts";
  }

  // 2. Category mapping & aliases
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

  return "engine-parts";
}

/**
 * Returns a stable cover image object for the given product.
 * Returns null if product is invalid or no collection is found.
 *
 * @param {Object} product - Product record from API or mock
 * @returns {Object|null} Cover image descriptor with { src, alt, label, categoryKey, isRepresentative: true }
 */
export function getProductCoverImage(product) {
  if (!product) return null;
  const categoryKey = resolveVisualCategory(product);
  const collection = IMAGE_COLLECTIONS[categoryKey];
  if (!collection || collection.length === 0) return null;

  const seed = product.product_id || product.id || product.part_number || product.product_name || product.name || "0";
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

/**
 * Returns an array of gallery image objects for the given product.
 * The images are rotated deterministically starting from the cover image.
 *
 * @param {Object} product - Product record from API or mock
 * @returns {Array<Object>} Array of gallery image descriptors
 */
export function getProductGalleryImages(product) {
  if (!product) return [];
  const categoryKey = resolveVisualCategory(product);
  const collection = IMAGE_COLLECTIONS[categoryKey];
  if (!collection || collection.length === 0) return [];

  const seed = product.product_id || product.id || product.part_number || product.product_name || product.name || "0";
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

