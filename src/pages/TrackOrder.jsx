import { useState, useEffect, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Orders } from "../data/db";
import {
  IconSearch,
  IconBox,
  IconTruck,
  IconCreditCard,
  IconClock,
  IconCheckCircle,
  IconCopy,
  IconClose,
} from "../components/Icons";

const STATUS_CONFIG = {
  NEW: { label: "Нове", color: "bg-slate-50 text-slate-700 border-slate-200", icon: <IconBox className="w-3.5 h-3.5" /> },
  PROCESSING: { label: "В обробці", color: "bg-blue-50 text-blue-700 border-blue-200", icon: <IconClock className="w-3.5 h-3.5" /> },
  AWAITING_PAYMENT: { label: "Очікує оплати", color: "bg-amber-50 text-amber-800 border-amber-200", icon: <IconClock className="w-3.5 h-3.5" /> },
  PAID: { label: "Оплачено", color: "bg-emerald-50 text-emerald-800 border-emerald-200", icon: <IconCreditCard className="w-3.5 h-3.5" /> },
  PACKED: { label: "Запаковано", color: "bg-indigo-50 text-indigo-700 border-indigo-200", icon: <IconBox className="w-3.5 h-3.5" /> },
  SHIPMENT_CREATED: { label: "Створено ТТН", color: "bg-purple-50 text-purple-700 border-purple-200", icon: <IconTruck className="w-3.5 h-3.5" /> },
  SHIPPED: { label: "Відправлено", color: "bg-teal-50 text-teal-800 border-teal-200", icon: <IconTruck className="w-3.5 h-3.5" /> },
  DELIVERED: { label: "Доставлено", color: "bg-sky-50 text-sky-800 border-sky-200", icon: <IconCheckCircle className="w-3.5 h-3.5" /> },
  COMPLETED: { label: "Виконано", color: "bg-green-50 text-green-800 border-green-200", icon: <IconCheckCircle className="w-3.5 h-3.5" /> },
  CANCELLED: { label: "Скасовано", color: "bg-rose-50 text-rose-700 border-rose-200", icon: <IconClose className="w-3.5 h-3.5" /> },
};

