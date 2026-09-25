import { useEffect, useState } from "react";
import RealisticBee from "./RealisticBee";

/**
 * Global Bee Flight System
 * Controls realistic 3D bees flying naturally across the website.
 * Features staggered trajectories, depth-of-field variations,
 * and device-optimized performance.
 */
export default function BeeFlightSystem() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <div
      className="pointer-events-none fixed inset-0 overflow-hidden z-30 select-none"
      aria-hidden="true"
    >
      {/* Bee #1: Mid-depth Explorer (Desktop & Mobile) */}
      <div className="absolute top-0 left-0 bee-traj-1">
        <div className="bee-organic-hover">
          <RealisticBee size={isMobile ? 38 : 46} depth="mid" />
        </div>
      </div>

      {/* Desktop Only: Additional Bees with staggered timing & depths */}
      {!isMobile && (
        <>
          {/* Bee #2: Foreground Worker (Right -> Left, Head Points Forward Left) */}
          <div
            className="absolute top-0 left-0 bee-traj-2"
            style={{ animationDelay: "-9s" }}
          >
            <div className="bee-organic-hover" style={{ animationDelay: "-1.5s" }}>
              <RealisticBee size={54} depth="near" facing="left" />
            </div>
          </div>

          {/* Bee #3: Deep Background Scout (Small, soft depth-of-field blur) */}
          <div
            className="absolute top-0 left-0 bee-traj-3"
            style={{ animationDelay: "-17s" }}
          >
            <div className="bee-organic-hover" style={{ animationDelay: "-3s" }}>
              <RealisticBee size={32} depth="far" />
            </div>
          </div>

          {/* Subtle golden pollen particles floating in atmospheric light */}
          <div
            className="pollen-particle absolute top-[25%] left-[20%] w-1.5 h-1.5 rounded-full bg-accent/70 shadow-[0_0_8px_#F4B928]"
            style={{ animationDelay: "0s" }}
          />
          <div
            className="pollen-particle absolute top-[55%] left-[65%] w-2 h-2 rounded-full bg-honey/80 shadow-[0_0_10px_#D99A19]"
            style={{ animationDelay: "-2.8s" }}
          />
          <div
            className="pollen-particle absolute top-[40%] left-[80%] w-1.5 h-1.5 rounded-full bg-amber-300/70"
            style={{ animationDelay: "-5.2s" }}
          />
        </>
      )}
    </div>
  );
}
