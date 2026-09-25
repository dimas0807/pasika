import { useId } from "react";
import RealisticBee from "./RealisticBee";

/**
 * Realistic Wax Honeycomb Component
 * Renders authentic wax cell structures with honey fill,
 * warm light refraction, honey droplets, and optional resting bee.
 */
export default function WaxHoneycomb({
  position = "left", // 'left' | 'right' | 'corner'
  withBee = true,
  className = "",
  style = {},
}) {
  const uid = useId().replace(/:/g, "_");

  return (
    <div
      className={`pointer-events-none select-none absolute z-10 ${
        position === "left"
          ? "-left-12 sm:-left-6 top-1/2 -translate-y-1/2"
          : position === "right"
          ? "-right-12 sm:-right-6 top-1/2 -translate-y-1/2"
          : "top-0 right-0"
      } ${className}`}
      style={style}
      aria-hidden="true"
    >
      <div className="relative">
        <svg
          width="220"
          height="320"
          viewBox="0 0 220 320"
          className="opacity-75 md:opacity-85 filter drop-shadow-md"
        >
          <defs>
            {/* Wax Wall Bevel */}
            <linearGradient id={`waxWall_${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFF4D0" />
              <stop offset="40%" stopColor="#E2A52A" />
              <stop offset="80%" stopColor="#B37512" />
              <stop offset="100%" stopColor="#6E4405" />
            </linearGradient>

            {/* Honey Cell Fill (Glistening amber) */}
            <radialGradient id={`honeyFill_${uid}`} cx="45%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#FFE082" />
              <stop offset="50%" stopColor="#FFA000" />
              <stop offset="85%" stopColor="#E65100" />
              <stop offset="100%" stopColor="#8A2E00" />
            </radialGradient>

            {/* Empty Cell Depth */}
            <radialGradient id={`emptyCell_${uid}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#5A390B" />
              <stop offset="70%" stopColor="#3B2304" />
              <stop offset="100%" stopColor="#1F1101" />
            </radialGradient>

            {/* Liquid Honey Drop */}
            <radialGradient id={`dropGrad_${uid}`} cx="35%" cy="30%" r="65%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="30%" stopColor="#FFD54F" />
              <stop offset="75%" stopColor="#FF8F00" />
              <stop offset="100%" stopColor="#C43E00" />
            </radialGradient>
          </defs>

          {/* Hexagonal Wax Cells Matrix */}
          <g stroke={`url(#waxWall_${uid})`} strokeWidth="3" strokeLinejoin="round">
            {/* Row 1 */}
            <polygon points="50,20 80,5 110,20 110,50 80,65 50,50" fill={`url(#honeyFill_${uid})`} />
            <polygon points="110,20 140,5 170,20 170,50 140,65 110,50" fill={`url(#emptyCell_${uid})`} />
            <polygon points="170,20 200,5 230,20 230,50 200,65 170,50" fill={`url(#honeyFill_${uid})`} />

            {/* Row 2 */}
            <polygon points="20,70 50,55 80,70 80,100 50,115 20,100" fill={`url(#honeyFill_${uid})`} />
            <polygon points="80,70 110,55 140,70 140,100 110,115 80,100" fill={`url(#honeyFill_${uid})`} />
            <polygon points="140,70 170,55 200,70 200,100 170,115 140,100" fill={`url(#emptyCell_${uid})`} />

            {/* Row 3 */}
            <polygon points="50,120 80,105 110,120 110,150 80,165 50,150" fill={`url(#honeyFill_${uid})`} />
            <polygon points="110,120 140,105 170,120 170,150 140,165 110,150" fill={`url(#honeyFill_${uid})`} />
            <polygon points="170,120 200,105 230,120 230,150 200,165 170,150" fill={`url(#honeyFill_${uid})`} />

            {/* Row 4 */}
            <polygon points="20,170 50,155 80,170 80,200 50,215 20,200" fill={`url(#emptyCell_${uid})`} />
            <polygon points="80,170 110,155 140,170 140,200 110,215 80,200" fill={`url(#honeyFill_${uid})`} />
            <polygon points="140,170 170,155 200,170 200,200 170,215 140,200" fill={`url(#honeyFill_${uid})`} />

            {/* Row 5 */}
            <polygon points="50,220 80,205 110,220 110,250 80,265 50,250" fill={`url(#honeyFill_${uid})`} />
            <polygon points="110,220 140,205 170,220 170,250 140,265 110,250" fill={`url(#emptyCell_${uid})`} />
            <polygon points="170,220 200,205 230,220 230,250 200,265 170,250" fill={`url(#honeyFill_${uid})`} />
          </g>

          {/* Liquid Honey Specular Gleams */}
          <ellipse cx="80" cy="85" rx="14" ry="7" fill="#FFFFFF" opacity="0.35" transform="rotate(-15 80 85)" />
          <ellipse cx="140" cy="185" rx="15" ry="8" fill="#FFFFFF" opacity="0.38" transform="rotate(-15 140 185)" />
          <ellipse cx="80" cy="135" rx="12" ry="6" fill="#FFFFFF" opacity="0.3" transform="rotate(-15 80 135)" />

          {/* Dripping Amber Honey Drops */}
          <path
            d="M 50 200 Q 50 220 44 228 A 6 6 0 1 0 56 228 Q 50 220 50 200 Z"
            fill={`url(#dropGrad_${uid})`}
            opacity="0.92"
          />
          <path
            d="M 110 250 Q 110 275 103 285 A 7 7 0 1 0 117 285 Q 110 275 110 250 Z"
            fill={`url(#dropGrad_${uid})`}
            opacity="0.95"
          />
        </svg>

        {/* Optional realistic working honeybee on the comb */}
        {withBee && (
          <div className="absolute top-[38%] left-[32%] transform -rotate-12 hover:scale-105 transition-transform duration-300">
            <RealisticBee size={38} depth="near" pollen={true} angle={15} />
          </div>
        )}
      </div>
    </div>
  );
}
