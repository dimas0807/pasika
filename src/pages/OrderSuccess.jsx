import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { Orders } from "../data/db";

export default function OrderSuccess() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [order, setOrder] = useState(() => Orders.byId(id));
  const [loading, setLoading] = useState(!order);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    Orders.fetchById(id, token)
      .then((o) => {
        if (o) setOrder(o);
        else setAccessDenied(!token);
      })
      .catch((err) => {
        if (err.status === 403) setAccessDenied(true);
      })
      .finally(() => setLoading(false));
  }, [id, token]);

  if (loading) {
    return (
      <div className="container-p py-24 text-center">
        <p className="text-ink/60">Завантаження інформації про замовлення...</p>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="container-p py-24 text-center">
        <h2 className="font-serif text-2xl font-bold text-ink mb-2">Доступ обмежено</h2>
        <p className="text-ink/60">Для перегляду деталей замовлення потрібне посилання з токеном авторизації.</p>
        <Link to="/" className="btn-primary mt-6 inline-flex">На головну</Link>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container-p py-24 text-center">
        <p className="text-ink/60">Замовлення не знайдено.</p>
        <Link to="/" className="btn-primary mt-4 inline-flex">На головну</Link>
      </div>
    );
  }

  const customerName = `${order.customer?.firstName || ""} ${order.customer?.lastName || ""}`.trim();
  const deliveryCity = typeof order.delivery?.city === "object" ? order.delivery.city.name : order.delivery?.city;

  return (
    <div className="container-p py-20 max-w-lg mx-auto text-center">
      <div className="w-16 h-16 rounded-full bg-leaf/10 text-leaf flex items-center justify-center text-3xl mx-auto">✓</div>
      <h1 className="font-serif text-3xl font-bold text-ink mt-6">Дякуємо за замовлення!</h1>
      <p className="text-ink/60 mt-2">Замовлення №{order.number} прийнято. Ми зв'яжемося з вами для підтвердження.</p>

      <div className="card p-6 mt-8 text-left space-y-2 text-sm">
        <Row label="Клієнт" value={customerName} />
        <Row label="Телефон" value={order.customer?.phone} />
        <Row label="Доставка" value={`${order.delivery?.provider || ""}, ${deliveryCity || ""}`} />
        <Row label="Оплата" value={order.payment?.method === "card" ? "На картку" : "При отриманні"} />
        <Row label="Сума" value={`${order.total} грн`} bold />
      </div>

      <div className="mt-6 text-xs text-ink/40 card p-4 bg-cream/50">
        📨 Сповіщення про замовлення автоматично надіслано у Telegram-бот пасіки.
      </div>

      <Link to="/catalog" className="btn-primary mt-8 inline-flex">Продовжити покупки</Link>
    </div>
  );
}

function Row({ label, value, bold }) {
  return (
    <div className="flex justify-between border-b border-ink/5 pb-2 last:border-0">
      <span className="text-ink/50">{label}</span>
      <span className={bold ? "font-bold font-serif text-ink" : "text-ink"}>{value}</span>
    </div>
  );
}
