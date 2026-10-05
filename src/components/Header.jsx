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
} from "./Icons";

const NAV = [
  { to: "/catalog", label: "Каталог", id: "catalog" },
  { to: "/gift-boxes", label: "Подарункові бокси", id: "gift-boxes" },
  { to: "/about", label: "Про Галинку", id: "about" },
  { to: "/delivery", label: "Доставка", id: "delivery" },
  { to: "/contacts", label: "Контакти", id: "contacts" },
];

export default function Header() {
  const { count, subtotal } = useCart();
  const [open, setOpen] = useState(false);
  const [s, setS] = useState(() => Settings.get());
  const [categories, setCategories] = useState(() => Categories.all());
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [scrolled, setScrolled] = useState(false);

  const closeTimeoutRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    Settings.fetch().then((data) => data && setS(data));
    Categories.fetchAll().then((data) => data && setCategories(data));
    return subscribe(() => {
      setS(Settings.get());
      setCategories(Categories.all());
    });
  }, []);

  const phone = (s?.contacts?.phone || s?.store?.phone || "068 025 78 77").trim();
  const rawPhone = phone.replace(/\D/g, "");
  const telHref = rawPhone ? `tel:+${rawPhone.startsWith("38") ? rawPhone : "38" + rawPhone}` : "tel:+380680257877";

  const viberRaw = (s?.contacts?.viber || "0680257877").trim();
  const viberUrl = getSocialUrl("viber", viberRaw) || "viber://chat?number=%2B380680257877";

  // Filter configured social links
  const configuredSocials = useMemo(() => {
    const list = [
      { key: "viber", label: "Viber", icon: <IconViber className="w-4 h-4 text-[#7360F2]" /> },
      { key: "tiktok", label: "TikTok", icon: <IconTikTok className="w-4 h-4 text-white" /> },
      { key: "telegram", label: "Telegram", icon: <IconTelegram className="w-4 h-4 text-[#2AABEE]" /> },
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

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile drawer on route change
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

  return (
    <>
      <header
        className={`sticky top-0 inset-x-0 z-40 bg-[#161413] border-b border-[#2C2621] transition-all duration-200 ${
          scrolled ? "shadow-[0_8px_24px_rgba(0,0,0,0.6)]" : "shadow-[0_2px_10px_rgba(0,0,0,0.3)]"
        }`}
      >
        <div className="container-p flex items-center justify-between h-18 sm:h-20">
          {/* Brand Logo */}
          <Link
            to="/"
            className="flex items-center gap-3 shrink-0 group transition-opacity hover:opacity-95"
            aria-label="М'ясний рай у Галинки — Головна"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-[#2E2721] to-[#1C1815] border border-bronze/40 flex items-center justify-center text-xl sm:text-2xl shadow-inner group-hover:border-bronze transition-colors">
              🥩
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-lg sm:text-xl font-bold tracking-tight leading-tight text-[#F4EFEA] group-hover:text-bronze transition-colors">
                М'ЯСНИЙ РАЙ
              </span>
              <span className="text-[10px] sm:text-[11px] tracking-[0.2em] uppercase font-bold text-bronze leading-none">
                У Галинки
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-7 text-[14px] font-medium text-[#D1C7BD]">
            {NAV.map((n) => {
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
                        `flex items-center gap-1.5 py-1.5 transition-colors duration-150 ${
                          isActive ? "text-bronze font-bold" : "text-[#D1C7BD] hover:text-bronze"
                        }`
                      }
                    >
                      <span>{n.label}</span>
                      <IconChevronDown
                        className={`w-3.5 h-3.5 opacity-60 transition-transform duration-200 ${
                          isOpen ? "rotate-180 text-bronze" : ""
                        }`}
                      />
                    </NavLink>

                    {/* Catalog Dropdown */}
                    <div
                      className={`absolute top-full left-0 pt-2 transition-all duration-150 z-50 ${
                        isOpen
                          ? "opacity-100 visible translate-y-0 pointer-events-auto"
                          : "opacity-0 invisible translate-y-1 pointer-events-none"
                      }`}
                    >
                      <div className="bg-[#1C1A18] border border-[#332C25] rounded-2xl p-2.5 shadow-[0_18px_45px_rgba(0,0,0,0.7)] min-w-[240px] text-[#F4EFEA] space-y-1">
                        <Link
                          to="/catalog"
                          onClick={() => setActiveDropdown(null)}
                          className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-bronze hover:bg-[#26221E] transition-colors"
                        >
                          <span>Всі домашні смаколики</span>
                          <IconChevronRight className="w-3.5 h-3.5 opacity-80" />
                        </Link>
                        <div className="h-px bg-[#2F2923] my-1" />
                        {categories.map((cat) => (
                          <Link
                            key={cat.slug}
                            to={`/catalog?category=${cat.slug}`}
                            onClick={() => setActiveDropdown(null)}
                            className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium text-[#D1C7BD] hover:text-bronze hover:bg-[#26221E] transition-colors"
                          >
                            <span className="flex items-center gap-2">
                              <span>{cat.icon || "🥩"}</span>
                              <span>{cat.name}</span>
                            </span>
                            <IconChevronRight className="w-3.5 h-3.5 opacity-35" />
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <NavLink
                  key={n.id}
                  to={n.to}
                  className={({ isActive }) =>
                    `py-1.5 transition-colors duration-150 ${
                      isActive ? "text-bronze font-bold" : "text-[#D1C7BD] hover:text-bronze"
                    }`
                  }
                >
                  {n.label}
                </NavLink>
              );
            })}
          </nav>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Phone CTA (Desktop) */}
            <a
              href={telHref}
              className="hidden xl:flex items-center gap-2 text-xs font-semibold text-[#D1C7BD] hover:text-bronze transition-colors px-2.5 py-1.5 rounded-lg border border-[#332C25] hover:border-bronze/40"
            >
              <IconPhone className="w-3.5 h-3.5 text-bronze" />
              <span>{phone}</span>
            </a>

            {/* Direct Viber CTA */}
            <a
              href={viberUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 bg-[#7360F2]/15 hover:bg-[#7360F2]/25 text-[#A599FA] hover:text-white border border-[#7360F2]/30 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 active:scale-95"
            >
              <IconViber className="w-4 h-4 text-[#8E7EFA]" />
              <span>Viber</span>
            </a>

            {/* Cart Button */}
            <Link
              to="/cart"
              className="relative flex items-center gap-2.5 bg-[#25211D] hover:bg-[#302B25] border border-[#3A332B] hover:border-bronze/50 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 text-[#F4EFEA] shadow-2xs group"
              aria-label="Кошик покупок"
            >
              <div className="relative">
                <IconCart className="w-4 h-4 sm:w-5 sm:h-5 text-bronze group-hover:scale-110 transition-transform" />
                {count > 0 && (
                  <span className="absolute -top-2.5 -right-2.5 bg-meat text-white font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                    {count}
                  </span>
                )}
              </div>
              <span className="hidden sm:inline-block font-bold">
                {subtotal > 0 ? `${subtotal} грн` : "Кошик"}
              </span>
            </Link>

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setOpen(!open)}
              className="lg:hidden p-2 rounded-xl bg-[#25211D] border border-[#3A332B] text-[#D1C7BD] hover:text-white focus:outline-none"
              aria-label={open ? "Закрити меню" : "Відкрити меню"}
            >
              {open ? <IconClose className="w-6 h-6" /> : <IconMenu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={() => setOpen(false)}
          />
          <div className="relative ml-auto w-full max-w-sm bg-[#161413] border-l border-[#2C2621] h-full flex flex-col p-6 overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between pb-5 border-b border-[#2C2621]">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">🥩</span>
                <div>
                  <div className="font-serif font-bold text-base text-[#F4EFEA]">М'ЯСНИЙ РАЙ</div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-bronze">У Галинки</div>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-2 rounded-xl bg-[#25211D] text-[#D1C7BD] hover:text-white"
              >
                <IconClose className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Navigation Links */}
            <nav className="py-5 space-y-2 border-b border-[#2C2621]">
              <NavLink
                to="/"
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `block px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    isActive ? "bg-bronze/15 text-bronze" : "text-[#D1C7BD] hover:bg-[#25211D]"
                  }`
                }
              >
                Головна
              </NavLink>
              <NavLink
                to="/catalog"
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `block px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    isActive ? "bg-bronze/15 text-bronze" : "text-[#D1C7BD] hover:bg-[#25211D]"
                  }`
                }
              >
                Каталог смаколиків
              </NavLink>
              <NavLink
                to="/about"
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `block px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    isActive ? "bg-bronze/15 text-bronze" : "text-[#D1C7BD] hover:bg-[#25211D]"
                  }`
                }
              >
                Про Галинку
              </NavLink>
              <NavLink
                to="/delivery"
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `block px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    isActive ? "bg-bronze/15 text-bronze" : "text-[#D1C7BD] hover:bg-[#25211D]"
                  }`
                }
              >
                Доставка Новою Поштою
              </NavLink>
              <NavLink
                to="/contacts"
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `block px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    isActive ? "bg-bronze/15 text-bronze" : "text-[#D1C7BD] hover:bg-[#25211D]"
                  }`
                }
              >
                Контакти
              </NavLink>
            </nav>

            {/* Quick Categories in Drawer */}
            <div className="py-4 border-b border-[#2C2621]">
              <div className="text-[11px] uppercase font-bold text-[#8C8074] tracking-wider mb-2.5 px-2">
                Категорії
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {categories.map((c) => (
                  <Link
                    key={c.slug}
                    to={`/catalog?category=${c.slug}`}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#1F1C19] text-xs font-medium text-[#C8BFB5] hover:text-bronze"
                  >
                    <span>{c.icon || "•"}</span>
                    <span className="truncate">{c.name}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Contact Actions in Drawer */}
            <div className="mt-auto pt-6 space-y-3">
              <a
                href={viberUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full btn-viber text-sm"
              >
                <IconViber className="w-5 h-5 text-white" />
                <span>Написати Галині у Viber</span>
              </a>

              <a
                href={telHref}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#24201C] border border-[#3A332B] text-sm font-bold text-[#F4EFEA] hover:border-bronze"
              >
                <IconPhone className="w-4 h-4 text-bronze" />
                <span>{phone}</span>
              </a>

              {/* TikTok link */}
              {configuredSocials.find((s) => s.key === "tiktok") && (
                <a
                  href={configuredSocials.find((s) => s.key === "tiktok").url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#000000] border border-[#2D2824] text-xs font-semibold text-white hover:border-[#FE2C55]"
                >
                  <IconTikTok className="w-4 h-4 text-white" />
                  <span>TikTok: @kopchonosti777</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
