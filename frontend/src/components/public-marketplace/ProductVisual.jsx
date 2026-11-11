import enginePartsImg from "../../screens/public/illustrations/engine-parts.svg";
import turbineBladesImg from "../../screens/public/illustrations/turbine-blades.svg";
import avionicsImg from "../../screens/public/illustrations/avionics.svg";
import electricalImg from "../../screens/public/illustrations/electrical.svg";
import hydraulicsImg from "../../screens/public/illustrations/hydraulics.svg";
import landingGearImg from "../../screens/public/illustrations/landing-gear.svg";
import fastenersImg from "../../screens/public/illustrations/fasteners.svg";
import sensorsImg from "../../screens/public/illustrations/sensors.svg";
import accessPanelsImg from "../../screens/public/illustrations/access-panels.svg";

export const CATEGORY_ILLUSTRATIONS = {
  "engine-parts": { src: enginePartsImg, label: "Engine & Core Propulsion" },
  "turbine-blades": { src: turbineBladesImg, label: "Turbine Blades & Vanes" },
  "avionics": { src: avionicsImg, label: "Avionics & Flight Electronics" },
  "electrical": { src: electricalImg, label: "Electrical Systems & Wiring" },
  "hydraulics": { src: hydraulicsImg, label: "Hydraulics & Actuation" },
  "landing-gear": { src: landingGearImg, label: "Landing Gear & Brakes" },
  "fasteners": { src: fastenersImg, label: "Aerospace Fasteners & Hardware" },
  "sensors": { src: sensorsImg, label: "Sensors & Telemetry Instrumentation" },
  "access-panels": { src: accessPanelsImg, label: "Structural Panels & Covers" },
};

export function resolveIllustrationKey({ category = "", name = "", partNumber = "" } = {}) {
  const text = `${category} ${name} ${partNumber}`.toLowerCase();

  if (/cabin/i.test(text)) {
    return "cabin";
  }
  if (/blade|vane|airfoil|turbine|hpt|lpt/i.test(text)) {
    return "turbine-blades";
  }
  if (/sensor|probe|transducer|thermocouple|telemetry|pitot/i.test(text)) {
    return "sensors";
  }
  if (/panel|door|access|cowl|fairing|hatch|shroud|structure/i.test(text)) {
    return "access-panels";
  }
  if (/avionics|display|instrument|navigation|radar|flight/i.test(text)) {
    return "avionics";
  }
  if (/electric|wire|harness|generator|relay|breaker|power/i.test(text)) {
    return "electrical";
  }
  if (/hydraulic|actuator|cylinder|valve|pump|fluid/i.test(text)) {
    return "hydraulics";
  }
  if (/gear|wheel|strut|brake|tire|tyre|oleo|landing/i.test(text)) {
    return "landing-gear";
  }
  if (/fastener|bolt|screw|rivet|nut|pin|washer|stud/i.test(text)) {
    return "fasteners";
  }
  if (/replacement/i.test(text)) {
    return "engine-parts";
  }
  return "engine-parts";
}

export default function ProductVisual({
  product = null,
  category = "",
  name = "",
  partNumber = "",
  categoryKey = "",
  size = "md",
  className = "",
  showBadge = false,
  showDisclaimer = false,
  alt = "",
}) {
  const prodCategory = category || product?.category_name || product?.category || "";
  const prodName = name || product?.product_name || product?.name || "";
  const prodPart = partNumber || product?.part_number || "";

  const resolvedKey = categoryKey || resolveIllustrationKey({
    category: prodCategory,
    name: prodName,
    partNumber: prodPart,
  });

  const computedAlt = alt || `${prodName || prodCategory || resolvedKey} illustration`;

  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-24 h-24 sm:w-28 sm:h-28",
    lg: "w-44 h-44 sm:w-56 sm:h-56",
    hero: "w-48 h-48 sm:w-64 sm:h-64 lg:w-72 lg:h-72",
    full: "w-full h-auto max-w-xs mx-auto",
  }[size] || "w-28 h-28";

  // Specific clean vector fallback for Cabin Components
  if (resolvedKey === "cabin") {
    return (
      <div className={`flex flex-col items-center justify-center ${className}`}>
        <div className="relative flex items-center justify-center">
          <svg
            viewBox="0 0 200 200"
            fill="none"
            className={`${sizeClasses} object-contain rounded-xl drop-shadow-xs transition-transform duration-300 hover:scale-105`}
            aria-label={computedAlt}
            role="img"
          >
            <rect width="200" height="200" rx="16" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1" />
            <circle cx="100" cy="100" r="75" stroke="#CBD5E1" strokeWidth="1.5" strokeDasharray="4 4" />
            {/* Cabin Control Panel & Environmental Module */}
            <rect x="46" y="46" width="108" height="108" rx="10" fill="#FFFFFF" stroke="#0B1F3A" strokeWidth="2.5" />
            <rect x="58" y="58" width="84" height="46" rx="6" fill="#EAF6FD" stroke="#2D9CDB" strokeWidth="1.5" />
            <circle cx="76" cy="81" r="6" fill="#0B1F3A" />
            <circle cx="100" cy="81" r="6" fill="#0B1F3A" />
            <circle cx="124" cy="81" r="6" fill="#0B1F3A" />
            <path d="M68 120 L 132 120 M 80 130 L 120 130" stroke="#0B1F3A" strokeWidth="2" strokeLinecap="round" />
            <rect x="74" y="166" width="52" height="18" rx="4" fill="#0B1F3A" />
            <text x="100" y="178" fill="#FFFFFF" fontFamily="system-ui, sans-serif" fontSize="8" fontWeight="700" textAnchor="middle" letterSpacing="1">CABIN</text>
          </svg>
          {showBadge && (
            <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#0B1F3A]/80 text-white backdrop-blur-xs">
              CABIN
            </span>
          )}
        </div>
        {showDisclaimer && (
          <p className="mt-2 text-[11px] text-slate-400 text-center tracking-tight">
            Illustration for category visualization.
          </p>
        )}
      </div>
    );
  }

  const illustration = CATEGORY_ILLUSTRATIONS[resolvedKey] || CATEGORY_ILLUSTRATIONS["engine-parts"];

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className="relative flex items-center justify-center">
        <img
          src={illustration.src}
          alt={computedAlt}
          className={`${sizeClasses} object-contain rounded-xl drop-shadow-xs transition-transform duration-300 hover:scale-105`}
          loading="lazy"
        />
        {showBadge && (
          <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#0B1F3A]/80 text-white backdrop-blur-xs">
            {resolvedKey.replace("-", " ").toUpperCase()}
          </span>
        )}
      </div>
      {showDisclaimer && (
        <p className="mt-2 text-[11px] text-slate-400 text-center tracking-tight">
          Illustration for category visualization.
        </p>
      )}
    </div>
  );
}
