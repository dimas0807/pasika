import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Settings, subscribe } from "../data/db";
import { getMapsUrl, getSocialUrl } from "../utils/contacts";

export default function Contacts() {
  const [s, setS] = useState(() => Settings.get());

  useEffect(() => {
    Settings.fetch().then((data) => data && setS(data));
    return subscribe(() => setS(Settings.get()));
  }, []);

  const phone = (s?.contacts?.phone || s?.store?.phone || "").trim();
  const email = (s?.contacts?.email || s?.store?.email || "").trim();
  const telegram = (s?.contacts?.telegram || "").trim();
  const viber = (s?.contacts?.viber || "").trim();
  const instagram = (s?.contacts?.instagram || "").trim();
  const facebook = (s?.contacts?.facebook || "").trim();
  const tiktok = (s?.contacts?.tiktok || "").trim();

  const pickupAddress = (s?.contacts?.pickupAddress || "").trim();
  const mapsUrl = getMapsUrl(s?.contacts?.pickupLat, s?.contacts?.pickupLng);

  const contactItems = [];

  if (phone) {
    contactItems.push({
      key: "phone",
      icon: "📞",
      label: "Телефон",
      value: phone,
      link: `tel:${phone.replace(/\s+/g, "")}`,
      btnText: "Зателефонувати",
    });
  }

  if (email) {
    contactItems.push({
      key: "email",
      icon: "📧",
      label: "Електронна пошта",
      value: email,
      link: `mailto:${email}`,
      btnText: "Написати",
    });
  }

  if (telegram) {
    const url = getSocialUrl("telegram", telegram);
    if (url) {
      contactItems.push({
        key: "telegram",
        icon: "💬",
        label: "Telegram",
        value: telegram,
        link: url,
        btnText: "Відкрити чат ↗",
        external: true,
      });
    }
  }

  if (viber) {
    const url = getSocialUrl("viber", viber);
    if (url) {
      contactItems.push({
        key: "viber",
        icon: "💜",
        label: "Viber",
        value: viber,
        link: url,
        btnText: "Написати у Viber ↗",
        external: true,
      });
    }
  }

  if (instagram) {
    const url = getSocialUrl("instagram", instagram);
    if (url) {
      contactItems.push({
        key: "instagram",
        icon: "📸",
        label: "Instagram",
        value: instagram,
        link: url,
        btnText: "Перейти ↗",
        external: true,
      });
    }
  }

  if (facebook) {
    const url = getSocialUrl("facebook", facebook);
    if (url) {
      contactItems.push({
        key: "facebook",
        icon: "👥",
        label: "Facebook",
        value: facebook,
        link: url,
        btnText: "Перейти ↗",
        external: true,
      });
    }
  }

  if (tiktok) {
    const url = getSocialUrl("tiktok", tiktok);
    if (url) {
      contactItems.push({
        key: "tiktok",
        icon: "📱",
        label: "TikTok",
        value: tiktok,
        link: url,
        btnText: "Перейти ↗",
        external: true,
      });
    }
  }

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

      {/* Main contacts list */}
      {contactItems.length > 0 && (
        <div className="mt-8 card p-6 sm:p-8 bg-[#FAF6EE] border border-gold/30 shadow-sm space-y-4">
          {contactItems.map((item) => (
            <ContactRow
              key={item.key}
              icon={item.icon}
              label={item.label}
              value={item.value}
              link={item.link}
              btnText={item.btnText}
              external={item.external}
            />
          ))}
        </div>
      )}

      {/* Pickup Section (Самовивіз) */}
      {pickupAddress && (
        <div className="mt-8 card p-6 sm:p-7 bg-[#FAF6EE] border border-gold/30 shadow-sm">
          <div className="flex items-start gap-3.5">
            <span className="text-2xl mt-0.5">📍</span>
            <div className="flex-1 min-w-0">
              <div className="text-xs uppercase tracking-wider font-bold text-honey">Самовивіз</div>
              <h3 className="font-serif text-lg font-bold text-ink mt-0.5">Адреса самовивозу</h3>
              <p className="text-sm sm:text-base font-semibold text-ink mt-1.5 leading-relaxed">
                {pickupAddress}
              </p>
              {mapsUrl && (
                <div className="mt-4">
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-primary text-xs py-2 px-4 inline-flex items-center gap-1.5 shadow-2xs font-bold"
                  >
                    <span>🗺️</span> Відкрити на карті
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Working Hours Banner */}
      <div className="mt-8 p-5 rounded-2xl bg-white border border-ink/10 flex items-center gap-4">
        <span className="text-3xl">⏰</span>
        <div>
          <h4 className="font-serif font-bold text-sm text-ink">Графік прийому замовлень:</h4>
          <p className="text-xs text-ink/60 mt-0.5">
            {s?.store?.workingHours
              ? `Години роботи: ${s.store.workingHours}. Онлайн-замовлення на сайті приймаються цілодобово 24/7.`
              : "Онлайн-замовлення на сайті приймаються цілодобово 24/7. Відправка посилок — щодня з понеділка по суботу."}
          </p>
        </div>
      </div>
    </div>
  );
}

function ContactRow({ icon, label, value, link, btnText, external }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-white border border-ink/5">
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-2xl shrink-0">{icon}</span>
        <div className="min-w-0">
          <div className="text-xs text-ink/50 font-medium">{label}</div>
          <div className="font-bold text-sm text-ink truncate">{value}</div>
        </div>
      </div>
      <a
        href={link}
        target={external ? "_blank" : undefined}
        rel={external ? "noreferrer" : undefined}
        className="btn-secondary text-xs py-2 px-4 self-start sm:self-auto shrink-0 font-semibold"
      >
        {btnText}
      </a>
    </div>
  );
}
