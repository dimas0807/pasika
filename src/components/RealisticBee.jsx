import { useId } from "react";

/**
 * Realistic 3D Honeybee (Apis mellifera) Component
 * Features anatomically detailed body, segmented abdomen, velvet thorax,
 * compound eyes, antennae, jointed legs, translucent venated wings with 3D flutter,
 * and dynamic depth/shadow rendering.
 */
export default function RealisticBee({
  size = 48,
  depth = "mid", // 'near' | 'mid' | 'far'
  angle = 0,     // flight rotation angle in degrees
  className = "",
  style = {},
}) {
  const uid = useId().replace(/:/g, "_");

  // Depth styling
  const depthStyles = {
    near: {
      scale: 1.15,
      filter: "drop-shadow(0 18px 14px rgba(41,40,33,0.25))",
      opacity: 1,
    },
    mid: {
      scale: 1.0,
      filter: "drop-shadow(0 10px 9px rgba(41,40,33,0.18))",
      opacity: 0.98,
    },
    far: {
      scale: 0.72,
      filter: "blur(1.2px) drop-shadow(0 5px 4px rgba(41,40,33,0.12))",
      opacity: 0.85,
    },
  }[depth] || {};

  const width = size * (depthStyles.scale || 1);
  const height = (width * 80) / 100;

  return (
    <div
      className={`pointer-events-none select-none inline-block ${className}`}
      style={{
        transform: `rotate(${angle}deg)`,
        transition: "transform 0.4s ease-out",
        filter: depthStyles.filter,
        opacity: depthStyles.opacity,
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
          {/* Abdominal 3D Cylindrical Light */}
          <linearGradient id={`abdoGrad_${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#4A300A" />
            <stop offset="25%" stopColor="#E5991A" />
            <stop offset="45%" stopColor="#FFAE26" />
            <stop offset="60%" stopColor="#C97B08" />
            <stop offset="85%" stopColor="#2A1B07" />
            <stop offset="100%" stopColor="#140C03" />
          </linearGradient>

          {/* Abdominal Stripe Bands */}
          <linearGradient id={`stripeGrad_${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#120E08" />
            <stop offset="15%" stopColor="#D98A12" />
            <stop offset="35%" stopColor="#18130B" />
            <stop offset="50%" stopColor="#EAA322" />
            <stop offset="70%" stopColor="#1A150D" />
            <stop offset="85%" stopColor="#E09516" />
            <stop offset="100%" stopColor="#120E08" />
          </linearGradient>

          {/* Velvet Thorax Texture Gradient */}
          <radialGradient id={`thoraxGrad_${uid}`} cx="45%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#8C5819" />
            <stop offset="35%" stopColor="#633C0D" />
            <stop offset="75%" stopColor="#382106" />
            <stop offset="100%" stopColor="#1D1103" />
          </radialGradient>

          {/* Compound Eye Reflection */}
          <radialGradient id={`eyeGrad_${uid}`} cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#4A443B" />
            <stop offset="40%" stopColor="#1A1815" />
            <stop offset="100%" stopColor="#080706" />
          </radialGradient>

          {/* Translucent Wing Sheen with Delicate Iridescence */}
          <linearGradient id={`wingSheen_${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.82" />
            <stop offset="30%" stopColor="#FFF9E6" stopOpacity="0.65" />
            <stop offset="70%" stopColor="#E6F2FF" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.25" />
          </linearGradient>

          {/* Wing Vein Stroke */}
          <linearGradient id={`veinGrad_${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8C6527" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#C2964A" stopOpacity="0.35" />
          </linearGradient>

          {/* Warm Ambient Honey Glow */}
          <radialGradient id={`ambientGlow_${uid}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#F4B928" stopOpacity="0.32" />
            <stop offset="60%" stopColor="#D99A19" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#D99A19" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ambient atmospheric aura */}
        <ellipse cx="50" cy="40" rx="36" ry="24" fill={`url(#ambientGlow_${uid})`} />

        {/* 1. LEGS (underneath body) */}
        <g stroke="#241B10" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none">
          {/* Forelegs */}
          <path d="M42 42 Q36 49 32 54 T28 58" opacity="0.85" />
          <path d="M44 41 Q39 46 36 51" opacity="0.6" strokeWidth="0.9" />

          {/* Middle legs */}
          <path d="M52 44 Q48 54 44 60 T40 65" opacity="0.9" strokeWidth="1.3" />
          <path d="M54 43 Q51 51 48 58" opacity="0.65" strokeWidth="1" />

          {/* Hind legs with pollen basket widening */}
          <path d="M64 45 Q62 58 56 67 T50 72" opacity="0.95" strokeWidth="1.6" />
          {/* Pollen Basket (golden dust on hind leg) */}
          <ellipse cx="58" cy="62" rx="2.5" ry="4" fill="#F4B928" opacity="0.85" stroke="#9E6B0D" strokeWidth="0.5" />
        </g>

        {/* 2. ABDOMEN (Segmented body) */}
        <g>
          {/* Base shape */}
          <ellipse cx="68" cy="40" rx="22" ry="13.5" fill={`url(#abdoGrad_${uid})`} />

          {/* Abdominal stripe overlays with 3D curve */}
          <path
            d="M 52 32 Q 55 40 52 48 Q 57 40 52 32 Z"
            fill="#120D06"
            opacity="0.9"
          />
          <path
            d="M 59 28 Q 63 40 59 52 Q 65 40 59 28 Z"
            fill="#17120A"
            opacity="0.95"
          />
          <path
            d="M 68 27 Q 73 40 68 53 Q 75 40 68 27 Z"
            fill="#1A130A"
            opacity="0.95"
          />
          <path
            d="M 77 29 Q 82 40 77 51 Q 84 40 77 29 Z"
            fill="#140E06"
            opacity="0.95"
          />

          {/* Golden fuzzy hair rings between segments */}
          <path d="M 56 30 Q 60 40 56 50" stroke="#FFD778" strokeWidth="0.8" fill="none" opacity="0.75" />
          <path d="M 65 28 Q 70 40 65 52" stroke="#FFCE52" strokeWidth="0.9" fill="none" opacity="0.8" />
          <path d="M 74 28 Q 79 40 74 52" stroke="#FFC12B" strokeWidth="0.8" fill="none" opacity="0.75" />

          {/* Highlight ridge along dorsal curve */}
          <path d="M 52 30 Q 68 26 82 33" stroke="#FFF0A8" strokeWidth="0.8" fill="none" opacity="0.6" />

          {/* Stinger tip */}
          <polygon points="90,40 93,40 89,41" fill="#0D0904" />
        </g>

        {/* 3. THORAX (Velvety textured chest) */}
        <g>
          <ellipse cx="45" cy="39" rx="12.5" ry="11" fill={`url(#thoraxGrad_${uid})`} />

          {/* Velvety micro-texture hairs on thorax */}
          <ellipse cx="43" cy="38" rx="10" ry="8.5" fill="#B37822" opacity="0.3" />
          <path
            d="M 37 32 Q 45 28 53 32 Q 45 46 37 32"
            fill="none"
            stroke="#F0B238"
            strokeWidth="0.6"
            opacity="0.5"
            strokeDasharray="1,1.5"
          />
          <circle cx="44" cy="35" r="7" fill="#FFAE26" opacity="0.18" />
        </g>

        {/* 4. HEAD, EYES & ANTENNAE */}
        <g>
          {/* Head base */}
          <ellipse cx="30" cy="38" rx="8" ry="7.5" fill="#1C160F" />

          {/* Compound Eye (Glossy with reflection) */}
          <ellipse cx="27" cy="35" rx="3.5" ry="5.5" fill={`url(#eyeGrad_${uid})`} transform="rotate(-15 27 35)" />
          {/* Eye specular glint */}
          <ellipse cx="26" cy="33" rx="1.2" ry="2.2" fill="#FFFFFF" opacity="0.65" transform="rotate(-20 26 33)" />

          {/* Curved Antennae */}
          <path
            d="M 24 33 Q 18 27 13 26 Q 10 26 9 28"
            stroke="#17120C"
            strokeWidth="1.1"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 26 32 Q 22 24 18 21 Q 15 20 13 22"
            stroke="#17120C"
            strokeWidth="1.1"
            strokeLinecap="round"
            fill="none"
          />
          {/* Antenna tip receptors */}
          <circle cx="9" cy="28" r="0.8" fill="#D99A19" />
          <circle cx="13" cy="22" r="0.8" fill="#D99A19" />
        </g>

        {/* 5. TRANSLUCENT WINGS (3D Flutter Animation) */}
        {/* Left / Upper Wing Pair */}
        <g className="realistic-wing-upper" style={{ transformOrigin: "42px 33px" }}>
          {/* Hindwing (smaller back wing) */}
          <path
            d="M 44 34 Q 38 18 48 10 Q 58 6 62 16 Q 64 24 48 35 Z"
            fill={`url(#wingSheen_${uid})`}
            stroke={`url(#veinGrad_${uid})`}
            strokeWidth="0.6"
            opacity="0.75"
          />
          {/* Forewing (large primary wing with realistic venation) */}
          <path
            d="M 41 33 Q 32 12 46 3 Q 62 -2 72 11 Q 78 22 52 35 Z"
            fill={`url(#wingSheen_${uid})`}
            stroke={`url(#veinGrad_${uid})`}
            strokeWidth="0.8"
          />
          {/* Main marginal vein */}
          <path
            d="M 41 33 Q 36 14 47 4 Q 60 1 70 12"
            fill="none"
            stroke="#8C6527"
            strokeWidth="1.1"
            opacity="0.85"
          />
          {/* Radial & Submarginal vein cells */}
          <path
            d="M 47 13 Q 56 11 63 18 M 53 19 Q 61 21 68 20 M 49 7 Q 56 16 52 27"
            fill="none"
            stroke="#B3853B"
            strokeWidth="0.5"
            opacity="0.7"
          />
          {/* Delicate cross-veinlets */}
          <path
            d="M 58 11 L 62 16 M 64 14 L 67 19 M 54 23 L 58 28"
            stroke="#C99847"
            strokeWidth="0.4"
            opacity="0.6"
          />
          {/* Sun glint along wing leading edge */}
          <path
            d="M 43 14 Q 50 5 62 3"
            stroke="#FFFFFF"
            strokeWidth="0.8"
            strokeLinecap="round"
            opacity="0.7"
          />
        </g>
      </svg>
    </div>
  );
}
