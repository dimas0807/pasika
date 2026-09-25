import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import RealisticBee from "./RealisticBee";
import { useCart } from "../context/CartContext";

const NAV = [
  { to: "/", label: "Головна" },
  { to: "/catalog", label: "Каталог" },
  { to: "/gift-boxes", label: "Подарункові бокси" },
  { to: "/about", label: "Про нас" },
  { to: "/delivery", label: "Доставка" },
  { to: "/contacts", label: "Контакти" },
];

export default function Header() {
  const { count } = useCart();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === "/";

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 ${
        scrolled || !isHome
          ? "bg-[#FFFDF8]/90 backdrop-blur-md border-b border-ink/5 shadow-2xs"
          : "bg-white/35 backdrop-blur-md border-b border-white/25 shadow-2xs"
      }`}
    >
      <div className="container-p flex items-center justify-between h-16 md:h-20">
        {/* Brand Logo with Realistic 3D Bee */}
        <Link
          to="/"
          className="flex items-center gap-2.5 font-serif text-2xl md:text-3xl font-extrabold text-ink tracking-tight hover:opacity-90 transition-opacity shrink-0"
        >
          <div className="w-8 h-8 flex items-center justify-center">
            <RealisticBee size={28} depth="near" />
          </div>
          <span className="bg-gradient-to-r from-ink via-ink to-[#4A4031] bg-clip-text">Honey</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-7 text-sm font-medium">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) =>
                `relative py-1 transition-colors hover:text-honey ${
                  isActive
                    ? "text-honey font-bold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-honey after:rounded-full"
                    : "text-ink/80"
                }`
              }
            >
              {n.label}
            </NavLink>
          ))}
        </nav>

        {/* Action Controls & Contact Info */}
        <div className="flex items-center gap-3 sm:gap-4 md:gap-5">
          {/* Direct Phone Call */}
          <a
            href="tel:+380678352311"
            className="hidden md:flex items-center gap-2 text-xs lg:text-sm font-semibold text-ink/85 hover:text-honey transition-colors py-1.5 px-3 rounded-full hover:bg-white/60"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-honey"
            >
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            <span>+380 67 835 23 11</span>
          </a>

          {/* Social Links (Desktop) */}
          <div className="hidden xl:flex items-center gap-3 border-l border-ink/10 pl-4 text-xs font-medium text-ink/65">
            <a
              href="https://www.tiktok.com/@honey.dsv"
              target="_blank"
              rel="noreferrer"
              className="hover:text-honey transition-colors"
            >
              TikTok
            </a>
            <span className="text-ink/20">•</span>
            <a
              href="https://t.me/honey_dsv"
              target="_blank"
              rel="noreferrer"
              className="hover:text-honey transition-colors"
            >
              Telegram
            </a>
          </div>

          {/* Cart Trigger */}
          <Link
            to="/cart"
            className="relative p-2.5 rounded-full hover:bg-white/60 text-ink hover:text-honey transition-all active:scale-95"
            aria-label="Кошик покупок"
          >
            <CartIcon />
            {count > 0 && (
              <span className="absolute top-0 right-0 bg-honey text-ink font-bold text-[11px] rounded-full min-w-5 h-5 px-1 flex items-center justify-center shadow-sm border border-clean">
                {count}
              </span>
            )}
          </Link>

          {/* Mobile Menu Hamburger */}
          <button
            className="lg:hidden p-2 rounded-xl text-ink hover:bg-white/60 transition-colors"
            onClick={() => setOpen((o) => !o)}
            aria-label="Меню навігації"
          >
            <MenuIcon open={open} />
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {open && (
        <div className="lg:hidden border-t border-ink/5 bg-[#FFFDF8]/95 backdrop-blur-md px-4 pt-2 pb-6 shadow-xl animate-fadeIn">
          <nav className="flex flex-col gap-1 py-2">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `py-3 px-3 rounded-xl text-base font-medium transition-colors ${
                    isActive
                      ? "bg-cream text-honey font-bold"
                      : "text-ink/80 hover:bg-cream/50"
                  }`
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>

          <div className="mt-4 pt-4 border-t border-ink/5 space-y-3">
            <a
              href="tel:+380678352311"
              className="flex items-center gap-2 text-sm font-semibold text-ink px-3 py-2 rounded-xl bg-cream/70"
            >
              <span className="text-honey">📞</span> +380 67 835 23 11
            </a>
            <div className="flex gap-4 px-3 text-sm text-ink/70">
              <a
                href="https://www.tiktok.com/@honey.dsv"
                target="_blank"
                rel="noreferrer"
                className="hover:text-honey font-medium"
              >
                TikTok ↗
              </a>
              <a
                href="https://t.me/honey_dsv"
                target="_blank"
                rel="noreferrer"
                className="hover:text-honey font-medium"
              >
                Telegram ↗
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function CartIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path
        d="M3 4h2l2.4 12.2a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.6L21 8H6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="21" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="17" cy="21" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

function MenuIcon({ open }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      {open ? (
        <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
      ) : (
        <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
      )}
    </svg>
  );
}
