import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Orders, resolveReceiptUrl, DeliveryAccounts, Auth } from "../data/db";

const STATUSES = [
  { key: "NEW", label: "Нове" },
  { key: "PROCESSING", label: "В обробці" },
  { key: "AWAITING_PAYMENT", label: "Очікує оплати" },
  { key: "PAID", label: "Оплачено" },
  { key: "PACKED", label: "Запаковано" },
  { key: "SHIPMENT_CREATED", label: "Створено ТТН" },
  { key: "SHIPPED", label: "Відправлено" },
  { key: "DELIVERED", label: "Доставлено" },
  { key: "COMPLETED", label: "Виконано" },
  { key: "CANCELLED", label: "Скасовано" },
];

const STATUS_LABELS = {
  NEW: "Нове",
  PROCESSING: "В обробці",
  AWAITING_PAYMENT: "Очікує оплати",
  PAID: "Оплачено",
  PACKED: "Запаковано",
  SHIPMENT_CREATED: "Створено ТТН",
  SHIPPED: "Відправлено",
  DELIVERED: "Доставлено",
  COMPLETED: "Виконано",
  CANCELLED: "Скасовано",
};

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(() => Orders.byId(id));
  const [loading, setLoading] = useState(!order);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Tracking edit state
  const [editingTracking, setEditingTracking] = useState(false);
  const [trackingNumberInput, setTrackingNumberInput] = useState("");
  const [deliveryServiceInput, setDeliveryServiceInput] = useState("Нова пошта");
  const [savingTracking, setSavingTracking] = useState(false);
  const [copiedTtn, setCopiedTtn] = useState(false);

  // Nova Poshta TTN automation states
  const [ttnModalOpen, setTtnModalOpen] = useState(false);
  const [ttnSubmitting, setTtnSubmitting] = useState(false);
  const [ttnAccounts, setTtnAccounts] = useState([]);
  const [ttnForm, setTtnForm] = useState({
    accountId: "",
    weight: "1.0",
    cost: "",
    description: "",
  });
  const [trackingLiveStatus, setTrackingLiveStatus] = useState(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [ttnCancelling, setTtnCancelling] = useState(false);

  // Payment confirmation state
  const [paymentConfirming, setPaymentConfirming] = useState(false);

  // Soft delete modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteActionLoading, setDeleteActionLoading] = useState(false);

  const rawReceiptUrl = order?.receipt?.fileUrl || order?.receipt?.dataUrl;
  const receiptName = order?.receipt?.name || "Квитанція / чек";

  const [receiptBlobUrl, setReceiptBlobUrl] = useState(() =>
    rawReceiptUrl?.startsWith("data:") ? rawReceiptUrl : null
  );
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [receiptUnavailable, setReceiptUnavailable] = useState(false);
  const [receiptMimeType, setReceiptMimeType] = useState(null);

  const loadOrder = useCallback(() => {
    Orders.fetchById(id)
      .then((o) => {
        if (o) {
          setOrder(o);
          setTrackingNumberInput(o.delivery?.trackingNumber || "");
          setDeliveryServiceInput(o.delivery?.deliveryService || o.delivery?.provider || "Нова пошта");
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  useEffect(() => {
    if (!rawReceiptUrl || rawReceiptUrl.startsWith("data:")) {
      return;
    }

    let active = true;
    let localBlobUrl = null;
    const fetchUrl = resolveReceiptUrl(rawReceiptUrl);

    setReceiptLoading(true);
    const token = Auth?.getToken ? Auth.getToken() : "";
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    fetch(fetchUrl, { credentials: "include", headers })
      .then(async (res) => {
        if (!active) return;
        if (!res.ok) {
          setReceiptUnavailable(true);
          setReceiptBlobUrl(null);
          return;
        }
        const contentType = res.headers.get("content-type") || "";
        if (contentType.includes("text/html")) {
          setReceiptUnavailable(true);
          setReceiptBlobUrl(null);
          return;
        }
        const blob = await res.blob();
        if (!active) return;
        localBlobUrl = URL.createObjectURL(blob);
        setReceiptBlobUrl(localBlobUrl);
        setReceiptMimeType(blob.type || contentType);
      })
      .catch(() => {
        if (active) {
          setReceiptUnavailable(true);
          setReceiptBlobUrl(null);
        }
      })
      .finally(() => {
        if (active) setReceiptLoading(false);
      });

    return () => {
      active = false;
      if (localBlobUrl) {
        URL.revokeObjectURL(localBlobUrl);
      }
    };
  }, [rawReceiptUrl]);

  const showNotification = (msg, isError = false) => {
    setFeedback({ text: msg, isError });
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleStatusChange = async (newStatus) => {
    setSaving(true);
    try {
      const updated = await Orders.updateStatus(order.id, newStatus);
      setOrder(updated);
      showNotification(`Статус змінено на "${STATUS_LABELS[newStatus] || newStatus}"`);
    } catch (err) {
      showNotification("Помилка зміни статусу: " + err.message, true);
    } finally {
      setSaving(false);
    }
  };

  const handleCopyTtn = (ttn) => {
    if (!ttn) return;
    navigator.clipboard.writeText(ttn).then(() => {
      setCopiedTtn(true);
      showNotification(`ТТН ${ttn} скопійовано`);
      setTimeout(() => setCopiedTtn(false), 2500);
    });
  };

  const handleSaveTracking = async (e) => {
    if (e) e.preventDefault();
    const cleanTtn = trackingNumberInput.trim();
    if (!cleanTtn) {
      showNotification("Введіть номер ТТН", true);
      return;
    }
    setSavingTracking(true);
    try {
      const updated = await Orders.updateTracking(order.id, {
        trackingNumber: cleanTtn,
        deliveryService: deliveryServiceInput,
      });
      setOrder(updated);
      setEditingTracking(false);
      showNotification("Номер ТТН збережено. Статус оновлено на «Відправлено»");
    } catch (err) {
      showNotification("Помилка збереження ТТН: " + err.message, true);
    } finally {
      setSavingTracking(false);
    }
  };

  const handleConfirmPayment = async () => {
    setPaymentConfirming(true);
    try {
      await Orders.confirmPayment(id);
      showNotification("Оплату перевірено та підтверджено! Статус: PAID");
      loadOrder();
    } catch (err) {
      showNotification(err.message, true);
    } finally {
      setPaymentConfirming(false);
    }
  };

  const openTtnModal = async () => {
    try {
      const accounts = await DeliveryAccounts.getAll("np");
      if (Array.isArray(accounts)) {
        setTtnAccounts(accounts);
        const def = accounts.find((a) => a.isDefault) || accounts[0];
        setTtnForm({
          accountId: def?.id || "",
          weight: "1.0",
          cost: String(order.total || 0),
          description: `Мед та продукти бджільництва (${order.orderCode || `PAS-${order.number}`})`,
        });
      }
    } catch {
      // ignore
    }
    setTtnModalOpen(true);
  };

  const handleCreateTtn = async (e) => {
    e.preventDefault();
    setTtnSubmitting(true);
    try {
      const data = await DeliveryAccounts.createOrderTtn(id, ttnForm);
      showNotification(`ТТН Нової пошти створено: ${data.trackingNumber}`);
      setTtnModalOpen(false);
      loadOrder();
    } catch (err) {
      showNotification(err.message, true);
    } finally {
      setTtnSubmitting(false);
    }
  };

  const handleCancelTtn = async () => {
    if (!window.confirm("Скасувати діючу ТТН для цього замовлення?")) return;
    setTtnCancelling(true);
    try {
      await DeliveryAccounts.cancelOrderTtn(id);
      showNotification("ТТН успішно скасовано");
      loadOrder();
    } catch (err) {
      showNotification(err.message, true);
    } finally {
      setTtnCancelling(false);
    }
  };

  const handleFetchLiveTracking = async () => {
    setTrackingLoading(true);
    setTrackingLiveStatus(null);
    try {
      const data = await DeliveryAccounts.getOrderTracking(id);
      setTrackingLiveStatus(data);
    } catch (err) {
      showNotification(err.message, true);
    } finally {
      setTrackingLoading(false);
    }
  };

  const handleSoftDelete = async () => {
    setDeleteActionLoading(true);
    try {
      await Orders.delete(order.id);
      setDeleteModalOpen(false);
      showNotification(`Замовлення #${order.number} переміщено в кошик`);
      loadOrder();
    } catch (err) {
      showNotification("Помилка видалення: " + err.message, true);
    } finally {
      setDeleteActionLoading(false);
    }
  };

  const handleRestore = async () => {
    setDeleteActionLoading(true);
    try {
      await Orders.restore(order.id);
      showNotification(`Замовлення #${order.number} відновлено`);
      loadOrder();
    } catch (err) {
      showNotification("Помилка відновлення: " + err.message, true);
    } finally {
      setDeleteActionLoading(false);
    }
  };

  if (loading && !order) {
    return (
      <div className="py-12 text-center text-ink/50">
        <div className="inline-block animate-spin mr-2">⏳</div> Завантаження деталей замовлення...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="py-12 text-center">
        <p className="text-ink/60 mb-4">Замовлення не знайдено в базі даних.</p>
        <Link to="/admin/orders" className="btn-primary text-sm">
          ← Повернутися до замовлень
        </Link>
      </div>
    );
  }

  const isCard = order.payment?.method === "card";
  const isPdf =
    (receiptMimeType && receiptMimeType.includes("pdf")) ||
    receiptName.toLowerCase().endsWith(".pdf") ||
    (rawReceiptUrl && rawReceiptUrl.toLowerCase().includes(".pdf"));

  const trackingNumber = order.delivery?.trackingNumber || order.tracking_number;
  const deliveryService = order.delivery?.deliveryService || order.delivery?.provider || "Нова пошта";
  const trackingUrl = order.delivery?.trackingUrl || (
    trackingNumber
      ? deliveryService.toLowerCase().includes("укр")
        ? `https://track.ukrposhta.ua/tracking_UA.html?barcode=${encodeURIComponent(trackingNumber)}`
        : `https://novaposhta.ua/tracking/?cargo_number=${encodeURIComponent(trackingNumber)}`
      : null
  );

  return (
    <div className="max-w-4xl space-y-6">
      {/* Toast */}
      {feedback && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all ${
            feedback.isError ? "bg-red-600 text-white" : "bg-leaf text-white"
          }`}
        >
          {feedback.isError ? "⚠️ " : "✓ "}
          {feedback.text}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-xs">
          <div className="card p-6 max-w-md w-full bg-white shadow-2xl rounded-2xl border border-ink/10 space-y-4">
            <div className="flex items-start gap-3">
              <span className="text-3xl">🗑️</span>
              <div>
                <h3 className="font-serif font-bold text-lg text-ink">
                  Перемістити замовлення #{order.number} у кошик?
                </h3>
                <p className="text-sm text-ink/70 mt-1">
                  Замовлення буде приховано з основного списку, але вся історія залишиться в базі даних. Ви зможете відновити його будь-коли.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-ink/10">
              <button
                type="button"
                disabled={deleteActionLoading}
                onClick={() => setDeleteModalOpen(false)}
                className="btn-secondary text-xs py-2 px-4 rounded-xl min-h-[44px]"
              >
                Скасувати
              </button>
              <button
                type="button"
                disabled={deleteActionLoading}
                onClick={handleSoftDelete}
                className="btn-primary bg-red-600 hover:bg-red-700 text-white text-xs py-2 px-4 rounded-xl min-h-[44px]"
              >
                {deleteActionLoading ? "Переміщення..." : "Перемістити в кошик"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Nova Poshta TTN Creation Modal */}
      {ttnModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-ink/10 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-ink/10">
              <div className="flex items-center gap-2">
                <span className="text-xl">📦</span>
                <h3 className="font-serif font-bold text-lg text-ink">
                  Створення ТТН Нової пошти
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setTtnModalOpen(false)}
                className="text-ink/40 hover:text-ink text-sm p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTtn} className="space-y-3.5 text-xs">
              <div className="bg-[#FAF7F2] p-3.5 rounded-2xl border border-ink/5 space-y-1">
                <div className="font-semibold text-ink">Отримувач:</div>
                <div className="text-ink/75">
                  {order.customer?.firstName} {order.customer?.lastName} • {order.customer?.phone}
                </div>
                <div className="text-ink/75">
                  📍 {order.delivery?.city || "Місто не вказано"}
                </div>
                <div className="text-ink/75">
                  🏤 {order.delivery?.branch || "Відділення не вказано"}
                </div>
              </div>

              {ttnAccounts.length > 0 && (
                <div>
                  <label className="block text-ink/70 font-semibold mb-1">
                    Акаунт відправника:
                  </label>
                  <select
                    value={ttnForm.accountId}
                    onChange={(e) => setTtnForm({ ...ttnForm, accountId: e.target.value })}
                    className="input text-xs"
                  >
                    {ttnAccounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} {acc.senderName ? `(${acc.senderName})` : ""} {acc.cityName ? `— ${acc.cityName}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-ink/70 font-semibold mb-1">Вага посилки (кг):</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={ttnForm.weight}
                    onChange={(e) => setTtnForm({ ...ttnForm, weight: e.target.value })}
                    className="input text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-ink/70 font-semibold mb-1">Оголошена вартість (грн):</label>
                  <input
                    type="number"
                    min="1"
                    value={ttnForm.cost}
                    onChange={(e) => setTtnForm({ ...ttnForm, cost: e.target.value })}
                    className="input text-xs"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-ink/70 font-semibold mb-1">Опис відправлення:</label>
                <input
                  type="text"
                  value={ttnForm.description}
                  onChange={(e) => setTtnForm({ ...ttnForm, description: e.target.value })}
                  className="input text-xs"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-ink/10">
                <button
                  type="button"
                  disabled={ttnSubmitting}
                  onClick={() => setTtnModalOpen(false)}
                  className="btn-secondary text-xs py-2 px-4 rounded-xl"
                >
                  Скасувати
                </button>
                <button
                  type="submit"
                  disabled={ttnSubmitting}
                  className="btn-primary text-xs py-2 px-4 rounded-xl font-semibold shadow-xs flex items-center gap-1.5"
                >
                  {ttnSubmitting ? (
                    <>
                      <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Створення в API...
                    </>
                  ) : (
                    "⚡ Створити ТТН"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/admin/orders"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink/60 hover:text-honey transition-colors"
        >
          <span>←</span> До списку замовлень
        </Link>

        {order.isDeleted ? (
          <span className="badge bg-red-100 text-red-700 text-xs font-bold">
            В кошику (Видалено {order.deletedAt ? new Date(order.deletedAt).toLocaleDateString("uk-UA") : ""})
          </span>
        ) : null}
      </div>

      {/* Deleted Order Warning Banner */}
      {order.isDeleted && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚠️</span>
            <div>
              <span className="font-bold">Це замовлення знаходиться у кошику.</span>
              <p className="text-xs text-amber-800/80">Воно приховане з основного списку замовлень та дашборду.</p>
            </div>
          </div>
          <button
            type="button"
            disabled={deleteActionLoading}
            onClick={handleRestore}
            className="btn-primary bg-leaf hover:bg-leaf/90 text-white text-xs py-2 px-4 rounded-xl self-start sm:self-auto font-semibold shadow-xs"
          >
            {deleteActionLoading ? "Відновлення..." : "🔄 Відновити замовлення"}
          </button>
        </div>
      )}

      {/* Main Header Card */}
      <div className="card p-4 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="font-serif text-2xl md:text-3xl font-bold text-ink flex items-center gap-2">
              <span>Замовлення</span>
              <span className="font-mono text-xl sm:text-2xl text-amber-900 bg-amber-50 px-2.5 py-0.5 rounded-xl border border-amber-200">
                {order.orderCode || order.order_code || `PAS-${order.number}`}
              </span>
            </h1>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                order.status === "COMPLETED"
                  ? "bg-leaf/20 text-leaf"
                  : order.status === "CANCELLED"
                  ? "bg-red-100 text-red-600"
                  : order.status === "SHIPPED"
                  ? "bg-indigo-100 text-indigo-900"
                  : "bg-honey/15 text-honey"
              }`}
            >
              {STATUS_LABELS[order.status] || order.status}
            </span>
          </div>
          <p className="text-xs text-ink/50 mt-1 break-words">
            Дата оформлення: {new Date(order.createdAt).toLocaleString("uk-UA")} • ID:{" "}
            <span className="font-mono text-ink/40 break-all">{order.id}</span>
          </p>
        </div>

        {/* Change status control & Trash action */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-xs text-ink/60 font-medium whitespace-nowrap">
              Статус:
            </label>
            <select
              value={order.status}
              disabled={saving || order.isDeleted}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="input w-auto min-h-[44px] text-sm cursor-pointer font-medium"
            >
              {STATUSES.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {!order.isDeleted ? (
            <button
              type="button"
              onClick={() => setDeleteModalOpen(true)}
              className="p-2.5 rounded-xl text-ink/40 hover:text-red-600 hover:bg-red-50 border border-ink/10 transition-colors min-h-[44px]"
              title="Перемістити в кошик"
            >
              🗑️
            </button>
          ) : null}
        </div>
      </div>

      {/* Grid of info cards */}
      <div className="grid md:grid-cols-2 gap-5">
        {/* Customer card with Deduplication History */}
        <div className="card p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-ink/5">
            <div className="flex items-center gap-2">
              <span className="text-lg">👤</span>
              <h3 className="font-serif font-bold text-ink">Дані покупця</h3>
            </div>
            {order.customer?.totalOrders ? (
              <span className="text-xs font-semibold bg-honey/15 text-honey px-2.5 py-0.5 rounded-full">
                Замовлень: {order.customer.totalOrders}
              </span>
            ) : null}
          </div>

          <div className="text-sm space-y-2 text-ink/80">
            <div>
              <span className="text-ink/40 text-xs block">ПІБ:</span>
              <span className="font-semibold text-ink text-base">
                {order.customer?.firstName} {order.customer?.lastName}
              </span>
            </div>
            <div>
              <span className="text-ink/40 text-xs block">Номер телефону:</span>
              <a
                href={`tel:${order.customer?.phone}`}
                className="font-medium text-honey hover:underline"
              >
                📞 {order.customer?.phone}
              </a>
            </div>
            {order.customer?.email && (
              <div>
                <span className="text-ink/40 text-xs block">Електронна пошта:</span>
                <a
                  href={`mailto:${order.customer?.email}`}
                  className="font-medium hover:underline text-ink/70"
                >
                  ✉️ {order.customer?.email}
                </a>
              </div>
            )}

            {/* Link to customer profile */}
            <div className="pt-2 border-t border-ink/5 flex items-center justify-between text-xs">
              <span className="text-ink/50">
                Загальна сума покупок: <strong className="text-ink">{order.customer?.totalSpent || order.total} грн</strong>
              </span>
              <Link
                to={`/admin/customers?search=${encodeURIComponent(order.customer?.phone || "")}`}
                className="text-honey hover:underline font-semibold"
              >
                Профіль клієнта →
              </Link>
            </div>
          </div>
        </div>

        {/* Delivery & Tracking (ТТН) card */}
        <div className="card p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-ink/5">
            <div className="flex items-center gap-2">
              <span className="text-lg">🚚</span>
              <h3 className="font-serif font-bold text-ink">Доставка та ТТН</h3>
            </div>
            <button
              type="button"
              onClick={() => setEditingTracking(!editingTracking)}
              className="text-xs text-honey hover:underline font-semibold"
            >
              {editingTracking ? "Скасувати" : trackingNumber ? "Змінити ТТН" : "+ Додати ТТН"}
            </button>
          </div>

          {editingTracking ? (
            <form onSubmit={handleSaveTracking} className="space-y-3 bg-cream/30 p-3 rounded-xl border border-ink/5">
              <div>
                <label className="block text-xs text-ink/60 font-medium mb-1">Служба доставки:</label>
                <select
                  value={deliveryServiceInput}
                  onChange={(e) => setDeliveryServiceInput(e.target.value)}
                  className="input text-xs"
                >
                  <option value="Нова пошта">Нова пошта</option>
                  <option value="Укрпошта">Укрпошта</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-ink/60 font-medium mb-1">Номер накладної (ТТН):</label>
                <input
                  type="text"
                  placeholder="Введіть номер ТТН..."
                  value={trackingNumberInput}
                  onChange={(e) => setTrackingNumberInput(e.target.value)}
                  className="input text-xs font-mono"
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setEditingTracking(false)}
                  className="btn-secondary text-xs py-1.5 px-3 rounded-lg"
                >
                  Скасувати
                </button>
                <button
                  type="submit"
                  disabled={savingTracking}
                  className="btn-primary text-xs py-1.5 px-3 rounded-lg"
                >
                  {savingTracking ? "Збереження..." : "Зберегти ТТН"}
                </button>
              </div>
            </form>
          ) : (
            <div className="text-sm space-y-2 text-ink/80">
              <div className="flex justify-between items-baseline">
                <div>
                  <span className="text-ink/40 text-xs block">Служба доставки:</span>
                  <span className="font-semibold text-ink">
                    {deliveryService}
                  </span>
                </div>
                {order.delivery?.shippedAt && (
                  <span className="text-[11px] text-ink/50">
                    Відправлено: {new Date(order.delivery.shippedAt).toLocaleDateString("uk-UA")}
                  </span>
                )}
              </div>

              {/* TTN Section */}
              <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 space-y-2">
                <span className="text-xs text-indigo-900 font-semibold block">Номер накладної (ТТН):</span>
                {trackingNumber ? (
                  <div>
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="font-mono text-base font-bold text-indigo-950 tracking-wider">
                        {trackingNumber}
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => handleCopyTtn(trackingNumber)}
                          className="btn-secondary text-xs py-1 px-2 rounded-lg border-indigo-200 text-indigo-900 bg-white hover:bg-indigo-50"
                        >
                          {copiedTtn ? "✓ Скопійовано" : "📋 Скопіювати"}
                        </button>
                        {trackingUrl && (
                          <a
                            href={trackingUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="btn-primary text-xs py-1 px-2 rounded-lg shadow-2xs inline-flex items-center gap-1"
                          >
                            Відстежити ↗
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={handleFetchLiveTracking}
                          disabled={trackingLoading}
                          className="btn-secondary text-xs py-1 px-2 rounded-lg border-indigo-200 text-indigo-900 bg-white hover:bg-indigo-50"
                        >
                          {trackingLoading ? "..." : "🔄 Статус"}
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelTtn}
                          disabled={ttnCancelling}
                          className="text-xs text-red-600 hover:text-red-800 underline ml-1"
                        >
                          {ttnCancelling ? "..." : "Скасувати"}
                        </button>
                      </div>
                    </div>

                    {trackingLiveStatus && (
                      <div className="mt-2.5 p-2.5 rounded-lg bg-white border border-indigo-200 text-xs text-indigo-950 space-y-1">
                        <div className="font-semibold flex items-center justify-between">
                          <span>Статус Нової пошти:</span>
                          <span className="text-[10px] bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded">
                            Код {trackingLiveStatus.statusCode}
                          </span>
                        </div>
                        <div className="text-ink/80">{trackingLiveStatus.statusDescription}</div>
                        {trackingLiveStatus.scheduledDeliveryDate && (
                          <div className="text-[11px] text-ink/60">
                            Орієнтовна доставка: {trackingLiveStatus.scheduledDeliveryDate}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-indigo-700/70 space-y-2">
                    <div className="italic">ТТН ще не додано.</div>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={openTtnModal}
                        className="btn-primary text-xs py-1.5 px-3 rounded-xl shadow-2xs font-semibold inline-flex items-center gap-1.5"
                      >
                        <span>⚡</span>
                        <span>Створити ТТН через Нову Пошту</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingTracking(true)}
                        className="btn-secondary text-xs py-1.5 px-3 rounded-xl font-medium"
                      >
                        Ввести вручну
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Destination Block */}
              <div className="pt-2 border-t border-ink/5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
                    <span>📍</span>
                    <span>Пункт призначення доставки</span>
                  </span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-900 border border-amber-500/20 font-bold">
                    {order.orderCode || order.order_code || `PAS-${order.number}`}
                  </span>
                </div>

                <div className="bg-[#FAF6EE] rounded-xl p-3 border border-ink/10 space-y-2.5 text-xs">
                  <div className="flex justify-between items-baseline gap-2">
                    <span className="text-ink/50">Служба:</span>
                    <span className="font-bold text-ink flex items-center gap-1">
                      <span>{deliveryService.toLowerCase().includes("укр") ? "📮" : "📦"}</span>
                      <span>{deliveryService}</span>
                    </span>
                  </div>

                  <div className="flex justify-between items-baseline gap-2">
                    <span className="text-ink/50">Населений пункт:</span>
                    <span className="font-semibold text-ink text-right">
                      {order.delivery?.city || "Не вказано"}
                    </span>
                  </div>

                  {order.delivery?.region && (
                    <div className="flex justify-between items-baseline gap-2">
                      <span className="text-ink/50">Область:</span>
                      <span className="font-medium text-ink/80 text-right">
                        {order.delivery.region}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-baseline gap-2">
                    <span className="text-ink/50">Відділення:</span>
                    <span className="font-semibold text-ink text-right">
                      {order.delivery?.branch || "Не вказано"}
                    </span>
                  </div>

                  {order.delivery?.warehouseAddress && order.delivery.warehouseAddress !== order.delivery.branch && (
                    <div className="flex justify-between items-baseline gap-2">
                      <span className="text-ink/50">Адреса відділення:</span>
                      <span className="font-medium text-ink text-right max-w-[65%]">
                        {order.delivery.warehouseAddress}
                      </span>
                    </div>
                  )}

                  {(order.delivery?.warehouseRef || order.delivery?.branchId) && (
                    <div className="flex justify-between items-center gap-2 pt-1 border-t border-ink/5">
                      <span className="text-ink/50">ID / Ref відділення:</span>
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-[11px] text-ink/60 select-all">
                          {order.delivery?.warehouseRef || order.delivery?.branchId}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard?.writeText(order.delivery?.warehouseRef || order.delivery?.branchId);
                            showNotification("Ref відділення скопійовано");
                          }}
                          className="text-amber-800 hover:text-amber-900 text-[10px] ml-1 p-0.5"
                          title="Скопіювати Ref"
                        >
                          📋
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-baseline gap-2 pt-1 border-t border-ink/5">
                    <span className="text-ink/50">Статус доставки:</span>
                    <span className="font-bold text-ink">
                      {STATUS_LABELS[order.status] || order.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Payment card */}
        <div className="card p-5 space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-ink/5">
            <span className="text-lg">💳</span>
            <h3 className="font-serif font-bold text-ink">Оплата</h3>
          </div>
          <div className="text-sm space-y-3">
            <div className="flex justify-between items-baseline border-b border-ink/5 pb-2">
              <span className="text-ink/60">Спосіб розрахунку:</span>
              <span className="font-semibold text-ink">
                {isCard ? "Оплачено наперед (на реквізити)" : "Оплата при отриманні (післяплата)"}
              </span>
            </div>

            <div className="flex justify-between items-baseline border-b border-ink/5 pb-2">
              <span className="text-ink/60">Статус оплати:</span>
              <div className="flex items-center gap-2">
                {order.status === "PAID" || order.payment?.status === "PAID" ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    ✓ Оплачено
                  </span>
                ) : isCard ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-200">
                    Очікує підтвердження
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                    Очікує оплати при отриманні
                  </span>
                )}
              </div>
            </div>

            {/* Confirm Payment action for admin */}
            {(order.status === "AWAITING_PAYMENT" || (isCard && order.status !== "PAID" && order.status !== "COMPLETED")) && (
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-xs text-emerald-900">
                  <span className="font-bold block">Перевірили надходження коштів?</span>
                  <span className="text-emerald-700">Підтвердіть для переведення в статус PAID.</span>
                </div>
                <button
                  type="button"
                  disabled={paymentConfirming}
                  onClick={handleConfirmPayment}
                  className="btn-primary bg-emerald-600 hover:bg-emerald-700 text-white text-xs py-2 px-3.5 rounded-xl shadow-xs font-semibold whitespace-nowrap self-start sm:self-auto"
                >
                  {paymentConfirming ? "Підтвердження..." : "✓ Підтвердити оплату"}
                </button>
              </div>
            )}

            {/* Receipt section */}
            <div>
              <span className="text-ink/60 text-xs block mb-1.5">Прикріплена квитанція / чек:</span>
              {isCard ? (
                rawReceiptUrl ? (
                  receiptLoading ? (
                    <div className="p-3 rounded-xl bg-cream/40 border border-ink/5 text-xs text-ink/60 flex items-center gap-2">
                      <span className="inline-block animate-spin">⏳</span> Завантаження чека...
                    </div>
                  ) : receiptUnavailable ? (
                    <div className="p-3 rounded-xl bg-amber-50/90 border border-amber-200/80 text-sm text-amber-900 flex items-start gap-2.5">
                      <span className="text-base select-none mt-0.5">⚠️</span>
                      <div>
                        <div className="font-semibold text-amber-950">Файл чека недоступний</div>
                        <div className="text-xs text-amber-800/80 mt-0.5">
                          Оригінальний файл ({receiptName}) відсутній на сервері або сесія застаріла.
                        </div>
                      </div>
                    </div>
                  ) : receiptBlobUrl ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <a
                          href={receiptBlobUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-primary text-xs py-1.5 px-3 inline-flex items-center gap-1.5 shadow-2xs"
                        >
                          <span>{isPdf ? "📄" : "📎"}</span> Відкрити оригінал чека
                        </a>
                        <span className="text-xs text-ink/50 truncate max-w-[200px]">{receiptName}</span>
                      </div>

                      {isPdf ? (
                        <div className="mt-3 p-4 bg-cream/40 rounded-xl border border-ink/10 flex items-center gap-3 max-w-sm">
                          <span className="text-3xl">📄</span>
                          <div>
                            <div className="font-medium text-sm text-ink">{receiptName}</div>
                            <div className="text-xs text-ink/50">PDF-документ квитанції</div>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-3 p-2 bg-cream/40 rounded-xl border border-ink/10 max-w-xs">
                          <a href={receiptBlobUrl} target="_blank" rel="noreferrer" title="Натисніть для збільшення">
                            <img
                              src={receiptBlobUrl}
                              alt={receiptName}
                              className="w-full h-auto max-h-48 object-contain rounded-lg border border-ink/5 hover:opacity-95"
                            />
                          </a>
                        </div>
                      )}
                    </div>
                  ) : null
                ) : (
                  <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600">
                    ⚠️ Клієнт обрав оплату зараз, але не надав файл квитанції.
                  </div>
                )
              ) : (
                <span className="text-xs text-ink/40">Для оплати при отриманні чек не вимагається.</span>
              )}
            </div>
          </div>
        </div>

        {/* Order comments & notes */}
        <div className="card p-5 space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-ink/5">
            <span className="text-lg">💬</span>
            <h3 className="font-serif font-bold text-ink">Коментар до замовлення</h3>
          </div>
          <div className="p-3 bg-cream/30 rounded-xl border border-ink/5 text-sm text-ink/80 min-h-[90px] whitespace-pre-wrap">
            {order.comment?.trim() ? order.comment : "Клієнт не залишив додаткових коментарів."}
          </div>
        </div>
      </div>

      {/* Ordered Products */}
      <div className="card p-4 sm:p-6 space-y-4">
        <h3 className="font-serif text-lg font-bold text-ink">Склад замовлення</h3>

        {/* Mobile Items List (sm:hidden) */}
        <div className="sm:hidden space-y-2.5">
          {order.items?.map((item, idx) => (
            <div key={item.id || item.product_id || idx} className="p-3 rounded-xl bg-cream/30 border border-ink/5 space-y-1.5 text-xs">
              <div className="flex justify-between font-medium text-ink text-sm">
                <span>{item.name}</span>
                <span className="font-bold">{item.price * item.qty} грн</span>
              </div>
              <div className="flex justify-between text-ink/60">
                <span>{item.weight || "—"}</span>
                <span>{item.qty} шт × {item.price} грн</span>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table (hidden sm:block) */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-ink/50 border-b border-ink/5 text-xs">
                <th className="pb-2">Товар</th>
                <th className="pb-2 text-center">Кількість</th>
                <th className="pb-2 text-right">Ціна за од.</th>
                <th className="pb-2 text-right">Сума</th>
              </tr>
            </thead>
            <tbody>
              {order.items?.map((item, idx) => (
                <tr key={item.id || item.product_id || idx} className="border-b border-ink/5 last:border-0">
                  <td className="py-3">
                    <span className="font-medium text-ink">{item.name}</span>
                    {item.weight && (
                      <span className="text-xs text-ink/50 ml-1.5">({item.weight})</span>
                    )}
                  </td>
                  <td className="py-3 text-center font-mono">
                    {item.qty} шт
                  </td>
                  <td className="py-3 text-right text-ink/70">
                    {item.price} грн
                  </td>
                  <td className="py-3 text-right font-semibold text-ink">
                    {item.price * item.qty} грн
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Total Summary */}
        <div className="pt-4 border-t border-ink/10 flex justify-end">
          <div className="w-full max-w-xs space-y-2 text-sm">
            <div className="flex justify-between text-ink/70">
              <span>Сума товарів:</span>
              <span className="font-semibold text-ink">{order.total} грн</span>
            </div>
            <div className="flex justify-between text-ink/70">
              <span>Доставка:</span>
              <span className="text-xs text-ink/50">за тарифами перевізника</span>
            </div>
            <div className="flex justify-between items-baseline pt-2 border-t border-ink/10 font-serif text-xl font-bold text-ink">
              <span>До сплати:</span>
              <span className="text-honey">{order.total} грн</span>
            </div>
          </div>
        </div>
      </div>

      {/* Status History Timeline (Section 15) */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-ink/5">
          <span className="text-lg">📜</span>
          <h3 className="font-serif font-bold text-ink">Історія статусів замовлення</h3>
        </div>

        {order.statusHistory && order.statusHistory.length > 0 ? (
          <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-ink/10">
            {order.statusHistory.map((h, i) => (
              <div key={h.id || i} className="relative">
                {/* Bullet */}
                <div className="absolute -left-6 top-1.5 w-3 h-3 rounded-full bg-honey ring-4 ring-cream" />
                <div className="text-xs space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-ink">
                      {h.fromStatus ? `${STATUS_LABELS[h.fromStatus] || h.fromStatus} ➔ ` : "Створено ➔ "}
                      {STATUS_LABELS[h.toStatus] || h.toStatus}
                    </span>
                    <span className="text-ink/40">•</span>
                    <span className="text-ink/50">
                      {new Date(h.createdAt).toLocaleString("uk-UA")}
                    </span>
                    <span className="px-1.5 py-0.2 bg-cream text-ink/60 rounded text-[10px] font-mono">
                      {h.changedBy || "system"}
                    </span>
                  </div>
                  {h.comment && (
                    <p className="text-ink/70 text-xs italic mt-0.5">
                      «{h.comment}»
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-ink/40 italic">
            Історія переходів статусів фіксується автоматично при кожній зміні.
          </p>
        )}
      </div>
    </div>
  );
}
