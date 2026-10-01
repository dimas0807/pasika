import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { Orders } from "../data/db";
import {
  IconBox,
  IconTruck,
  IconCopy,
  IconCheckCircle,
  IconTelegram,
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
        <div className="w-10 h-10 border-3 border-honey border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-ink/60 font-medium text-sm">Завантаження інформації про замовлення...</p>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="container-p py-24 text-center max-w-md mx-auto">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 text-honey flex items-center justify-center mx-auto mb-4 border border-amber-900/10">
          <IconBox className="w-6 h-6" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-ink mb-2">Доступ обмежено</h2>
        <p className="text-ink/65 text-sm leading-relaxed">
          Для безпеки персональних даних деталі замовлення доступні лише за захищеним посиланням з одноразовим токеном.
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
        <div className="w-14 h-14 rounded-2xl bg-amber-50 text-honey flex items-center justify-center mx-auto mb-4 border border-amber-900/10">
          <IconBox className="w-6 h-6" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-ink mb-2">Замовлення не знайдено</h2>
        <p className="text-ink/65 text-sm">Перевірте правильність номера або зверніться до підтримки.</p>
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
      ? deliveryService.toLowerCase().includes("укр")
        ? `https://track.ukrposhta.ua/tracking_UA.html?barcode=${encodeURIComponent(trackingNumber)}`
        : `https://novaposhta.ua/tracking/?cargo_number=${encodeURIComponent(trackingNumber)}`
      : null
  );

  return (
    <div className="container-p py-10 sm:py-16 md:py-20 max-w-lg mx-auto text-center">
      {/* Success icon */}
      <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto shadow-sm ring-4 ring-emerald-500/15 border border-emerald-500/20">
        <IconCheckCircle className="w-9 h-9" />
      </div>

      <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 mt-5 inline-block">
        Замовлення успішно прийнято
      </span>

      <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-ink mt-2">
        Дякуємо за довіру!
      </h1>
      <p className="text-ink/65 text-sm sm:text-base mt-2 leading-relaxed">
        Номер вашого замовлення:{" "}
        <span className="font-mono font-bold text-ink bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
          {order.orderCode || order.order_code || `PAS-${order.number}`}
        </span>
        . Ми вже отримали його та готуємо до пакування.
      </p>

      {/* Delivery Tracking Card */}
      {trackingNumber && (
        <div className="card p-5 mt-6 text-left bg-indigo-50/70 border border-indigo-200/80 shadow-sm rounded-3xl space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-900">
                <IconTruck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-base text-indigo-950">Відстеження доставки</h3>
                <span className="text-xs text-indigo-800/80">{deliveryService}</span>
              </div>
            </div>
            <span className="badge bg-indigo-100 text-indigo-900 font-semibold text-xs">
              {order.status === "COMPLETED" ? "Вручено" : "Відправлено"}
            </span>
          </div>

          <div className="p-3.5 bg-white rounded-2xl border border-indigo-100 flex items-center justify-between gap-2 flex-wrap">
            <div>
              <span className="text-[11px] text-ink/50 block">Номер накладної (ТТН):</span>
              <span className="font-mono font-bold text-base text-ink tracking-wider">
                {trackingNumber}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleCopyTtn(trackingNumber)}
                className="btn-secondary text-xs py-1.5 px-3 rounded-xl border-indigo-200 text-indigo-900 bg-indigo-50/50 hover:bg-indigo-100/60 inline-flex items-center gap-1.5"
              >
                <IconCopy className="w-3.5 h-3.5" />
                <span>{copiedTtn ? "Скопійовано" : "Копія"}</span>
              </button>
              {trackingUrl && (
                <a
                  href={trackingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-primary text-xs py-1.5 px-3.5 rounded-xl shadow-2xs inline-flex items-center gap-1 font-semibold"
                >
                  Відстежити ↗
                </a>
              )}
            </div>
          </div>

          {order.delivery?.shippedAt && (
            <p className="text-[11px] text-indigo-900/70 text-right">
              Дата відправки: {new Date(order.delivery.shippedAt).toLocaleDateString("uk-UA")}
            </p>
          )}
        </div>
      )}

      {/* Order Details Card */}
      <div className="card p-5 sm:p-6 mt-6 text-left bg-white/85 backdrop-blur-md border border-amber-900/10 shadow-[0_4px_24px_rgba(41,40,33,0.04)] rounded-3xl space-y-2.5 text-xs sm:text-sm">
        <Row label="Клієнт" value={customerName} />
        <Row label="Телефон" value={order.customer?.phone} />
        <Row label="Доставка" value={`${order.delivery?.provider || ""}`} />
        <Row label="Місто" value={deliveryCity} />
        {deliveryBranch && <Row label="Відділення" value={deliveryBranch} />}
        <Row
          label="Спосіб оплати"
          value={order.payment?.method === "card" ? "Оплачено наперед (картка / IBAN)" : "Оплата при отриманні"}
        />
        {order.payment?.method === "card" && (
          <Row label="Чек про оплату" value="✓ Завантажено (на перевірці)" />
        )}
        <div className="pt-2 border-t border-ink/10">
          <Row label="Сума до сплати" value={`${order.total} грн`} bold />
        </div>
      </div>

      {/* Telegram Notification Indicator */}
      <div className="mt-5 text-xs text-ink/75 card p-4 bg-white/80 border border-amber-900/10 rounded-2xl flex items-center gap-3 text-left">
        <div className="w-9 h-9 rounded-xl bg-honey/15 flex items-center justify-center text-honey shrink-0">
          <IconTelegram className="w-4 h-4" />
        </div>
        <div>
          <div className="font-bold text-ink">Сповіщення надіслано в Telegram</div>
          <div className="text-[11px] text-ink/50 mt-0.5">
            Пасічник отримав ваше замовлення та оновлює статус у реальному часі.
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          to={`/track-order?code=${encodeURIComponent(order.orderCode || order.order_code || order.number || "")}`}
          className="btn-secondary text-xs sm:text-sm px-6 py-3.5 flex items-center justify-center gap-2 font-semibold shadow-xs"
        >
          <IconBox className="w-4 h-4 text-honey" />
          <span>Відстежити статус</span>
        </Link>
        <Link to="/catalog" className="btn-primary text-xs sm:text-sm px-7 py-3.5 flex items-center justify-center gap-1.5 font-bold shadow-md">
          <span>Продовжити покупки</span>
          <IconArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

function Row({ label, value, bold }) {
  if (!value) return null;
  return (
    <div className="flex justify-between items-baseline border-b border-ink/5 pb-2 last:border-0 last:pb-0">
      <span className="text-ink/50">{label}:</span>
      <span className={bold ? "font-serif font-bold text-base sm:text-lg text-honey" : "font-medium text-ink text-right"}>
        {value}
      </span>
    </div>
  );
}
