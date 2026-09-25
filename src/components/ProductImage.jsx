// Demo product illustrations (SVG mockups), consistent single style.
// Swap for real product photography later — same aspect ratio (1:1).
const PALETTE = {
  honey: { fill: "#D99A19", cap: "#8A6A2C" },
  "cream-honey": { fill: "#F3D9A4", cap: "#B9A47A" },
  "nuts-honey": { fill: "#B5731A", cap: "#6E4A1A" },
  pollen: { fill: "#F4B928", cap: "#9C7A1C" },
  propolis: { fill: "#7A5230", cap: "#4A3320" },
  perga: { fill: "#C98A2E", cap: "#7A5220" },
};

function Jar({ colorKey }) {
  const c = PALETTE[colorKey] || PALETTE.honey;
  return (
    <svg viewBox="0 0 240 240" className="w-full h-full">
      <ellipse cx="120" cy="205" rx="70" ry="10" fill="#29282111" />
      <rect x="95" y="35" width="50" height="20" rx="6" fill={c.cap} />
      <rect x="90" y="50" width="60" height="12" rx="4" fill={c.cap} opacity="0.85" />
      <path d="M60 65 h120 a10 10 0 0 1 10 10 v100 a30 30 0 0 1 -30 30 H80 a30 30 0 0 1 -30 -30 V75 a10 10 0 0 1 10 -10 z" fill="#FFFDF8" stroke="#29282122" strokeWidth="2" />
      <path d="M65 80 h110 v90 a25 25 0 0 1 -25 25 H90 a25 25 0 0 1 -25 -25 z" fill={c.fill} />
      <ellipse cx="120" cy="80" rx="55" ry="8" fill="#FFFFFF" opacity="0.35" />
      <g opacity="0.5">
        <circle cx="150" cy="110" r="2.5" fill="#29282133" />
        <circle cx="100" cy="140" r="2.5" fill="#29282133" />
        <circle cx="135" cy="160" r="2.5" fill="#29282133" />
      </g>
      <text x="120" y="130" textAnchor="middle" fontFamily="Playfair Display, serif" fontSize="13" fill="#FFFDF8" opacity="0.9">Honey</text>
    </svg>
  );
}

function GiftBox({ variant }) {
  const ribbon = variant === "box-osoblyvyi" ? "#B9A47A" : variant === "box-karpatskyi" ? "#536B43" : "#D99A19";
  return (
    <svg viewBox="0 0 240 240" className="w-full h-full">
      <ellipse cx="120" cy="205" rx="80" ry="10" fill="#29282111" />
      <rect x="40" y="90" width="160" height="100" rx="8" fill="#C9A15E" />
      <rect x="40" y="90" width="160" height="100" rx="8" fill="url(#kraft)" opacity="0.25" />
      <rect x="40" y="80" width="160" height="26" rx="6" fill="#B9895A" />
      <rect x="108" y="70" width="24" height="120" fill={ribbon} opacity="0.9" />
      <rect x="40" y="128" width="160" height="14" fill={ribbon} opacity="0.9" />
      <circle cx="120" cy="128" r="18" fill={ribbon} />
      <circle cx="120" cy="128" r="8" fill="#FFFDF8" />
      <circle cx="70" cy="150" r="16" fill="#FFFDF8" stroke="#D99A19" strokeWidth="3" />
      <circle cx="170" cy="160" r="14" fill="#FFFDF8" stroke="#D99A19" strokeWidth="3" />
      <defs>
        <pattern id="kraft" width="6" height="6" patternUnits="userSpaceOnUse">
          <rect width="6" height="6" fill="#00000000" />
          <path d="M0 6 L6 0" stroke="#00000022" strokeWidth="1" />
        </pattern>
      </defs>
    </svg>
  );
}

export default function ProductImage({ image, category, className = "" }) {
  const isBox = category === "gift-boxes" || image?.startsWith("box");
  return (
    <div className={`bg-gradient-to-br from-cream to-[#EFE4C9] flex items-center justify-center rounded-2xl overflow-hidden ${className}`}>
      <div className="w-3/4 h-3/4">
        {isBox ? <GiftBox variant={image} /> : <Jar colorKey={category} />}
      </div>
    </div>
  );
}
