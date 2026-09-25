import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import { Products, subscribe } from "../data/db";

const OCCASIONS = [
  { icon: "💍", title: "Весілля та бонбоньєрки", desc: "Міні-баночки з персональними іменами молодят" },
  { icon: "🎁", title: "Корпоративні подарунки", desc: "Брендовані набори для колег та партнерів" },
  { icon: "🎂", title: "Дні народження", desc: "Святкове пакування зі стрічками та свічками" },
  { icon: "🌿", title: "Сімейні свята", desc: "Теплий та корисний подарунок для найрідніших" },
];

export default function GiftBoxes() {
  const [, setTick] = useState(0);

  useEffect(() => {
    Products.fetchAll();
    return subscribe(() => setTick((t) => t + 1));
  }, []);

  const boxes = Products.byCategory("gift-boxes");

  return (
    <div className="pb-16">
      {/* Hero Banner */}
      <section className="bg-gradient-to-b from-[#F7F1E5] via-[#FAF5EB] to-[#FFFDF8] py-12 md:py-20 border-b border-ink/5">
        <div className="container-p text-center max-w-3xl mx-auto">
          <nav className="text-xs text-ink/50 mb-4 flex items-center justify-center gap-1.5">
            <Link to="/" className="hover:text-honey transition-colors">Головна</Link>
            <span>/</span>
            <span className="text-ink/80 font-medium">Подарункові бокси</span>
          </nav>

          <span className="text-xs font-bold uppercase tracking-wider text-honey bg-white/90 px-3.5 py-1.5 rounded-full border border-honey/20 shadow-2xs">
            Подарункова колекція
          </span>

          <h1 className="font-serif text-3xl sm:text-5xl font-extrabold text-ink mt-4 leading-tight">
            Подарунок, який запам'ятається 💛
          </h1>

          <p className="mt-4 text-ink/75 text-sm sm:text-base leading-relaxed">
            Готові крафтові бокси з натуральним медом, крем-медом, свічками з вощини та горіхами. Ідеально підходить для привітання рідних, колег або гостей вашого свята.
          </p>
        </div>
      </section>

      {/* Gift Boxes Catalog */}
      <section className="container-p py-10 md:py-14">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          {boxes.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>

        {/* Custom Events / Personalization Showcase */}
        <div className="mt-16 card p-6 sm:p-10 md:p-12 bg-gradient-to-br from-[#FAF6EE] to-[#F3ECD9] border border-gold/30">
          <div className="max-w-2xl mx-auto text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-leaf bg-white px-3 py-1 rounded-full border border-leaf/20">
              Персоналізація
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-ink mt-3">
              Індивідуальне оформлення під вашу подію
            </h2>
            <p className="mt-3 text-ink/70 text-sm sm:text-base leading-relaxed">
              Ми розробляємо персональні етикетки, підбираємо стрічки у кольоровій гамі вашого свята та комплектуємо бокси за вашим бажанням.
            </p>
          </div>

          <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {OCCASIONS.map((o) => (
              <div key={o.title} className="bg-white/80 backdrop-blur-xs p-5 rounded-2xl border border-ink/5 flex flex-col items-center text-center">
                <span className="text-3xl mb-2">{o.icon}</span>
                <h4 className="font-bold text-sm text-ink">{o.title}</h4>
                <p className="text-xs text-ink/60 mt-1">{o.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <a
              href="https://t.me"
              target="_blank"
              rel="noreferrer"
              className="btn-primary inline-flex items-center gap-2"
            >
              <span>Обговорити замовлення в Telegram</span>
              <span>↗</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
