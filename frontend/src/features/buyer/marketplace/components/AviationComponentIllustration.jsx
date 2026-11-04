/**
 * AviationComponentIllustration
 * Vector schematic illustration based on part category and type.
 * Provides accurate fallback visualization for aerospace catalog components
 * when photographic assets are not present in the catalog database.
 */
export default function AviationComponentIllustration({
  category,
  productType,
  name,
  className = "w-28 h-24",
  viewMode = "default",
}) {
  const lowerName = (name || "").toLowerCase();
  const lowerCat = (category || "").toLowerCase();

  // 1. Turbine / Rotor Blades / Engine Core
  if (
    lowerName.includes("blade") ||
    lowerName.includes("rotor") ||
    lowerCat.includes("engine")
  ) {
    return (
      <svg
        viewBox="0 0 160 120"
        className={`${className} text-slate-400`}
        fill="none"
        stroke="currentColor"
        aria-hidden="true"
      >
        <rect
          x="20"
          y="88"
          width="120"
          height="14"
          rx="3"
          fill="#E2E8F0"
          stroke="#94A3B8"
          strokeWidth="2"
        />
        <path
          d="M35 88 C32 40, 42 20, 45 16 C48 20, 58 40, 55 88 Z"
          fill="#F1F5F9"
          stroke="#64748B"
          strokeWidth="2"
        />
        <path
          d="M65 88 C62 38, 72 18, 75 14 C78 18, 88 38, 85 88 Z"
          fill="#F8FAFC"
          stroke="#475569"
          strokeWidth="2"
        />
        <path
          d="M95 88 C92 38, 102 18, 105 14 C108 18, 118 38, 115 88 Z"
          fill="#F8FAFC"
          stroke="#475569"
          strokeWidth="2"
        />
        <path
          d="M125 88 C122 40, 132 20, 135 16 C138 20, 148 40, 145 88 Z"
          fill="#F1F5F9"
          stroke="#64748B"
          strokeWidth="2"
        />
        <circle cx="80" cy="95" r="3" fill="#64748B" />
        <circle cx="110" cy="95" r="3" fill="#64748B" />
        <circle cx="50" cy="95" r="3" fill="#64748B" />
        {viewMode === "blueprint" && (
          <path
            d="M20 20 L140 20 M80 10 L80 110"
            stroke="#0284C7"
            strokeDasharray="3 3"
            strokeWidth="1"
          />
        )}
      </svg>
    );
  }

  // 2. Pumps / Valves / Hydraulics
  if (
    lowerName.includes("pump") ||
    lowerName.includes("valve") ||
    lowerCat.includes("hydraulic")
  ) {
    return (
      <svg
        viewBox="0 0 160 120"
        className={`${className} text-sky-500`}
        fill="none"
        stroke="currentColor"
        aria-hidden="true"
      >
        <circle
          cx="80"
          cy="60"
          r="32"
          fill="#E0F2FE"
          stroke="#0284C7"
          strokeWidth="2.5"
        />
        <circle
          cx="80"
          cy="60"
          r="14"
          fill="#BAE6FD"
          stroke="#0369A1"
          strokeWidth="2"
        />
        <circle cx="80" cy="60" r="5" fill="#0369A1" />
        {/* Flanges / Pipes */}
        <rect
          x="74"
          y="12"
          width="12"
          height="18"
          rx="2"
          fill="#BAE6FD"
          stroke="#0284C7"
          strokeWidth="2"
        />
        <rect x="70" y="8" width="20" height="5" rx="1" fill="#0284C7" />
        <rect
          x="18"
          y="54"
          width="30"
          height="12"
          rx="2"
          fill="#BAE6FD"
          stroke="#0284C7"
          strokeWidth="2"
        />
        <rect x="12" y="50" width="6" height="20" rx="1" fill="#0284C7" />
        <rect
          x="112"
          y="54"
          width="30"
          height="12"
          rx="2"
          fill="#BAE6FD"
          stroke="#0284C7"
          strokeWidth="2"
        />
        <rect x="142" y="50" width="6" height="20" rx="1" fill="#0284C7" />
        {/* Fasteners */}
        <circle cx="60" cy="40" r="2.5" fill="#0369A1" />
        <circle cx="100" cy="40" r="2.5" fill="#0369A1" />
        <circle cx="60" cy="80" r="2.5" fill="#0369A1" />
        <circle cx="100" cy="80" r="2.5" fill="#0369A1" />
      </svg>
    );
  }

  // 3. Sensors / Thermocouples / Electrical Leads
  if (
    lowerName.includes("sensor") ||
    lowerName.includes("thermocouple") ||
    lowerName.includes("lead") ||
    lowerCat.includes("electrical")
  ) {
    return (
      <svg
        viewBox="0 0 160 120"
        className={`${className} text-amber-500`}
        fill="none"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          d="M25 75 Q60 55, 95 62"
          stroke="#F59E0B"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d="M25 80 Q60 60, 95 67"
          stroke="#3B82F6"
          strokeWidth="3"
          strokeLinecap="round"
        />
        {/* Sensor probe tip */}
        <rect
          x="95"
          y="56"
          width="35"
          height="12"
          rx="2"
          fill="#CBD5E1"
          stroke="#475569"
          strokeWidth="2"
        />
        <rect
          x="130"
          y="59"
          width="18"
          height="6"
          rx="1"
          fill="#94A3B8"
          stroke="#334155"
          strokeWidth="1.5"
        />
        {/* Connector collar */}
        <rect x="90" y="53" width="7" height="18" rx="1.5" fill="#475569" />
        <line
          x1="102"
          y1="56"
          x2="102"
          y2="68"
          stroke="#94A3B8"
          strokeWidth="1"
        />
        <line
          x1="108"
          y1="56"
          x2="108"
          y2="68"
          stroke="#94A3B8"
          strokeWidth="1"
        />
      </svg>
    );
  }

  // 4. Fasteners / Hardware
  if (
    lowerName.includes("bolt") ||
    lowerName.includes("nut") ||
    lowerName.includes("screw") ||
    lowerCat.includes("fastener")
  ) {
    return (
      <svg
        viewBox="0 0 160 120"
        className={`${className} text-slate-400`}
        fill="none"
        stroke="currentColor"
        aria-hidden="true"
      >
        <rect
          x="42"
          y="24"
          width="18"
          height="8"
          rx="1"
          fill="#CBD5E1"
          stroke="#475569"
          strokeWidth="1.5"
        />
        <rect
          x="47"
          y="32"
          width="8"
          height="58"
          fill="#E2E8F0"
          stroke="#64748B"
          strokeWidth="1.5"
        />
        <rect
          x="74"
          y="20"
          width="18"
          height="8"
          rx="1"
          fill="#CBD5E1"
          stroke="#475569"
          strokeWidth="1.5"
        />
        <rect
          x="79"
          y="28"
          width="8"
          height="64"
          fill="#F1F5F9"
          stroke="#475569"
          strokeWidth="1.5"
        />
        <rect
          x="106"
          y="24"
          width="18"
          height="8"
          rx="1"
          fill="#CBD5E1"
          stroke="#475569"
          strokeWidth="1.5"
        />
        <rect
          x="111"
          y="32"
          width="8"
          height="58"
          fill="#E2E8F0"
          stroke="#64748B"
          strokeWidth="1.5"
        />
      </svg>
    );
  }

  // 5. Default generic aviation component
  return (
    <svg
      viewBox="0 0 160 120"
      className={`${className} text-slate-400`}
      fill="none"
      stroke="currentColor"
      aria-hidden="true"
    >
      <rect
        x="35"
        y="30"
        width="90"
        height="60"
        rx="8"
        fill="#F8FAFC"
        stroke="#64748B"
        strokeWidth="2"
      />
      <circle
        cx="80"
        cy="60"
        r="18"
        fill="#E2E8F0"
        stroke="#475569"
        strokeWidth="2"
      />
      <circle cx="80" cy="60" r="6" fill="#3B82F6" />
      <line
        x1="45"
        y1="42"
        x2="60"
        y2="42"
        stroke="#94A3B8"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="45"
        y1="50"
        x2="55"
        y2="50"
        stroke="#94A3B8"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="112" cy="42" r="3" fill="#10B981" />
      <circle cx="112" cy="52" r="3" fill="#F59E0B" />
    </svg>
  );
}

