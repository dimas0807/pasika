import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { Orders } from "../data/db";
import {
  IconTruck,
  IconCopy,
  IconCheckCircle,
  IconArrowRight,
} from "../components/Icons";

export default function OrderSuccess() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [order, setOrder] = useState(() => Orders.byId(id));
  const [loading, setLoading] = useState(!order);
  const [accessDenied, setAccessDenied] = useState(false);
  const [copiedTtn, setCopiedTtn] = useState(false);

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

  const handleCopyTtn = (ttn) => {
    if (!ttn) return;
    navigator.clipboard.writeText(ttn).then(() => {
      setCopiedTtn(true);
      setTimeout(() => setCopiedTtn(false), 2500);
    });
  };

  if (loading) {
    return (
      <div className="container-p py-24 text-center">
        <div className="text-4xl mb-3 animate-bounce">🥩</div>
        <p className="text-[#A3988E] font-medium text-sm">Завантаження замовлення...</p>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="container-p py-24 text-center max-w-md mx-auto">
        <div className="text-4xl mb-4">🔒</div>
        <h2 className="font-serif text-2xl font-bold text-[#F4EFEA] mb-2">Доступ захищено</h2>
        <p className="text-[#A3988E] text-sm leading-relaxed">
          Для безпеки ваших персональних даних деталі замовлення доступні лише за індивідуальним посиланням.
        </p>
        <Link to="/" className="btn-primary mt-6 inline-flex text-sm">
          На головну
        </Link>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container-p py-24 text-center max-w-md mx-auto">
        <div className="text-4xl mb-4">🥩</div>
        <h2 className="font-serif text-2xl font-bold text-[#F4EFEA] mb-2">Замовлення не знайдено</h2>
        <p className="text-[#A3988E] text-sm">Перевірте номер замовлення або зверніться до Галини у Viber.</p>
        <Link to="/" className="btn-primary mt-6 inline-flex text-sm">
          На головну
        </Link>
      </div>
    );
  }

  const customerName = `${order.customer?.firstName || ""} ${order.customer?.lastName || ""}`.trim();
  const deliveryCity = typeof order.delivery?.city === "object" ? order.delivery.city.name : order.delivery?.city;
  const deliveryBranch = typeof order.delivery?.branch === "object" ? order.delivery.branch.name : order.delivery?.branch;

  const trackingNumber = order.delivery?.trackingNumber || order.tracking_number || order.delivery?.tracking_number;
  const deliveryService = order.delivery?.deliveryService || order.delivery?.provider || "Нова Пошта";
  const trackingUrl = order.delivery?.trackingUrl || (
    trackingNumber
      ? `https://novaposhta.ua/tracking/?cargo_number=${encodeURIComponent(trackingNumber)}`
      : null
  );

  const contactMethodLabel = (val) => {
    switch (val) {
      case "viber": return "🟣 Viber";
      case "telegram": return "✈️ Telegram";
      default: return "📞 Дзвінок телефоном";
    }
  };

  return (
    <div className="container-p py-10 sm:py-16 md:py-20 max-w-lg mx-auto text-center">
      {/* Success icon */}
      <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-emerald-950/60 text-emerald-400 flex items-center justify-center mx-auto shadow-sm ring-4 ring-emerald-500/20 border border-emerald-500/30">
        <IconCheckCircle className="w-9 h-9" />
      </div>

      <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 mt-5 inline-block">
        Замовлення успішно прийнято!
      </span>

      <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-[#F4EFEA] mt-2">
        Дякуємо за замовлення!
      </h1>
      <p className="text-[#A3988E] text-sm sm:text-base mt-2 leading-relaxed">
        Номер вашого замовлення:{" "}
        <span className="font-mono font-bold text-bronze bg-[#241F1A] px-2.5 py-1 rounded border border-bronze/40">
          {order.orderCode || order.order_code || `GAL-${order.number}`}
        </span>
      </p>

      {/* Delivery Tracking Card */}
      {trackingNumber && (
        <div className="p-5 mt-6 text-left bg-[#1C1815] border border-bronze/40 shadow-xl rounded-3xl space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-bronze/20 flex items-center justify-center text-bronze">
                <IconTruck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-base text-[#F4EFEA]">Відстеження доставки</h3>
                <span className="text-xs text-[#8C8074]">{deliveryService}</span>
              </div>
            </div>
            <span className="badge bg-bronze/20 text-bronze font-semibold text-xs border border-bronze/30">
              {order.status === "COMPLETED" ? "Вручено" : "Відправлено"}
            </span>
          </div>

          <div className="p-3.5 bg-[#141210] rounded-2xl border border-[#2F2821] flex items-center justify-between gap-2 flex-wrap">
            <div>
              <span className="text-[11px] text-[#8C8074] block">Номер накладної (ТТН):</span>
              <span className="font-mono font-bold text-base text-[#F4EFEA] tracking-wider">
                {trackingNumber}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleCopyTtn(trackingNumber)}
                className="btn-secondary text-xs py-1.5 px-3 rounded-xl border-[#3A332B] text-[#D1C7BD] bg-[#1C1815] inline-flex items-center gap-1.5"
              >
                <IconCopy className="w-3.5 h-3.5" />
                <span>{copiedTtn ? "Скопійовано" : "Копія"}</span>
              </button>
              {trackingUrl && (
                <a
                  href={trackingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-primary text-xs py-1.5 px-3.5 rounded-xl inline-flex items-center gap-1 font-semibold"
                >
                  Відстежити ↗
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Order Details Card */}
      <div className="p-5 sm:p-6 mt-6 text-left bg-[#1C1815] border border-[#2F2821] shadow-xl rounded-3xl space-y-2.5 text-xs sm:text-sm">
        <Row label="Клієнт" value={customerName} />
        <Row label="Телефон" value={order.customer?.phone} />
        {order.preferredContact && (
          <Row label="Зв'язок" value={contactMethodLabel(order.preferredContact)} />
        )}
        <Row label="Доставка" value={`${order.delivery?.provider || "Нова Пошта"}`} />
        <Row label="Місто" value={deliveryCity} />
        {deliveryBranch && <Row label="Відділення / поштомат" value={deliveryBranch} />}
        <Row
          label="Спосіб оплати"
          value={order.payment?.method === "card" ? "Оплата карткою / IBAN" : "Оплата при отриманні на Новій Пошті"}
        />
        <div className="pt-2 border-t border-[#2F2821]">
          <Row label="Сума замовлення" value={`${order.total} грн`} bold />
        </div>
      </div>

      {/* Galinka Kitchen Confirmation Banner */}
      <div className="mt-5 text-xs card p-4 bg-[#1C1815] border border-bronze/30 rounded-2xl flex items-center gap-3 text-left">
        <span className="text-2xl shrink-0">👩‍🍳</span>
        <div>
          <div className="font-bold text-[#F4EFEA]">Галинка вже обробляє замовлення</div>
          <div className="text-[11px] text-[#A3988E] mt-0.5">
            Свіжі страви будуть надійно запаковані у термобокс з холодом та передані Новій Пошті.
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          to={`/track-order?code=${encodeURIComponent(order.orderCode || order.order_code || `GAL-${order.number}`)}`}
          className="btn-secondary text-xs sm:text-sm px-6 py-3.5 flex items-center justify-center gap-2 font-semibold"
        >
          <span>Відстежити замовлення</span>
        </Link>
        <Link to="/catalog" className="btn-primary text-xs sm:text-sm px-7 py-3.5 flex items-center justify-center gap-1.5 font-bold">
          <span>До каталогу</span>
          <IconArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

function Row({ label, value, bold }) {
  if (!value) return null;
  return (
    <div className="flex justify-between items-baseline border-b border-[#2A241F] pb-2 last:border-0 last:pb-0">
      <span className="text-[#8C8074]">{label}:</span>
      <span className={bold ? "font-serif font-bold text-base sm:text-lg text-bronze" : "font-medium text-[#F4EFEA] text-right"}>
        {value}
      </span>
    </div>
  );
}
