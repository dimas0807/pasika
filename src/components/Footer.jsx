import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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

  const storeName = s?.store?.name || "М'ясний рай у Галинки";
  const storeDesc =
    s?.store?.description ||
    s?.store?.tagline ||
    "Домашні ковбаси, копченості на дровах, соковита шинка, генеральське сало та паштети власного приготування. Готуємо з любов'ю за перевіреними домашніми рецептами.";
  const phone = (s?.contacts?.phone || s?.store?.phone || "068 025 78 77").trim();
  const rawPhone = phone.replace(/\D/g, "");
  const telHref = rawPhone ? `tel:+${rawPhone.startsWith("38") ? rawPhone : "38" + rawPhone}` : "tel:+380680257877";

  const activeSocials = [
    { key: "tiktok", label: "TikTok" },
    { key: "viber", label: "Viber" },
    { key: "telegram", label: "Telegram" },
    { key: "instagram", label: "Instagram" },
    { key: "facebook", label: "Facebook" },
  ]
    .map((item) => {
      const raw = s?.contacts?.[item.key] || (item.key === "tiktok" ? "@kopchonosti777" : item.key === "viber" ? "0680257877" : "");
      return { ...item, url: getSocialUrl(item.key, raw) };
    })
    .filter((item) => Boolean(item.url));

  const renderSocialIcon = (key) => {
    switch (key) {
      case "telegram":
        return <IconTelegram className="w-3.5 h-3.5 text-[#2AABEE]" />;
      case "viber":
        return <IconViber className="w-3.5 h-3.5 text-[#8E7EFA]" />;
      case "instagram":
        return <IconInstagram className="w-3.5 h-3.5 text-[#E4405F]" />;
      case "facebook":
        return <IconFacebook className="w-3.5 h-3.5 text-[#1877F2]" />;
      case "tiktok":
        return <IconTikTok className="w-3.5 h-3.5 text-white" />;
      default:
        return null;
    }
  };

  return (
    <footer className="bg-[#100F0E] text-[#F4EFEA] border-t border-[#2A241F] mt-16 sm:mt-24 relative overflow-hidden">
      {/* Ambient warm smoke/glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-bronze/5 rounded-full blur-3xl pointer-events-none" />

      <div className="container-p py-12 md:py-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12 relative z-10">
        {/* Brand Column */}
        <div className="lg:col-span-4">
          <Link to="/" className="flex items-center gap-3">
            <span className="text-3xl">🥩</span>
            <div>
              <div className="font-serif text-xl sm:text-2xl font-bold text-[#F4EFEA] tracking-tight leading-none">
                М'ЯСНИЙ РАЙ
              </div>
              <div className="text-[11px] uppercase tracking-widest font-bold text-bronze mt-1">
                У Галинки
              </div>
            </div>
          </Link>
          <p className="text-[#A3988E] text-xs sm:text-sm leading-relaxed mt-4 max-w-sm">
            {storeDesc}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-[#8C8074]">
            <span className="inline-flex items-center gap-1.5">
              <IconShieldCheck className="w-4 h-4 text-bronze" />
              <span>Копчення на натуральних дровах</span>
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-1.5">
              <IconTruck className="w-4 h-4 text-bronze" />
              <span>Нова Пошта по всій Україні</span>
            </span>
          </div>
        </div>

        {/* Store Links */}
        <div className="lg:col-span-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-bronze mb-4">
            Каталог смаколиків
          </h4>
          <ul className="space-y-2.5 text-xs sm:text-sm text-[#C8BFB5]">
            <li>
              <Link to="/catalog" className="hover:text-bronze transition-colors">
                Всі домашні продукти
              </Link>
            </li>
            <li>
              <Link to="/catalog?category=domashni-kovbasy" className="hover:text-bronze transition-colors">
                Домашні ковбаси
              </Link>
            </li>
            <li>
              <Link to="/catalog?category=kopchene-myaso" className="hover:text-bronze transition-colors">
                Копчена шинка та балик
              </Link>
            </li>
            <li>
              <Link to="/catalog?category=salo" className="hover:text-bronze transition-colors">
                Генеральське сало
              </Link>
            </li>
            <li>
              <Link to="/track-order" className="hover:text-bronze transition-colors">
                Відстежити своє замовлення
              </Link>
            </li>
          </ul>
        </div>

        {/* About Links */}
        <div className="lg:col-span-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-bronze mb-4">
            Покупцям
          </h4>
          <ul className="space-y-2.5 text-xs sm:text-sm text-[#C8BFB5]">
            <li>
              <Link to="/about" className="hover:text-bronze transition-colors">
                Про Галинку
              </Link>
            </li>
            <li>
              <Link to="/delivery" className="hover:text-bronze transition-colors">
                Доставка Новою Поштою
              </Link>
            </li>
            <li>
              <Link to="/contacts" className="hover:text-bronze transition-colors">
                Контакти та зв'язок
              </Link>
            </li>
            <li>
              <Link to="/cart" className="hover:text-bronze transition-colors">
                Мій кошик
              </Link>
            </li>
          </ul>
        </div>

        {/* Contacts & Socials */}
        <div className="lg:col-span-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-bronze mb-4">
            Зв'язок з Галинкою
          </h4>
          <ul className="space-y-2.5 text-xs sm:text-sm text-[#C8BFB5]">
            <li>
              <a href={telHref} className="hover:text-bronze font-bold text-sm text-[#F4EFEA] transition-colors">
                {phone}
              </a>
            </li>
            <li>
              <span className="text-xs text-[#8C8074]">Швидкі консультації та прийом замовлень</span>
            </li>
            {activeSocials.length > 0 && (
              <li className="flex flex-wrap gap-2 pt-2">
                {activeSocials.map((item) => (
                  <a
                    key={item.key}
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#221E1A] hover:bg-[#2F2923] border border-[#352D26] hover:border-bronze text-xs font-semibold text-[#E4DDD5] transition-all"
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
      <div className="border-t border-[#241F1A] py-5">
        <div className="container-p flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#7A6F64] text-center sm:text-left">
          <div>© {new Date().getFullYear()} М'ясний рай у Галинки. Всі права захищено.</div>
          <div>Домашні копченості на дровах з любов'ю та турботою</div>
        </div>
      </div>
    </footer>
  );
}
