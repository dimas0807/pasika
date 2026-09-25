import { useEffect, useRef, useState } from "react";
import RealisticBee from "./RealisticBee";

/**
 * Living Apiary Composition & Visual Journey:
 * Left: Wild Carpathian meadow flora (linden, phacelia, clover).
 * Right: Authentic wooden beehives on green hillside.
 * Bee: Swoops to flower -> gathers pollen -> golden baskets appear on hind legs ->
 *      swoops toward camera in 3D perspective zoom -> banks smoothly ->
 *      flies into depth to the wooden hive -> enters hive -> loops.
 *
 * CRITICAL: The bee's head ALWAYS strictly leads the velocity tangent vector!
 */

const STORY_STAGES = [
  { id: "flower", icon: "🌸", label: "Квітучі луки", desc: "Липа, різнотрав'я та дикі карпатські медоноси" },
  { id: "bee", icon: "🐝", label: "Праця бджоли", desc: "Невтомний політ і збір нектару за ясної погоди" },
  { id: "pollen", icon: "✨", label: "Золотистий пилок", desc: "Наповнення пилкових кошиків на задніх лапках" },
  { id: "hive", icon: "🏡", label: "Родинний вулик", desc: "Повернення до пасіки в с. Новоселиця" },
  { id: "honeycomb", icon: "🟨", label: "Воскові соти", desc: "Природне дозрівання меду без цукру та домішок" },
  { id: "honey", icon: "🍯", label: "Свіжий мед", desc: "Чистий золотий нектар, створений самою природою" },
  { id: "product", icon: "📦", label: "До вашого столу", desc: "Дбайливе фасування у скло та доставка по Україні" },
];

