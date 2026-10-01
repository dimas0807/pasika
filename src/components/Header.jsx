import { useEffect, useState, useMemo } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { Categories, Products, Settings, subscribe } from "../data/db";
import { getSocialUrl } from "../utils/contacts";
import {
  IconCart,
  IconPhone,
  IconMenu,
  IconClose,
  IconInstagram,
  IconTelegram,
  IconViber,
  IconFacebook,
  IconTikTok,
  IconChevronRight,
  IconChevronDown,
  IconTruck,
  IconBox,
} from "./Icons";

const NAV = [
  { to: "/", label: "Головна", id: "home" },
  { to: "/catalog", label: "Каталог", id: "catalog" },
  { to: "/gift-boxes", label: "Подарункові бокси", id: "gift-boxes" },
  { to: "/about", label: "Про пасіку", id: "about" },
];

export default function Header() {
  const { count, subtotal } = useCart();
  const [open, setOpen] = useState(false);
  const [s, setS] = useState(() => Settings.get());
  const [categories, setCategories] = useState(() => Categories.all());
  const [products, setProducts] = useState(() => Products.all());
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [expandedMobile, setExpandedMobile] = useState(null);
  const [scrolled, setScrolled] = useState(false);

  const location = useLocation();
  const isHome = location.pathname === "/";
  const isTransparent = isHome && !scrolled;

  useEffect(() => {
    Settings.fetch().then((data) => data && setS(data));
    Categories.fetchAll().then((data) => data && setCategories(data));
    Products.fetchAll().then((data) => data && setProducts(data));
    return subscribe(() => {
      setS(Settings.get());
      setCategories(Categories.all());
      setProducts(Products.all());
    });
  }, []);

  // Filter real gift boxes from existing products catalog
  const giftBoxes = useMemo(() => {
    return products.filter((p) => p.category === "gift-boxes" || p.giftBox);
  }, [products]);

  // Dynamically resolve social networks configured in Admin Settings
  const configuredSocials = useMemo(() => {
    const list = [
      { key: "viber", label: "Viber", icon: <IconViber className="w-4 h-4 text-[#7360F2]" /> },
      { key: "telegram", label: "Telegram", icon: <IconTelegram className="w-4 h-4 text-[#2AABEE]" /> },
      { key: "tiktok", label: "TikTok", icon: <IconTikTok className="w-4 h-4 text-ink" /> },
      { key: "instagram", label: "Instagram", icon: <IconInstagram className="w-4 h-4 text-[#E4405F]" /> },
      { key: "facebook", label: "Facebook", icon: <IconFacebook className="w-4 h-4 text-[#1877F2]" /> },
    ];

    return list
      .map((net) => {
        const raw = (s?.contacts?.[net.key] || s?.store?.[net.key] || "").trim();
        return {
          ...net,
          raw,
          url: getSocialUrl(net.key, raw),
        };
      })
      .filter((net) => Boolean(net.url));
  }, [s]);

  // Scroll detection for transparent matte glass-to-solid transition on Home page
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
    setActiveDropdown(null);
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

  const toggleMobileGroup = (id) => {
    setExpandedMobile((prev) => (prev === id ? null : id));
  };

  return (
    <>
      <header
        className={`z-40 transition-all duration-300 ${
          isHome
            ? `fixed top-0 inset-x-0 ${
                isTransparent
                  ? "bg-white/[0.04] backdrop-blur-md border-b border-white/10 text-white shadow-[0_4px_30px_rgba(0,0,0,0.12)]"
                  : "bg-[#FFFDF8]/90 backdrop-blur-xl border-b border-amber-900/10 text-ink shadow-[0_8px_30px_rgba(41,40,33,0.04)]"
              }`
            : "sticky top-0 inset-x-0 bg-[#FFFDF8]/90 backdrop-blur-xl border-b border-amber-900/10 text-ink shadow-[0_8px_30px_rgba(41,40,33,0.04)]"
        }`}
      >
        <div className="container-p flex items-center justify-between h-16 sm:h-18 md:h-20">
          
          {/* 1. Brand Logo: Clean "Honey Pasika" + Subtle "Сімейна пасіка" */}
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
              className={`text-[9px] sm:text-[10px] tracking-[0.2em] uppercase font-semibold mt-1 transition-colors ${
                isTransparent ? "text-white/70" : "text-ink/45"
              }`}
            >
              Сімейна пасіка
            </span>
          </Link>

          {/* 2. Desktop Navigation: Головна | Каталог ▾ | Подарункові бокси ▾ | Про пасіку ▾ */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-8 text-sm font-medium">
            {NAV.map((n) => {
              // 2.1 — Каталог dropdown
              if (n.id === "catalog") {
                const isOpen = activeDropdown === "catalog";
                return (
                  <div
                    key={n.id}
                    className="relative group py-2"
                    onMouseEnter={() => setActiveDropdown("catalog")}
                    onMouseLeave={() => setActiveDropdown(null)}
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
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </NavLink>

                    {/* Catalog Dropdown Card */}
                    <div
                      className={`absolute top-full left-0 pt-2 transition-all duration-200 z-50 ${
                        isOpen
                          ? "opacity-100 visible translate-y-0 pointer-events-auto"
                          : "opacity-0 invisible translate-y-1 pointer-events-none"
                      }`}
                    >
                      <div className="bg-[#FFFDF8]/98 backdrop-blur-2xl border border-amber-900/10 rounded-2xl p-2.5 shadow-2xl min-w-[240px] text-ink space-y-0.5">
                        <Link
                          to="/catalog"
                          onClick={() => setActiveDropdown(null)}
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
                              onClick={() => setActiveDropdown(null)}
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

              // 2.2 — Подарункові бокси dropdown
              if (n.id === "gift-boxes") {
                const isOpen = activeDropdown === "gift-boxes";
                return (
                  <div
                    key={n.id}
                    className="relative group py-2"
                    onMouseEnter={() => setActiveDropdown("gift-boxes")}
                    onMouseLeave={() => setActiveDropdown(null)}
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
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </NavLink>

                    {/* Gift Boxes Dropdown Card with Real Catalog Boxes */}
                    <div
                      className={`absolute top-full left-0 pt-2 transition-all duration-200 z-50 ${
                        isOpen
                          ? "opacity-100 visible translate-y-0 pointer-events-auto"
                          : "opacity-0 invisible translate-y-1 pointer-events-none"
                      }`}
                    >
                      <div className="bg-[#FFFDF8]/98 backdrop-blur-2xl border border-amber-900/10 rounded-2xl p-2.5 shadow-2xl min-w-[260px] text-ink space-y-0.5">
                        <Link
                          to="/gift-boxes"
                          onClick={() => setActiveDropdown(null)}
                          className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-honey hover:bg-honey/10 transition-colors"
                        >
                          <span className="flex items-center gap-2">
                            <IconBox className="w-3.5 h-3.5" />
                            <span>Всі подарункові бокси</span>
                          </span>
                          <IconChevronRight className="w-3.5 h-3.5 opacity-70" />
                        </Link>

                        {giftBoxes.length > 0 && <div className="h-px bg-amber-900/10 my-1" />}

                        {giftBoxes.map((box) => (
                          <Link
                            key={box.id || box.slug}
                            to={`/product/${box.slug}`}
                            onClick={() => setActiveDropdown(null)}
                            className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-ink/80 hover:text-honey hover:bg-cream/70 transition-colors group/box"
                          >
                            <span className="truncate pr-2">{box.name}</span>
                            <span className="text-[11px] font-bold text-ink/50 group-hover/box:text-honey shrink-0">
                              {box.price} грн
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              }

              // 2.3 — Про пасіку dropdown (Про нас, Доставка, Контакти)
              if (n.id === "about") {
                const isOpen = activeDropdown === "about";
                return (
                  <div
                    key={n.id}
                    className="relative group py-2"
                    onMouseEnter={() => setActiveDropdown("about")}
                    onMouseLeave={() => setActiveDropdown(null)}
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
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </NavLink>

                    {/* About Dropdown with Real Project Pages */}
                    <div
                      className={`absolute top-full left-0 pt-2 transition-all duration-200 z-50 ${
                        isOpen
                          ? "opacity-100 visible translate-y-0 pointer-events-auto"
                          : "opacity-0 invisible translate-y-1 pointer-events-none"
                      }`}
                    >
                      <div className="bg-[#FFFDF8]/98 backdrop-blur-2xl border border-amber-900/10 rounded-2xl p-2.5 shadow-2xl min-w-[220px] text-ink space-y-0.5">
                        <Link
                          to="/about"
                          onClick={() => setActiveDropdown(null)}
                          className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-ink/80 hover:text-honey hover:bg-cream/70 transition-colors"
                        >
                          <span>Історія пасіки та родина</span>
                          <IconChevronRight className="w-3.5 h-3.5 opacity-40" />
                        </Link>
                        <Link
                          to="/delivery"
                          onClick={() => setActiveDropdown(null)}
                          className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-ink/80 hover:text-honey hover:bg-cream/70 transition-colors"
                        >
                          <span>Доставка та оплата</span>
                          <IconChevronRight className="w-3.5 h-3.5 opacity-40" />
                        </Link>
                        <Link
                          to="/contacts"
                          onClick={() => setActiveDropdown(null)}
                          className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-ink/80 hover:text-honey hover:bg-cream/70 transition-colors"
                        >
                          <span>Контакти та локація</span>
                          <IconChevronRight className="w-3.5 h-3.5 opacity-40" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              }

              // Standard Link (Головна)
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

          {/* 3. Desktop Right Controls: [Відстежити] | [Зв'язок / Телефон ▾] | [Кошик] */}
          <div className="hidden lg:flex items-center gap-3 xl:gap-3.5 shrink-0">
            
            {/* 3.1 — Distinct Utility: Track Order Button */}
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

            {/* 3.2 — Compact "Зв'язок" Dropdown (Real Admin Channels Only) */}
            <div
              className="relative py-2"
              onMouseEnter={() => setActiveDropdown("contact")}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <a
                href={`tel:${phone.replace(/\s+/g, "")}`}
                className={`inline-flex items-center gap-2 text-xs xl:text-sm font-semibold py-1.5 px-3 rounded-full transition-all border ${
                  isTransparent
                    ? "text-white/95 hover:text-white bg-white/10 hover:bg-white/20 border-white/20 backdrop-blur-md shadow-xs"
                    : "text-ink/85 hover:text-honey bg-cream/50 hover:bg-cream/80 border-amber-900/10 shadow-2xs"
                }`}
                title="Зателефонувати або обрати месенджер"
              >
                <IconPhone className={`w-3.5 h-3.5 ${isTransparent ? "text-accent" : "text-honey"} shrink-0`} />
                <span className="whitespace-nowrap">{phone}</span>
                {configuredSocials.length > 0 && (
                  <IconChevronDown
                    className={`w-3 h-3 opacity-60 transition-transform duration-200 ${
                      activeDropdown === "contact" ? "rotate-180" : ""
                    }`}
                  />
                )}
              </a>

              {/* Contact Dropdown Popover */}
              {configuredSocials.length > 0 && (
                <div
                  className={`absolute right-0 top-full pt-2 transition-all duration-200 z-50 ${
                    activeDropdown === "contact"
                      ? "opacity-100 visible translate-y-0 pointer-events-auto"
                      : "opacity-0 invisible translate-y-1 pointer-events-none"
                  }`}
                >
                  <div className="bg-[#FFFDF8]/98 backdrop-blur-2xl border border-amber-900/10 rounded-2xl p-2.5 shadow-2xl min-w-[210px] text-ink space-y-1">
                    <div className="text-[10px] uppercase tracking-wider font-bold text-ink/40 px-2.5 pt-1 pb-0.5">
                      Швидкий зв'язок
                    </div>
                    <a
                      href={`tel:${phone.replace(/\s+/g, "")}`}
                      className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-semibold rounded-xl text-ink hover:text-honey hover:bg-cream/70 transition-colors"
                    >
                      <div className="w-6 h-6 rounded-lg bg-honey/15 flex items-center justify-center text-honey shrink-0">
                        <IconPhone className="w-3.5 h-3.5" />
                      </div>
                      <span>{phone}</span>
                    </a>

                    <div className="h-px bg-amber-900/10 my-1" />

                    <div className="text-[10px] uppercase tracking-wider font-bold text-ink/40 px-2.5 pt-0.5 pb-0.5">
                      Месенджери та соцмережі
                    </div>
                    {configuredSocials.map((item) => (
                      <a
                        key={item.key}
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2.5 px-2.5 py-1.5 text-xs font-medium rounded-xl text-ink/75 hover:text-honey hover:bg-cream/70 transition-colors"
                      >
                        <div className="w-6 h-6 rounded-lg bg-amber-900/5 flex items-center justify-center shrink-0">
                          {item.icon}
                        </div>
                        <span>{item.label}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 3.3 — Dynamic Shopping Cart Button */}
            <Link
              to="/cart"
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-200 active:scale-95 shrink-0 shadow-2xs ${
                isTransparent
                  ? "text-white hover:text-accent bg-white/15 hover:bg-white/25 border border-white/30 backdrop-blur-md"
                  : "text-ink hover:text-honey bg-amber-500/10 hover:bg-amber-500/15 border border-amber-900/15"
              }`}
              aria-label={`Кошик покупок: ${count} товарів на суму ${subtotal} грн`}
            >
              <div className="relative flex items-center justify-center">
                <IconCart className="w-5 h-5" />
                {count > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-gradient-to-r from-honey to-accent text-ink font-bold text-[10px] rounded-full min-w-4 h-4 px-1 flex items-center justify-center shadow-xs border border-clean">
                    {count}
                  </span>
                )}
              </div>
              {count > 0 && (
                <span className="text-xs font-bold whitespace-nowrap hidden sm:inline ml-0.5">
                  {subtotal} грн
                </span>
              )}
            </Link>
          </div>

          {/* 4. Mobile Right Controls: Dynamic Cart & Hamburger */}
          <div className="flex items-center gap-2 sm:gap-2.5 lg:hidden">
            {/* Dynamic Mobile Cart */}
            <Link
              to="/cart"
              className={`inline-flex items-center gap-1.5 px-2.5 py-2 rounded-xl transition-all active:scale-95 ${
                isTransparent
                  ? "text-white bg-white/15 border border-white/25 backdrop-blur-md shadow-xs"
                  : "text-ink hover:bg-cream/60 border border-amber-900/10"
              }`}
              aria-label={`Кошик покупок (${count})`}
            >
              <div className="relative flex items-center">
                <IconCart className="w-5 h-5" />
                {count > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-gradient-to-r from-honey to-accent text-ink font-bold text-[10px] rounded-full min-w-4 h-4 px-1 flex items-center justify-center shadow-xs border border-clean">
                    {count}
                  </span>
                )}
              </div>
              {count > 0 && (
                <span className="text-xs font-bold whitespace-nowrap hidden sm:inline">
                  {subtotal} грн
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

      {/* 5. MOBILE NAVIGATION DRAWER & ACCORDIONS */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden animate-fade-in">
          {/* Backdrop Blur Overlay */}
          <div
            className="fixed inset-0 bg-ink/40 backdrop-blur-xs transition-opacity"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          {/* Slide-in Sheet from Right with iPhone-inspired Frosted Glass */}
          <div className="fixed inset-y-0 right-0 max-w-sm w-full bg-[#FFFDF8]/98 backdrop-blur-2xl shadow-2xl border-l border-amber-900/10 flex flex-col z-50 overflow-y-auto">
            
            {/* Drawer Header */}
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

            {/* Navigation Links with Tap Accordions */}
            <nav className="flex-1 px-4 py-4 space-y-1.5">
              
              {/* Home */}
              <NavLink
                to="/"
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex items-center justify-between py-3.5 px-4 rounded-xl text-base font-semibold transition-all ${
                    isActive
                      ? "bg-amber-100/60 text-honey font-bold shadow-2xs"
                      : "text-ink/80 hover:bg-cream/50 hover:text-ink"
                  }`
                }
              >
                <span>Головна</span>
                <IconChevronRight className="w-4 h-4 opacity-40" />
              </NavLink>

              {/* Catalog Accordion */}
              <div className="space-y-1">
                <div className="flex items-center justify-between rounded-xl hover:bg-cream/50 transition-colors">
                  <NavLink
                    to="/catalog"
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      `flex-1 py-3.5 px-4 text-base font-semibold transition-all ${
                        isActive ? "text-honey font-bold" : "text-ink/80"
                      }`
                    }
                  >
                    Каталог
                  </NavLink>
                  <button
                    type="button"
                    onClick={() => toggleMobileGroup("catalog")}
                    className="p-3.5 text-ink/50 hover:text-ink"
                    aria-label="Розгорнути категорії каталогу"
                  >
                    <IconChevronDown
                      className={`w-4 h-4 transition-transform duration-200 ${
                        expandedMobile === "catalog" ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                </div>

                {expandedMobile === "catalog" && (
                  <div className="pl-4 pr-2 py-1 space-y-1 bg-cream/30 rounded-xl mb-1">
                    <Link
                      to="/catalog"
                      onClick={() => setOpen(false)}
                      className="block py-2 px-3 text-xs font-bold text-honey rounded-lg hover:bg-white/80"
                    >
                      Всі товари каталогу
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

              {/* Gift Boxes Accordion */}
              <div className="space-y-1">
                <div className="flex items-center justify-between rounded-xl hover:bg-cream/50 transition-colors">
                  <NavLink
                    to="/gift-boxes"
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      `flex-1 py-3.5 px-4 text-base font-semibold transition-all ${
                        isActive ? "text-honey font-bold" : "text-ink/80"
                      }`
                    }
                  >
                    Подарункові бокси
                  </NavLink>
                  <button
                    type="button"
                    onClick={() => toggleMobileGroup("gift-boxes")}
                    className="p-3.5 text-ink/50 hover:text-ink"
                    aria-label="Розгорнути подарункові бокси"
                  >
                    <IconChevronDown
                      className={`w-4 h-4 transition-transform duration-200 ${
                        expandedMobile === "gift-boxes" ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                </div>

                {expandedMobile === "gift-boxes" && (
                  <div className="pl-4 pr-2 py-1 space-y-1 bg-cream/30 rounded-xl mb-1">
                    <Link
                      to="/gift-boxes"
                      onClick={() => setOpen(false)}
                      className="block py-2 px-3 text-xs font-bold text-honey rounded-lg hover:bg-white/80"
                    >
                      Всі подарункові бокси
                    </Link>
                    {giftBoxes.map((box) => (
                      <Link
                        key={box.id || box.slug}
                        to={`/product/${box.slug}`}
                        onClick={() => setOpen(false)}
                        className="flex items-center justify-between py-2 px-3 text-xs font-medium text-ink/75 hover:text-honey rounded-lg hover:bg-white/80 transition-colors"
                      >
                        <span className="truncate pr-2">{box.name}</span>
                        <span className="text-[11px] font-bold text-ink/50">{box.price} грн</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* About Accordion */}
              <div className="space-y-1">
                <div className="flex items-center justify-between rounded-xl hover:bg-cream/50 transition-colors">
                  <NavLink
                    to="/about"
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      `flex-1 py-3.5 px-4 text-base font-semibold transition-all ${
                        isActive ? "text-honey font-bold" : "text-ink/80"
                      }`
                    }
                  >
                    Про пасіку
                  </NavLink>
                  <button
                    type="button"
                    onClick={() => toggleMobileGroup("about")}
                    className="p-3.5 text-ink/50 hover:text-ink"
                    aria-label="Розгорнути сторінки про пасіку"
                  >
                    <IconChevronDown
                      className={`w-4 h-4 transition-transform duration-200 ${
                        expandedMobile === "about" ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                </div>

                {expandedMobile === "about" && (
                  <div className="pl-4 pr-2 py-1 space-y-1 bg-cream/30 rounded-xl mb-1">
                    <Link
                      to="/about"
                      onClick={() => setOpen(false)}
                      className="block py-2 px-3 text-xs font-medium text-ink/75 hover:text-honey rounded-lg hover:bg-white/80 transition-colors"
                    >
                      Історія пасіки та родина
                    </Link>
                    <Link
                      to="/delivery"
                      onClick={() => setOpen(false)}
                      className="block py-2 px-3 text-xs font-medium text-ink/75 hover:text-honey rounded-lg hover:bg-white/80 transition-colors"
                    >
                      Доставка та оплата
                    </Link>
                    <Link
                      to="/contacts"
                      onClick={() => setOpen(false)}
                      className="block py-2 px-3 text-xs font-medium text-ink/75 hover:text-honey rounded-lg hover:bg-white/80 transition-colors"
                    >
                      Контакти та локація
                    </Link>
                  </div>
                )}
              </div>

              {/* Dedicated Utility Track Link */}
              <NavLink
                to="/track-order"
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex items-center justify-between py-3.5 px-4 rounded-xl text-sm font-semibold transition-all mt-3 border ${
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

            {/* Mobile Drawer Footer: Phone + Admin-Configured Social Channels */}
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
                      Зв'язок з пасікою
                    </span>
                    <span>{phone}</span>
                  </div>
                </a>
              )}

              {configuredSocials.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-ink/50 uppercase tracking-wider mb-2">
                    Ми у соцмережах та месенджерах:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {configuredSocials.map((item) => (
                      <a
                        key={item.key}
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-amber-900/10 text-xs font-medium text-ink/80 hover:text-honey hover:border-honey/40 transition-colors shadow-2xs"
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