export default function TrackOrder() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCode = searchParams.get("code") || "";

  const [inputCode, setInputCode] = useState(initialCode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [orderData, setOrderData] = useState(null);
  const [copied, setCopied] = useState(false);

  const fetchTracking = useCallback(async (codeToSearch) => {
    const q = (codeToSearch || "").trim();
    if (!q) return;

    setLoading(true);
    setError(null);

    try {
      const data = await Orders.track(q);
      setOrderData(data);
      setSearchParams({ code: q });
    } catch (err) {
      setOrderData(null);
      setError(err.message || "Помилка при пошуку замовлення");
    } finally {
      setLoading(false);
    }
  }, [setSearchParams]);

  useEffect(() => {
    if (initialCode) {
      fetchTracking(initialCode);
    }
  }, [initialCode, fetchTracking]);

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchTracking(inputCode);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (ts) => {
    if (!ts) return "";
    return new Date(ts).toLocaleString("uk-UA", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const statusInfo = orderData ? (STATUS_CONFIG[orderData.status] || {
    label: orderData.statusLabel || orderData.status,
    color: "bg-stone-50 text-stone-800 border-stone-200",
    icon: <IconBox className="w-3.5 h-3.5" />,
  }) : null;

  return (
    <div className="bg-[#FAF7F2] min-h-[75vh] py-8 sm:py-12 md:py-16">
      <div className="container-p max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-amber-100 text-honey shadow-sm mb-3.5 border border-amber-900/10">
            <IconBox className="w-6 h-6" />
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-extrabold text-ink tracking-tight">
            Відстеження замовлення
          </h1>
          <p className="text-ink/65 text-xs sm:text-sm md:text-base mt-2 max-w-md mx-auto leading-relaxed">
            Введіть номер вашого замовлення у форматі <span className="font-semibold text-ink">PAS-10001</span> або номер накладної, щоб дізнатися актуальний статус
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="flex flex-col sm:flex-row gap-2.5 bg-white/90 backdrop-blur-md p-2 sm:p-2.5 rounded-2xl shadow-[0_4px_20px_rgba(41,40,33,0.04)] border border-amber-900/10">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-3.5 flex items-center text-ink/40">
                <IconSearch className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                placeholder="Наприклад: PAS-10001"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-transparent border-none text-ink text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-honey/50 placeholder:text-ink/40 font-mono sm:font-sans font-medium"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading || !inputCode.trim()}
              className="btn-primary py-3 px-6 text-sm font-semibold whitespace-nowrap shadow-sm disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Пошук...
                </span>
              ) : (
                "Відстежити"
              )}
            </button>
          </div>
        </form>

        {/* Error message */}
        {error && (
          <div className="p-4 mb-8 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3 animate-fadeIn">
            <div className="w-5 h-5 rounded-full bg-rose-200 text-rose-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
              !
            </div>
            <div className="flex-1">
              <div className="font-semibold">{error}</div>
              <div className="text-xs text-rose-600 mt-0.5">
                Перевірте правильність написання номера (наприклад, PAS-10001 або 10001). Номер замовлення надсилається при оформленні.
              </div>
            </div>
          </div>
        )}

        {/* Order Details View */}
        {orderData && (
          <div className="space-y-5 sm:space-y-6 animate-fadeIn">
            {/* Status Card */}
            <div className="bg-white/85 backdrop-blur-md rounded-3xl p-5 sm:p-7 shadow-[0_4px_24px_rgba(41,40,33,0.04)] border border-amber-900/10">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-5 sm:pb-6 border-b border-ink/10">
                <div>
                  <div className="text-xs uppercase tracking-wider text-ink/50 font-semibold mb-1">
                    Замовлення
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xl sm:text-2xl font-bold text-ink">
                      {orderData.orderCode}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(orderData.orderCode)}
                      className="p-1.5 text-xs text-ink/60 hover:text-honey hover:bg-cream/60 rounded-lg transition-colors flex items-center gap-1 border border-amber-900/10"
                      title="Скопіювати номер"
                    >
                      <IconCopy className="w-3.5 h-3.5" />
                      <span>{copied ? "Скопійовано" : "Копія"}</span>
                    </button>
                  </div>
                  <div className="text-xs text-ink/60 mt-1">
                    Оформлено: {formatDate(orderData.createdAt)}
                  </div>
                </div>

                <div>
                  <span
                    className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold border ${statusInfo.color}`}
                  >
                    <span>{statusInfo.icon}</span>
                    <span>{statusInfo.label}</span>
                  </span>
                </div>
              </div>

              {/* Delivery info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-5 sm:pt-6">
                <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-amber-900/5">
                  <div className="text-xs font-semibold text-ink/50 uppercase tracking-wider mb-1">
                    Служба доставки
                  </div>
                  <div className="text-sm font-semibold text-ink">
                    {orderData.delivery.service || "Нова Пошта"}
                  </div>
                  {(orderData.delivery.city || orderData.delivery.branch) && (
                    <div className="text-xs text-ink/75 mt-1 leading-relaxed">
                      {orderData.delivery.city && <div>{orderData.delivery.city}</div>}
                      {orderData.delivery.branch && <div className="text-ink/60">{orderData.delivery.branch}</div>}
                    </div>
                  )}
                </div>

                <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-amber-900/5 flex flex-col justify-between">
                  <div>
                    <div className="text-xs font-semibold text-ink/50 uppercase tracking-wider mb-1">
                      Номер накладної (ТТН)
                    </div>
                    {orderData.delivery.trackingNumber ? (
                      <div className="font-mono text-base font-bold text-ink flex items-center gap-2">
                        <span>{orderData.delivery.trackingNumber}</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(orderData.delivery.trackingNumber)}
                          className="p-1 text-xs text-ink/50 hover:text-honey rounded transition-colors"
                          title="Скопіювати ТТН"
                        >
                          <IconCopy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="text-xs text-ink/55 italic">
                        ТТН буде сформовано після пакування посилки
                      </div>
                    )}
                  </div>

                  {orderData.delivery.trackingUrl && (
                    <div className="mt-3">
                      <a
                        href={orderData.delivery.trackingUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-honey hover:text-accent transition-colors"
                      >
                        Перевірити на сайті перевізника ↗
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Products List Card */}
            <div className="bg-white/85 backdrop-blur-md rounded-3xl p-5 sm:p-7 shadow-[0_4px_24px_rgba(41,40,33,0.04)] border border-amber-900/10">
              <h2 className="font-serif text-lg font-bold text-ink mb-4">
                Склад замовлення
              </h2>
              <div className="divide-y divide-ink/5">
                {orderData.items?.map((item, idx) => (
                  <div key={idx} className="py-3 flex items-center justify-between text-sm">
                    <div className="flex-1 pr-4">
                      <div className="font-semibold text-ink">{item.name}</div>
                      {item.weight && (
                        <div className="text-xs text-ink/50 mt-0.5">Фасування: {item.weight}</div>
                      )}
                    </div>
                    <div className="text-right whitespace-nowrap">
                      <div className="text-xs text-ink/60">
                        {item.qty} × {item.price} грн
                      </div>
                      <div className="font-semibold text-ink">
                        {item.qty * item.price} грн
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-ink/10 flex items-center justify-between">
                <span className="font-semibold text-ink text-base">Всього:</span>
                <span className="font-serif text-xl font-bold text-honey">
                  {orderData.total} грн
                </span>
              </div>
            </div>

            {/* Status History Timeline Card */}
            {orderData.statusHistory && orderData.statusHistory.length > 0 && (
              <div className="bg-white/85 backdrop-blur-md rounded-3xl p-5 sm:p-7 shadow-[0_4px_24px_rgba(41,40,33,0.04)] border border-amber-900/10">
                <h2 className="font-serif text-lg font-bold text-ink mb-5">
                  Історія зміни статусу
                </h2>
                <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-ink/10">
                  {orderData.statusHistory.map((h, i) => {
                    const hConfig = STATUS_CONFIG[h.toStatus] || {
                      label: h.toStatus,
                      icon: <IconBox className="w-3 h-3" />,
                    };
                    return (
                      <div key={i} className="flex items-start gap-4 relative">
                        <div className="w-6 h-6 rounded-full bg-white border-2 border-honey text-honey flex items-center justify-center text-xs shrink-0 z-10 shadow-2xs">
                          {hConfig.icon}
                        </div>
                        <div className="flex-1 bg-[#FAF7F2] p-3.5 rounded-2xl border border-amber-900/5 text-xs sm:text-sm">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-semibold text-ink">
                              {hConfig.label}
                            </span>
                            <span className="text-[11px] text-ink/50">
                              {formatDate(h.createdAt)}
                            </span>
                          </div>
                          {h.comment && (
                            <div className="text-ink/70 text-xs mt-1">
                              {h.comment}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Help box */}
            <div className="text-center p-6 bg-white/60 rounded-3xl border border-amber-900/10">
              <p className="text-xs sm:text-sm text-ink/65">
                Маєте питання щодо вашого замовлення? Зв&apos;яжіться з нами через розділ{" "}
                <Link to="/contacts" className="text-honey font-semibold hover:underline">
                  Контакти
                </Link>{" "}
                або зателефонуйте.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
