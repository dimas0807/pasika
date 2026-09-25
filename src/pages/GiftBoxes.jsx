import { useEffect, useState } from "react";
import ProductCard from "../components/ProductCard";
import { Products, subscribe } from "../data/db";

const EXTRA = ["Весільний", "Подарунок гостям", "День народження"];

export default function GiftBoxes() {
  const [, setTick] = useState(0);

  useEffect(() => {
    Products.fetchAll();
    return subscribe(() => setTick((t) => t + 1));
  }, []);

  const boxes = Products.byCategory("gift-boxes");
  return (
    <div>
      <section className="bg-gradient-to-b from-leaf/10 to-clean py-14">
        <div className="container-p text-center">
          <h1 className="font-serif text-4xl font-bold text-ink">Подарунок, який запам'ятається 💛</h1>
          <p className="mt-3 text-ink/60 max-w-xl mx-auto">
            Готові набори та можливість персонального оформлення для особливих подій.
          </p>
        </div>
      </section>

      <section className="container-p py-12">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
          {boxes.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>

        <div className="mt-14 card p-8 text-center">
          <h2 className="font-serif text-2xl font-bold text-ink">Додатково оформлюємо бокси для:</h2>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            {EXTRA.map((e) => (
              <span key={e} className="badge bg-cream text-ink/70 text-sm">{e}</span>
            ))}
          </div>
          <p className="mt-4 text-ink/60 text-sm">Можливе персональне оформлення — напишіть нам у Telegram, щоб обговорити деталі.</p>
        </div>
      </section>
    </div>
  );
}
