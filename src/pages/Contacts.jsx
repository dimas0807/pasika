import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Settings, subscribe } from "../data/db";
import { getMapsUrl, getSocialUrl } from "../utils/contacts";
import {
  IconPhone,
  IconMail,
  IconTelegram,
  IconViber,
  IconInstagram,
  IconFacebook,
  IconTikTok,
  IconMapPin,
  IconClock,
  IconExternalLink,
} from "../components/Icons";

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
      icon: <IconPhone className="w-5 h-5 text-amber-800" />,
      label: "Телефон",
      value: phone,
      link: `tel:${phone.replace(/\s+/g, "")}`,
      btnText: "Зателефонувати",
    });
  }

  if (email) {
    contactItems.push({
      key: "email",
      icon: <IconMail className="w-5 h-5 text-amber-800" />,
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
        icon: <IconTelegram className="w-5 h-5 text-[#2AABEE]" />,
        label: "Telegram",
        value: telegram,
        link: url,
        btnText: "Відкрити чат",
        external: true,
      });
    }
  }

  if (viber) {
    const url = getSocialUrl("viber", viber);
    if (url) {
      contactItems.push({
        key: "viber",
        icon: <IconViber className="w-5 h-5 text-[#7360F2]" />,
        label: "Viber",
        value: viber,
        link: url,
        btnText: "Написати у Viber",
        external: true,
      });
    }
  }

  if (instagram) {
    const url = getSocialUrl("instagram", instagram);
    if (url) {
      contactItems.push({
        key: "instagram",
        icon: <IconInstagram className="w-5 h-5 text-[#E4405F]" />,
        label: "Instagram",
        value: instagram,
        link: url,
        btnText: "Перейти",
        external: true,
      });
    }
  }

  if (facebook) {
    const url = getSocialUrl("facebook", facebook);
    if (url) {
      contactItems.push({
        key: "facebook",
        icon: <IconFacebook className="w-5 h-5 text-[#1877F2]" />,
        label: "Facebook",
        value: facebook,
        link: url,
        btnText: "Перейти",
        external: true,
      });
    }
  }

  if (tiktok) {
    const url = getSocialUrl("tiktok", tiktok);
    if (url) {
      contactItems.push({
        key: "tiktok",
        icon: <IconTikTok className="w-5 h-5 text-ink" />,
        label: "TikTok",
        value: tiktok,
        link: url,
        btnText: "Перейти",
        external: true,
      });
    }
  }

  return (
    <div className="container-p py-10 md:py-16 max-w-3xl">
      <nav className="text-xs text-ink/50 mb-3 flex items-center gap-1.5">
        <Link to="/" className="hover:text-honey transition-colors">Головна</Link>
        <span>/</span>
        <span className="text-ink/80 font-medium">Контакти</span>
      </nav>

      <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-ink">
        Контакти
      </h1>
      <p className="text-ink/65 text-sm sm:text-base mt-2 leading-relaxed">
        Ми завжди на зв'язку! Задайте питання щодо продукції, гуртових замовлень або персонального оформлення боксів.
      </p>

      {/* Main contacts list */}
      {contactItems.length > 0 && (
        <div className="mt-8 glass-card p-6 sm:p-8 space-y-3.5">
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
        <div className="mt-8 glass-card p-6 sm:p-7">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
              <IconMapPin className="w-6 h-6 text-amber-800" />
            </div>
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
                    className="btn-primary text-xs py-2 px-4 inline-flex items-center gap-1.5 font-bold"
                  >
                    <span>Відкрити на карті</span>
                    <IconExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Working Hours Banner */}
      <div className="mt-8 p-5 rounded-2xl glass-card flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
          <IconClock className="w-6 h-6 text-amber-800" />
        </div>
        <div>
          <h4 className="font-serif font-bold text-sm text-ink">Графік прийому замовлень:</h4>
          <p className="text-xs text-ink/65 mt-0.5 leading-relaxed">
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
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-white/80 border border-amber-900/10 shadow-2xs hover:border-amber-500/30 transition-all">
      <div className="flex items-center gap-3.5 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/15 flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div className="min-w-0">
          <div className="text-xs text-ink/50 font-medium">{label}</div>
          <div className="font-bold text-sm text-ink truncate">{value}</div>
        </div>
      </div>
      <a
        href={link}
        target={external ? "_blank" : undefined}
        rel={external ? "noreferrer" : undefined}
        className="btn-secondary text-xs py-2 px-4 self-start sm:self-auto shrink-0 font-semibold inline-flex items-center gap-1.5"
      >
        <span>{btnText}</span>
        {external && <IconExternalLink className="w-3 h-3 text-ink/50" />}
      </a>
    </div>
  );
}
