import { useRef, useState } from "react";

export default function TikTokCard({ item }) {
  const videoRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);

  const handleMouseEnter = () => {
    // Only trigger hover video on devices with fine pointers and hover capability
    const canHover =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    if (!canHover) return;

    setIsHovered(true);

    if (videoRef.current && !videoFailed) {
      videoRef.current.currentTime = 0;
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Auto-play might be restricted or file not found
        });
      }
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);

    if (videoRef.current) {
      videoRef.current.pause();
      try {
        videoRef.current.currentTime = 0;
      } catch {}
    }
  };

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noreferrer"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="group relative rounded-2xl overflow-hidden aspect-[9/16] bg-[#FAF6EE] border border-ink/10 hover:border-honey shadow-sm hover:shadow-md transition-all duration-300 transform hover:scale-[1.02] flex flex-col justify-end p-3.5 select-none"
    >
      {/* Video Element (plays only on desktop hover, muted, loop) */}
      <video
        ref={videoRef}
        src={item.videoSrc}
        muted
        loop
        playsInline
        preload="none"
        onError={() => setVideoFailed(true)}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
          isHovered && !videoFailed ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Static Poster Image */}
      <img
        src={item.poster}
        alt={item.label}
        className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 ${
          isHovered && !videoFailed ? "opacity-0" : "opacity-100"
        }`}
        loading="lazy"
      />

      {/* Gradient Overlay for Legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none transition-opacity duration-300" />

      {/* Play Icon Badge (fades out when video is actively playing on hover) */}
      <div
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full backdrop-blur-md border border-white/60 flex items-center justify-center text-white transition-all duration-300 shadow-md pointer-events-none ${
          isHovered && !videoFailed
            ? "opacity-0 scale-90"
            : "bg-white/30 group-hover:scale-110 group-hover:bg-honey group-hover:text-ink opacity-100 scale-100"
        }`}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5">
          <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
      </div>

      {/* Card Information */}
      <div className="relative z-10 text-white pointer-events-none">
        <span className="text-[11px] font-semibold text-accent/90 tracking-wide">
          @honey.dsv
        </span>
        <div className="text-xs font-bold mt-0.5 line-clamp-1">{item.label}</div>
        <div className="text-[10px] text-white/75 mt-1 flex items-center gap-1 group-hover:text-accent transition-colors font-medium">
          <span>Дивитися в TikTok</span>
          <span>↗</span>
        </div>
      </div>
    </a>
  );
}
