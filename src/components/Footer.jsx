import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Settings, subscribe } from "../data/db";

export default function Footer() {
  const [s, setS] = useState(() => Settings.get());

  useEffect(() => {
    Settings.fetch().then((data) => data && setS(data));
    return subscribe(() => setS(Settings.get()));
  }, []);

  return (
    <footer className="bg-ink text-cream mt-20">
      <div className="container-p py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <div className="font-serif text-xl font-bold flex items-center gap-2 mb-3">🐝 Honey Pasika</div>
          <p className="text-cream/60 text-sm leading-relaxed">
            Власна пасіка з натуральним медом та продуктами бджільництва. Робимо мед, який хочеться дарувати.
          </p>
        </div>
        <div>
          <div className="font-semibold mb-3">Магазин</div>
          <ul className="space-y-2 text-sm text-cream/70">
            <li><Link to="/catalog" className="hover:text-accent">Каталог</Link></li>
            <li><Link to="/gift-boxes" className="hover:text-accent">Подарункові бокси</Link></li>
            <li><Link to="/delivery" className="hover:text-accent">Доставка та оплата</Link></li>
            <li><Link to="/cart" className="hover:text-accent">Кошик</Link></li>
          </ul>
        </div>
        <div>
          <div className="font-semibold mb-3">Про нас</div>
          <ul className="space-y-2 text-sm text-cream/70">
            <li><Link to="/about" className="hover:text-accent">Про пасіку</Link></li>
            <li><Link to="/contacts" className="hover:text-accent">Контакти</Link></li>
            <li><Link to="/admin" className="hover:text-accent">Адмін-панель</Link></li>
          </ul>
        </div>
        <div>
          <div className="font-semibold mb-3">Контакти</div>
          <ul className="space-y-2 text-sm text-cream/70">
            <li>{s?.contacts?.phone}</li>
            <li>{s?.contacts?.email}</li>
            <li className="flex gap-3 pt-1">
              <a href="https://tiktok.com" target="_blank" rel="noreferrer" className="hover:text-accent">TikTok</a>
              <a href="https://t.me" target="_blank" rel="noreferrer" className="hover:text-accent">Telegram</a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-cream/10 py-4 text-center text-xs text-cream/40">
        © {new Date().getFullYear()} Honey Pasika — Власна пасіка
      </div>
    </footer>
  );
}
