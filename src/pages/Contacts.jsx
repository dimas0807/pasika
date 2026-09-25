import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Settings, subscribe } from "../data/db";

export default function Contacts() {
  const [s, setS] = useState(() => Settings.get());

  useEffect(() => {
    Settings.fetch().then((data) => data && setS(data));
    return subscribe(() => setS(Settings.get()));
  }, []);

  const phone = s?.contacts?.phone || "+380 67 835 23 11";
  const email = s?.contacts?.email || "hello@pasika-honey.ua";
  const tiktok = s?.contacts?.tiktok || "@honey.dsv";
  const telegram = s?.contacts?.telegram || "@pasika_honey";

  return (
    <div className="container-p py-10 md:py-16 max-w-3xl">
      <nav className="text-xs text-ink/50 mb-3 flex items-center gap-1.5">
        <Link to="/" className="hover:text-honey">Головна</Link>
        <span>/</span>
        <span className="text-ink/80 font-medium">Контакти</span>
      </nav>

      <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-ink">
        Контакти
      </h1>
      <p className="text-ink/65 text-sm sm:text-base mt-2">
        Ми завжди на зв'язку! Задайте питання щодо продукції, гуртових замовлень або персонального оформлення боксів.
      </p>

      <div className="mt-8 card p-6 sm:p-8 bg-[#FAF6EE] border border-gold/30 shadow-sm space-y-4">
        <ContactRow
          icon="📞"
          label="Телефон"
          value={phone}
          link={`tel:${phone.replace(/\s+/g, "")}`}
          btnText="Зателефонувати"
        />
        <ContactRow
          icon="📧"
          label="Електронна пошта"
          value={email}
          link={`mailto:${email}`}
          btnText="Написати"
        />
        <ContactRow
          icon="📱"
          label="TikTok"
          value={tiktok}
          link="https://www.tiktok.com/@honey.dsv"
          btnText="Перейти ↗"
          external
        />
        <ContactRow
          icon="💬"
          label="Telegram"
          value={telegram}
          link="https://t.me"
          btnText="Відкрити чат ↗"
          external
        />
      </div>

      <div className="mt-8 p-5 rounded-2xl bg-white border border-ink/10 flex items-center gap-4">
        <span className="text-3xl">⏰</span>
        <div>
          <h4 className="font-serif font-bold text-sm text-ink">Графік прийому замовлень:</h4>
          <p className="text-xs text-ink/60 mt-0.5">
            Онлайн-замовлення на сайті приймаються цілодобово 24/7. Відправка посилок — щодня з понеділка по суботу.
          </p>
        </div>
      </div>
    </div>
  );
}

function ContactRow({ icon, label, value, link, btnText, external }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-white border border-ink/5">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <div className="text-xs text-ink/50 font-medium">{label}</div>
          <div className="font-bold text-sm text-ink">{value}</div>
        </div>
      </div>
      <a
        href={link}
        target={external ? "_blank" : undefined}
        rel={external ? "noreferrer" : undefined}
        className="btn-secondary text-xs py-2 px-4 self-start sm:self-auto"
      >
        {btnText}
      </a>
    </div>
  );
}
