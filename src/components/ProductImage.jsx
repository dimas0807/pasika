import { useState } from "react";

// Mapping from product keys/categories to realistic high-res photographic assets
const IMAGE_MAP = {
  "honey-jar": "/images/prod-honey.jpg",
  "honey-jar-big": "/images/prod-honey.jpg",
  "cream-honey": "/images/prod-cream-honey.jpg",
  "nuts-honey": "/images/prod-nuts-honey.jpg",
  pollen: "/images/prod-pollen.jpg",
  propolis: "/images/prod-propolis.jpg",
  perga: "/images/prod-perga.jpg",
  "box-medovyi": "/images/prod-gift-box.jpg",
  "box-karpatskyi": "/images/prod-gift-box.jpg",
  "box-osoblyvyi": "/images/prod-gift-box.jpg",
};

const CATEGORY_DEFAULT_IMAGE = {
  honey: "/images/prod-honey.jpg",
  "cream-honey": "/images/prod-cream-honey.jpg",
  "nuts-honey": "/images/prod-nuts-honey.jpg",
  pollen: "/images/prod-pollen.jpg",
  propolis: "/images/prod-propolis.jpg",
  perga: "/images/prod-perga.jpg",
  "gift-boxes": "/images/prod-gift-box.jpg",
};

// Fallback stylized vector illustrations (in case image network fails)
const PALETTE = {
  honey: { fill: "#D99A19", cap: "#8A6A2C" },
  "cream-honey": { fill: "#F3D9A4", cap: "#B9A47A" },
  "nuts-honey": { fill: "#B5731A", cap: "#6E4A1A" },
  pollen: { fill: "#F4B928", cap: "#9C7A1C" },
  propolis: { fill: "#7A5230", cap: "#4A3320" },
  perga: { fill: "#C98A2E", cap: "#7A5220" },
};

function SvgFallbackJar({ colorKey }) {
  const c = PALETTE[colorKey] || PALETTE.honey;
  return (
    <svg viewBox="0 0 240 240" className="w-full h-full p-4">
      <ellipse cx="120" cy="205" rx="70" ry="10" fill="#29282111" />
      <rect x="95" y="35" width="50" height="20" rx="6" fill={c.cap} />
      <rect x="90" y="50" width="60" height="12" rx="4" fill={c.cap} opacity="0.85" />
      <path
        d="M60 65 h120 a10 10 0 0 1 10 10 v100 a30 30 0 0 1 -30 30 H80 a30 30 0 0 1 -30 -30 V75 a10 10 0 0 1 10 -10 z"
        fill="#FFFDF8"
        stroke="#29282122"
        strokeWidth="2"
      />
      <path d="M65 80 h110 v90 a25 25 0 0 1 -25 25 H90 a25 25 0 0 1 -25 -25 z" fill={c.fill} />
      <ellipse cx="120" cy="80" rx="55" ry="8" fill="#FFFFFF" opacity="0.35" />
      <text
        x="120"
        y="130"
        textAnchor="middle"
        fontFamily="Playfair Display, serif"
        fontSize="13"
        fill="#FFFDF8"
        opacity="0.9"
      >
        Honey
      </text>
    </svg>
  );
}

function SvgFallbackBox() {
  return (
    <svg viewBox="0 0 240 240" className="w-full h-full p-4">
      <ellipse cx="120" cy="205" rx="80" ry="10" fill="#29282111" />
      <rect x="40" y="90" width="160" height="100" rx="8" fill="#C9A15E" />
      <rect x="40" y="80" width="160" height="26" rx="6" fill="#B9895A" />
      <rect x="108" y="70" width="24" height="120" fill="#D99A19" opacity="0.9" />
      <rect x="40" y="128" width="160" height="14" fill="#D99A19" opacity="0.9" />
      <circle cx="120" cy="128" r="14" fill="#D99A19" />
    </svg>
  );
}

export default function ProductImage({ image, category, alt = "Продукт пасіки", className = "" }) {
  const [hasError, setHasError] = useState(false);

  // Resolve photographic asset path
  let resolvedSrc = null;

  if (image && (image.startsWith("/") || image.startsWith("http"))) {
    resolvedSrc = image;
  } else if (image && IMAGE_MAP[image]) {
    resolvedSrc = IMAGE_MAP[image];
  } else if (category && CATEGORY_DEFAULT_IMAGE[category]) {
    resolvedSrc = CATEGORY_DEFAULT_IMAGE[category];
  } else if (image?.startsWith("box") || category === "gift-boxes") {
    resolvedSrc = "/images/prod-gift-box.jpg";
  } else {
    resolvedSrc = "/images/prod-honey.jpg";
  }

  const isBox = category === "gift-boxes" || image?.startsWith("box");

  if (hasError || !resolvedSrc) {
    return (
      <div className={`bg-[#F9F5EC] flex items-center justify-center rounded-2xl overflow-hidden ${className}`}>
        {isBox ? <SvgFallbackBox /> : <SvgFallbackJar colorKey={category} />}
      </div>
    );
  }

  return (
    <div className={`relative bg-[#FAF6EE] flex items-center justify-center rounded-2xl overflow-hidden ${className}`}>
      <img
        src={resolvedSrc}
        alt={alt}
        loading="lazy"
        onError={() => setHasError(true)}
        className="w-full h-full object-cover object-center transition-transform duration-500"
      />
    </div>
  );
}
