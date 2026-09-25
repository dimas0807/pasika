// Lightweight decorative bee/pollen scene — pure CSS/SVG, no Three.js (fast, mobile-friendly).
function Bee({ className }) {
  return (
    <svg viewBox="0 0 40 30" className={className} width="34" height="26">
      <ellipse cx="20" cy="16" rx="10" ry="7" fill="#292821" />
      <rect x="12" y="11" width="16" height="2.2" fill="#F4B928" />
      <rect x="12" y="15" width="16" height="2.2" fill="#F4B928" />
      <rect x="12" y="19" width="16" height="2.2" fill="#F4B928" />
      <ellipse cx="8" cy="10" rx="7" ry="5" fill="#FFFDF8" opacity="0.6" transform="rotate(-20 8 10)" />
      <ellipse cx="14" cy="6" rx="6" ry="4" fill="#FFFDF8" opacity="0.6" transform="rotate(-10 14 6)" />
      <circle cx="30" cy="14" r="3" fill="#292821" />
    </svg>
  );
}

export default function BeeScene({ dense = false }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <Bee className="bee absolute top-[15%] left-[8%] opacity-80" />
      <Bee className="bee-2 absolute top-[55%] left-[85%] opacity-70" />
      {dense && <Bee className="bee-3 absolute top-[75%] left-[20%] opacity-60" />}
      <span className="pollen absolute top-[30%] left-[10%] w-1.5 h-1.5 rounded-full bg-accent/70" />
      <span className="pollen absolute top-[60%] left-[40%] w-1 h-1 rounded-full bg-honey/60" style={{ animationDelay: "-3s" }} />
      <span className="pollen absolute top-[20%] left-[60%] w-1.5 h-1.5 rounded-full bg-accent/50" style={{ animationDelay: "-6s" }} />
    </div>
  );
}
