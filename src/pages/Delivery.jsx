import { useEffect, useState } from "react";
import { Settings, subscribe } from "../data/db";

export default function Delivery() {
  const [s, setS] = useState(() => Settings.get());

  useEffect(() => {
    Settings.fetch().then((data) => data && setS(data));
    return subscribe(() => setS(Settings.get()));
  }, []);

  return (
    <div className="container-p py-14 max-w-3xl">
      <h1 className="font-serif text-4xl font-bold text-ink">Доставка та оплата</h1>

      <div className="mt-10 grid sm:grid-cols-2 gap-5">
        <div className="card p-6">
          <div className="text-2xl mb-2">📦</div>
          <h3 className="font-semibold text-ink">Нова пошта</h3>
          <p className="text-sm text-ink/60 mt-1">Доставка у відділення або поштомат по всій Україні. 1–2 дні.</p>
        </div>
        <div className="card p-6">
          <div className="text-2xl mb-2">📮</div>
          <h3 className="font-semibold text-ink">Укрпошта</h3>
          <p className="text-sm text-ink/60 mt-1">Доставка у відділення Укрпошти. 2–4 дні.</p>
        </div>
      </div>

      <div className="mt-10 grid sm:grid-cols-2 gap-5">
        <div className="card p-6">
          <div className="text-2xl mb-2">💵</div>
          <h3 className="font-semibold text-ink">Оплата при отриманні</h3>
          <p className="text-sm text-ink/60 mt-1">Оплачуєте замовлення при отриманні на відділенні.</p>
        </div>
        <div className="card p-6">
          <div className="text-2xl mb-2">💳</div>
          <h3 className="font-semibold text-ink">Оплата на картку</h3>
          <p className="text-sm text-ink/60 mt-1">{s?.payment?.instruction}</p>
        </div>
      </div>
    </div>
  );
}
