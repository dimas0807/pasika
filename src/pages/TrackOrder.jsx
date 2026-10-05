import { useState, useEffect, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Orders } from "../data/db";
import {
  IconSearch,
  IconTruck,
  IconCreditCard,
  IconClock,
  IconCheckCircle,
  IconCopy,
  IconClose,
} from "../components/Icons";

const STATUS_CONFIG = {
  NEW: { label: "Нове", color: "bg-slate-800 text-slate-200 border-slate-700", icon: "📦" },
  CONFIRMED: { label: "Підтверджено", color: "bg-amber-950/60 text-amber-300 border-amber-700/60", icon: "✓" },
  PROCESSING: { label: "В обробці", color: "bg-blue-950/60 text-blue-300 border-blue-700/60", icon: "⏳" },
  COOKING: { label: "Готується в коптильні", color: "bg-orange-950/60 text-orange-300 border-orange-700/60", icon: "🔥" },
  AWAITING_PAYMENT: { label: "Очікує оплати", color: "bg-amber-950/60 text-amber-300 border-amber-700/60", icon: "💳" },
  PAID: { label: "Оплачено", color: "bg-emerald-950/60 text-emerald-300 border-emerald-700/60", icon: "✓" },
  PACKED: { label: "Запаковано", color: "bg-indigo-950/60 text-indigo-300 border-indigo-700/60", icon: "❄️" },
  SHIPMENT_CREATED: { label: "Створено ТТН", color: "bg-purple-950/60 text-purple-300 border-purple-700/60", icon: "🚚" },
  SHIPPED: { label: "Відправлено Новою Поштою", color: "bg-teal-950/60 text-teal-300 border-teal-700/60", icon: "🚚" },
  DELIVERED: { label: "Доставлено у відділення", color: "bg-sky-950/60 text-sky-300 border-sky-700/60", icon: "📍" },
  COMPLETED: { label: "Виконано", color: "bg-emerald-900/80 text-emerald-200 border-emerald-600/60", icon: "🥩" },
  CANCELLED: { label: "Скасовано", color: "bg-rose-950/60 text-rose-300 border-rose-700/60", icon: "✕" },
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
    color: "bg-stone-900 text-stone-200 border-stone-700",
    icon: "🥩",
  }) : null;

  return (
    <div className="bg-[#121110] text-[#F4EFEA] min-h-[75vh] py-8 sm:py-12 md:py-16">
      <div className="container-p max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#1C1815] text-3xl shadow-sm mb-3.5 border border-bronze/40">
            🥩
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#F4EFEA] tracking-tight">
            Відстеження замовлення
          </h1>
          <p className="text-[#A3988E] text-xs sm:text-sm md:text-base mt-2 max-w-md mx-auto leading-relaxed">
            Введіть номер вашого замовлення у форматі <span className="font-bold text-bronze">GAL-10001</span> або номер накладної ТТН
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="flex flex-col sm:flex-row gap-2.5 bg-[#1C1815] p-2.5 rounded-2xl shadow-xl border border-[#332A22]">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-3.5 flex items-center text-[#8C8074]">
                <IconSearch className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                placeholder="Наприклад: GAL-10001"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#141210] border border-[#2F2821] text-[#F4EFEA] text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-bronze/50 placeholder:text-[#6C6359] font-mono sm:font-sans font-medium"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading || !inputCode.trim()}
              className="btn-primary py-3 px-6 text-sm font-bold whitespace-nowrap shadow-sm disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-[#141210] border-t-transparent rounded-full animate-spin" />
                  Пошук...
                </span>
              ) : (
                "Знайти замовлення"
              )}
            </button>
          </div>
        </form>

        {/* Error message */}
        {error && (
          <div className="p-4 mb-8 rounded-2xl bg-rose-950/40 border border-rose-800 text-rose-300 text-sm flex items-start gap-3 animate-fadeIn">
            <div className="w-5 h-5 rounded-full bg-rose-900 text-rose-200 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
              !
            </div>
            <div className="flex-1">
              <div className="font-semibold">{error}</div>
              <div className="text-xs text-rose-400 mt-0.5">
                Перевірте правильність написання номера (наприклад, GAL-10001). Якщо виникли труднощі, напишіть Галині у Viber.
              </div>
            </div>
          </div>
        )}

        {/* Order Details View */}
        {orderData && (
          <div className="space-y-5 sm:space-y-6 animate-fadeIn">
            {/* Status Card */}
            <div className="bg-[#1C1815] rounded-3xl p-5 sm:p-7 shadow-xl border border-[#2F2821]">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-5 sm:pb-6 border-b border-[#2C2621]">
                <div>
                  <div className="text-xs uppercase tracking-wider text-[#8C8074] font-semibold mb-1">
                    Замовлення
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xl sm:text-2xl font-bold text-[#F4EFEA]">
                      {orderData.orderCode}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(orderData.orderCode)}
                      className="p-1.5 text-xs text-[#8C8074] hover:text-bronze hover:bg-[#25201C] rounded-lg transition-colors flex items-center gap-1 border border-[#3A332B]"
                      title="Скопіювати номер"
                    >
                      <IconCopy className="w-3.5 h-3.5" />
                      <span>{copied ? "Скопійовано" : "Копія"}</span>
                    </button>
                  </div>
                  <div className="text-xs text-[#8C8074] mt-1">
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
                <div className="bg-[#141210] p-4 rounded-2xl border border-[#2A241F]">
                  <div className="text-xs font-semibold text-[#8C8074] uppercase tracking-wider mb-1">
                    Служба доставки
                  </div>
                  <div className="text-sm font-semibold text-[#F4EFEA]">
                    {orderData.delivery.service || "Нова Пошта"}
                  </div>
                  {(orderData.delivery.city || orderData.delivery.branch) && (
                    <div className="text-xs text-[#CFC5BA] mt-1.5 leading-relaxed space-y-1">
                      {orderData.delivery.city && (
                        <div className="font-medium text-[#F4EFEA]">
                          📍 {orderData.delivery.city}
                          {orderData.delivery.region && !orderData.delivery.city.includes(orderData.delivery.region) ? ` (${orderData.delivery.region})` : ""}
                        </div>
                      )}
                      {orderData.delivery.branch && (
                        <div className="text-[#CFC5BA] font-medium">
                          🏤 {orderData.delivery.branch}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="bg-[#141210] p-4 rounded-2xl border border-[#2A241F] flex flex-col justify-between">
                  <div>
                    <div className="text-xs font-semibold text-[#8C8074] uppercase tracking-wider mb-1">
                      Номер накладної (ТТН)
                    </div>
                    {orderData.delivery.trackingNumber ? (
                      <div className="font-mono text-base font-bold text-bronze flex items-center gap-2">
                        <span>{orderData.delivery.trackingNumber}</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(orderData.delivery.trackingNumber)}
                          className="p-1 text-xs text-[#8C8074] hover:text-bronze rounded transition-colors"
                          title="Скопіювати ТТН"
                        >
                          <IconCopy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="text-xs text-[#8C8074] italic">
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
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-bronze hover:underline"
                      >
                        Перевірити на сайті Нової Пошти ↗
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Products List Card */}
            <div className="bg-[#1C1815] rounded-3xl p-5 sm:p-7 shadow-xl border border-[#2F2821]">
              <h2 className="font-serif text-lg font-bold text-[#F4EFEA] mb-4">
                Склад замовлення
              </h2>
              <div className="divide-y divide-[#28221D]">
                {orderData.items?.map((item, idx) => (
                  <div key={idx} className="py-3 flex items-center justify-between text-sm">
                    <div className="flex-1 pr-4">
                      <div className="font-semibold text-[#F4EFEA]">{item.name}</div>
                      {item.weight && (
                        <div className="text-xs text-[#8C8074] mt-0.5">Вага: {item.weight}</div>
                      )}
                    </div>
                    <div className="text-right whitespace-nowrap">
                      <div className="text-xs text-[#8C8074]">
                        {item.qty} × {item.price} грн
                      </div>
                      <div className="font-semibold text-[#F4EFEA]">
                        {item.qty * item.price} грн
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-[#2C2621] flex items-center justify-between">
                <span className="font-semibold text-[#F4EFEA] text-base">Всього:</span>
                <span className="font-serif text-xl font-bold text-bronze">
                  {orderData.total} грн
                </span>
              </div>
            </div>

            {/* Status History Timeline Card */}
            {orderData.statusHistory && orderData.statusHistory.length > 0 && (
              <div className="bg-[#1C1815] rounded-3xl p-5 sm:p-7 shadow-xl border border-[#2F2821]">
                <h2 className="font-serif text-lg font-bold text-[#F4EFEA] mb-5">
                  Історія зміни статусу
                </h2>
                <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#2F2821]">
                  {orderData.statusHistory.map((h, i) => {
                    const hConfig = STATUS_CONFIG[h.toStatus] || {
                      label: h.toStatus,
                      icon: "•",
                    };
                    return (
                      <div key={i} className="flex items-start gap-4 relative">
                        <div className="w-6 h-6 rounded-full bg-[#181614] border-2 border-bronze text-bronze flex items-center justify-center text-xs shrink-0 z-10 shadow-xs">
                          {hConfig.icon}
                        </div>
                        <div className="flex-1 bg-[#141210] p-3.5 rounded-2xl border border-[#2A241F] text-xs sm:text-sm">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-semibold text-[#F4EFEA]">
                              {hConfig.label}
                            </span>
                            <span className="text-[11px] text-[#8C8074]">
                              {formatDate(h.createdAt)}
                            </span>
                          </div>
                          {h.comment && (
                            <div className="text-[#CFC5BA] text-xs mt-1">
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
            <div className="text-center p-6 bg-[#181614] rounded-3xl border border-[#2F2821]">
              <p className="text-xs sm:text-sm text-[#A3988E]">
                Виникли запитання щодо замовлення? Напишіть Галині у Viber або зателефонуйте:{" "}
                <Link to="/contacts" className="text-bronze font-bold hover:underline">
                  Контакти
                </Link>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
