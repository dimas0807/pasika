import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Orders } from "../data/db";

const ORDER_STATUSES = [
  { key: "all", label: "Всі замовлення" },
  { key: "NEW", label: "Нові" },
  { key: "PROCESSING", label: "В обробці" },
  { key: "PACKED", label: "Запаковано" },
  { key: "SHIPPED", label: "Відправлено" },
  { key: "COMPLETED", label: "Виконано" },
  { key: "CANCELLED", label: "Скасовано" },
];

const STATUS_LABEL = {
  NEW: "Нове",
  PROCESSING: "В обробці",
  PACKED: "Запаковано",
  SHIPPED: "Відправлено",
  COMPLETED: "Виконано",
  CANCELLED: "Скасовано",
};

const STATUS_COLOR = {
  NEW: "bg-honey/15 text-honey font-semibold",
  PROCESSING: "bg-amber-100 text-amber-900",
  PACKED: "bg-blue-100 text-blue-900",
  SHIPPED: "bg-indigo-100 text-indigo-900",
  COMPLETED: "bg-leaf/20 text-leaf font-semibold",
  CANCELLED: "bg-red-100 text-red-600",
};

export default function OrdersAdmin() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all"); // 'all', 'cod', 'card_pending', 'card_completed'
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  const loadOrders = () => {
    setLoading(true);
    Orders.fetchAll()
      .then((data) => setOrders(data || []))
      .catch((err) => console.error("Error fetching orders:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const showNotification = (msg, isError = false) => {
    setFeedbackMsg({ text: msg, isError });
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const handleStatusChange = async (id, nextStatus) => {
    try {
      setActionLoading(id);
      await Orders.updateStatus(id, nextStatus);
      showNotification(`Статус замовлення змінено на "${STATUS_LABEL[nextStatus] || nextStatus}"`);
      loadOrders();
    } catch (err) {
      showNotification("Не вдалося оновити статус: " + err.message, true);
    } finally {
      setActionLoading(null);
    }
  };

  // Filter orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      // Order status
      if (statusFilter !== "all" && o.status !== statusFilter) {
        return false;
      }

      // Payment filter
      const isCard = o.payment?.method === "card";
      if (paymentFilter === "cod" && isCard) return false;
      if (paymentFilter === "card_pending" && (!isCard || o.status === "COMPLETED")) return false;
      if (paymentFilter === "card_completed" && (!isCard || o.status !== "COMPLETED")) return false;

      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const numMatch = String(o.number || "").toLowerCase().includes(q);
        const nameMatch = `${o.customer?.firstName || ""} ${o.customer?.lastName || ""}`.toLowerCase().includes(q);
        const phoneMatch = String(o.customer?.phone || "").toLowerCase().includes(q);
        const cityMatch = String(o.delivery?.city || "").toLowerCase().includes(q);
        if (!numMatch && !nameMatch && !phoneMatch && !cityMatch) return false;
      }

      return true;
    });
  }, [orders, statusFilter, paymentFilter, search]);

  return (
    <div>
      {/* Toast Notification */}
      {feedbackMsg && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all ${
            feedbackMsg.isError ? "bg-red-600 text-white" : "bg-leaf text-white"
          }`}
        >
          {feedbackMsg.isError ? "⚠️ " : "✓ "}
          {feedbackMsg.text}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-ink">Замовлення</h1>
          <p className="text-xs text-ink/50 mt-0.5">
            Всього замовлень: {orders.length} • Знайдено: {filteredOrders.length}
          </p>
        </div>
        <button
          onClick={loadOrders}
          className="text-xs text-ink/70 border border-ink/15 rounded-xl px-3 py-2 hover:bg-cream transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          🔄 Оновити
        </button>
      </div>

      {/* Filters bar */}
      <div className="card p-4 mb-6 space-y-4">
        {/* Status Pills */}
        <div className="flex flex-wrap gap-1.5">
          {ORDER_STATUSES.map((s) => {
            const count = s.key === "all" ? orders.length : orders.filter((o) => o.status === s.key).length;
            const active = statusFilter === s.key;
            return (
              <button
                key={s.key}
                onClick={() => setStatusFilter(s.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
                  active
                    ? "bg-honey text-white shadow-xs font-semibold"
                    : "bg-cream/60 hover:bg-cream text-ink/70"
                }`}
              >
                <span>{s.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${active ? "bg-white/20 text-white" : "bg-ink/5 text-ink/50"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & Payment Filter */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-3 border-t border-ink/5">
          {/* Search */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40 text-sm">🔍</span>
            <input
              type="text"
              placeholder="Пошук (номер, ім'я, телефон, місто)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-9 text-sm"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink/40 hover:text-ink"
              >
                ✕
              </button>
            )}
          </div>

          {/* Payment filter */}
          <div>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="input text-sm cursor-pointer"
            >
              <option value="all">Усі способи та статуси оплати</option>
              <option value="cod">Оплата при отриманні</option>
              <option value="card_pending">Оплата на картку (чек на перевірці)</option>
              <option value="card_completed">Оплата на картку (виконані)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="card overflow-x-auto shadow-sm">
        <table className="w-full text-sm min-w-[880px]">
          <thead>
            <tr className="text-left text-ink/50 border-b border-ink/5 bg-cream/30 text-xs">
              <th className="p-3 w-16">№</th>
              <th className="p-3">Дата</th>
              <th className="p-3">Клієнт</th>
              <th className="p-3">Сума</th>
              <th className="p-3">Доставка</th>
              <th className="p-3">Оплата</th>
              <th className="p-3">Чек</th>
              <th className="p-3">Статус замовлення</th>
              <th className="p-3 text-right">Дії</th>
            </tr>
          </thead>
          <tbody>
            {loading && orders.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-8 text-center text-ink/40">
                  <div className="inline-block animate-spin mr-2">⏳</div> Завантаження замовлень...
                </td>
              </tr>
            ) : filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-8 text-center text-ink/40">
                  Замовлень за обраними фільтрами немає.
                </td>
              </tr>
            ) : (
              filteredOrders.map((o) => {
                const isCard = o.payment?.method === "card";
                const receiptUrl = o.receipt?.fileUrl || o.receipt?.dataUrl;

                return (
                  <tr
                    key={o.id}
                    className="border-b border-ink/5 last:border-0 hover:bg-cream/30 transition-colors"
                  >
                    <td className="p-3 font-semibold text-ink">
                      <Link to={`/admin/orders/${o.id}`} className="hover:text-honey transition-colors">
                        #{o.number}
                      </Link>
                    </td>
                    <td className="p-3 text-xs text-ink/60 whitespace-nowrap">
                      {new Date(o.createdAt).toLocaleDateString("uk-UA", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="p-3">
                      <div className="font-medium text-ink">
                        {o.customer?.firstName} {o.customer?.lastName}
                      </div>
                      <div className="text-xs text-ink/50 font-mono">{o.customer?.phone}</div>
                    </td>
                    <td className="p-3 font-bold text-ink whitespace-nowrap">
                      {o.total} грн
                    </td>
                    <td className="p-3 text-xs text-ink/70">
                      <div className="font-medium text-ink flex items-center gap-1">
                        <span>{o.delivery?.provider === "Укрпошта" ? "📮" : "📦"}</span>
                        <span>{o.delivery?.provider || "Нова пошта"}</span>
                      </div>
                      <div className="text-ink/60 truncate max-w-[150px]">
                        {o.delivery?.city || "—"}
                      </div>
                      {o.delivery?.branch && (
                        <div className="text-[11px] text-ink/40 truncate max-w-[150px]">
                          {o.delivery.branch}
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-xs">
                      {isCard ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-medium bg-amber-50 text-amber-800 border border-amber-200/60 whitespace-nowrap">
                          <span>💳</span> Оплачено наперед
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-medium bg-blue-50 text-blue-700 border border-blue-200/60 whitespace-nowrap">
                          <span>💵</span> При отриманні
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-xs whitespace-nowrap">
                      {isCard ? (
                        receiptUrl ? (
                          <a
                            href={receiptUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 font-semibold text-honey hover:underline bg-cream/70 px-2 py-1 rounded-lg"
                            title={o.receipt?.name || "Переглянути квитанцію"}
                          >
                            📎 Чек
                          </a>
                        ) : (
                          <span className="text-red-500 font-medium text-xs">Не надано</span>
                        )
                      ) : (
                        <span className="text-ink/35 text-xs">—</span>
                      )}
                    </td>
                    <td className="p-3">
                      <select
                        value={o.status}
                        disabled={actionLoading === o.id}
                        onChange={(e) => handleStatusChange(o.id, e.target.value)}
                        className={`badge border-0 cursor-pointer text-xs py-1 px-2.5 rounded-lg shadow-2xs font-medium transition-all ${
                          STATUS_COLOR[o.status] || "bg-cream text-ink"
                        }`}
                      >
                        {ORDER_STATUSES.filter((s) => s.key !== "all").map((s) => (
                          <option key={s.key} value={s.key}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-3 text-right">
                      <Link
                        to={`/admin/orders/${o.id}`}
                        className="px-2.5 py-1 rounded-lg border border-ink/10 text-xs font-medium text-ink/80 hover:bg-cream hover:text-honey transition-colors inline-block"
                      >
                        Деталі →
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
