import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import RealisticBee from "./RealisticBee";
import { Settings, subscribe } from "../data/db";

export default function Footer() {
  const [s, setS] = useState(() => Settings.get());

  useEffect(() => {
    Settings.fetch().then((data) => data && setS(data));
    return subscribe(() => setS(Settings.get()));
  }, []);

  const phone = s?.contacts?.phone || "+380 67 835 23 11";
  const email = s?.contacts?.email || "hello@pasika-honey.ua";

  return (
    <footer className="bg-[#171512] text-[#FFFDF8] border-t border-gold/20 mt-16 sm:mt-24 relative overflow-hidden">
      {/* Ambient warm glow in top-right */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="container-p py-12 md:py-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12 relative z-10">
        {/* Brand Column */}
        <div className="lg:col-span-4">
          <Link to="/" className="font-serif text-2xl font-bold flex items-center gap-2.5 text-white">
            <RealisticBee size={28} depth="near" />
            <span>Honey Pasika</span>
          </Link>
          <p className="text-white/70 text-xs sm:text-sm leading-relaxed mt-3.5 max-w-sm">
            Власна сімейна пасіка на Прикарпатті (с. Новоселиця). Натуральний мед, соти, авторські крем-меди та крафтові подарункові бокси.
          </p>
          <div className="mt-5 flex items-center gap-3 text-xs text-white/50">
            <span>🌿 Натуральні продукти</span>
            <span>•</span>
            <span>🚚 Доставка по Україні</span>
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
            <li>
              <a href={`tel:${phone.replace(/\s+/g, "")}`} className="hover:text-accent transition-colors">
                {phone}
              </a>
            </li>
            <li>
              <a href={`mailto:${email}`} className="hover:text-accent transition-colors">
                {email}
              </a>
            </li>
            <li className="flex gap-4 pt-2">
              <a
                href={
                  s?.contacts?.tiktok
                    ? s.contacts.tiktok.startsWith("http")
                      ? s.contacts.tiktok
                      : `https://www.tiktok.com/${s.contacts.tiktok.startsWith("@") ? "" : "@"}${s.contacts.tiktok}`
                    : "https://www.tiktok.com/@honey.dsv"
                }
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-accent hover:text-ink text-xs font-semibold transition-all"
              >
                TikTok ↗
              </a>
              <a
                href={
                  s?.contacts?.telegram
                    ? s.contacts.telegram.startsWith("http")
                      ? s.contacts.telegram
                      : `https://t.me/${s.contacts.telegram.replace(/^@/, "")}`
                    : "https://t.me/honey_dsv"
                }
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-accent hover:text-ink text-xs font-semibold transition-all"
              >
                Telegram ↗
              </a>
            </li>
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
