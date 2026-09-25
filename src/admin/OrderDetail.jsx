import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Orders } from "../data/db";

const STATUSES = ["NEW", "PROCESSING", "PACKED", "SHIPPED", "COMPLETED", "CANCELLED"];
const STATUS_LABEL = {
  NEW: "Нове", PROCESSING: "В обробці", PACKED: "Запаковано",
  SHIPPED: "Відправлено", COMPLETED: "Виконано", CANCELLED: "Скасовано",
};

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(() => Orders.byId(id));
  const [loading, setLoading] = useState(!order);

  const loadOrder = useCallback(() => {
    Orders.fetchById(id)
      .then((o) => {
        if (o) setOrder(o);
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  if (loading && !order) {
    return (
      <div>
        <p className="text-ink/50">Завантаження замовлення...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div>
        <p className="text-ink/50">Замовлення не знайдено.</p>
        <Link to="/admin/orders" className="text-honey">← До замовлень</Link>
      </div>
    );
  }

  const setStatus = async (status) => {
    try {
      const updated = await Orders.updateStatus(order.id, status);
      setOrder(updated);
    } catch (err) {
      alert("Помилка зміни статусу: " + err.message);
    }
  };

  const receiptUrl = order.receipt?.fileUrl || order.receipt?.dataUrl;
  const receiptName = order.receipt?.name || "Чек";

  return (
    <div className="max-w-3xl">
      <Link to="/admin/orders" className="text-sm text-ink/50 hover:text-honey">← До замовлень</Link>
      <div className="flex items-center justify-between mt-3 mb-6">
        <div>
          <h1 className="font-serif text-2xl font-bold text-ink">Замовлення #{order.number}</h1>
          <span className="text-xs text-ink/40">ID: {order.id} • Створено: {new Date(order.createdAt).toLocaleString("uk-UA")}</span>
        </div>
        <select value={order.status} onChange={(e) => setStatus(e.target.value)} className="input w-auto cursor-pointer">
          {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
        </select>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <div className="card p-5">
          <h3 className="font-semibold text-ink mb-3">Клієнт</h3>
          <p className="text-sm text-ink/70">{order.customer?.firstName} {order.customer?.lastName}</p>
          <p className="text-sm text-ink/70">📞 {order.customer?.phone}</p>
          <p className="text-sm text-ink/70">📧 {order.customer?.email || "—"}</p>
        </div>
        <div className="card p-5">
          <h3 className="font-semibold text-ink mb-3">Доставка</h3>
          <p className="text-sm text-ink/70 font-medium">🚚 {order.delivery?.provider}</p>
          <p className="text-sm text-ink/70">📍 {order.delivery?.city} {order.delivery?.cityId && <span className="text-xs text-ink/40">({order.delivery.cityId})</span>}</p>
          <p className="text-sm text-ink/70">🏤 {order.delivery?.branch} {order.delivery?.branchId && <span className="text-xs text-ink/40">({order.delivery.branchId})</span>}</p>
        </div>
        <div className="card p-5">
          <h3 className="font-semibold text-ink mb-3">Оплата</h3>
          <p className="text-sm text-ink/70 font-medium">{order.payment?.method === "card" ? "💳 На картку" : "💵 При отриманні"}</p>
          {receiptUrl ? (
            <div className="mt-3">
              <a
                href={receiptUrl}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary text-xs inline-flex items-center gap-1.5 py-1.5 px-3"
              >
                📎 Переглянути чек ({receiptName})
              </a>
            </div>
          ) : (
            <p className="text-sm text-ink/40 mt-1">Чек не завантажено</p>
          )}
        </div>
        <div className="card p-5">
          <h3 className="font-semibold text-ink mb-3">Коментар</h3>
          <p className="text-sm text-ink/70">{order.comment || "—"}</p>
        </div>
      </div>

      <div className="card p-5 mt-5">
        <h3 className="font-semibold text-ink mb-3">Товари</h3>
        <div className="space-y-2 text-sm">
          {order.items?.map((i) => (
            <div key={i.id || i.product_id} className="flex justify-between border-b border-ink/5 pb-2 last:border-0">
              <span>{i.name} {i.weight ? `(${i.weight})` : ""} × {i.qty}</span>
              <span className="font-medium">{i.price * i.qty} грн</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between font-serif text-lg font-bold text-ink pt-3 mt-2 border-t border-ink/10">
          <span>Разом</span><span>{order.total} грн</span>
        </div>
      </div>
    </div>
  );
}