export default function FlowerToHiveScene() {
  const [beeState, setBeeState] = useState({
    x: 18,        // percent of container width
    y: 25,        // percent of container height
    scale: 0.7,   // Z-depth scale (0.4 = far, 1.45 = near foreground)
    angle: 18,    // tangent rotation (head points in travel direction)
    banking: 0,   // banking tilt
    pollen: 0,    // 0 = clean legs, 1 = full golden pollen
    blur: 1.5,    // depth-of-field blur in px
    opacity: 0.9,
    currentPhase: 0, // 0..6 mapped to STORY_STAGES
  });

  const [pollenBurst, setPollenBurst] = useState(false);
  const animFrameRef = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => {
    // 15-second rich continuous cinematic loop
    const LOOP_DURATION = 15000;

    const animate = (timestamp) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = (timestamp - startTimeRef.current) % LOOP_DURATION;
      const progress = elapsed / LOOP_DURATION; // 0.0 to 1.0

      let x, y, scale, angle, banking, pollen, blur, opacity, currentPhase;

      // Phase 1 (0.00 - 0.22): Elegant descent toward Carpathian wild flora
      if (progress < 0.22) {
        const p = progress / 0.22; // 0 to 1
        currentPhase = 0; // Flower
        // Approaches from upper left (10%, 20%) to the blossom nectar cup at (24%, 62%)
        x = 10 + p * 14;
        y = 18 + Math.sin(p * Math.PI * 0.5) * 44;
        scale = 0.65 + p * 0.4; // 0.65 -> 1.05
        angle = 24 - p * 18; // Pitching smoothly down-right toward the flower
        banking = Math.sin(p * Math.PI) * 12;
        pollen = 0;
        blur = (1 - p) * 1.5;
        opacity = Math.min(1, 0.4 + p * 0.6);
      }
      // Phase 2 (0.22 - 0.40): Intimate Blossom Contact & Golden Pollen Gathering
      else if (progress < 0.40) {
        const p = (progress - 0.22) / 0.18;
        currentPhase = p < 0.5 ? 1 : 2; // Bee -> Pollen
        // Gentle organic hovering and sipping nectar
        const hoverX = Math.sin(p * Math.PI * 4) * 1.4;
        const hoverY = Math.cos(p * Math.PI * 4) * 1.6;
        x = 24 + hoverX;
        y = 62 + hoverY;
        scale = 1.05 + Math.sin(p * Math.PI) * 0.08;
        angle = 4 + Math.sin(p * Math.PI * 2) * 6;
        banking = Math.sin(p * Math.PI * 3) * 8;
        pollen = Math.min(1, p * 1.4); // Golden pollen visibly accumulates on hind legs!
        blur = 0;
        opacity = 1;
      }
      // Phase 3 (0.40 - 0.64): Takeoff & Breathtaking 3D Foreground Zoom
      else if (progress < 0.64) {
        const p = (progress - 0.40) / 0.24;
        currentPhase = 2; // Pollen trail
        // Swoops forward towards the camera! x goes 24 -> 54, y swoops up
        x = 24 + p * 30;
        y = 62 - Math.sin(p * Math.PI * 0.85) * 26;
        // Z-Depth Scale: massive 3D zoom up to 1.45 (crisp foreground near camera)
        scale = 1.05 + Math.sin(p * Math.PI) * 0.42;
        // Tangent heading: climbs steeply (-16deg) then levels out (+4deg)
        angle = -16 + p * 24;
        banking = -Math.sin(p * Math.PI) * 18;
        pollen = 1; // Loaded with bright golden pollen baskets
        blur = 0;
        opacity = 1;
      }
      // Phase 4 (0.64 - 0.86): Banking into Depth toward Wooden Hives
      else if (progress < 0.86) {
        const p = (progress - 0.64) / 0.22;
        currentPhase = 3; // Hive
        // Curves away into depth toward the hive entrance board at (82%, 58%)
        x = 54 + p * 28;
        y = 36 + Math.sin(p * Math.PI * 0.65) * 22;
        // Z-Depth Scale: recedes into distance (1.45 -> 0.50)
        scale = 1.45 - p * 0.95;
        // Heading tangent: smoothly points towards the flight entrance
        angle = 8 + p * 6;
        banking = Math.sin(p * Math.PI) * 14;
        pollen = 1;
        blur = p * 1.6; // Atmospheric distance blur
        opacity = 1 - p * 0.12;
      }
      // Phase 5 (0.86 - 1.00): Touchdown on Flight Board & Enters Hive Entrance
      else {
        const p = (progress - 0.86) / 0.14;
        currentPhase = p < 0.5 ? 4 : 5; // Honeycomb / Honey
        x = 82 + p * 2.5;
        y = 58 + p * 1.5;
        scale = 0.50 - p * 0.18;
        angle = 14 - p * 10;
        banking = (1 - p) * 6;
        pollen = 1 - p * 0.6; // Discharging pollen into the comb
        blur = 1.6 + p * 0.8;
        opacity = Math.max(0, 1 - p * 1.9); // Vanishes inside hive
      }

      setBeeState({
        x,
        y,
        scale,
        angle,
        banking,
        pollen,
        blur,
        opacity,
        currentPhase,
      });

      // Pollen burst active during flower contact
      setPollenBurst(progress >= 0.24 && progress <= 0.38);

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#18120B] via-[#261A10] to-[#18120B] text-white py-16 md:py-24 border-y border-amber-900/30">
      {/* 1. PHOTOGRAPHIC PANORAMIC APIARY BACKDROP */}
      <div className="absolute inset-0 z-0">
        <img
          src="/images/about-apiary.jpg"
          alt="Карпатська пасіка серед квітучих луків"
          className="w-full h-full object-cover object-center opacity-30 mix-blend-luminosity scale-102"
        />
        {/* Atmospheric Warm Golden Sunlight & Vignette Overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#140E08]/95 via-[#1B130B]/80 to-[#140E08]/95" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/25 via-transparent to-black/70" />
      </div>

      <div className="container-p relative z-20">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-xs font-bold uppercase tracking-widest text-accent mb-3 shadow-xs backdrop-blur-md">
            <RealisticBee size={18} depth="near" facing="right" />
            <span>Жива родинна пасіка • Прикарпаття</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight drop-shadow-md">
            Шлях бджоли: від квітки до вулика 🌸 → 🍯
          </h2>
          <p className="mt-3 text-white/80 text-sm sm:text-base leading-relaxed">
            Погляньте на священний природний процес: бджола збирає нектар та пилок на карпатському різнотрав'ї, несе його до дерев'яного вулика, де народжується чистий мед.
          </p>
        </div>

        {/* ==================================================
            2. THE LIVING LANDSCAPE CANVAS (FLOWER -> BEE -> HIVE)
            ================================================== */}
        <div className="relative rounded-3xl overflow-hidden border border-amber-500/30 bg-gradient-to-b from-[#24170E]/95 via-[#2E1E12]/90 to-[#170F08]/95 shadow-2xl p-6 sm:p-10 min-h-[420px] sm:min-h-[500px] flex flex-col justify-between select-none">
          {/* Ambient Sunlight & Sunbeam Rays */}
          <div className="absolute -top-24 left-1/4 w-96 h-96 rounded-full bg-amber-400/15 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 right-1/4 w-96 h-96 rounded-full bg-honey/15 blur-3xl pointer-events-none" />

          {/* Golden Sunbeams streaming from top center */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-25">
            <div className="w-[180%] h-full -top-1/2 left-[-40%] absolute bg-[radial-gradient(ellipse_at_50%_0%,_rgba(245,180,40,0.35)_0%,_transparent_70%)]" />
          </div>

          {/* Landscape Composition: Left Flora & Right Hive */}
          <div className="grid grid-cols-12 h-full absolute inset-0 pointer-events-none z-10">
            {/* ----------------------------------------------------
                LEFT SIDE: Wild Carpathian Meadow, Linden & Phacelia
                ---------------------------------------------------- */}
            <div className="col-span-6 sm:col-span-5 relative flex items-end p-5 sm:p-8">
              {/* Linden Leaves & Blossom Branch from Upper Left */}
              <div className="absolute top-2 left-2 flex items-center gap-1.5 opacity-85 select-none filter drop-shadow">
                <svg width="120" height="70" viewBox="0 0 120 70" fill="none" className="transform -rotate-6">
                  {/* Branch Stem */}
                  <path d="M 0 10 Q 40 25 100 20" stroke="#4A3418" strokeWidth="2.5" strokeLinecap="round" />
                  {/* Linden Heart Leaves */}
                  <path d="M 30 20 C 20 5 10 20 25 35 C 35 45 45 35 30 20 Z" fill="#4E7029" stroke="#3D5A1E" strokeWidth="1" />
                  <path d="M 65 22 C 55 8 45 22 60 38 C 70 48 80 38 65 22 Z" fill="#5F8832" stroke="#4A6E24" strokeWidth="1" />
                  {/* Linden Blossom Cluster */}
                  <circle cx="85" cy="32" r="3.5" fill="#FFF4B8" />
                  <circle cx="92" cy="36" r="3" fill="#FFE57F" />
                  <circle cx="88" cy="42" r="3" fill="#FFF4B8" />
                  <circle cx="98" cy="30" r="3" fill="#FFE57F" />
                </svg>
                <span className="text-[11px] font-bold text-amber-200/80 hidden md:inline font-serif">Липовий цвіт</span>
              </div>

              {/* Foreground Botanical Flowers (Clover, Phacelia, Meadow Nectar Flora) */}
              <div className="relative z-10 space-y-2">
                <svg width="220" height="160" viewBox="0 0 220 160" fill="none" className="filter drop-shadow-xl">
                  {/* Grass & Stems */}
                  <path d="M 20 160 Q 40 100 45 60" stroke="#43662B" strokeWidth="3" strokeLinecap="round" />
                  <path d="M 70 160 Q 75 110 82 75" stroke="#3D5D25" strokeWidth="3" strokeLinecap="round" />
                  <path d="M 120 160 Q 115 105 108 55" stroke="#4B7230" strokeWidth="3.5" strokeLinecap="round" />
                  <path d="M 160 160 Q 150 115 140 80" stroke="#3E5F26" strokeWidth="2.5" strokeLinecap="round" />

                  {/* Wild Purple Phacelia (Фацелія) */}
                  <g transform="translate(30, 40)">
                    <path d="M 15 25 Q 25 10 35 15 Q 45 20 40 35" fill="none" stroke="#7E57C2" strokeWidth="3" />
                    <circle cx="20" cy="18" r="4" fill="#9575CD" />
                    <circle cx="28" cy="13" r="4.5" fill="#7E57C2" />
                    <circle cx="36" cy="18" r="4" fill="#B39DDB" />
                    <circle cx="38" cy="28" r="3.5" fill="#7E57C2" />
                  </g>

                  {/* Red/Pink Meadow Clover (Конюшина) */}
                  <g transform="translate(130, 65)">
                    <ellipse cx="15" cy="15" rx="14" ry="17" fill="#E91E63" opacity="0.85" />
                    <circle cx="10" cy="8" r="4" fill="#F06292" />
                    <circle cx="20" cy="8" r="4" fill="#F48FB1" />
                    <circle cx="15" cy="18" r="5" fill="#D81B60" />
                  </g>

                  {/* MAIN NECTAR FLOWER (Golden Core Meadow Daisy/Wildflower) — landing target for the bee! */}
                  <g transform="translate(85, 30)">
                    {/* Glowing Petals */}
                    <ellipse cx="25" cy="5" rx="7" ry="15" fill="#FFFFFF" opacity="0.95" />
                    <ellipse cx="45" cy="25" rx="15" ry="7" fill="#FFFFFF" opacity="0.95" />
                    <ellipse cx="25" cy="45" rx="7" ry="15" fill="#FFFFFF" opacity="0.95" />
                    <ellipse cx="5" cy="25" rx="15" ry="7" fill="#FFFFFF" opacity="0.95" />
                    <ellipse cx="11" cy="11" rx="8" ry="14" transform="rotate(-45 11 11)" fill="#FFF9C4" opacity="0.9" />
                    <ellipse cx="39" cy="11" rx="8" ry="14" transform="rotate(45 39 11)" fill="#FFF9C4" opacity="0.9" />
                    <ellipse cx="39" cy="39" rx="8" ry="14" transform="rotate(-45 39 39)" fill="#FFF9C4" opacity="0.9" />
                    <ellipse cx="11" cy="39" rx="8" ry="14" transform="rotate(45 11 39)" fill="#FFF9C4" opacity="0.9" />

                    {/* Rich Golden Nectar Disc (Центр квітки) */}
                    <circle cx="25" cy="25" r="11" fill="url(#nectarGlow)" />
                    <circle cx="25" cy="25" r="8" fill="#F59E0B" />
                    <circle cx="25" cy="25" r="5" fill="#D97706" />

                    {/* Pollen grains shimmer */}
                    <circle cx="22" cy="22" r="1.5" fill="#FEF08A" />
                    <circle cx="27" cy="24" r="1.2" fill="#FEF08A" />
                    <circle cx="24" cy="28" r="1.2" fill="#FFFBEB" />
                  </g>

                  <defs>
                    <radialGradient id="nectarGlow" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#FEF08A" />
                      <stop offset="60%" stopColor="#F59E0B" />
                      <stop offset="100%" stopColor="#B45309" />
                    </radialGradient>
                  </defs>
                </svg>

                <div className="inline-block px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-amber-400/40 text-[11px] font-bold text-accent shadow-xs">
                  🌸 Дикі медоноси Карпат (липа, конюшина, фацелія)
                </div>
              </div>

              {/* Golden Pollen Dust Burst Particles */}
              {pollenBurst && (
                <div className="absolute bottom-24 left-28 pointer-events-none">
                  <div className="w-3 h-3 rounded-full bg-accent shadow-[0_0_15px_#F4B928] animate-ping absolute" />
                  <div className="w-2 h-2 rounded-full bg-amber-300 shadow-[0_0_10px_#FCD34D] absolute -top-5 left-8 animate-bounce" />
                  <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_#FFF] absolute top-6 -left-6" />
                </div>
              )}
            </div>

            {/* ----------------------------------------------------
                CENTER: Visual Path Divider
                ---------------------------------------------------- */}
            <div className="col-span-0 sm:col-span-2 relative flex items-center justify-center">
              <div className="text-center opacity-40 hidden sm:block">
                <div className="text-xs font-mono tracking-widest text-amber-300/80 uppercase">
                  ← Політ бджоли →
                </div>
                <div className="w-24 h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent mx-auto mt-1" />
              </div>
            </div>

            {/* ----------------------------------------------------
                RIGHT SIDE: Authentic Wooden Beehives & Apiary Entrance
                ---------------------------------------------------- */}
            <div className="col-span-6 sm:col-span-5 relative flex items-end justify-end p-5 sm:p-8 text-right">
              <div className="relative z-10 flex flex-col items-end space-y-2">
                {/* Handcrafted Wooden Beehive SVG (Вулик Дадана з прилітною дошкою) */}
                <svg width="220" height="180" viewBox="0 0 220 180" fill="none" className="filter drop-shadow-2xl">
                  {/* Hive Stand (Ніжки вулика) */}
                  <rect x="75" y="155" width="12" height="22" rx="2" fill="#3E2714" />
                  <rect x="165" y="155" width="12" height="22" rx="2" fill="#3E2714" />

                  {/* Bottom Board (Дно вулика) */}
                  <rect x="60" y="145" width="132" height="12" rx="2" fill="#5D3A1A" stroke="#3E2714" strokeWidth="1" />

                  {/* Flight Board Extends Forward (Прилітна дошка для бджіл) */}
                  <polygon points="50,152 70,147 70,154 50,157" fill="#8D5B28" stroke="#5D3A1A" strokeWidth="1" />
                  <path d="M 50 152 L 110 152" stroke="#B47B3E" strokeWidth="2" strokeLinecap="round" />

                  {/* Lower Brood Box (Гніздовий корпус — кедрові дошки) */}
                  <rect x="68" y="95" width="116" height="50" rx="3" fill="#8B5A2B" stroke="#4A2E12" strokeWidth="1.5" />
                  {/* Wood Planks Lines */}
                  <line x1="68" y1="112" x2="184" y2="112" stroke="#5E3A18" strokeWidth="1.5" />
                  <line x1="68" y1="129" x2="184" y2="129" stroke="#5E3A18" strokeWidth="1.5" />

                  {/* Upper Honey Super Box (Медовий магазинний корпус) */}
                  <rect x="68" y="52" width="116" height="42" rx="3" fill="#9C6631" stroke="#4A2E12" strokeWidth="1.5" />
                  {/* Wood Planks Lines */}
                  <line x1="68" y1="66" x2="184" y2="66" stroke="#684119" strokeWidth="1.5" />
                  <line x1="68" y1="80" x2="184" y2="80" stroke="#684119" strokeWidth="1.5" />

                  {/* Wooden Hive Roof (Дашок вулика) */}
                  <polygon points="60,52 126,30 192,52" fill="#5D3A1A" stroke="#3E2714" strokeWidth="2" />
                  <polygon points="58,54 126,32 194,54" fill="none" stroke="#A6733D" strokeWidth="1" />
                  <rect x="62" y="50" width="128" height="4" rx="1" fill="#3E2714" />

                  {/* Hive Entrance Slot (Льотковий отвір — вхід для бджіл) */}
                  <rect x="80" y="140" width="46" height="6" rx="2" fill="#150E06" stroke="#5D3A1A" strokeWidth="1" />

                  {/* Golden Honeycomb Glow radiating from inside the hive entrance */}
                  <ellipse cx="103" cy="143" rx="16" ry="3.5" fill="#F59E0B" opacity="0.85" filter="drop-shadow(0 0 6px #F59E0B)" />

                  {/* Hive Number Tag */}
                  <circle cx="126" cy="112" r="6" fill="#FAF6EE" stroke="#3E2714" strokeWidth="1" />
                  <text x="126" y="115" fontSize="8" fontWeight="bold" fill="#3E2714" textAnchor="middle">12</text>

                  {/* Background secondary hives in distance */}
                  <g opacity="0.45" transform="translate(145, 70) scale(0.55)">
                    <rect x="68" y="52" width="116" height="85" fill="#75471D" />
                    <polygon points="60,52 126,30 192,52" fill="#4A2E12" />
                  </g>
                </svg>

                <div className="inline-block px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-amber-400/40 text-[11px] font-bold text-amber-200 shadow-xs">
                  🏡 Дерев'яний вулик Дадана (родинна пасіка)
                </div>
              </div>
            </div>
          </div>

          {/* ==================================================
              3. THE REAL-TIME 3D PERSPECTIVE FLIGHT BEE
              ================================================== */}
          <div
            className="absolute z-20 pointer-events-none transition-transform will-change-transform"
            style={{
              left: `${beeState.x}%`,
              top: `${beeState.y}%`,
              transform: `translate(-50%, -50%) scale(${beeState.scale}) rotate(${beeState.angle}deg) rotateX(${beeState.banking}deg)`,
              filter: `blur(${beeState.blur}px)`,
              opacity: beeState.opacity,
            }}
          >
            {/* The Anatomically Realistic Bee with Dynamic Pollen Pellets */}
            <div className="relative">
              <RealisticBee
                size={58}
                depth={beeState.scale > 1.2 ? "near" : beeState.scale < 0.7 ? "far" : "mid"}
                pollen={beeState.pollen > 0.15 ? beeState.pollen : false}
                facing="right" // Head strictly points Forward/East!
              />

              {/* Shimmering Golden Pollen Trail in Flight */}
              {beeState.pollen > 0.5 && (
                <div className="absolute -left-3 top-8 pointer-events-none flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent/90 shadow-[0_0_8px_#F4B928] animate-pulse" />
                  <span className="w-1 h-1 rounded-full bg-honey/80" />
                </div>
              )}
            </div>
          </div>

          {/* Interactive Live Status Indicator */}
          <div className="relative z-30 self-start">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/15 text-xs text-white/90">
              <span className="w-2 h-2 rounded-full bg-leaf animate-ping" />
              <span className="font-semibold text-accent">
                {STORY_STAGES[beeState.currentPhase]?.label}
              </span>
              <span className="text-white/40 hidden sm:inline">•</span>
              <span className="text-white/70 text-[11px] hidden sm:inline">
                {STORY_STAGES[beeState.currentPhase]?.desc}
              </span>
            </div>
          </div>

          {/* Visual Legend Guide at the bottom */}
          <div className="relative z-30 flex items-center justify-between text-[11px] text-white/60 pt-4 border-t border-white/10 mt-auto">
            <span className="flex items-center gap-1.5">
              <span>🌸</span> Квітка (початок збору)
            </span>
            <span className="flex items-center gap-1 text-accent font-semibold">
              <span>🐝</span> Бджола завжди летить головою вперед
            </span>
            <span className="flex items-center gap-1.5">
              <span>🏡</span> Вулик (доставка пилку)
            </span>
          </div>
        </div>

        {/* ==================================================
            4. THE NATURAL FLOW: FLOWER -> BEE -> HIVE STORYLINE
            ================================================== */}
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {STORY_STAGES.map((s, idx) => {
            const isActive = idx === beeState.currentPhase;
            return (
              <div
                key={s.id}
                className={`p-3.5 rounded-2xl border transition-all duration-300 relative ${
                  isActive
                    ? "bg-amber-500/25 border-amber-400 text-white shadow-lg ring-1 ring-amber-400/50 scale-102"
                    : "bg-white/5 border-white/10 text-white/75 hover:bg-white/10"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{s.icon}</span>
                  <span className="text-[10px] font-mono text-white/40">0{idx + 1}</span>
                </div>
                <div className="font-bold text-xs sm:text-sm text-white mt-2 leading-snug">
                  {s.label}
                </div>
                <div className="text-[11px] text-white/65 mt-1 leading-tight line-clamp-2">
                  {s.desc}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
