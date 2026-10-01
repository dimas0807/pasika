import { useEffect, useState, useMemo, useRef } from "react";
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

  const closeTimeoutRef = useRef(null);
  const location = useLocation();

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

  // Filter real existing gift boxes from catalog
  const giftBoxes = useMemo(() => {
    return products.filter((p) => p.category === "gift-boxes" || p.giftBox);
  }, [products]);

  // Dynamically resolve real admin-configured social networks (no empty networks)
  const configuredSocials = useMemo(() => {
    const list = [
      { key: "viber", label: "Viber", icon: <IconViber className="w-4 h-4 text-[#7360F2]" /> },
      { key: "telegram", label: "Telegram", icon: <IconTelegram className="w-4 h-4 text-[#2AABEE]" /> },
      { key: "tiktok", label: "TikTok", icon: <IconTikTok className="w-4 h-4 text-[#292821]" /> },
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

  // Scroll detection to subtly refine shadow
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [location.pathname]);

  // Close mobile drawer and dropdowns on route changes
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

  // Dropdown hover timing helpers for fluid, flicker-free interaction
  const handleMouseEnter = (id) => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setActiveDropdown(id);
  };

  const handleMouseLeave = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    closeTimeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 140);
  };

  const phone = (s?.contacts?.phone || s?.store?.phone || "+380 67 835 23 11").trim();

  const toggleMobileGroup = (id) => {
    setExpandedMobile((prev) => (prev === id ? null : id));
  };

  return (
    <>
      {/* ==============================================================
          MAIN HEADER CONTAINER
          - SOLID WARM IVORY/CREAM BACKGROUND (#FFFDF8) ON ALL PAGES
          - ZERO TRANSPARENCY, ZERO GLASS, ZERO BLUR
          - HERO PHOTOGRAPHY BEGINS CLEANLY BELOW THIS HEADER
          - STICKY TOP-0 WITH REFINED SOLID ARTISANAL BORDER & SHADOW
          ============================================================== */}
      <header
        className={`sticky top-0 inset-x-0 z-40 bg-[#FFFDF8] site-header-solid border-b border-[#E8DEC8] transition-shadow duration-200 ${
          scrolled
            ? "shadow-[0_4px_16px_rgba(41,40,33,0.07)]"
            : "shadow-[0_2px_8px_rgba(41,40,33,0.03)]"
        }`}
        style={{
          backgroundColor: "#FFFDF8",
          opacity: 1,
          backdropFilter: "none",
          WebkitBackdropFilter: "none",
        }}
      >
        <div className="container-p flex items-center justify-between h-18 sm:h-20">
          
          {/* 1. BRAND LOGO: Honey Pasika + СІМЕЙНА ПАСІКА (Solid Deep Ink / Warm Brown) */}
          <Link
            to="/"
            className="flex flex-col shrink-0 group transition-opacity hover:opacity-95"
            aria-label="Honey Pasika — Головна"
          >
            <span className="font-serif text-2xl sm:text-[25px] font-bold tracking-[-0.01em] leading-none text-[#292821]">
              Honey Pasika
            </span>
            <span className="text-[9.5px] tracking-[0.24em] uppercase font-semibold text-[#8C6D46] mt-0.5">
              Сімейна пасіка
            </span>
          </Link>

          {/* 2. DESKTOP NAVIGATION: Головна | Каталог ▾ | Подарункові бокси ▾ | Про пасіку ▾ */}
          <nav className="hidden lg:flex items-center gap-7 xl:gap-8 text-[14px] font-medium tracking-normal text-[#292821]">
            {NAV.map((n) => {
              // 2.1 — Каталог dropdown
              if (n.id === "catalog") {
                const isOpen = activeDropdown === "catalog";
                return (
                  <div
                    key={n.id}
                    className="relative py-2"
                    onMouseEnter={() => handleMouseEnter("catalog")}
                    onMouseLeave={handleMouseLeave}
                  >
                    <NavLink
                      to={n.to}
                      className={({ isActive }) =>
                        `relative flex items-center gap-1.5 py-1.5 transition-colors duration-150 ${
                          isActive
                            ? "text-honey font-semibold after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-4 after:h-0.5 after:bg-honey after:rounded-full"
                            : "text-[#292821]/80 hover:text-honey"
                        }`
                      }
                    >
                      <span>{n.label}</span>
                      <IconChevronDown
                        className={`w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-transform duration-200 ${
                          isOpen ? "rotate-180 text-honey" : ""
                        }`}
                      />
                    </NavLink>

                    {/* Catalog Dropdown: 100% Opaque Solid Warm Ivory Card (Completely covers Hero) */}
                    <div
                      className={`absolute top-full left-0 pt-2 transition-all duration-150 z-50 ${
                        isOpen
                          ? "opacity-100 visible translate-y-0 pointer-events-auto"
                          : "opacity-0 invisible translate-y-1 pointer-events-none"
                      }`}
                    >
                      <div
                        className="bg-[#FFFDF8] site-dropdown-solid border border-[#E2D6C0] rounded-2xl p-2.5 shadow-[0_18px_45px_rgba(41,40,33,0.16)] min-w-[240px] text-[#292821] space-y-0.5"
                        style={{
                          backgroundColor: "#FFFDF8",
                          opacity: 1,
                          backdropFilter: "none",
                          WebkitBackdropFilter: "none",
                        }}
                      >
                        <Link
                          to="/catalog"
                          onClick={() => setActiveDropdown(null)}
                          className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-[#B87A10] hover:bg-[#F7F1E5] hover:text-[#8F5E06] transition-colors"
                        >
                          <span>Всі товари каталогу</span>
                          <IconChevronRight className="w-3.5 h-3.5 opacity-80" />
                        </Link>

                        <div className="h-px bg-[#E8DEC8] my-1" />

                        {categories.map((cat) => {
                          const targetUrl =
                            cat.slug === "gift-boxes" ? "/gift-boxes" : `/catalog?category=${cat.slug}`;
                          return (
                            <Link
                              key={cat.slug}
                              to={targetUrl}
                              onClick={() => setActiveDropdown(null)}
                              className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium text-[#292821] hover:text-[#B87A10] hover:bg-[#F7F1E5] transition-colors group/cat"
                            >
                              <span>{cat.name}</span>
                              <IconChevronRight className="w-3.5 h-3.5 opacity-35 group-hover/cat:opacity-90 group-hover/cat:translate-x-0.5 transition-all" />
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
                    className="relative py-2"
                    onMouseEnter={() => handleMouseEnter("gift-boxes")}
                    onMouseLeave={handleMouseLeave}
                  >
                    <NavLink
                      to={n.to}
                      className={({ isActive }) =>
                        `relative flex items-center gap-1.5 py-1.5 transition-colors duration-150 ${
                          isActive
                            ? "text-honey font-semibold after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-4 after:h-0.5 after:bg-honey after:rounded-full"
                            : "text-[#292821]/80 hover:text-honey"
                        }`
                      }
                    >
                      <span>{n.label}</span>
                      <IconChevronDown
                        className={`w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-transform duration-200 ${
                          isOpen ? "rotate-180 text-honey" : ""
                        }`}
                      />
                    </NavLink>

                    {/* Gift Boxes Dropdown: 100% Opaque Solid Warm Ivory Card */}
                    <div
                      className={`absolute top-full left-0 pt-2 transition-all duration-150 z-50 ${
                        isOpen
                          ? "opacity-100 visible translate-y-0 pointer-events-auto"
                          : "opacity-0 invisible translate-y-1 pointer-events-none"
                      }`}
                    >
                      <div
                        className="bg-[#FFFDF8] site-dropdown-solid border border-[#E2D6C0] rounded-2xl p-2.5 shadow-[0_18px_45px_rgba(41,40,33,0.16)] min-w-[270px] text-[#292821] space-y-0.5"
                        style={{
                          backgroundColor: "#FFFDF8",
                          opacity: 1,
                          backdropFilter: "none",
                          WebkitBackdropFilter: "none",
                        }}
                      >
                        <Link
                          to="/gift-boxes"
                          onClick={() => setActiveDropdown(null)}
                          className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-[#B87A10] hover:bg-[#F7F1E5] hover:text-[#8F5E06] transition-colors"
                        >
                          <span className="flex items-center gap-2">
                            <IconBox className="w-3.5 h-3.5" />
                            <span>Всі подарункові бокси</span>
                          </span>
                          <IconChevronRight className="w-3.5 h-3.5 opacity-80" />
                        </Link>

                        {giftBoxes.length > 0 && <div className="h-px bg-[#E8DEC8] my-1" />}

                        {giftBoxes.map((box) => (
                          <Link
                            key={box.id || box.slug}
                            to={`/product/${box.slug}`}
                            onClick={() => setActiveDropdown(null)}
                            className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium text-[#292821] hover:text-[#B87A10] hover:bg-[#F7F1E5] transition-colors group/box"
                          >
                            <span className="truncate pr-2">{box.name}</span>
                            <span className="text-[11px] font-bold text-[#292821]/60 group-hover/box:text-[#B87A10] shrink-0">
                              {box.price} грн
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              }

              // 2.3 — Про пасіку dropdown
              if (n.id === "about") {
                const isOpen = activeDropdown === "about";
                return (
                  <div
                    key={n.id}
                    className="relative py-2"
                    onMouseEnter={() => handleMouseEnter("about")}
                    onMouseLeave={handleMouseLeave}
                  >
                    <NavLink
                      to={n.to}
                      className={({ isActive }) =>
                        `relative flex items-center gap-1.5 py-1.5 transition-colors duration-150 ${
                          isActive
                            ? "text-honey font-semibold after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-4 after:h-0.5 after:bg-honey after:rounded-full"
                            : "text-[#292821]/80 hover:text-honey"
                        }`
                      }
                    >
                      <span>{n.label}</span>
                      <IconChevronDown
                        className={`w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-transform duration-200 ${
                          isOpen ? "rotate-180 text-honey" : ""
                        }`}
                      />
                    </NavLink>

                    {/* About Dropdown: 100% Opaque Solid Warm Ivory Card */}
                    <div
                      className={`absolute top-full left-0 pt-2 transition-all duration-150 z-50 ${
                        isOpen
                          ? "opacity-100 visible translate-y-0 pointer-events-auto"
                          : "opacity-0 invisible translate-y-1 pointer-events-none"
                      }`}
                    >
                      <div
                        className="bg-[#FFFDF8] site-dropdown-solid border border-[#E2D6C0] rounded-2xl p-2.5 shadow-[0_18px_45px_rgba(41,40,33,0.16)] min-w-[220px] text-[#292821] space-y-0.5"
                        style={{
                          backgroundColor: "#FFFDF8",
                          opacity: 1,
                          backdropFilter: "none",
                          WebkitBackdropFilter: "none",
                        }}
                      >
                        <Link
                          to="/about"
                          onClick={() => setActiveDropdown(null)}
                          className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold text-[#292821] hover:text-[#B87A10] hover:bg-[#F7F1E5] transition-colors"
                        >
                          <span>Про пасіку</span>
                          <IconChevronRight className="w-3.5 h-3.5 opacity-50" />
                        </Link>
                        <Link
                          to="/about#story"
                          onClick={() => setActiveDropdown(null)}
                          className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold text-[#292821] hover:text-[#B87A10] hover:bg-[#F7F1E5] transition-colors"
                        >
                          <span>Наша історія</span>
                          <IconChevronRight className="w-3.5 h-3.5 opacity-50" />
                        </Link>
                        <Link
                          to="/delivery"
                          onClick={() => setActiveDropdown(null)}
                          className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold text-[#292821] hover:text-[#B87A10] hover:bg-[#F7F1E5] transition-colors"
                        >
                          <span>Доставка та оплата</span>
                          <IconChevronRight className="w-3.5 h-3.5 opacity-50" />
                        </Link>
                        <Link
                          to="/contacts"
                          onClick={() => setActiveDropdown(null)}
                          className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold text-[#292821] hover:text-[#B87A10] hover:bg-[#F7F1E5] transition-colors"
                        >
                          <span>Контакти</span>
                          <IconChevronRight className="w-3.5 h-3.5 opacity-50" />
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
                    `relative py-1.5 transition-colors duration-150 ${
                      isActive
                        ? "text-honey font-semibold after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-4 after:h-0.5 after:bg-honey after:rounded-full"
                        : "text-[#292821]/80 hover:text-honey"
                    }`
                  }
                >
                  {n.label}
                </NavLink>
              );
            })}
          </nav>

          {/* 3. DESKTOP RIGHT CONTROLS: [Відстежити] | [Телефон / Месенджери ▾] | [Кошик] */}
          <div className="hidden lg:flex items-center gap-4 xl:gap-5 shrink-0">
            
            {/* 3.1 — Clean Track Order Button */}
            <NavLink
              to="/track-order"
              className={({ isActive }) =>
                `inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-150 active:scale-95 shrink-0 ${
                  isActive
                    ? "bg-honey text-white font-bold shadow-sm"
                    : "text-[#292821]/85 hover:text-honey border border-[#DECDB3] bg-[#FAF5EB] shadow-2xs hover:border-honey/60"
                }`
              }
              title="Перевірити статус замовлення"
            >
              <IconTruck className="w-3.5 h-3.5 shrink-0 opacity-85" />
              <span>Відстежити</span>
            </NavLink>

            {/* 3.2 — Phone & Messengers Popover (Solid Warm Ivory Dropdown) */}
            <div
              className="relative py-2"
              onMouseEnter={() => handleMouseEnter("contact")}
              onMouseLeave={handleMouseLeave}
            >
              <a
                href={`tel:${phone.replace(/\s+/g, "")}`}
                className="inline-flex items-center gap-1.5 text-xs xl:text-sm font-semibold py-1.5 text-[#292821]/85 hover:text-honey transition-colors"
                title="Зателефонувати або обрати месенджер"
              >
                <IconPhone className="w-3.5 h-3.5 text-honey shrink-0" />
                <span className="whitespace-nowrap">{phone}</span>
                {configuredSocials.length > 0 && (
                  <IconChevronDown
                    className={`w-3 h-3 opacity-60 transition-transform duration-200 ${
                      activeDropdown === "contact" ? "rotate-180 text-honey" : ""
                    }`}
                  />
                )}
              </a>

              {/* Contact Dropdown Popover: 100% Opaque Solid Warm Ivory Card */}
              {configuredSocials.length > 0 && (
                <div
                  className={`absolute right-0 top-full pt-2 transition-all duration-150 z-50 ${
                    activeDropdown === "contact"
                      ? "opacity-100 visible translate-y-0 pointer-events-auto"
                      : "opacity-0 invisible translate-y-1 pointer-events-none"
                  }`}
                >
                  <div
                    className="bg-[#FFFDF8] site-dropdown-solid border border-[#E2D6C0] rounded-2xl p-2.5 shadow-[0_18px_45px_rgba(41,40,33,0.16)] min-w-[210px] text-[#292821] space-y-1"
                    style={{
                      backgroundColor: "#FFFDF8",
                      opacity: 1,
                      backdropFilter: "none",
                      WebkitBackdropFilter: "none",
                    }}
                  >
                    <div className="text-[10px] uppercase tracking-wider font-bold text-[#8C6D46] px-2.5 pt-1 pb-0.5">
                      Швидкий зв'язок
                    </div>
                    <a
                      href={`tel:${phone.replace(/\s+/g, "")}`}
                      className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-semibold rounded-xl text-[#292821] hover:text-[#B87A10] hover:bg-[#F7F1E5] transition-colors"
                    >
                      <div className="w-6 h-6 rounded-lg bg-[#F6EBD3] flex items-center justify-center text-honey shrink-0">
                        <IconPhone className="w-3.5 h-3.5" />
                      </div>
                      <span>{phone}</span>
                    </a>

                    <div className="h-px bg-[#E8DEC8] my-1" />

                    <div className="text-[10px] uppercase tracking-wider font-bold text-[#8C6D46] px-2.5 pt-0.5 pb-0.5">
                      Месенджери та соцмережі
                    </div>
                    {configuredSocials.map((item) => (
                      <a
                        key={item.key}
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2.5 px-2.5 py-1.5 text-xs font-medium rounded-xl text-[#292821]/80 hover:text-[#B87A10] hover:bg-[#F7F1E5] transition-colors"
                      >
                        <div className="w-6 h-6 rounded-lg bg-[#F2E8D5] flex items-center justify-center shrink-0">
                          {item.icon}
                        </div>
                        <span>{item.label}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 3.3 — Shopping Cart Link (Clean & Direct) */}
            <Link
              to="/cart"
              className="inline-flex items-center gap-2 text-[#292821] hover:text-honey transition-colors duration-150 active:scale-95 shrink-0"
              aria-label={`Кошик покупок: ${count} товарів на суму ${subtotal} грн`}
            >
              <div className="relative flex items-center justify-center p-1">
                <IconCart className="w-5 h-5 shrink-0" />
                {count > 0 && (
                  <span className="absolute -top-1 -right-2 bg-gradient-to-r from-honey to-accent text-[#292821] font-bold text-[10px] rounded-full min-w-4 h-4 px-1 flex items-center justify-center shadow-xs">
                    {count}
                  </span>
                )}
              </div>
              {count > 0 && (
                <span className="text-xs font-semibold whitespace-nowrap hidden xl:inline ml-0.5">
                  {subtotal} грн
                </span>
              )}
            </Link>
          </div>

          {/* 4. MOBILE RIGHT CONTROLS: Only Cart & Hamburger (Clean Solid Bar) */}
          <div className="flex items-center gap-1.5 sm:gap-2 lg:hidden">
            {/* Dynamic Mobile Cart */}
            <Link
              to="/cart"
              className="p-2 text-[#292821] hover:text-honey transition-colors active:scale-95"
              aria-label={`Кошик покупок (${count})`}
            >
              <div className="relative flex items-center justify-center">
                <IconCart className="w-5 h-5" />
                {count > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-gradient-to-r from-honey to-accent text-[#292821] font-bold text-[10px] rounded-full min-w-4 h-4 px-1 flex items-center justify-center shadow-xs">
                    {count}
                  </span>
                )}
              </div>
            </Link>

            {/* Mobile Menu Hamburger Button */}
            <button
              type="button"
              className="p-2 text-[#292821] hover:text-honey transition-colors active:scale-95"
              onClick={() => setOpen((prev) => !prev)}
              aria-label={open ? "Закрити меню" : "Відкрити меню навігації"}
              aria-expanded={open}
            >
              {open ? <IconClose className="w-6 h-6" /> : <IconMenu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* ==============================================================
          5. MOBILE NAVIGATION DRAWER
          - Fully opaque warm cream (#FAF5EB) background so hero photo
            does NOT bleed through and all text is 100% readable.
          - Accordions for Каталог, Подарункові бокси, and Про пасіку.
          - Direct access to Tracking, Phone, and Admin-Configured Socials.
          - High touch target convenience (min 48px height).
          ============================================================== */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden animate-fade-in">
          {/* Backdrop Overlay (Clean dim, no blur) */}
          <div
            className="fixed inset-0 bg-[#17120A]/55 transition-opacity"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          {/* Slide-in Sheet: Solid Warm Natural Beige (100% Opaque) */}
          <div
            className="fixed inset-y-0 right-0 max-w-sm w-full bg-[#FAF5EB] shadow-2xl border-l border-[#E2D6C0] flex flex-col z-50 overflow-y-auto"
            style={{
              backgroundColor: "#FAF5EB",
              opacity: 1,
              backdropFilter: "none",
              WebkitBackdropFilter: "none",
            }}
          >
            
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#E2D6C0] bg-[#FAF5EB]">
              <div className="flex flex-col">
                <span className="font-serif text-xl font-bold text-[#292821]">
                  Honey Pasika
                </span>
                <span className="text-[9px] tracking-[0.2em] uppercase font-semibold text-[#8C6D46] mt-0.5">
                  Сімейна пасіка
                </span>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-[#292821]/70 hover:text-[#292821] hover:bg-[#EFE5D2] transition-colors"
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
                  `flex items-center justify-between min-h-12 px-3.5 rounded-xl text-base font-semibold transition-all ${
                    isActive
                      ? "bg-[#EFE5D2] text-[#B87A10] font-bold"
                      : "text-[#292821]/85 hover:bg-[#EFE5D2] hover:text-[#292821]"
                  }`
                }
              >
                <span>Головна</span>
                <IconChevronRight className="w-4 h-4 opacity-40" />
              </NavLink>

              {/* Catalog Accordion */}
              <div className="space-y-1">
                <div className="flex items-center justify-between rounded-xl hover:bg-[#EFE5D2] transition-colors min-h-12">
                  <NavLink
                    to="/catalog"
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      `flex-1 py-3 px-3.5 text-base font-semibold transition-all ${
                        isActive ? "text-[#B87A10] font-bold" : "text-[#292821]/85"
                      }`
                    }
                  >
                    Каталог
                  </NavLink>
                  <button
                    type="button"
                    onClick={() => toggleMobileGroup("catalog")}
                    className="p-3 text-[#292821]/60 hover:text-[#292821] min-w-12 flex items-center justify-center"
                    aria-label="Розгорнути категорії каталогу"
                  >
                    <IconChevronDown
                      className={`w-4 h-4 transition-transform duration-200 ${
                        expandedMobile === "catalog" ? "rotate-180 text-honey" : ""
                      }`}
                    />
                  </button>
                </div>

                {expandedMobile === "catalog" && (
                  <div className="pl-3 pr-2 py-1 space-y-1 bg-[#F2E8D5] rounded-xl mb-1.5">
                    <Link
                      to="/catalog"
                      onClick={() => setOpen(false)}
                      className="block py-2.5 px-3 text-xs font-bold text-[#B87A10] rounded-lg hover:bg-[#EAE0CB] transition-colors"
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
                          className="block py-2.5 px-3 text-xs font-medium text-[#292821]/85 hover:text-[#B87A10] rounded-lg hover:bg-[#EAE0CB] transition-colors"
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
                <div className="flex items-center justify-between rounded-xl hover:bg-[#EFE5D2] transition-colors min-h-12">
                  <NavLink
                    to="/gift-boxes"
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      `flex-1 py-3 px-3.5 text-base font-semibold transition-all ${
                        isActive ? "text-[#B87A10] font-bold" : "text-[#292821]/85"
                      }`
                    }
                  >
                    Подарункові бокси
                  </NavLink>
                  <button
                    type="button"
                    onClick={() => toggleMobileGroup("gift-boxes")}
                    className="p-3 text-[#292821]/60 hover:text-[#292821] min-w-12 flex items-center justify-center"
                    aria-label="Розгорнути подарункові бокси"
                  >
                    <IconChevronDown
                      className={`w-4 h-4 transition-transform duration-200 ${
                        expandedMobile === "gift-boxes" ? "rotate-180 text-honey" : ""
                      }`}
                    />
                  </button>
                </div>

                {expandedMobile === "gift-boxes" && (
                  <div className="pl-3 pr-2 py-1 space-y-1 bg-[#F2E8D5] rounded-xl mb-1.5">
                    <Link
                      to="/gift-boxes"
                      onClick={() => setOpen(false)}
                      className="block py-2.5 px-3 text-xs font-bold text-[#B87A10] rounded-lg hover:bg-[#EAE0CB] transition-colors"
                    >
                      Всі подарункові бокси
                    </Link>
                    {giftBoxes.map((box) => (
                      <Link
                        key={box.id || box.slug}
                        to={`/product/${box.slug}`}
                        onClick={() => setOpen(false)}
                        className="flex items-center justify-between py-2.5 px-3 text-xs font-medium text-[#292821]/85 hover:text-[#B87A10] rounded-lg hover:bg-[#EAE0CB] transition-colors"
                      >
                        <span className="truncate pr-2">{box.name}</span>
                        <span className="text-[11px] font-bold text-[#292821]/60">{box.price} грн</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* About Accordion */}
              <div className="space-y-1">
                <div className="flex items-center justify-between rounded-xl hover:bg-[#EFE5D2] transition-colors min-h-12">
                  <NavLink
                    to="/about"
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      `flex-1 py-3 px-3.5 text-base font-semibold transition-all ${
                        isActive ? "text-[#B87A10] font-bold" : "text-[#292821]/85"
                      }`
                    }
                  >
                    Про пасіку
                  </NavLink>
                  <button
                    type="button"
                    onClick={() => toggleMobileGroup("about")}
                    className="p-3 text-[#292821]/60 hover:text-[#292821] min-w-12 flex items-center justify-center"
                    aria-label="Розгорнути сторінки про пасіку"
                  >
                    <IconChevronDown
                      className={`w-4 h-4 transition-transform duration-200 ${
                        expandedMobile === "about" ? "rotate-180 text-honey" : ""
                      }`}
                    />
                  </button>
                </div>

                {expandedMobile === "about" && (
                  <div className="pl-3 pr-2 py-1 space-y-1 bg-[#F2E8D5] rounded-xl mb-1.5">
                    <Link
                      to="/about"
                      onClick={() => setOpen(false)}
                      className="block py-2.5 px-3 text-xs font-medium text-[#292821]/85 hover:text-[#B87A10] rounded-lg hover:bg-[#EAE0CB] transition-colors"
                    >
                      Про пасіку
                    </Link>
                    <Link
                      to="/about#story"
                      onClick={() => setOpen(false)}
                      className="block py-2.5 px-3 text-xs font-medium text-[#292821]/85 hover:text-[#B87A10] rounded-lg hover:bg-[#EAE0CB] transition-colors"
                    >
                      Наша історія
                    </Link>
                    <Link
                      to="/delivery"
                      onClick={() => setOpen(false)}
                      className="block py-2.5 px-3 text-xs font-medium text-[#292821]/85 hover:text-[#B87A10] rounded-lg hover:bg-[#EAE0CB] transition-colors"
                    >
                      Доставка та оплата
                    </Link>
                    <Link
                      to="/contacts"
                      onClick={() => setOpen(false)}
                      className="block py-2.5 px-3 text-xs font-medium text-[#292821]/85 hover:text-[#B87A10] rounded-lg hover:bg-[#EAE0CB] transition-colors"
                    >
                      Контакти
                    </Link>
                  </div>
                )}
              </div>

              {/* Utility Track Link */}
              <NavLink
                to="/track-order"
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex items-center justify-between min-h-12 px-3.5 rounded-xl text-sm font-semibold transition-all mt-3 border ${
                    isActive
                      ? "bg-[#F7EACD] text-[#B87A10] border-[#D99A19]/40 font-bold"
                      : "text-[#292821]/85 border-[#DECDB3] bg-[#F4EBD8] hover:bg-[#EFE5D2]"
                  }`
                }
              >
                <span className="flex items-center gap-2.5">
                  <IconTruck className="w-4 h-4 text-honey" />
                  <span>Відстежити замовлення</span>
                </span>
                <IconChevronRight className="w-4 h-4 opacity-50" />
              </NavLink>
            </nav>

            {/* Mobile Drawer Footer: Phone + Admin-Configured Social Channels */}
            <div className="p-4 sm:p-5 border-t border-[#E2D6C0] bg-[#F5EDDE] space-y-3.5">
              {phone && (
                <a
                  href={`tel:${phone.replace(/\s+/g, "")}`}
                  className="flex items-center gap-3 p-3 rounded-xl bg-[#FFFDF8] border border-[#E2D6C0] text-sm font-bold text-[#292821] shadow-2xs hover:border-honey/40 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#F6EBD3] flex items-center justify-center text-honey shrink-0">
                    <IconPhone className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-medium text-[#8C6D46] uppercase tracking-wider">
                      Зв'язок з пасікою
                    </span>
                    <span>{phone}</span>
                  </div>
                </a>
              )}

              {configuredSocials.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-[#8C6D46] uppercase tracking-wider mb-2">
                    Ми у соцмережах та месенджерах:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {configuredSocials.map((item) => (
                      <a
                        key={item.key}
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-[#FFFDF8] border border-[#E2D6C0] text-xs font-semibold text-[#292821]/85 hover:text-honey hover:border-honey/40 transition-colors shadow-2xs"
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
