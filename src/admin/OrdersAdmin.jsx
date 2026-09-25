import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Orders, resolveReceiptUrl } from "../data/db";

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
  const [isTrashView, setIsTrashView] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all"); // 'all', 'cod', 'card_pending', 'card_completed'
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState(null);
  const [deleteModalOrder, setDeleteModalOrder] = useState(null);
  const [copiedTtn, setCopiedTtn] = useState(null);

  const loadOrders = (trash = isTrashView) => {
    setLoading(true);
    Orders.fetchAll({ deleted: trash })
      .then((data) => setOrders(data || []))
      .catch((err) => console.error("Error fetching orders:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadOrders(isTrashView);
  }, [isTrashView]);

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

  const handleOpenReceipt = async (e, rawUrl) => {
    e.preventDefault();
    e.stopPropagation();
    if (!rawUrl) return;
    if (rawUrl.startsWith("data:") || rawUrl.startsWith("blob:")) {
      window.open(rawUrl, "_blank");
      return;
    }
    const fetchUrl = resolveReceiptUrl(rawUrl);
    try {
      const res = await fetch(fetchUrl, { credentials: "include" });
      if (!res.ok) {
        showNotification("Файл чека недоступний", true);
        return;
      }
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("text/html")) {
        showNotification("Файл чека недоступний", true);
        return;
      }
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, "_blank");
    } catch {
      showNotification("Файл чека недоступний", true);
    }
  };

  const handleCopyTtn = (e, ttn) => {
    e.preventDefault();
    e.stopPropagation();
    if (!ttn) return;
    navigator.clipboard.writeText(ttn).then(() => {
      setCopiedTtn(ttn);
      showNotification(`ТТН ${ttn} скопійовано в буфер обміну`);
      setTimeout(() => setCopiedTtn(null), 2500);
    });
  };

  const handleSoftDelete = async (order) => {
    try {
      setActionLoading(order.id);
      await Orders.delete(order.id);
      setDeleteModalOrder(null);
      showNotification(`Замовлення #${order.number} переміщено в кошик`);
      loadOrders(isTrashView);
    } catch (err) {
      showNotification("Помилка видалення: " + err.message, true);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRestore = async (order) => {
    try {
      setActionLoading(order.id);
      await Orders.restore(order.id);
      showNotification(`Замовлення #${order.number} успішно відновлено з кошика`);
      loadOrders(isTrashView);
    } catch (err) {
      showNotification("Помилка відновлення: " + err.message, true);
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
        const ttnMatch = String(o.delivery?.trackingNumber || o.tracking_number || "").toLowerCase().includes(q);
        if (!numMatch && !nameMatch && !phoneMatch && !cityMatch && !ttnMatch) return false;
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

      {/* Soft Delete Confirmation Modal */}
      {deleteModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-xs">
          <div className="card p-6 max-w-md w-full bg-white shadow-2xl rounded-2xl border border-ink/10 space-y-4 animate-in fade-in">
            <div className="flex items-start gap-3">
              <span className="text-3xl">🗑️</span>
              <div>
                <h3 className="font-serif font-bold text-lg text-ink">
                  Перемістити замовлення в кошик?
                </h3>
                <p className="text-sm text-ink/70 mt-1">
                  Замовлення <span className="font-semibold text-ink">#{deleteModalOrder.number}</span> ({deleteModalOrder.customer?.firstName} {deleteModalOrder.customer?.lastName || ""}) на суму {deleteModalOrder.total} грн буде переміщено у кошик.
                </p>
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 text-xs text-amber-900 mt-3">
                  💡 Дані не видаляються з бази назавжди. Ви зможете переглянути його у вкладці «Кошик видалених» та відновити в будь-який момент.
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-ink/10">
              <button
                type="button"
                disabled={actionLoading === deleteModalOrder.id}
                onClick={() => setDeleteModalOrder(null)}
                className="btn-secondary text-xs py-2 px-4 rounded-xl min-h-[44px]"
              >
                Скасувати
              </button>
              <button
                type="button"
                disabled={actionLoading === deleteModalOrder.id}
                onClick={() => handleSoftDelete(deleteModalOrder)}
                className="btn-primary bg-red-600 hover:bg-red-700 text-white text-xs py-2 px-4 rounded-xl min-h-[44px] shadow-xs"
              >
                {actionLoading === deleteModalOrder.id ? "Переміщення..." : "Перемістити в кошик"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-2xl md:text-3xl font-bold text-ink">
              {isTrashView ? "Кошик видалених замовлень" : "Замовлення"}
            </h1>
            {isTrashView && (
              <span className="badge bg-amber-100 text-amber-900 font-semibold text-xs">
                Кошик
              </span>
            )}
          </div>
          <p className="text-xs text-ink/50 mt-0.5">
            {isTrashView
              ? `У кошику: ${orders.length} замовлень`
              : `Всього замовлень: ${orders.length} • Знайдено: ${filteredOrders.length}`}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Toggle between Active and Trash */}
          <button
            onClick={() => {
              setIsTrashView(!isTrashView);
              setStatusFilter("all");
            }}
            className={`text-xs rounded-xl px-3 py-2 transition-colors flex items-center gap-1.5 min-h-[40px] font-medium border ${
              isTrashView
                ? "bg-amber-100 border-amber-300 text-amber-900 font-semibold"
                : "bg-cream/60 border-ink/10 text-ink/70 hover:bg-cream hover:text-ink"
            }`}
          >
            {isTrashView ? "← Активні замовлення" : "🗑️ Кошик видалених"}
          </button>

          <button
            onClick={() => loadOrders(isTrashView)}
            className="text-xs text-ink/70 border border-ink/15 rounded-xl px-3 py-2 hover:bg-cream transition-colors flex items-center gap-1.5 min-h-[40px]"
          >
            🔄 Оновити
          </button>
        </div>
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
              placeholder="Пошук (номер, клієнт, телефон, ТТН, місто)..."
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

      {/* Mobile Orders List (md:hidden) */}
      <div className="md:hidden space-y-3">
        {loading && orders.length === 0 ? (
          <div className="card p-8 text-center text-ink/40">
            <div className="inline-block animate-spin mr-2">⏳</div> Завантаження замовлень...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="card p-8 text-center text-ink/40">
            {isTrashView
              ? "Кошик порожній."
              : "Замовлень за обраними фільтрами немає."}
          </div>
        ) : (
          filteredOrders.map((o) => {
            const isCard = o.payment?.method === "card";
            const receiptUrl = o.receipt?.fileUrl || o.receipt?.dataUrl;
            const ttn = o.delivery?.trackingNumber || o.tracking_number;

            return (
              <div key={o.id} className="card p-4 space-y-3 border border-ink/10 shadow-xs">
                {/* Header: #Number, Date, Status */}
                <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-ink/5">
                  <div>
                    <Link
                      to={`/admin/orders/${o.id}`}
                      className="font-serif font-bold text-lg text-ink hover:text-honey transition-colors"
                    >
                      #{o.number}
                    </Link>
                    <div className="text-[11px] text-ink/50">
                      {new Date(o.createdAt).toLocaleDateString("uk-UA", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>

                  {!isTrashView ? (
                    <select
                      value={o.status}
                      disabled={actionLoading === o.id}
                      onChange={(e) => handleStatusChange(o.id, e.target.value)}
                      className={`badge border-0 cursor-pointer text-xs py-2 px-3 rounded-xl shadow-2xs font-semibold min-h-[44px] transition-all ${
                        STATUS_COLOR[o.status] || "bg-cream text-ink"
                      }`}
                    >
                      {ORDER_STATUSES.filter((s) => s.key !== "all").map((s) => (
                        <option key={s.key} value={s.key}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="badge bg-red-100 text-red-700 text-xs">
                      Видалено
                    </span>
                  )}
                </div>

                {/* Client info */}
                <div className="text-xs space-y-1">
                  <div className="font-semibold text-ink text-sm">
                    👤 {o.customer?.firstName} {o.customer?.lastName}
                  </div>
                  {o.customer?.phone && (
                    <div>
                      <a
                        href={`tel:${o.customer.phone}`}
                        className="text-honey font-medium hover:underline inline-flex items-center gap-1"
                      >
                        📞 {o.customer.phone}
                      </a>
                    </div>
                  )}
                </div>

                {/* Delivery & TTN */}
                <div className="text-xs text-ink/70 bg-cream/40 p-2.5 rounded-xl border border-ink/5 space-y-1.5">
                  <div className="font-medium text-ink flex items-center gap-1.5 justify-between">
                    <div className="flex items-center gap-1">
                      <span>{o.delivery?.provider === "Укрпошта" ? "📮" : "📦"}</span>
                      <span>{o.delivery?.provider || o.delivery?.deliveryService || "Нова пошта"}</span>
                      <span className="text-ink/40">•</span>
                      <span className="text-ink">{o.delivery?.city || "—"}</span>
                    </div>
                  </div>
                  {o.delivery?.branch && (
                    <div className="text-[11px] text-ink/60 truncate">
                      {o.delivery.branch}
                    </div>
                  )}

                  {/* TTN Badge */}
                  {ttn && (
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-ink/5">
                      <div className="font-mono text-indigo-800 font-semibold text-[11px] flex items-center gap-1">
                        <span>ТТН:</span>
                        <span>{ttn}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => handleCopyTtn(e, ttn)}
                          className="text-[11px] font-medium text-indigo-700 hover:text-indigo-900 bg-indigo-100/70 px-2 py-0.5 rounded"
                        >
                          {copiedTtn === ttn ? "✓ Скопійовано" : "Скопіювати"}
                        </button>
                        {o.delivery?.trackingUrl && (
                          <a
                            href={o.delivery.trackingUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] text-honey hover:underline font-medium"
                          >
                            Відстежити ↗
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Payment & Receipt */}
                <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
                  <div className="text-xs">
                    {isCard ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium bg-amber-50 text-amber-800 border border-amber-200/60">
                        <span>💳</span> Оплачено наперед
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium bg-blue-50 text-blue-700 border border-blue-200/60">
                        <span>💵</span> При отриманні
                      </span>
                    )}
                  </div>

                  {isCard && (
                    <div>
                      {receiptUrl ? (
                        <button
                          type="button"
                          onClick={(e) => handleOpenReceipt(e, receiptUrl)}
                          className="inline-flex items-center gap-1 text-xs font-bold text-honey bg-honey/10 active:bg-honey/20 border border-honey/30 px-3 py-2 rounded-xl min-h-[44px]"
                          title="Переглянути квитанцію"
                        >
                          📎 Чек
                        </button>
                      ) : (
                        <span className="text-xs text-red-500 font-medium">Немає чека</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom: Total & Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-ink/5">
                  <div>
                    <span className="text-[11px] text-ink/40 block">До сплати:</span>
                    <span className="font-bold text-ink text-base">{o.total} грн</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      to={`/admin/orders/${o.id}`}
                      className="btn-secondary text-xs py-2 px-3 rounded-xl min-h-[44px] inline-flex items-center gap-1 font-semibold"
                    >
                      Деталі →
                    </Link>

                    {!isTrashView ? (
                      <button
                        type="button"
                        onClick={() => setDeleteModalOrder(o)}
                        className="p-2.5 rounded-xl text-ink/40 hover:text-red-600 hover:bg-red-50 border border-ink/10 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                        title="Перемістити в кошик"
                      >
                        🗑️
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={actionLoading === o.id}
                        onClick={() => handleRestore(o)}
                        className="btn-primary text-xs py-2 px-3 rounded-xl min-h-[44px] inline-flex items-center gap-1 font-semibold bg-leaf hover:bg-leaf/90"
                      >
                        {actionLoading === o.id ? "..." : "🔄 Відновити"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop Orders Table View (hidden md:block) */}
      <div className="hidden md:block card overflow-x-auto shadow-sm">
        <table className="w-full text-sm min-w-[960px]">
          <thead>
            <tr className="text-left text-ink/50 border-b border-ink/5 bg-cream/30 text-xs">
              <th className="p-3 w-16">№</th>
              <th className="p-3">Дата</th>
              <th className="p-3">Клієнт</th>
              <th className="p-3">Сума</th>
              <th className="p-3">Доставка / ТТН</th>
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
                  {isTrashView ? "Кошик порожній." : "Замовлень за обраними фільтрами немає."}
                </td>
              </tr>
            ) : (
              filteredOrders.map((o) => {
                const isCard = o.payment?.method === "card";
                const receiptUrl = o.receipt?.fileUrl || o.receipt?.dataUrl;
                const ttn = o.delivery?.trackingNumber || o.tracking_number;

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
                        <span>{o.delivery?.provider || o.delivery?.deliveryService || "Нова пошта"}</span>
                        <span className="text-ink/40">•</span>
                        <span>{o.delivery?.city || "—"}</span>
                      </div>
                      {/* TTN Display & Copy */}
                      {ttn ? (
                        <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                          <span className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-mono font-medium text-[11px]">
                            {ttn}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handleCopyTtn(e, ttn)}
                            className="text-[11px] text-indigo-700 hover:text-indigo-950 font-medium underline"
                            title="Скопіювати ТТН"
                          >
                            {copiedTtn === ttn ? "✓ Скопійовано" : "копіювати"}
                          </button>
                          {o.delivery?.trackingUrl && (
                            <a
                              href={o.delivery.trackingUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] text-honey hover:underline ml-1"
                              title="Відкрити відстеження перевізника"
                            >
                              трекінг ↗
                            </a>
                          )}
                        </div>
                      ) : (
                        <div className="text-ink/40 text-[11px] mt-0.5">
                          {o.delivery?.branch || "Без ТТН"}
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
                          <button
                            type="button"
                            onClick={(e) => handleOpenReceipt(e, receiptUrl)}
                            className="inline-flex items-center gap-1 font-semibold text-honey hover:underline bg-cream/70 px-2 py-1 rounded-lg cursor-pointer"
                            title={o.receipt?.name || "Переглянути квитанцію"}
                          >
                            📎 Чек
                          </button>
                        ) : (
                          <span className="text-red-500 font-medium text-xs">Не надано</span>
                        )
                      ) : (
                        <span className="text-ink/35 text-xs">—</span>
                      )}
                    </td>
                    <td className="p-3">
                      {!isTrashView ? (
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
                      ) : (
                        <span className="badge bg-red-100 text-red-700 text-xs">
                          Видалено {o.deletedAt ? new Date(o.deletedAt).toLocaleDateString("uk-UA") : ""}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/admin/orders/${o.id}`}
                          className="px-2.5 py-1 rounded-lg border border-ink/10 text-xs font-medium text-ink/80 hover:bg-cream hover:text-honey transition-colors"
                        >
                          Деталі →
                        </Link>

                        {!isTrashView ? (
                          <button
                            type="button"
                            onClick={() => setDeleteModalOrder(o)}
                            className="p-1.5 rounded-lg text-ink/30 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors"
                            title="Перемістити в кошик"
                          >
                            🗑️
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={actionLoading === o.id}
                            onClick={() => handleRestore(o)}
                            className="px-2.5 py-1 rounded-lg bg-leaf text-white text-xs font-semibold hover:bg-leaf/90 transition-colors"
                            title="Відновити замовлення"
                          >
                            {actionLoading === o.id ? "..." : "Відновити"}
                          </button>
                        )}
                      </div>
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
