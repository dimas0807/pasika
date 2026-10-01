import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import RealisticBee from "./RealisticBee";
import { Settings, subscribe } from "../data/db";
import { getSocialUrl } from "../utils/contacts";
import {
  IconShieldCheck,
  IconTruck,
  IconTelegram,
  IconViber,
  IconInstagram,
  IconFacebook,
  IconTikTok,
} from "./Icons";

export default function Footer() {
  const [s, setS] = useState(() => Settings.get());

  useEffect(() => {
    Settings.fetch().then((data) => data && setS(data));
    return subscribe(() => setS(Settings.get()));
  }, []);

  const storeName = s?.store?.name || "Honey Pasika";
  const storeDesc =
    s?.store?.description ||
    s?.store?.tagline ||
    "Власна сімейна пасіка на Прикарпатті (с. Новоселиця). Натуральний мед, соти, авторські крем-меди та крафтові подарункові бокси.";
  const phone = (s?.contacts?.phone || s?.store?.phone || "").trim();
  const email = (s?.contacts?.email || s?.store?.email || "").trim();

  const activeSocials = [
    { key: "telegram", label: "Telegram" },
    { key: "viber", label: "Viber" },
    { key: "instagram", label: "Instagram" },
    { key: "facebook", label: "Facebook" },
    { key: "tiktok", label: "TikTok" },
  ]
    .map((item) => ({ ...item, url: getSocialUrl(item.key, s?.contacts?.[item.key]) }))
    .filter((item) => Boolean(item.url));

  const renderSocialIcon = (key) => {
    switch (key) {
      case "telegram":
        return <IconTelegram className="w-3.5 h-3.5" />;
      case "viber":
        return <IconViber className="w-3.5 h-3.5" />;
      case "instagram":
        return <IconInstagram className="w-3.5 h-3.5" />;
      case "facebook":
        return <IconFacebook className="w-3.5 h-3.5" />;
      case "tiktok":
        return <IconTikTok className="w-3.5 h-3.5" />;
      default:
        return null;
    }
  };

  return (
    <footer className="bg-[#171512] text-[#FFFDF8] border-t border-gold/20 mt-16 sm:mt-24 relative overflow-hidden">
      {/* Ambient warm glow in top-right */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="container-p py-12 md:py-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12 relative z-10">
        {/* Brand Column */}
        <div className="lg:col-span-4">
          <Link to="/" className="font-serif text-2xl font-bold flex items-center gap-2.5 text-white">
            <RealisticBee size={28} depth="near" />
            <span>{storeName}</span>
          </Link>
          <p className="text-white/70 text-xs sm:text-sm leading-relaxed mt-3.5 max-w-sm">
            {storeDesc}
          </p>
          <div className="mt-5 flex items-center gap-3 text-xs text-white/60">
            <span className="inline-flex items-center gap-1.5">
              <IconShieldCheck className="w-3.5 h-3.5 text-accent" />
              <span>Натуральні продукти</span>
            </span>
            <span className="text-white/20">•</span>
            <span className="inline-flex items-center gap-1.5">
              <IconTruck className="w-3.5 h-3.5 text-accent" />
              <span>Доставка по Україні</span>
            </span>
          </div>
        </div>

        {/* Store Links */}
        <div className="lg:col-span-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-accent mb-4">
            Магазин
          </h4>
          <ul className="space-y-2.5 text-xs sm:text-sm text-white/75">
            <li>
              <Link to="/catalog" className="hover:text-accent transition-colors">
                Каталог продукції
              </Link>
            </li>
            <li>
              <Link to="/gift-boxes" className="hover:text-accent transition-colors">
                Подарункові бокси
              </Link>
            </li>
            <li>
              <Link to="/delivery" className="hover:text-accent transition-colors">
                Доставка та оплата
              </Link>
            </li>
            <li>
              <Link to="/track-order" className="hover:text-accent transition-colors">
                Відстежити замовлення
              </Link>
            </li>
            <li>
              <Link to="/cart" className="hover:text-accent transition-colors">
                Кошик замовлень
              </Link>
            </li>
          </ul>
        </div>

        {/* Company Links */}
        <div className="lg:col-span-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-accent mb-4">
            Пасіка
          </h4>
          <ul className="space-y-2.5 text-xs sm:text-sm text-white/75">
            <li>
              <Link to="/about" className="hover:text-accent transition-colors">
                Про нашу пасіку
              </Link>
            </li>
            <li>
              <Link to="/contacts" className="hover:text-accent transition-colors">
                Контакти
              </Link>
            </li>
          </ul>
        </div>

        {/* Contacts & Socials */}
        <div className="lg:col-span-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-accent mb-4">
            Зв'язок з нами
          </h4>
          <ul className="space-y-2.5 text-xs sm:text-sm text-white/75">
            {phone && (
              <li>
                <a href={`tel:${phone.replace(/\s+/g, "")}`} className="hover:text-accent transition-colors">
                  {phone}
                </a>
              </li>
            )}
            {email && (
              <li>
                <a href={`mailto:${email}`} className="hover:text-accent transition-colors">
                  {email}
                </a>
              </li>
            )}
            {activeSocials.length > 0 && (
              <li className="flex flex-wrap gap-2 pt-2">
                {activeSocials.map((item) => (
                  <a
                    key={item.key}
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-accent hover:text-ink text-xs font-semibold transition-all"
                  >
                    {renderSocialIcon(item.key)}
                    <span>{item.label}</span>
                  </a>
                ))}
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10 py-5">
        <div className="container-p flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/40 text-center sm:text-left">
          <div>© {new Date().getFullYear()} Honey Pasika. Всі права захищено.</div>
          <div>Зроблено з любов'ю до української природи та бджіл</div>
        </div>
      </div>
    </footer>
  );
}
