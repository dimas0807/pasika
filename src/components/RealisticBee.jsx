import { useId } from "react";

/**
 * Photorealistic 3D Honeybee (Apis mellifera) Component
 * Features authentic three-quarter flight perspective, anatomically accurate
 * segmented body, fuzzy velvet thorax, compound eyes, jointed legs with pollen baskets,
 * and double translucent wings beating at high frequency with 3D depth.
 */
export default function RealisticBee({
  size = 52,
  depth = "mid",       // 'near' | 'mid' | 'far'
  pollen = true,       // boolean or number (0 to 1) for golden pollen basket intensity
  angle = 0,           // flight heading angle in degrees (0deg = straight forward)
  banking = 0,         // banking angle (roll)
  facing = "right",    // 'right' (default, head pointing East/Forward) | 'left' (head pointing West)
  flapping = true,     // animate wings
  className = "",
  style = {},
}) {
  const uid = useId().replace(/:/g, "_");

  // Depth styling for 3D visual perspective
  const depthConfig = {
    near: {
      scale: 1.25,
      filter: "drop-shadow(0 20px 16px rgba(35,28,18,0.28))",
      blur: "none",
      opacity: 1,
    },
    mid: {
      scale: 1.0,
      filter: "drop-shadow(0 12px 10px rgba(35,28,18,0.2))",
      blur: "none",
      opacity: 0.98,
    },
    far: {
      scale: 0.65,
      filter: "drop-shadow(0 6px 5px rgba(35,28,18,0.14))",
      blur: "blur(1.4px)",
      opacity: 0.82,
    },
  }[depth] || {};

  const width = size * (depthConfig.scale || 1);
  const height = (width * 80) / 100;

  return (
    <div
      className={`pointer-events-none select-none inline-block ${className}`}
      style={{
        transform: `rotate(${angle}deg) rotateX(${banking}deg)`,
        filter: `${depthConfig.filter} ${depthConfig.blur || ""}`,
        opacity: depthConfig.opacity,
        transition: "transform 0.15s ease-out, filter 0.25s ease-out",
        ...style,
      }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 100 80"
        width={width}
        height={height}
        style={{ overflow: "visible" }}
      >
        <defs>
          {/* 3D Cylindrical Abdomen Light */}
          <linearGradient id={`abdo3D_${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#4A2E05" />
            <stop offset="20%" stopColor="#D98A12" />
            <stop offset="42%" stopColor="#FFAE26" />
            <stop offset="65%" stopColor="#B86F07" />
            <stop offset="85%" stopColor="#2D1A04" />
            <stop offset="100%" stopColor="#120A02" />
          </linearGradient>

          {/* Velvet Thorax Fur Gradient */}
          <radialGradient id={`thoraxFur_${uid}`} cx="45%" cy="38%" r="62%">
            <stop offset="0%" stopColor="#9E681F" />
            <stop offset="35%" stopColor="#754710" />
            <stop offset="70%" stopColor="#3D2408" />
            <stop offset="100%" stopColor="#1A0E03" />
          </radialGradient>

          {/* Compound Eye with Glossy Curved Specular Sheen */}
          <radialGradient id={`eyeGloss_${uid}`} cx="35%" cy="30%" r="65%">
            <stop offset="0%" stopColor="#575147" />
            <stop offset="45%" stopColor="#221E1A" />
            <stop offset="100%" stopColor="#080706" />
          </radialGradient>

          {/* Translucent Glass Wing with Fine Sunlight Iridescence */}
          <linearGradient id={`wingGlass_${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.88" />
            <stop offset="25%" stopColor="#FFF7D6" stopOpacity="0.7" />
            <stop offset="60%" stopColor="#E2EFFF" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.3" />
          </linearGradient>

          {/* Wing Vein Pattern Stroke */}
          <linearGradient id={`veinStroke_${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#875E1E" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#D1A252" stopOpacity="0.4" />
          </linearGradient>

          {/* Golden Pollen Basket Glow */}
          <radialGradient id={`pollenBasket_${uid}`} cx="40%" cy="35%" r="60%">
            <stop offset="0%" stopColor="#FFF176" />
            <stop offset="45%" stopColor="#FBC02D" />
            <stop offset="85%" stopColor="#F57F17" />
            <stop offset="100%" stopColor="#E65100" />
          </radialGradient>

          {/* Ambient Warm Golden Aura */}
          <radialGradient id={`ambient_${uid}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#F4B928" stopOpacity="0.35" />
            <stop offset="60%" stopColor="#D99A19" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#D99A19" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ambient atmospheric warm glow */}
        <ellipse cx="50" cy="40" rx="38" ry="26" fill={`url(#ambient_${uid})`} />

        {/* Anatomical Orientation Group: when facing="right" (default), mirrors so Head is Forward at Right */}
        <g transform={facing === "right" ? "translate(100, 0) scale(-1, 1)" : undefined}>
          {/* ==================================================
              1. LEGS (Articulated with natural joints & pollen basket)
              ================================================== */}
          <g stroke="#241B10" strokeLinecap="round" strokeLinejoin="round" fill="none">
            {/* Forelegs (reaching forward in flight) */}
            <path d="M 40 43 Q 32 50 28 55 T 24 60" strokeWidth="1.2" opacity="0.9" />
            <path d="M 43 42 Q 36 47 33 53" strokeWidth="0.9" opacity="0.65" />

            {/* Midlegs (angled downward for stability) */}
            <path d="M 50 45 Q 45 56 40 63 T 36 68" strokeWidth="1.3" opacity="0.92" />
            <path d="M 52 44 Q 48 53 45 60" strokeWidth="1" opacity="0.7" />

            {/* Hindlegs with Corbicula (Pollen Basket) */}
            <path d="M 62 46 Q 60 60 54 70 T 48 76" strokeWidth="1.6" opacity="0.95" />
            <path d="M 64 45 Q 63 56 59 66" strokeWidth="1.1" opacity="0.75" />

            {/* Realistic Bright Golden Pollen Pellet gathered on hind leg */}
            {Boolean(pollen) && (
              <g
                opacity={typeof pollen === "number" ? Math.max(0, Math.min(1, pollen)) : 1}
                style={{ transition: "opacity 0.4s ease-in-out" }}
              >
                <ellipse
                  cx="56"
                  cy="64"
                  rx="3.2"
                  ry="5"
                  fill={`url(#pollenBasket_${uid})`}
                  stroke="#C47D06"
                  strokeWidth="0.6"
                  transform="rotate(-15 56 64)"
                />
                {/* Pollen dust texture highlights */}
                <circle cx="55.2" cy="62.5" r="0.8" fill="#FFF9C4" opacity="0.9" />
                <circle cx="57" cy="65" r="0.6" fill="#FFF59D" opacity="0.8" />
              </g>
            )}
          </g>

          {/* ==================================================
              2. ABDOMEN (3D Foreshortened, Segmented Chitin Tergites)
              ================================================== */}
          <g>
            {/* Base 3D body volume */}
            <ellipse cx="69" cy="40" rx="23" ry="14" fill={`url(#abdo3D_${uid})`} />

          {/* Tergite segment shadows for 3D cylindrical depth */}
          <path
            d="M 52 32 Q 56 40 52 48 Q 58 40 52 32 Z"
            fill="#120D06"
            opacity="0.95"
          />
          <path
            d="M 60 28 Q 65 40 60 52 Q 67 40 60 28 Z"
            fill="#17120A"
            opacity="0.95"
          />
          <path
            d="M 69 27 Q 75 40 69 53 Q 77 40 69 27 Z"
            fill="#1A130A"
            opacity="0.95"
          />
          <path
            d="M 78 29 Q 84 40 78 51 Q 86 40 78 29 Z"
            fill="#140E06"
            opacity="0.95"
          />

          {/* Golden velvety hair bands along each tergite border */}
          <path d="M 56 30 Q 61 40 56 50" stroke="#FFDF85" strokeWidth="0.9" fill="none" opacity="0.85" />
          <path d="M 65 28 Q 71 40 65 52" stroke="#FFD76B" strokeWidth="1" fill="none" opacity="0.85" />
          <path d="M 74 28 Q 80 40 74 52" stroke="#FFCD4A" strokeWidth="0.9" fill="none" opacity="0.8" />

          {/* Specular dorsal highlight along the curved top spine */}
          <path d="M 51 30 Q 68 25 84 32" stroke="#FFF7C2" strokeWidth="0.9" fill="none" opacity="0.7" />

          {/* Tapered posterior tip */}
          <polygon points="91,40 94,40 90,41.5" fill="#0D0904" />
        </g>

        {/* ==================================================
            3. THORAX (Dense Velvet Fur with Scutum Anatomy)
            ================================================== */}
        <g>
          <ellipse cx="45" cy="39" rx="13" ry="11.5" fill={`url(#thoraxFur_${uid})`} />

          {/* Velvety fur micro-texture */}
          <ellipse cx="43" cy="38" rx="10.5" ry="9" fill="#B37822" opacity="0.35" />
          <path
            d="M 36 32 Q 45 27 54 32 Q 45 47 36 32"
            fill="none"
            stroke="#F0B238"
            strokeWidth="0.7"
            opacity="0.55"
            strokeDasharray="1,1.5"
          />
          <circle cx="44" cy="35" r="7.5" fill="#FFAE26" opacity="0.22" />
        </g>

        {/* ==================================================
            4. HEAD, COMPOUND EYE & SENSORY ANTENNAE
            ================================================== */}
        <g>
          {/* Head base */}
          <ellipse cx="29" cy="38" rx="8.5" ry="8" fill="#1C160F" />

          {/* Large Compound Eye with Glossy Specular Arch */}
          <ellipse
            cx="26"
            cy="35"
            rx="4"
            ry="6"
            fill={`url(#eyeGloss_${uid})`}
            transform="rotate(-15 26 35)"
          />
          {/* Curved eye glint reflection */}
          <ellipse
            cx="25"
            cy="33"
            rx="1.4"
            ry="2.6"
            fill="#FFFFFF"
            opacity="0.7"
            transform="rotate(-20 25 33)"
          />

          {/* Forward Antennae reaching into 3D space */}
          <path
            d="M 23 33 Q 16 26 11 25 Q 8 25 7 27"
            stroke="#17120C"
            strokeWidth="1.2"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 25 32 Q 20 23 15 20 Q 12 19 10 21"
            stroke="#17120C"
            strokeWidth="1.2"
            strokeLinecap="round"
            fill="none"
          />
          {/* Sensory tip receptors */}
          <circle cx="7" cy="27" r="0.9" fill="#E6A020" />
          <circle cx="10" cy="21" r="0.9" fill="#E6A020" />
        </g>

        {/* ==================================================
            5. DOUBLE TRANSLUCENT WINGS (3D Flutter Animation)
            ================================================== */}
        <g
          className={flapping ? "realistic-wing-upper" : ""}
          style={{ transformOrigin: "42px 33px" }}
        >
          {/* Hindwing (smaller back wing with cellular veins) */}
          <path
            d="M 44 34 Q 37 17 48 9 Q 59 5 63 15 Q 65 24 48 35 Z"
            fill={`url(#wingGlass_${uid})`}
            stroke={`url(#veinStroke_${uid})`}
            strokeWidth="0.6"
            opacity="0.8"
          />
          {/* Forewing (large primary aerodynamic wing) */}
          <path
            d="M 41 33 Q 31 11 46 2 Q 63 -3 74 10 Q 80 22 52 35 Z"
            fill={`url(#wingGlass_${uid})`}
            stroke={`url(#veinStroke_${uid})`}
            strokeWidth="0.8"
          />
          {/* Costa & Subcosta leading-edge structural veins */}
          <path
            d="M 41 33 Q 35 13 47 3 Q 61 0 72 11"
            fill="none"
            stroke="#875E1E"
            strokeWidth="1.2"
            opacity="0.9"
          />
          {/* Radial & Medial venation cells */}
          <path
            d="M 47 12 Q 57 10 65 17 M 53 18 Q 62 20 70 19 M 49 6 Q 57 15 53 26"
            fill="none"
            stroke="#B58638"
            strokeWidth="0.55"
            opacity="0.75"
          />
          {/* Cross-veinlets */}
          <path
            d="M 59 10 L 63 15 M 65 13 L 68 18 M 55 22 L 59 27"
            stroke="#CCA04E"
            strokeWidth="0.45"
            opacity="0.65"
          />
          {/* Sun flare gleam on leading edge of wing */}
          <path
            d="M 43 13 Q 50 4 63 2"
            stroke="#FFFFFF"
            strokeWidth="0.9"
            strokeLinecap="round"
            opacity="0.75"
          />
        </g>
        </g>
      </svg>
    </div>
  );
}
