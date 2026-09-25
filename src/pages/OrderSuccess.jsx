import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { Orders } from "../data/db";

export default function OrderSuccess() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [order, setOrder] = useState(() => Orders.byId(id));
  const [loading, setLoading] = useState(!order);
  const [accessDenied, setAccessDenied] = useState(false);

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

  if (loading) {
    return (
      <div className="container-p py-24 text-center">
        <div className="text-3xl animate-spin mb-3">🐝</div>
        <p className="text-ink/60 font-medium">Завантаження інформації про замовлення...</p>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="container-p py-24 text-center max-w-md mx-auto">
        <div className="text-4xl mb-3">🔒</div>
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
        <div className="text-4xl mb-3">📦</div>
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

  return (
    <div className="container-p py-14 sm:py-20 max-w-lg mx-auto text-center">
      {/* Success icon */}
      <div className="w-18 h-18 rounded-full bg-leaf/15 text-leaf flex items-center justify-center text-3xl mx-auto shadow-sm ring-4 ring-leaf/10">
        ✓
      </div>

      <span className="text-xs font-bold uppercase tracking-wider text-leaf mt-5 inline-block">
        Замовлення успішно створено
      </span>

      <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-ink mt-2">
        Дякуємо за довіру! 🍯
      </h1>
      <p className="text-ink/65 text-sm sm:text-base mt-2">
        Номер вашого замовлення: <span className="font-bold text-ink">#{order.number}</span>.
        Ми вже отримали його та готуємо до пакування.
      </p>

      {/* Order Details Card */}
      <div className="card p-6 mt-8 text-left bg-white border border-ink/10 shadow-sm rounded-3xl space-y-2.5 text-xs sm:text-sm">
        <Row label="Клієнт" value={customerName} />
        <Row label="Телефон" value={order.customer?.phone} />
        <Row label="Доставка" value={`${order.delivery?.provider || ""}`} />
        <Row label="Місто" value={deliveryCity} />
        {deliveryBranch && <Row label="Відділення" value={deliveryBranch} />}
        <Row
          label="Спосіб оплати"
          value={order.payment?.method === "card" ? "💳 Оплачено наперед" : "💵 Оплата при отриманні"}
        />
        {order.payment?.method === "card" && (
          <Row label="Чек про оплату" value="✓ Завантажено (на перевірці)" />
        )}
        <div className="pt-2 border-t border-ink/10">
          <Row label="Сума до сплати" value={`${order.total} грн`} bold />
        </div>
      </div>

      {/* Telegram Notification indicator */}
      <div className="mt-6 text-xs text-ink/70 card p-4 bg-[#FAF6EE] border border-gold/30 rounded-2xl flex items-center gap-3 text-left">
        <span className="text-2xl">📱</span>
        <div>
          <div className="font-bold text-ink">Сповіщення надіслано в Telegram</div>
          <div className="text-[11px] text-ink/50 mt-0.5">
            Пасічник отримав ваше замовлення та незабаром зв'яжеться з вами.
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
        <Link to="/catalog" className="btn-primary text-sm px-7 py-3.5">
          Продовжити покупки →
        </Link>
        <Link to="/" className="btn-secondary text-sm px-6 py-3.5">
          На головну
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
      <span className={bold ? "font-serif font-bold text-base text-ink" : "font-medium text-ink text-right"}>
        {value}
      </span>
    </div>
  );
}
