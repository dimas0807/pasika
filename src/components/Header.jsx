import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { Categories, Settings, subscribe } from "../data/db";
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
  IconChevronDown,
  IconTruck,
} from "./Icons";

const NAV = [
  { to: "/", label: "Головна" },
  { to: "/catalog", label: "Каталог", hasDropdown: true },
  { to: "/gift-boxes", label: "Подарункові бокси" },
  { to: "/about", label: "Про пасіку" },
  { to: "/delivery", label: "Доставка" },
];

export default function Header() {
  const { count } = useCart();
  const [open, setOpen] = useState(false);
  const [s, setS] = useState(() => Settings.get());
  const [categories, setCategories] = useState(() => Categories.all());
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [mobileCatalogExpanded, setMobileCatalogExpanded] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const location = useLocation();
  const isHome = location.pathname === "/";
  const isTransparent = isHome && !scrolled;

  useEffect(() => {
    Settings.fetch().then((data) => data && setS(data));
    Categories.fetchAll().then((data) => data && setCategories(data));
    return subscribe(() => {
      setS(Settings.get());
      setCategories(Categories.all());
    });
  }, []);

  // Scroll detection for transparent-to-glass transition on Home page
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 35);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [location.pathname]);

  // Close mobile drawer and dropdown on route change
  useEffect(() => {
    setOpen(false);
    setCatalogOpen(false);
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
      <header
        className={`z-40 transition-all duration-300 ${
          isHome
            ? `fixed top-0 inset-x-0 ${
                isTransparent
                  ? "bg-transparent border-b border-transparent text-white"
                  : "bg-[#FFFDF8]/95 backdrop-blur-xl border-b border-amber-900/10 text-ink shadow-[0_4px_24px_rgba(41,40,33,0.04)]"
              }`
            : "sticky top-0 inset-x-0 bg-[#FFFDF8]/95 backdrop-blur-xl border-b border-amber-900/10 text-ink shadow-[0_4px_24px_rgba(41,40,33,0.03)]"
        }`}
      >
        <div className="container-p flex items-center justify-between h-16 sm:h-18 md:h-20">
          
          {/* 1. Brand Logo: Honey Pasika + Subtitle (No Bee as requested) */}
          <Link
            to="/"
            className="flex flex-col group shrink-0 transition-opacity hover:opacity-95"
            aria-label="Honey Pasika — Головна"
          >
            <span
              className={`font-serif text-xl sm:text-2xl lg:text-[26px] font-extrabold tracking-tight leading-none transition-colors ${
                isTransparent ? "text-white drop-shadow-sm" : "text-ink"
              }`}
            >
              Honey Pasika
            </span>
            <span
              className={`text-[9px] sm:text-[10px] tracking-[0.16em] uppercase font-bold mt-1 transition-colors ${
                isTransparent ? "text-white/75 drop-shadow-xs" : "text-ink/45"
              }`}
            >
              СІМЕЙНА ПАСІКА • 100% НАТУРАЛЬНИЙ МЕД
            </span>
          </Link>

          {/* 2. Desktop Navigation (Головна | Каталог + Dropdown | Подарункові бокси | Про пасіку | Доставка) */}
          <nav className="hidden lg:flex items-center gap-5 xl:gap-7 text-sm font-medium">
            {NAV.map((n) => {
              if (n.hasDropdown) {
                return (
                  <div
                    key={n.to}
                    className="relative group py-2"
                    onMouseEnter={() => setCatalogOpen(true)}
                    onMouseLeave={() => setCatalogOpen(false)}
                  >
                    <NavLink
                      to={n.to}
                      className={({ isActive }) =>
                        `relative flex items-center gap-1.5 py-1.5 transition-colors duration-200 ${
                          isActive
                            ? isTransparent
                              ? "text-accent font-bold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-accent after:rounded-full"
                              : "text-honey font-bold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-honey after:rounded-full"
                            : isTransparent
                            ? "text-white/90 hover:text-white"
                            : "text-ink/75 hover:text-honey"
                        }`
                      }
                    >
                      <span>{n.label}</span>
                      <IconChevronDown
                        className={`w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-transform duration-200 ${
                          catalogOpen ? "rotate-180" : ""
                        }`}
                      />
                    </NavLink>

                    {/* Desktop Catalog Dropdown with Real Categories */}
                    <div
                      className={`absolute top-full left-0 pt-2 transition-all duration-200 z-50 ${
                        catalogOpen
                          ? "opacity-100 visible translate-y-0 pointer-events-auto"
                          : "opacity-0 invisible translate-y-1 pointer-events-none"
                      }`}
                    >
                      <div className="bg-[#FFFDF8]/98 backdrop-blur-2xl border border-amber-900/10 rounded-2xl p-2.5 shadow-xl min-w-[230px] text-ink space-y-0.5">
                        <Link
                          to="/catalog"
                          onClick={() => setCatalogOpen(false)}
                          className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-honey hover:bg-honey/10 transition-colors"
                        >
                          <span>Всі товари каталогу</span>
                          <IconChevronRight className="w-3.5 h-3.5 opacity-70" />
                        </Link>

                        <div className="h-px bg-amber-900/10 my-1" />

                        {categories.map((cat) => {
                          const targetUrl =
                            cat.slug === "gift-boxes" ? "/gift-boxes" : `/catalog?category=${cat.slug}`;
                          return (
                            <Link
                              key={cat.slug}
                              to={targetUrl}
                              onClick={() => setCatalogOpen(false)}
                              className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-ink/80 hover:text-honey hover:bg-cream/70 transition-colors group/cat"
                            >
                              <span>{cat.name}</span>
                              <IconChevronRight className="w-3.5 h-3.5 opacity-30 group-hover/cat:opacity-80 group-hover/cat:translate-x-0.5 transition-all" />
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <NavLink
                  key={n.to}
                  to={n.to}
                  className={({ isActive }) =>
                    `relative py-1.5 transition-colors duration-200 ${
                      isActive
                        ? isTransparent
                          ? "text-accent font-bold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-accent after:rounded-full"
                          : "text-honey font-bold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-honey after:rounded-full"
                        : isTransparent
                        ? "text-white/90 hover:text-white"
                        : "text-ink/75 hover:text-honey"
                    }`
                  }
                >
                  {n.label}
                </NavLink>
              );
            })}
          </nav>

          {/* 3. Desktop Right Action Controls: [Відстежити] | [Телефон] | [Кошик] */}
          <div className="hidden lg:flex items-center gap-3 xl:gap-4 shrink-0">
            {/* Distinct Utility: Track Order Button */}
            <NavLink
              to="/track-order"
              className={({ isActive }) =>
                `inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 active:scale-95 shrink-0 ${
                  isActive
                    ? isTransparent
                      ? "bg-accent text-stone-900 font-bold shadow-md ring-2 ring-accent/50"
                      : "bg-honey text-white font-bold shadow-sm"
                    : isTransparent
                    ? "bg-white/15 hover:bg-white/25 text-white border border-white/30 backdrop-blur-md shadow-xs hover:border-white/50"
                    : "bg-amber-500/10 hover:bg-amber-500/20 text-ink/80 hover:text-ink border border-amber-900/15 shadow-2xs"
                }`
              }
              title="Перевірити статус замовлення"
            >
              <IconTruck className="w-3.5 h-3.5 shrink-0 opacity-80" />
              <span>Відстежити</span>
            </NavLink>

            {/* Direct Phone Link */}
            {phone && (
              <a
                href={`tel:${phone.replace(/\s+/g, "")}`}
                className={`inline-flex items-center gap-2 text-xs xl:text-sm font-semibold py-1.5 px-3 rounded-full transition-all ${
                  isTransparent
                    ? "text-white/95 hover:text-white hover:bg-white/10"
                    : "text-ink/85 hover:text-honey hover:bg-cream/50"
                }`}
                title={`Зателефонувати: ${phone}`}
              >
                <IconPhone className={`w-3.5 h-3.5 ${isTransparent ? "text-accent" : "text-honey"} shrink-0`} />
                <span className="whitespace-nowrap">{phone}</span>
              </a>
            )}

            {/* Shopping Cart Button */}
            <Link
              to="/cart"
              className={`relative p-2.5 rounded-xl transition-all duration-200 active:scale-95 shrink-0 ${
                isTransparent
                  ? "text-white hover:text-accent bg-white/15 hover:bg-white/25 border border-white/30 backdrop-blur-md shadow-xs"
                  : "text-ink hover:text-honey hover:bg-cream/60 border border-amber-900/10 hover:border-honey/40"
              }`}
              aria-label={`Кошик покупок (${count} товарів)`}
            >
              <IconCart className="w-5 h-5" />
              {count > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-gradient-to-r from-honey to-accent text-ink font-bold text-[11px] rounded-full min-w-5 h-5 px-1 flex items-center justify-center shadow-xs border border-clean">
                  {count}
                </span>
              )}
            </Link>
          </div>

          {/* 4. Mobile Right Controls: Cart & Hamburger Only */}
          <div className="flex items-center gap-2 sm:gap-2.5 lg:hidden">
            {/* Mobile Cart Trigger */}
            <Link
              to="/cart"
              className={`relative p-2 sm:p-2.5 rounded-xl transition-all active:scale-95 ${
                isTransparent
                  ? "text-white bg-white/15 border border-white/25 backdrop-blur-md shadow-xs"
                  : "text-ink hover:bg-cream/60 border border-amber-900/10"
              }`}
              aria-label={`Кошик покупок (${count})`}
            >
              <IconCart className="w-5 h-5 sm:w-6 sm:h-6" />
              {count > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-gradient-to-r from-honey to-accent text-ink font-bold text-[10px] sm:text-[11px] rounded-full min-w-4.5 h-4.5 sm:min-w-5 sm:h-5 px-1 flex items-center justify-center shadow-xs border border-clean">
                  {count}
                </span>
              )}
            </Link>

            {/* Mobile Menu Hamburger Button */}
            <button
              type="button"
              className={`p-2 sm:p-2.5 rounded-xl transition-colors active:scale-95 ${
                isTransparent
                  ? "text-white bg-white/15 border border-white/25 backdrop-blur-md shadow-xs"
                  : "text-ink hover:bg-cream/60 border border-amber-900/10"
              }`}
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
            
            {/* Drawer Header (Clean Honey Pasika branding without bee) */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-amber-900/10">
              <div className="flex flex-col">
                <span className="font-serif text-lg font-bold text-ink">
                  Honey Pasika
                </span>
                <span className="text-[9px] tracking-wider uppercase font-semibold text-ink/40">
                  Сімейна пасіка
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
              {NAV.map((n) => {
                if (n.hasDropdown) {
                  return (
                    <div key={n.to} className="space-y-1">
                      <div className="flex items-center justify-between rounded-xl hover:bg-cream/50 transition-colors">
                        <NavLink
                          to={n.to}
                          onClick={() => setOpen(false)}
                          className={({ isActive }) =>
                            `flex-1 py-3 px-4 text-base font-semibold transition-all ${
                              isActive ? "text-honey font-bold" : "text-ink/80"
                            }`
                          }
                        >
                          {n.label}
                        </NavLink>
                        <button
                          type="button"
                          onClick={() => setMobileCatalogExpanded((v) => !v)}
                          className="p-3 text-ink/50 hover:text-ink"
                          aria-label="Показати категорії каталогу"
                        >
                          <IconChevronDown
                            className={`w-4 h-4 transition-transform duration-200 ${
                              mobileCatalogExpanded ? "rotate-180" : ""
                            }`}
                          />
                        </button>
                      </div>

                      {mobileCatalogExpanded && (
                        <div className="pl-4 pr-2 py-1 space-y-1 bg-cream/30 rounded-xl mb-1">
                          <Link
                            to="/catalog"
                            onClick={() => setOpen(false)}
                            className="block py-2 px-3 text-xs font-bold text-honey rounded-lg hover:bg-white/80"
                          >
                            Всі товари
                          </Link>
                          {categories.map((cat) => {
                            const targetUrl =
                              cat.slug === "gift-boxes" ? "/gift-boxes" : `/catalog?category=${cat.slug}`;
                            return (
                              <Link
                                key={cat.slug}
                                to={targetUrl}
                                onClick={() => setOpen(false)}
                                className="block py-2 px-3 text-xs font-medium text-ink/75 hover:text-honey rounded-lg hover:bg-white/80 transition-colors"
                              >
                                {cat.name}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <NavLink
                    key={n.to}
                    to={n.to}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center justify-between py-3 px-4 rounded-xl text-base font-semibold transition-all ${
                        isActive
                          ? "bg-amber-100/60 text-honey font-bold shadow-2xs"
                          : "text-ink/80 hover:bg-cream/50 hover:text-ink"
                      }`
                    }
                  >
                    <span>{n.label}</span>
                    <IconChevronRight className="w-4 h-4 opacity-40" />
                  </NavLink>
                );
              })}

              {/* Utility Track Link inside Mobile Drawer */}
              <NavLink
                to="/track-order"
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex items-center justify-between py-3 px-4 rounded-xl text-sm font-semibold transition-all mt-3 border ${
                    isActive
                      ? "bg-honey/15 text-honey border-honey/40 font-bold"
                      : "text-ink/80 border-amber-900/15 bg-amber-500/5 hover:bg-cream/50"
                  }`
                }
              >
                <span className="flex items-center gap-2.5">
                  <IconTruck className="w-4 h-4 text-honey" />
                  <span>Відстежити замовлення</span>
                </span>
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
                    <span className="text-[11px] font-medium text-ink/50 uppercase tracking-wider">
                      Зв'язок з нами
                    </span>
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
