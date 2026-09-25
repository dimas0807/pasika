import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Settings, subscribe } from "../data/db";

export default function Delivery() {
  const [s, setS] = useState(() => Settings.get());

  useEffect(() => {
    Settings.fetch().then((data) => data && setS(data));
    return subscribe(() => setS(Settings.get()));
  }, []);

  return (
    <div className="container-p py-10 md:py-16 max-w-4xl">
      <nav className="text-xs text-ink/50 mb-3 flex items-center gap-1.5">
        <Link to="/" className="hover:text-honey">Головна</Link>
        <span>/</span>
        <span className="text-ink/80 font-medium">Доставка та оплата</span>
      </nav>

      <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-ink">
        Доставка та оплата
      </h1>
      <p className="text-ink/65 text-sm sm:text-base mt-2 max-w-xl">
        Ми дбаємо про те, щоб кожна скляна баночка доїхала до вас цілою, надійно захищеною та в найкоротший термін.
      </p>

      {/* Delivery carriers */}
      <div className="mt-10">
        <h2 className="font-serif text-xl sm:text-2xl font-bold text-ink mb-4 flex items-center gap-2">
          <span>🚚</span> Способи доставки
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="card p-6 bg-[#FAF6EE] border border-gold/20 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-3xl">📦</span>
                <span className="text-xs font-bold text-honey bg-white px-2.5 py-1 rounded-full border border-honey/20">
                  1–2 дні
                </span>
              </div>
              <h3 className="font-serif font-bold text-lg text-ink">Нова пошта</h3>
              <p className="text-xs text-ink/70 mt-2 leading-relaxed">
                Доставка у будь-яке працююче відділення або поштомат по Україні. Можливість відстеження за номером ТТН одразу після відправки.
              </p>
            </div>
            <div className="text-[11px] text-ink/50 mt-4 pt-3 border-t border-ink/10">
              Вартість: за тарифами перевізника (від 70 грн)
            </div>
          </div>

          <div className="card p-6 bg-[#FAF6EE] border border-gold/20 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-3xl">📮</span>
                <span className="text-xs font-bold text-leaf bg-white px-2.5 py-1 rounded-full border border-leaf/20">
                  2–4 дні
                </span>
              </div>
              <h3 className="font-serif font-bold text-lg text-ink">Укрпошта</h3>
              <p className="text-xs text-ink/70 mt-2 leading-relaxed">
                Доставка у найвіддаленіші куточки України та селища. Економічний варіант для нетермінових замовлень.
              </p>
            </div>
            <div className="text-[11px] text-ink/50 mt-4 pt-3 border-t border-ink/10">
              Вартість: за тарифами Укрпошти (від 45 грн)
            </div>
          </div>

          {(s?.contacts?.pickupAddress || "").trim() && (
            <div className="card p-6 bg-[#FAF6EE] border border-gold/20 flex flex-col justify-between sm:col-span-2 lg:col-span-1">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-3xl">📍</span>
                  <span className="text-xs font-bold text-amber-800 bg-white px-2.5 py-1 rounded-full border border-amber-300">
                    Самовивіз
                  </span>
                </div>
                <h3 className="font-serif font-bold text-lg text-ink">Самовивіз</h3>
                <p className="text-xs sm:text-sm text-ink/80 mt-2 leading-relaxed font-semibold">
                  {s.contacts.pickupAddress}
                </p>
              </div>
              {s.contacts.pickupLat && s.contacts.pickupLng && (
                <div className="mt-4 pt-3 border-t border-ink/10">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${s.contacts.pickupLat},${s.contacts.pickupLng}`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-secondary text-xs py-1.5 px-3 inline-flex items-center gap-1 font-semibold"
                  >
                    <span>🗺️</span> Відкрити на карті
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Payment methods */}
      <div className="mt-12">
        <h2 className="font-serif text-xl sm:text-2xl font-bold text-ink mb-4 flex items-center gap-2">
          <span>💳</span> Варіанти оплати
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="card p-6 border border-ink/10 bg-white">
            <span className="text-3xl mb-3 block">💵</span>
            <h3 className="font-serif font-bold text-lg text-ink">Оплата при отриманні</h3>
            <p className="text-xs text-ink/70 mt-2 leading-relaxed">
              Оплата замовлення під час отримання посилки у відділенні перевізника або кур'єру.
            </p>
            <div className="text-[11px] text-ink/50 mt-4">
              Комісія перевізника: 20 грн + 2% від суми (для Нової пошти)
            </div>
          </div>

          <div className="card p-6 border border-ink/10 bg-white">
            <span className="text-3xl mb-3 block">💳</span>
            <h3 className="font-serif font-bold text-lg text-ink">Оплатити зараз</h3>
            <p className="text-xs text-ink/70 mt-2 leading-relaxed">
              {s?.payment?.instruction || "Без комісії! Оплата за реквізитами картки або IBAN із завантаженням чека під час оформлення замовлення."}
            </p>
            <div className="text-[11px] text-leaf font-semibold mt-4">
              ✓ Без додаткових комісій за накладений платіж
            </div>
          </div>
        </div>
      </div>

      {/* Packaging assurance */}
      <div className="mt-12 p-6 rounded-2xl bg-cream/70 border border-gold/30 flex items-start gap-4">
        <span className="text-3xl">🍯</span>
        <div>
          <h4 className="font-serif font-bold text-base text-ink">Гарантія безпечного пакування</h4>
          <p className="text-xs text-ink/70 mt-1 leading-relaxed">
            Ми використовуємо спеціальні картонні ложементи та повітряно-бульбашкову плівку. Якщо раптом банка пошкодиться під час перевезення — ми безкоштовно надішлемо вам нову або повернемо кошти.
          </p>
        </div>
      </div>
    </div>
  );
}
