import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Orders } from "../data/db";

const STATUSES = ["NEW", "PROCESSING", "PACKED", "SHIPPED", "COMPLETED", "CANCELLED"];
const STATUS_LABEL = {
  NEW: "Нове", PROCESSING: "В обробці", PACKED: "Запаковано",
  SHIPPED: "Відправлено", COMPLETED: "Виконано", CANCELLED: "Скасовано",
};
const STATUS_COLOR = {
  NEW: "bg-honey/15 text-honey", PROCESSING: "bg-accent/20 text-ink",
  PACKED: "bg-gold/20 text-ink", SHIPPED: "bg-leaf/15 text-leaf",
  COMPLETED: "bg-leaf/20 text-leaf", CANCELLED: "bg-red-100 text-red-500",
};

export default function OrdersAdmin() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const loadOrders = (f = filter) => {
    setLoading(true);
    Orders.fetchAll(f)
      .then((data) => setOrders(data || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadOrders(filter);
  }, [filter]);

  const setStatus = async (id, status) => {
    try {
      await Orders.updateStatus(id, status);
      loadOrders(filter);
    } catch (err) {
      alert("Не вдалося оновити статус: " + err.message);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-2xl md:text-3xl font-bold text-ink">Замовлення</h1>
        <button
          onClick={() => loadOrders(filter)}
          className="text-xs text-ink/60 border border-ink/15 rounded-lg px-3 py-1.5 hover:bg-cream"
        >
          🔄 Оновити
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setFilter("all")}
          className={`badge ${filter === "all" ? "bg-honey text-white" : "bg-cream text-ink/70"}`}
        >
          Всі
        </button>
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`badge ${filter === s ? "bg-honey text-white" : "bg-cream text-ink/70"}`}
          >
            {STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm min-w-[800px]">
          <thead>
            <tr className="text-left text-ink/50 border-b border-ink/5">
              <th className="p-3">№</th>
              <th className="p-3">Дата</th>
              <th className="p-3">Клієнт</th>
              <th className="p-3">Сума</th>
              <th className="p-3">Доставка</th>
              <th className="p-3">Спосіб оплати</th>
              <th className="p-3">Статус оплати</th>
              <th className="p-3">Чек</th>
              <th className="p-3">Статус</th>
              <th className="p-3">Дії</th>
            </tr>
          </thead>
          <tbody>
            {loading && orders.length === 0 ? (
              <tr>
                <td colSpan={10} className="p-6 text-center text-ink/40">
                  Завантаження замовлень...
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={10} className="p-6 text-center text-ink/40">
                  Замовлень немає.
                </td>
              </tr>
            ) : (
              orders.map((o) => (
                <tr key={o.id} className="border-b border-ink/5 last:border-0 hover:bg-cream/20">
                  <td className="p-3 font-medium">#{o.number}</td>
                  <td className="p-3 text-ink/60">
                    {new Date(o.createdAt).toLocaleDateString("uk-UA")}
                  </td>
                  <td className="p-3">
                    <div className="font-medium text-ink">{o.customer?.firstName} {o.customer?.lastName}</div>
                    <div className="text-xs text-ink/50">{o.customer?.phone}</div>
                  </td>
                  <td className="p-3 font-semibold">{o.total} грн</td>
                  <td className="p-3 text-ink/60">
                    <div>{o.delivery?.provider}</div>
                    {o.delivery?.city && <div className="text-[11px] text-ink/45 truncate max-w-[120px]">{o.delivery.city}</div>}
                  </td>
                  <td className="p-3 text-ink/75 font-medium text-xs">
                    {o.payment?.method === "card" ? "Оплачено наперед" : "Оплата при отриманні"}
                  </td>
                  <td className="p-3">
                    {o.payment?.method === "card" ? (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 whitespace-nowrap">
                        Чек на перевірці
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 whitespace-nowrap">
                        Очікує оплати
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-xs">
                    {o.payment?.method === "card" ? (
                      o.receipt?.fileUrl ? (
                        <a
                          href={o.receipt.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-honey hover:underline font-semibold inline-flex items-center gap-1"
                          title={o.receipt.name}
                        >
                          📎 Відкрити чек
                        </a>
                      ) : (
                        <span className="text-red-500 font-medium">Немає</span>
                      )
                    ) : (
                      <span className="text-ink/40">Не потрібен</span>
                    )}
                  </td>
                  <td className="p-3">
                    <select
                      value={o.status}
                      onChange={(e) => setStatus(o.id, e.target.value)}
                      className={`badge border-0 cursor-pointer ${STATUS_COLOR[o.status] || "bg-cream text-ink"}`}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {STATUS_LABEL[s]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-3">
                    <Link to={`/admin/orders/${o.id}`} className="text-honey hover:underline">
                      Деталі
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
