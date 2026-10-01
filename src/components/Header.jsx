import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import RealisticBee from "./RealisticBee";
import { useCart } from "../context/CartContext";
import { Settings, subscribe } from "../data/db";
import { getSocialUrl } from "../utils/contacts";
import {
  IconCart,
  IconPhone,
  IconMenu,
  IconClose,
  IconInstagram,
  IconTelegram,
  IconViber,
  IconChevronRight,
} from "./Icons";

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
  const [s, setS] = useState(() => Settings.get());
  const location = useLocation();

  useEffect(() => {
    Settings.fetch().then((data) => data && setS(data));
    return subscribe(() => setS(Settings.get()));
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const phone = (s?.contacts?.phone || s?.store?.phone || "+380 (97) 123-45-67").trim();

  const socialLinks = [
    { key: "telegram", label: "Telegram", icon: <IconTelegram className="w-4 h-4" /> },
    { key: "instagram", label: "Instagram", icon: <IconInstagram className="w-4 h-4" /> },
    { key: "viber", label: "Viber", icon: <IconViber className="w-4 h-4" /> },
  ]
    .map((item) => ({
      ...item,
      url: getSocialUrl(item.key, s?.contacts?.[item.key]),
    }))
    .filter((item) => Boolean(item.url));

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#FFFDF8]/90 backdrop-blur-xl border-b border-amber-900/10 text-ink shadow-[0_4px_24px_rgba(41,40,33,0.03)] transition-all">
        <div className="container-p flex items-center justify-between h-16 sm:h-18 md:h-20">
          
          {/* Brand Logo with Realistic 3D Bee */}
          <Link
            to="/"
            className="flex items-center gap-2.5 sm:gap-3 group shrink-0"
            aria-label="Honey Pasika — Головна"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105">
              <RealisticBee size={30} depth="near" />
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-xl sm:text-2xl lg:text-[26px] font-extrabold tracking-tight text-ink leading-tight">
                Honey Pasika
              </span>
              <span className="text-[10px] tracking-wider uppercase text-ink/40 font-semibold hidden sm:block">
                Сімейна пасіка • 100% натуральний мед
              </span>
            </div>
          </Link>

          {/* Desktop Navigation (lg+) */}
          <nav className="hidden lg:flex items-center gap-5 xl:gap-7 text-sm font-medium">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                className={({ isActive }) =>
                  `relative py-1.5 transition-colors duration-200 ${
                    isActive
                      ? "text-honey font-bold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-honey after:rounded-full"
                      : "text-ink/75 hover:text-honey"
                  }`
                }
              >
                {n.label}
              </NavLink>
            ))}
            <NavLink
              to="/track-order"
              className={({ isActive }) =>
                `text-xs font-semibold px-2.5 py-1 rounded-full transition-colors border ${
                  isActive
                    ? "bg-honey/15 text-honey border-honey/40"
                    : "text-ink/60 border-amber-900/10 hover:text-honey hover:border-honey/40 hover:bg-cream/40"
                }`
              }
            >
              Відстежити
            </NavLink>
          </nav>

          {/* Desktop Action Controls (Phone, Socials, Cart) */}
          <div className="hidden lg:flex items-center gap-3.5 xl:gap-5">
            {/* Direct Phone Call */}
            {phone && (
              <a
                href={`tel:${phone.replace(/\s+/g, "")}`}
                className="flex items-center gap-2 text-xs xl:text-sm font-semibold py-1.5 px-3 rounded-full text-ink/80 hover:text-honey hover:bg-cream/50 transition-all border border-transparent hover:border-amber-900/10"
              >
                <IconPhone className="w-3.5 h-3.5 text-honey shrink-0" />
                <span className="whitespace-nowrap">{phone}</span>
              </a>
            )}

            {/* Social Links */}
            {socialLinks.length > 0 && (
              <div className="flex items-center gap-1.5 border-l border-ink/10 pl-3">
                {socialLinks.map((item) => (
                  <a
                    key={item.key}
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={item.label}
                    className="p-1.5 rounded-lg text-ink/50 hover:text-honey hover:bg-cream/50 transition-colors"
                  >
                    {item.icon}
                  </a>
                ))}
              </div>
            )}

            {/* Cart Button */}
            <Link
              to="/cart"
              className="relative p-2.5 rounded-xl transition-all duration-200 active:scale-95 text-ink hover:text-honey hover:bg-cream/60 border border-amber-900/10 hover:border-honey/40"
              aria-label={`Кошик покупок (${count} товарів)`}
            >
              <IconCart className="w-5 h-5" />
              {count > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-gradient-to-r from-honey to-accent text-ink font-bold text-[11px] rounded-full min-w-5 h-5 px-1 flex items-center justify-center shadow-sm border border-clean animate-pulse">
                  {count}
                </span>
              )}
            </Link>
          </div>

          {/* Mobile Right Controls: Cart & Hamburger Only */}
          <div className="flex items-center gap-2 sm:gap-2.5 lg:hidden">
            {/* Mobile Cart Trigger */}
            <Link
              to="/cart"
              className="relative p-2 sm:p-2.5 rounded-xl transition-all active:scale-95 text-ink hover:bg-cream/60 border border-amber-900/10"
              aria-label={`Кошик покупок (${count})`}
            >
              <IconCart className="w-5 h-5 sm:w-6 sm:h-6" />
              {count > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-gradient-to-r from-honey to-accent text-ink font-bold text-[10px] sm:text-[11px] rounded-full min-w-4.5 h-4.5 sm:min-w-5 sm:h-5 px-1 flex items-center justify-center shadow-sm border border-clean">
                  {count}
                </span>
              )}
            </Link>

            {/* Mobile Menu Hamburger Button */}
            <button
              type="button"
              className="p-2 sm:p-2.5 rounded-xl transition-colors text-ink hover:bg-cream/60 border border-amber-900/10 active:scale-95"
              onClick={() => setOpen((prev) => !prev)}
              aria-label={open ? "Закрити меню" : "Відкрити меню навігації"}
              aria-expanded={open}
            >
              {open ? <IconClose className="w-6 h-6" /> : <IconMenu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* MOBILE NAVIGATION DRAWER & OVERLAY */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden animate-fade-in">
          {/* Backdrop Blur Overlay */}
          <div
            className="fixed inset-0 bg-ink/40 backdrop-blur-xs transition-opacity"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          {/* Slide-in Sheet from Right */}
          <div className="fixed inset-y-0 right-0 max-w-sm w-full bg-[#FFFDF8]/98 backdrop-blur-2xl shadow-2xl border-l border-amber-900/10 flex flex-col z-50 overflow-y-auto">
            
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-amber-900/10">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 flex items-center justify-center">
                  <RealisticBee size={24} depth="near" />
                </div>
                <span className="font-serif text-lg font-bold text-ink">
                  Honey Pasika
                </span>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-ink/60 hover:text-ink hover:bg-cream/60 transition-colors"
                aria-label="Закрити меню"
              >
                <IconClose className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 px-4 py-4 space-y-1.5">
              {NAV.map((n) => (
                <NavLink
                  key={n.to}
                  to={n.to}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center justify-between py-3.5 px-4 rounded-xl text-base font-semibold transition-all ${
                      isActive
                        ? "bg-amber-100/60 text-honey font-bold shadow-2xs"
                        : "text-ink/80 hover:bg-cream/50 hover:text-ink"
                    }`
                  }
                >
                  <span>{n.label}</span>
                  <IconChevronRight className="w-4 h-4 opacity-40" />
                </NavLink>
              ))}

              <NavLink
                to="/track-order"
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex items-center justify-between py-3.5 px-4 rounded-xl text-sm font-semibold transition-all mt-2 border ${
                    isActive
                      ? "bg-honey/15 text-honey border-honey/40 font-bold"
                      : "text-ink/70 border-amber-900/10 hover:bg-cream/50"
                  }`
                }
              >
                <span>Відстежити замовлення</span>
                <IconChevronRight className="w-4 h-4 opacity-40" />
              </NavLink>
            </nav>

            {/* Mobile Drawer Footer with Contact & Socials */}
            <div className="p-4 sm:p-5 border-t border-amber-900/10 bg-cream/30 space-y-3.5">
              {phone && (
                <a
                  href={`tel:${phone.replace(/\s+/g, "")}`}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/90 border border-amber-900/10 text-sm font-bold text-ink shadow-2xs hover:border-honey/40 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-honey/15 flex items-center justify-center text-honey shrink-0">
                    <IconPhone className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] font-medium text-ink/50 uppercase tracking-wider">Гаряча лінія</span>
                    <span>{phone}</span>
                  </div>
                </a>
              )}

              {socialLinks.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-ink/50 uppercase tracking-wider mb-2">
                    Ми у соцмережах:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {socialLinks.map((item) => (
                      <a
                        key={item.key}
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-amber-900/10 text-xs font-medium text-ink/80 hover:text-honey hover:border-honey/40 transition-colors shadow-2xs"
                      >
                        {item.icon}
                        <span>{item.label}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
