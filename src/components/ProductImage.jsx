import { useState } from "react";
import { resolveImageUrl } from "../data/db";

// Mapping from meat product keys to realistic photographic assets
const IMAGE_MAP = {
  "kovbasa-domashnya": "/images/kovbasa-domashnya.jpg",
  "kovbasa-kopchena": "/images/kovbasa-kopchena.jpg",
  shynka: "/images/shynka.jpg",
  balyk: "/images/balyk.jpg",
  pidcherevyna: "/images/pidcherevyna.jpg",
  salo: "/images/salo.jpg",
  kurochka: "/images/kurochka.jpg",
  sardelky: "/images/sardelky.jpg",
  pashtet: "/images/pashtet.jpg",
  rebertsya: "/images/rebertsya.jpg",
  "prod-gift-box": "/images/prod-gift-box.jpg",
  "gift-box": "/images/prod-gift-box.jpg",
  box: "/images/prod-gift-box.jpg",

  // Product slugs
  "balychok-kopchenyy": "/images/balyk.jpg",
  "oshyyok-yak-shashlyk": "/images/shynka.jpg",
  "rulet-z-chornoslyvom": "/images/shynka.jpg",
  "rulet-z-kurahoyu": "/images/shynka.jpg",
  "salo-kopchene": "/images/salo.jpg",
  "kurka-kopchena": "/images/kurochka.jpg",
  okorochok: "/images/kurochka.jpg",
  kryla: "/images/kurochka.jpg",
  file: "/images/kurochka.jpg",
  "rulety-kuryachi": "/images/kurochka.jpg",
  molochna: "/images/kovbasa-kopchena.jpg",
  nizhna: "/images/kovbasa-kopchena.jpg",
  fileyna: "/images/kovbasa-kopchena.jpg",
  molochni: "/images/sardelky.jpg",
  nizhni: "/images/sardelky.jpg",
  fileyni: "/images/sardelky.jpg",
  "pechinkovi-kovbasky": "/images/sardelky.jpg",
  "liverna-kovbasa": "/images/kovbasa-domashnya.jpg",
  "sardelky-kopcheni": "/images/sardelky.jpg",
  "sardelky-tsyharky": "/images/sardelky.jpg",
  "myslyvski-kovbasky": "/images/kovbasa-kopchena.jpg",
  "kovbasky-khot-doh": "/images/sardelky.jpg",
  "shashlyk-kuryachyy-na-hryli": "/images/rebertsya.jpg",
  "shynka-svynyna-kurka": "/images/shynka.jpg",
  "kuryachyy-file-okorochok": "/images/pashtet.jpg",
  "pechinkovyy-svynyachyy": "/images/pashtet.jpg",
  "saltyson-yazykovyy": "/images/pashtet.jpg",
  "pechene-myaso": "/images/shynka.jpg",
  "pechenyy-rulet": "/images/shynka.jpg",
  "oshyyok-pechenyy": "/images/shynka.jpg",
  "kovbasovyy-syr": "/images/pashtet.jpg",
  solonyna: "/images/salo.jpg",

  // Gift boxes
  "myasnyy-boks": "/images/prod-gift-box.jpg",
  "boks-do-svyata": "/images/prod-gift-box.jpg",
  "boks-dlya-viyskovoho": "/images/prod-gift-box.jpg",
  "simeynyy-boks": "/images/prod-gift-box.jpg",
  "podarunkovyy-boks": "/images/prod-gift-box.jpg",
  "vlasnyy-myasnyy-boks": "/images/prod-gift-box.jpg",
  "custom-meat-box": "/images/prod-gift-box.jpg",
  custom_box: "/images/prod-gift-box.jpg",
};

const CATEGORY_DEFAULT_IMAGE = {
  "domashni-kovbasy": "/images/kovbasa-domashnya.jpg",
  "kopchene-myaso": "/images/shynka.jpg",
  "kuryache-kopchene": "/images/kurochka.jpg",
  "vareni-kovbasy": "/images/kovbasa-kopchena.jpg",
  "sardelky-ta-kovbasky": "/images/sardelky.jpg",
  "pashtetky": "/images/pashtet.jpg",
  "domashnye": "/images/salo.jpg",
  "inshe": "/images/rebertsya.jpg",
  "podarunkovi-boksy": "/images/prod-gift-box.jpg",
  // Legacy categories fallback
  kopchenosti: "/images/rebertsya.jpg",
  kurochka: "/images/kurochka.jpg",
  sardelky: "/images/sardelky.jpg",
  pashtety: "/images/pashtet.jpg",
  salo: "/images/salo.jpg",
};

function SvgFallbackMeat() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#1F1C19] text-[#C88432] p-6 select-none">
      <span className="text-5xl mb-2">🥩</span>
      <span className="text-xs font-semibold uppercase tracking-wider text-[#9E9184]">
        М'ясний рай
      </span>
    </div>
  );
}

export default function ProductImage({ image, category, alt = "Домашній м'ясний делікатес", className = "" }) {
  const [hasError, setHasError] = useState(false);

  // Resolve photographic asset path
  let resolvedSrc = null;

  if (image && (image.startsWith("http://") || image.startsWith("https://") || image.startsWith("data:") || image.startsWith("blob:"))) {
    resolvedSrc = image;
  } else if (image && image.startsWith("/uploads/")) {
    resolvedSrc = resolveImageUrl(image);
  } else if (image && image.startsWith("/")) {
    resolvedSrc = image;
  } else if (image && IMAGE_MAP[image]) {
    resolvedSrc = IMAGE_MAP[image];
  } else if (category && CATEGORY_DEFAULT_IMAGE[category]) {
    resolvedSrc = CATEGORY_DEFAULT_IMAGE[category];
  } else {
    resolvedSrc = "/images/kovbasa-domashnya.jpg";
  }

  if (hasError || !resolvedSrc) {
    return (
      <div className={`bg-[#1F1C19] flex items-center justify-center rounded-2xl overflow-hidden border border-[#2E2822] ${className}`}>
        <SvgFallbackMeat />
      </div>
    );
  }

  return (
    <div className={`relative bg-[#1A1816] flex items-center justify-center rounded-2xl overflow-hidden border border-[#2E2822] ${className}`}>
      <img
        src={resolvedSrc}
        alt={alt}
        loading="lazy"
        onError={() => setHasError(true)}
        className="w-full h-full object-cover object-center transition-transform duration-500 hover:scale-105"
      />
    </div>
  );
}
