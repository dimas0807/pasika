import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Settings, subscribe } from "../data/db";
import {
  NovaPoshtaLogo,
  UkrposhtaLogo,
  IconTruck,
  IconMapPin,
  IconCreditCard,
  IconCash,
  IconShieldCheck,
} from "../components/Icons";

export default function Delivery() {
  const [s, setS] = useState(() => Settings.get());

  useEffect(() => {
    Settings.fetch().then((data) => data && setS(data));
    return subscribe(() => setS(Settings.get()));
  }, []);

  return (
    <div className="container-p py-8 sm:py-12 md:py-16 max-w-4xl">
      {/* Breadcrumb Navigation */}
      <nav className="text-xs text-ink/50 mb-3 flex items-center gap-1.5" aria-label="Хлібні крихти">
        <Link to="/" className="hover:text-honey transition-colors">Головна</Link>
        <span>/</span>
        <span className="text-ink/80 font-medium">Доставка та оплата</span>
      </nav>

      {/* Page Title */}
      <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-ink tracking-tight">
        Доставка та оплата
      </h1>
      <p className="text-ink/65 text-sm sm:text-base mt-2 max-w-xl leading-relaxed">
        Ми дбаємо про те, щоб кожна скляна баночка доїхала до вас цілою, надійно захищеною та в найкоротший термін.
      </p>

      {/* Delivery carriers */}
      <div className="mt-10 sm:mt-12">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-8 h-8 rounded-xl bg-honey/15 flex items-center justify-center text-honey">
            <IconTruck className="w-4 h-4" />
          </div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-ink">
            Способи доставки
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {/* Nova Poshta Card */}
          <div className="glass-card p-5 sm:p-6 flex flex-col justify-between card-hover">
            <div>
              <div className="flex items-center justify-between mb-4">
                <NovaPoshtaLogo className="w-8 h-8" />
                <span className="text-xs font-bold text-honey bg-amber-50 px-2.5 py-1 rounded-full border border-honey/25">
                  1–2 дні
                </span>
              </div>
              <h3 className="font-serif font-bold text-lg text-ink">Нова Пошта</h3>
              <p className="text-xs text-ink/70 mt-2 leading-relaxed">
                Доставка у будь-яке відділення або поштомат по всій Україні. Миттєве відстеження посилки за номером ТТН.
              </p>
            </div>
            <div className="text-[11px] font-medium text-ink/50 mt-5 pt-3 border-t border-amber-900/10">
              Вартість: за тарифами перевізника (від 70 грн)
            </div>
          </div>

          {/* Ukrposhta Card */}
          <div className="glass-card p-5 sm:p-6 flex flex-col justify-between card-hover">
            <div>
              <div className="flex items-center justify-between mb-4">
                <UkrposhtaLogo className="w-8 h-8" />
                <span className="text-xs font-bold text-leaf bg-emerald-50 px-2.5 py-1 rounded-full border border-leaf/25">
                  2–4 дні
                </span>
              </div>
              <h3 className="font-serif font-bold text-lg text-ink">Укрпошта</h3>
              <p className="text-xs text-ink/70 mt-2 leading-relaxed">
                Доставка у найвіддаленіші куточки та села України. Економічний та надійний варіант.
              </p>
            </div>
            <div className="text-[11px] font-medium text-ink/50 mt-5 pt-3 border-t border-amber-900/10">
              Вартість: за тарифами Укрпошти (від 45 грн)
            </div>
          </div>

          {/* Pickup Card (if configured) */}
          {(s?.contacts?.pickupAddress || "").trim() && (
            <div className="glass-card p-5 sm:p-6 flex flex-col justify-between sm:col-span-2 lg:col-span-1 card-hover">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-800">
                    <IconMapPin className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-300">
                    Самовивіз
                  </span>
                </div>
                <h3 className="font-serif font-bold text-lg text-ink">Самовивіз</h3>
                <p className="text-xs text-ink/80 mt-2 leading-relaxed font-semibold">
                  {s.contacts.pickupAddress}
                </p>
              </div>
              {s.contacts.pickupLat && s.contacts.pickupLng && (
                <div className="mt-5 pt-3 border-t border-amber-900/10">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${s.contacts.pickupLat},${s.contacts.pickupLng}`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-secondary text-xs py-1.5 px-3 inline-flex items-center gap-1.5 font-semibold"
                  >
                    <IconMapPin className="w-3.5 h-3.5" />
                    <span>Відкрити на карті</span>
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Payment methods */}
      <div className="mt-12 sm:mt-16">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-8 h-8 rounded-xl bg-honey/15 flex items-center justify-center text-honey">
            <IconCreditCard className="w-4 h-4" />
          </div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-ink">
            Варіанти оплати
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 sm:gap-5">
          {/* COD Card */}
          <div className="glass-card p-5 sm:p-6 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-900/10 flex items-center justify-center text-amber-800 mb-4">
                <IconCash className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-bold text-lg text-ink">Оплата при отриманні (післяплата)</h3>
              <p className="text-xs text-ink/70 mt-2 leading-relaxed">
                Оплата готівкою або банківською карткою під час отримання посилки у відділенні перевізника або кур'єру.
              </p>
            </div>
            <div className="text-[11px] text-ink/50 mt-5 pt-3 border-t border-amber-900/10">
              Комісія перевізника: 20 грн + 2% від суми (за тарифами Нової пошти)
            </div>
          </div>

          {/* Pay Now Card */}
          <div className="glass-card p-5 sm:p-6 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-900/10 flex items-center justify-center text-leaf mb-4">
                <IconCreditCard className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-bold text-lg text-ink">Оплатити зараз (картка / IBAN)</h3>
              <p className="text-xs text-ink/70 mt-2 leading-relaxed">
                {s?.payment?.instruction || "Без комісії! Оплата за реквізитами картки або IBAN із завантаженням фото чека під час оформлення замовлення."}
              </p>
            </div>
            <div className="text-[11px] text-leaf font-bold mt-5 pt-3 border-t border-amber-900/10 flex items-center gap-1.5">
              <IconShieldCheck className="w-3.5 h-3.5 text-leaf" />
              <span>Без додаткових комісій за накладений платіж</span>
            </div>
          </div>
        </div>
      </div>

      {/* Packaging assurance */}
      <div className="mt-12 sm:mt-16 p-5 sm:p-6 rounded-2xl glass-card flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-800 shrink-0 mt-0.5">
          <IconShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <h4 className="font-serif font-bold text-base sm:text-lg text-ink">Гарантія безпечного пакування</h4>
          <p className="text-xs sm:text-sm text-ink/70 mt-1 leading-relaxed">
            Ми використовуємо спеціальні посилені картонні ложементи та повітряно-бульбашкову плівку. Якщо раптом банка пошкодиться під час перевезення — ми безкоштовно надішлемо вам нову або миттєво повернемо кошти.
          </p>
        </div>
      </div>
    </div>
  );
}
