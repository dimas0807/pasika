import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Orders, resolveReceiptUrl } from "../data/db";

const STATUSES = [
  { key: "NEW", label: "Нове" },
  { key: "PROCESSING", label: "В обробці" },
  { key: "PACKED", label: "Запаковано" },
  { key: "SHIPPED", label: "Відправлено" },
  { key: "COMPLETED", label: "Виконано" },
  { key: "CANCELLED", label: "Скасовано" },
];

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(() => Orders.byId(id));
  const [loading, setLoading] = useState(!order);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

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
        if (o) setOrder(o);
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
    setReceiptUnavailable(false);

    fetch(fetchUrl, { credentials: "include" })
      .then(async (res) => {
        if (!active) return;
        if (!res.ok) {
          setReceiptUnavailable(true);
          setReceiptBlobUrl(null);
          return;
        }
        const contentType = res.headers.get("content-type") || "";
        if (contentType.includes("text/html")) {
          // Reject SPA HTML fallback (e.g. 404 rewrite)
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
      showNotification(`Статус змінено на "${STATUSES.find((s) => s.key === newStatus)?.label || newStatus}"`);
    } catch (err) {
      showNotification("Помилка зміни статусу: " + err.message, true);
    } finally {
      setSaving(false);
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

      {/* Breadcrumb & Navigation */}
      <div>
        <Link
          to="/admin/orders"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink/60 hover:text-honey transition-colors"
        >
          <span>←</span> До списку замовлень
        </Link>
      </div>

      {/* Main Header */}
      <div className="card p-4 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="font-serif text-2xl md:text-3xl font-bold text-ink">
              Замовлення #{order.number}
            </h1>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                order.status === "COMPLETED"
                  ? "bg-leaf/20 text-leaf"
                  : order.status === "CANCELLED"
                  ? "bg-red-100 text-red-600"
                  : "bg-honey/15 text-honey"
              }`}
            >
              {STATUSES.find((s) => s.key === order.status)?.label || order.status}
            </span>
          </div>
          <p className="text-xs text-ink/50 mt-1 break-words">
            Дата оформлення: {new Date(order.createdAt).toLocaleString("uk-UA")} • ID:{" "}
            <span className="font-mono text-ink/40 break-all">{order.id}</span>
          </p>
        </div>

        {/* Change status control */}
        <div className="flex items-center gap-2 flex-wrap">
          <label className="text-xs text-ink/60 font-medium whitespace-nowrap">
            Змінити статус:
          </label>
          <select
            value={order.status}
            disabled={saving}
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
      </div>

      {/* Grid of info cards */}
      <div className="grid md:grid-cols-2 gap-5">
        {/* Customer card */}
        <div className="card p-5 space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-ink/5">
            <span className="text-lg">👤</span>
            <h3 className="font-serif font-bold text-ink">Дані покупця</h3>
          </div>
          <div className="text-sm space-y-1.5 text-ink/80">
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
          </div>
        </div>

        {/* Delivery card */}
        <div className="card p-5 space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-ink/5">
            <span className="text-lg">🚚</span>
            <h3 className="font-serif font-bold text-ink">Доставка</h3>
          </div>
          <div className="text-sm space-y-1.5 text-ink/80">
            <div>
              <span className="text-ink/40 text-xs block">Служба доставки:</span>
              <span className="font-semibold text-ink">
                {order.delivery?.provider || "Нова пошта"}
              </span>
            </div>
            <div>
              <span className="text-ink/40 text-xs block">Населений пункт:</span>
              <span className="font-medium text-ink">
                📍 {order.delivery?.city || "Не вказано"}
              </span>
            </div>
            <div>
              <span className="text-ink/40 text-xs block">Відділення / Адреса:</span>
              <span className="font-medium text-ink">
                🏤 {order.delivery?.branch || "Не вказано"}
              </span>
            </div>
          </div>
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
              {isCard ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-200">
                  Чек на перевірці
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                  Очікує оплати при отриманні
                </span>
              )}
            </div>

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
    </div>
  );
}
