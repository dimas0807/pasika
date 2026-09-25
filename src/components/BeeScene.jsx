// Realistic Living Bee & Pollen Scene
// Uses lightweight SVG with CSS hardware-accelerated animations (no heavy Three.js canvas overhead).
// Pure pointer-events-none to prevent interfering with interactive UI.

function RealisticBee({ size = 36, className = "" }) {
  return (
    <svg
      viewBox="0 0 50 40"
      width={size}
      height={(size * 40) / 50}
      className={className}
      style={{ overflow: "visible" }}
    >
      <defs>
        <radialGradient id="beeGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#F4B928" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#F4B928" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="bodyStripes" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#1E1D19" />
          <stop offset="20%" stopColor="#F4B928" />
          <stop offset="35%" stopColor="#1E1D19" />
          <stop offset="55%" stopColor="#F4B928" />
          <stop offset="70%" stopColor="#1E1D19" />
          <stop offset="85%" stopColor="#F4B928" />
          <stop offset="100%" stopColor="#1E1D19" />
        </linearGradient>
      </defs>

      {/* Subtle warm aura */}
      <circle cx="25" cy="20" r="18" fill="url(#beeGlow)" />

      {/* Gossamer wings with high-frequency flutter */}
      <g className="wing-animated">
        <ellipse
          cx="17"
          cy="11"
          rx="11"
          ry="5.5"
          fill="#FFFFFF"
          fillOpacity="0.75"
          stroke="#D99A19"
          strokeWidth="0.6"
          strokeOpacity="0.4"
          transform="rotate(-28 17 11)"
        />
        <line
          x1="10"
          y1="13"
          x2="24"
          y2="9"
          stroke="#B9A47A"
          strokeWidth="0.4"
          strokeOpacity="0.5"
          transform="rotate(-28 17 11)"
        />
      </g>
      <g className="wing-animated" style={{ animationDelay: "-0.04s" }}>
        <ellipse
          cx="22"
          cy="9"
          rx="10"
          ry="5"
          fill="#FFFFFF"
          fillOpacity="0.65"
          stroke="#D99A19"
          strokeWidth="0.6"
          strokeOpacity="0.4"
          transform="rotate(-15 22 9)"
        />
      </g>

      {/* Bee body: fuzzy striped abdomen and thorax */}
      <ellipse cx="25" cy="22" rx="13" ry="8.5" fill="url(#bodyStripes)" />

      {/* Fuzzy Thorax */}
      <ellipse cx="18" cy="21" rx="6" ry="6.5" fill="#3D3627" />

      {/* Head */}
      <circle cx="11" cy="21" r="4.5" fill="#1E1D19" />

      {/* Eye */}
      <ellipse cx="10" cy="20" rx="1.5" ry="2" fill="#0D0D0B" />

      {/* Antennae */}
      <path
        d="M9 18 Q6 14 5 13"
        fill="none"
        stroke="#1E1D19"
        strokeWidth="0.8"
        strokeLinecap="round"
      />
      <path
        d="M10 17 Q9 13 8 11"
        fill="none"
        stroke="#1E1D19"
        strokeWidth="0.8"
        strokeLinecap="round"
      />

      {/* Tiny legs */}
      <path
        d="M17 27 Q18 31 16 33 M22 28 Q24 32 23 34 M27 27 Q29 31 31 33"
        fill="none"
        stroke="#292821"
        strokeWidth="0.7"
        strokeLinecap="round"
        opacity="0.8"
      />
    </svg>
  );
}

export default function BeeScene({ dense = false }) {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* Primary bee floating near hero top-right */}
      <div className="bee-path-1 absolute top-[18%] right-[14%] z-10 hidden sm:block">
        <div className="bee-body-hover">
          <RealisticBee size={42} />
        </div>
      </div>

      {/* Secondary bee floating lower near product */}
      <div className="bee-path-2 absolute top-[52%] right-[42%] z-10 hidden md:block">
        <div className="bee-body-hover" style={{ animationDelay: "-1.8s" }}>
          <RealisticBee size={32} />
        </div>
      </div>

      {/* Mobile-friendly subtle single bee with reduced movement */}
      <div className="absolute top-[12%] right-[8%] z-10 sm:hidden opacity-90">
        <div className="bee-body-hover">
          <RealisticBee size={30} />
        </div>
      </div>

      {/* Optional third bee for dense scenes */}
      {dense && (
        <div className="bee-path-1 absolute top-[70%] left-[8%] z-10 hidden lg:block" style={{ animationDelay: "-4.5s" }}>
          <div className="bee-body-hover" style={{ animationDelay: "-2.2s" }}>
            <RealisticBee size={34} />
          </div>
        </div>
      )}

      {/* Golden pollen dust particles drifting gently */}
      <div
        className="pollen-particle absolute top-[35%] right-[25%] w-1.5 h-1.5 rounded-full bg-accent/70 shadow-[0_0_6px_#F4B928]"
        style={{ animationDelay: "0s" }}
      />
      <div
        className="pollen-particle absolute top-[60%] right-[32%] w-2 h-2 rounded-full bg-honey/80 shadow-[0_0_8px_#D99A19]"
        style={{ animationDelay: "-2.4s" }}
      />
      <div
        className="pollen-particle absolute top-[25%] right-[18%] w-1 h-1 rounded-full bg-accent/60"
        style={{ animationDelay: "-4.8s" }}
      />
      <div
        className="pollen-particle absolute top-[75%] right-[45%] w-1.5 h-1.5 rounded-full bg-amber-300/60"
        style={{ animationDelay: "-1.2s" }}
      />
    </div>
  );
}
