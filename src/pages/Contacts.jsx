import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Settings, subscribe } from "../data/db";
import { getSocialUrl } from "../utils/contacts";
import {
  IconPhone,
  IconTelegram,
  IconViber,
  IconInstagram,
  IconFacebook,
  IconTikTok,
  IconClock,
  IconTruck,
} from "../components/Icons";

export default function Contacts() {
  const [s, setS] = useState(() => Settings.get());

  useEffect(() => {
    Settings.fetch().then((data) => data && setS(data));
    return subscribe(() => setS(Settings.get()));
  }, []);

  const phone = (s?.contacts?.phone || s?.store?.phone || "068 025 78 77").trim();
  const rawPhone = phone.replace(/\D/g, "");
  const telHref = rawPhone ? `tel:+${rawPhone.startsWith("38") ? rawPhone : "38" + rawPhone}` : "tel:+380680257877";

  const viberRaw = (s?.contacts?.viber || "0680257877").trim();
  const viberUrl = getSocialUrl("viber", viberRaw) || "viber://chat?number=%2B380680257877";

  const tiktokRaw = (s?.contacts?.tiktok || "@kopchonosti777").trim();
  const tiktokUrl = getSocialUrl("tiktok", tiktokRaw) || "https://www.tiktok.com/@kopchonosti777";

  const telegramRaw = (s?.contacts?.telegram || "").trim();
  const telegramUrl = telegramRaw ? getSocialUrl("telegram", telegramRaw) : null;

  const instagramRaw = (s?.contacts?.instagram || "").trim();
  const instagramUrl = instagramRaw ? getSocialUrl("instagram", instagramRaw) : null;

  const facebookRaw = (s?.contacts?.facebook || "").trim();
  const facebookUrl = facebookRaw ? getSocialUrl("facebook", facebookRaw) : null;

  return (
    <div className="bg-[#121110] text-[#F4EFEA] min-h-[80vh] py-10 sm:py-16 md:py-20">
      <div className="container-p max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#26201B] border border-bronze/40 text-xs font-bold uppercase tracking-wider text-bronze mb-3">
            <span>🥩 Прямий зв'язок</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#F4EFEA] tracking-tight">
            Контакти Галинки
          </h1>
          <p className="text-[#A3988E] text-sm sm:text-base mt-2 max-w-lg mx-auto">
            Завжди раді відповісти на ваші запитання, проконсультувати щодо асортименту або допомогти оформити замовлення.
          </p>
        </div>

        {/* Priority CTA Cards */}
        <div className="grid sm:grid-cols-2 gap-6 mb-10">
          {/* Viber Card */}
          <div className="p-6 rounded-2xl bg-[#1C1815] border border-[#7360F2]/40 shadow-xl flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#7360F2]/20 text-[#A599FA] flex items-center justify-center mb-4">
                <IconViber className="w-6 h-6" />
              </div>
              <h2 className="font-serif font-bold text-xl text-[#F4EFEA]">
                Viber (основний месенджер)
              </h2>
              <p className="text-xs sm:text-sm text-[#A3988E] mt-1 leading-relaxed">
                Найшвидший спосіб зв'язатися з Галиною. Швидкі відповіді, уточнення наявності та консультації.
              </p>
              <div className="font-mono text-base font-bold text-white mt-3">
                {phone}
              </div>
            </div>
            <a
              href={viberUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 w-full btn-viber text-sm font-bold text-center"
            >
              <IconViber className="w-5 h-5 text-white" />
              <span>Написати у Viber</span>
            </a>
          </div>

          {/* Phone Card */}
          <div className="p-6 rounded-2xl bg-[#1C1815] border border-bronze/40 shadow-xl flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-bronze/20 text-bronze flex items-center justify-center mb-4">
                <IconPhone className="w-6 h-6" />
              </div>
              <h2 className="font-serif font-bold text-xl text-[#F4EFEA]">
                Телефонний дзвінок
              </h2>
              <p className="text-xs sm:text-sm text-[#A3988E] mt-1 leading-relaxed">
                Телефонуйте для термінових замовлень та узгодження деталей доставки.
              </p>
              <div className="font-mono text-base font-bold text-bronze mt-3">
                {phone}
              </div>
            </div>
            <a
              href={telHref}
              className="mt-6 w-full btn-primary text-sm font-bold text-center"
            >
              <IconPhone className="w-4 h-4 text-[#141210]" />
              <span>Зателефонувати</span>
            </a>
          </div>
        </div>

        {/* Additional Channels */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {/* TikTok */}
          <div className="p-5 rounded-2xl bg-[#1C1815] border border-[#2F2821] flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <IconTikTok className="w-5 h-5 text-white" />
                <span className="font-bold text-sm text-[#F4EFEA]">TikTok</span>
              </div>
              <div className="text-xs text-bronze font-mono">@kopchonosti777</div>
              <p className="text-[11px] text-[#8C8074] mt-1">110K+ підписників, живі відео коптильні</p>
            </div>
            <a
              href={tiktokUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 text-xs font-bold text-white hover:text-bronze flex items-center gap-1"
            >
              <span>Дивитися профіль</span>
              <span>→</span>
            </a>
          </div>

          {/* Telegram (if present) */}
          {telegramUrl && (
            <div className="p-5 rounded-2xl bg-[#1C1815] border border-[#2F2821] flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <IconTelegram className="w-5 h-5 text-[#2AABEE]" />
                  <span className="font-bold text-sm text-[#F4EFEA]">Telegram</span>
                </div>
                <div className="text-xs text-[#2AABEE] font-mono">{telegramRaw}</div>
                <p className="text-[11px] text-[#8C8074] mt-1">Швидкі текстові повідомлення</p>
              </div>
              <a
                href={telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 text-xs font-bold text-[#2AABEE] hover:underline flex items-center gap-1"
              >
                <span>Відкрити чат</span>
                <span>→</span>
              </a>
            </div>
          )}

          {/* Instagram (if present) */}
          {instagramUrl && (
            <div className="p-5 rounded-2xl bg-[#1C1815] border border-[#2F2821] flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <IconInstagram className="w-5 h-5 text-[#E4405F]" />
                  <span className="font-bold text-sm text-[#F4EFEA]">Instagram</span>
                </div>
                <div className="text-xs text-[#E4405F] font-mono">{instagramRaw}</div>
                <p className="text-[11px] text-[#8C8074] mt-1">Фотозвіти та відгуки</p>
              </div>
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 text-xs font-bold text-[#E4405F] hover:underline flex items-center gap-1"
              >
                <span>Перейти</span>
                <span>→</span>
              </a>
            </div>
          )}

          {/* Facebook (if present) */}
          {facebookUrl && (
            <div className="p-5 rounded-2xl bg-[#1C1815] border border-[#2F2821] flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <IconFacebook className="w-5 h-5 text-[#1877F2]" />
                  <span className="font-bold text-sm text-[#F4EFEA]">Facebook</span>
                </div>
                <div className="text-xs text-[#1877F2] font-mono">{facebookRaw}</div>
                <p className="text-[11px] text-[#8C8074] mt-1">Спільнота у Facebook</p>
              </div>
              <a
                href={facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 text-xs font-bold text-[#1877F2] hover:underline flex items-center gap-1"
              >
                <span>Перейти</span>
                <span>→</span>
              </a>
            </div>
          )}
        </div>

        {/* Schedule & Delivery Info Card */}
        <div className="p-6 rounded-2xl bg-[#1C1815] border border-[#2F2821] grid md:grid-cols-2 gap-6 text-sm">
          <div className="flex items-start gap-3">
            <IconClock className="w-5 h-5 text-bronze shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-[#F4EFEA]">Графік роботи та прийому дзвінків</div>
              <p className="text-xs text-[#A3988E] mt-1 leading-relaxed">
                Щодня з 08:00 до 20:00.<br />
                Оформлення замовлень через сайт працює <strong className="text-white">цілодобово 24/7</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <IconTruck className="w-5 h-5 text-bronze shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-[#F4EFEA]">Доставка по Україні</div>
              <p className="text-xs text-[#A3988E] mt-1 leading-relaxed">
                Відправляємо Новою Поштою щодня у термопакетах з холодоелементами. Термін доставки: 1–2 дні.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
