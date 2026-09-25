import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { request } from "../data/db";

const STATUS_LABEL = {
  NEW: "Нове", PROCESSING: "В обробці", PACKED: "Запаковано",
  SHIPPED: "Відправлено", COMPLETED: "Виконано", CANCELLED: "Скасовано",
};
const STATUS_COLOR = {
  NEW: "bg-honey/15 text-honey", PROCESSING: "bg-accent/20 text-ink",
  PACKED: "bg-gold/20 text-ink", SHIPPED: "bg-leaf/15 text-leaf",
  COMPLETED: "bg-leaf/20 text-leaf", CANCELLED: "bg-red-100 text-red-500",
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    request("/api/admin/dashboard")
      .then((d) => {
        if (d) setData(d);
      })
      .catch((err) => console.error("Error loading dashboard:", err))
      .finally(() => setLoading(false));
  }, []);

  const kpis = data?.kpis || {
    totalOrders: 0,
    ordersToday: 0,
    ordersThisWeek: 0,
    ordersThisMonth: 0,
    newOrders: 0,
    processingOrders: 0,
    packedOrders: 0,
    shippedOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    totalRevenue: 0,
    completedRevenue: 0,
    averageCheck: 0,
    totalCustomers: 0,
    newCustomers: 0,
    repeatCustomers: 0,
  };
  const recentOrders = data?.recentOrders || [];
  const top = data?.topProducts || [];
  const telegram = data?.telegramLogs || [];
  const salesOrders = data?.salesOrders || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-ink">Дашборд</h1>
          <p className="text-xs text-ink/50 mt-0.5">
            Показники на основі реальної бази даних SQLite • Постійне збереження
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/admin/customers"
            className="text-xs font-semibold px-3 py-2 rounded-xl bg-cream/70 hover:bg-cream border border-ink/10 text-ink transition-colors flex items-center gap-1.5"
          >
            👥 Клієнти ({kpis.totalCustomers})
          </Link>
          <Link
            to="/admin/orders"
            className="text-xs font-semibold px-3 py-2 rounded-xl bg-honey text-white shadow-2xs hover:bg-honey/90 transition-colors flex items-center gap-1.5"
          >
            📦 Замовлення
          </Link>
        </div>
      </div>

      {loading && !data ? (
        <div className="text-sm text-ink/40 py-8 text-center">
          <div className="inline-block animate-spin mr-2">⏳</div> Завантаження показників...
        </div>
      ) : (
        <>
          {/* Main KPI Cards: Revenue & Volume */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Kpi
              label="Виручка (виконані)"
              value={`${kpis.completedRevenue.toLocaleString("uk-UA")} грн`}
              sub={`Всього замовлень: ${kpis.totalOrders}`}
              highlight
            />
            <Kpi
              label="Загальна виручка"
              value={`${kpis.totalRevenue.toLocaleString("uk-UA")} грн`}
              sub="Враховуючи всі замовлення"
            />
            <Kpi
              label="Середній чек"
              value={`${kpis.averageCheck.toLocaleString("uk-UA")} грн`}
              sub="По завершених покупках"
            />
            <Kpi
              label="Клієнти в базі"
              value={kpis.totalCustomers}
              sub={`Постійних: ${kpis.repeatCustomers} • Нових: ${kpis.newCustomers}`}
            />
          </div>

          {/* Period Orders & Funnel Breakdown */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="card p-3.5 bg-cream/40 border border-ink/5">
              <div className="text-[11px] text-ink/50 uppercase tracking-wider font-semibold">Замовлення за періодами</div>
              <div className="mt-2 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-ink/70">Сьогодні:</span>
                  <span className="font-bold text-ink">{kpis.ordersToday}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink/70">Цього тижня:</span>
                  <span className="font-bold text-ink">{kpis.ordersThisWeek}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink/70">Цього місяця:</span>
                  <span className="font-bold text-ink">{kpis.ordersThisMonth}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-ink/5">
                  <span className="text-ink/80 font-medium">Всього за весь час:</span>
                  <span className="font-bold text-honey">{kpis.totalOrders}</span>
                </div>
              </div>
            </div>

            <div className="card p-3.5 bg-cream/40 border border-ink/5">
              <div className="text-[11px] text-ink/50 uppercase tracking-wider font-semibold">Статуси в роботі</div>
              <div className="mt-2 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-honey font-medium">✨ Нові:</span>
                  <span className="font-bold text-honey">{kpis.newOrders}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-amber-800">⏳ В обробці:</span>
                  <span className="font-bold text-ink">{kpis.processingOrders}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-800">📦 Запаковано:</span>
                  <span className="font-bold text-ink">{kpis.packedOrders}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-indigo-800">🚚 Відправлено (ТТН):</span>
                  <span className="font-bold text-ink">{kpis.shippedOrders}</span>
                </div>
              </div>
            </div>

            <div className="card p-3.5 bg-cream/40 border border-ink/5">
              <div className="text-[11px] text-ink/50 uppercase tracking-wider font-semibold">Завершені та скасовані</div>
              <div className="mt-2 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-leaf font-medium">✓ Виконано:</span>
                  <span className="font-bold text-leaf">{kpis.completedOrders}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-red-600">✕ Скасовано:</span>
                  <span className="font-bold text-red-600">{kpis.cancelledOrders}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-ink/5">
                  <span className="text-ink/70">Конверсія завершених:</span>
                  <span className="font-bold text-ink">
                    {kpis.totalOrders > 0 ? Math.round((kpis.completedOrders / kpis.totalOrders) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>

            <div className="card p-3.5 bg-cream/40 border border-ink/5">
              <div className="text-[11px] text-ink/50 uppercase tracking-wider font-semibold">База покупців</div>
              <div className="mt-2 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-ink/70">Всього клієнтів:</span>
                  <span className="font-bold text-ink">{kpis.totalCustomers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-honey font-medium">⭐ Постійні (2+ замовлення):</span>
                  <span className="font-bold text-honey">{kpis.repeatCustomers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink/70">Нові клієнти:</span>
                  <span className="font-bold text-ink">{kpis.newCustomers}</span>
                </div>
                <div className="pt-1 border-t border-ink/5">
                  <Link to="/admin/customers" className="text-honey hover:underline font-medium text-[11px] block text-right">
                    Переглянути базу клієнтів →
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-5">
            <div className="card p-4 sm:p-5 lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-ink">Останні замовлення</h3>
                <Link to="/admin/orders" className="text-xs text-honey hover:underline font-medium">
                  Всі замовлення →
                </Link>
              </div>
              {recentOrders.length === 0 ? (
                <p className="text-sm text-ink/40">Замовлень ще немає.</p>
              ) : (
                <div className="space-y-2">
                  {recentOrders.map((o) => (
                    <Link
                      key={o.id}
                      to={`/admin/orders/${o.id}`}
                      className="flex items-center justify-between gap-2 p-3 sm:py-2.5 sm:px-3 border border-ink/5 sm:border-0 sm:border-b last:border-0 text-sm hover:bg-cream/40 rounded-xl sm:rounded-lg min-h-[44px] transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="font-semibold text-ink truncate flex items-center gap-2">
                          <span>#{o.number} {o.customer?.firstName} {o.customer?.lastName || ""}</span>
                          {o.delivery?.trackingNumber && (
                            <span className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-mono hidden sm:inline">
                              ТТН: {o.delivery.trackingNumber}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-ink/50">
                          {o.total} грн • {o.delivery?.city || "Місто не вказано"}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-ink/80 font-bold hidden sm:inline">{o.total} грн</span>
                        <span className={`badge ${STATUS_COLOR[o.status] || "bg-cream text-ink"}`}>
                          {STATUS_LABEL[o.status] || o.status}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="card p-4 sm:p-5">
              <h3 className="font-semibold text-ink mb-4">Залишки товарів</h3>
              {top.length === 0 ? (
                <p className="text-sm text-ink/40">Немає даних.</p>
              ) : (
                <div className="space-y-2.5 text-sm">
                  {top.map((item) => (
                    <div key={item.name} className="flex justify-between items-center gap-2">
                      <span className="text-ink/70 line-clamp-1">{item.name}</span>
                      <span className={`font-semibold shrink-0 px-2 py-0.5 rounded-md text-xs ${
                        item.qty <= 5 ? "bg-red-100 text-red-700 font-bold" : "bg-cream/60 text-ink"
                      }`}>
                        {item.qty} шт
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="card p-4 sm:p-5">
            <h3 className="font-semibold text-ink mb-4">Динаміка останніх замовлень</h3>
            <SalesChart orders={salesOrders} />
          </div>

          <div className="card p-4 sm:p-5">
            <h3 className="font-semibold text-ink mb-3">📨 Telegram — останні сповіщення</h3>
            {telegram.length === 0 ? (
              <p className="text-sm text-ink/40">Сповіщень ще немає — з'являться після першого замовлення.</p>
            ) : (
              <div className="space-y-3">
                {telegram.map((t) => (
                  <div key={t.id} className="relative">
                    <span className="text-[10px] text-ink/40 block mb-1">
                      {new Date(t.created_at || t.createdAt).toLocaleString("uk-UA")} • Статус: {t.status}
                    </span>
                    <pre className="text-xs bg-ink text-cream/90 rounded-xl p-3 whitespace-pre-wrap break-words font-sans overflow-x-hidden">
                      {t.text}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function Kpi({ label, value, sub, highlight, className = "" }) {
  return (
    <div className={`card p-4 flex flex-col justify-between ${highlight ? "bg-honey text-white shadow-xs" : ""} ${className}`}>
      <div>
        <div className={`text-xs ${highlight ? "text-white/80" : "text-ink/50"}`}>{label}</div>
        <div className="font-serif text-xl sm:text-2xl font-bold mt-1 truncate">{value}</div>
      </div>
      {sub && (
        <div className={`text-[11px] mt-2 pt-1.5 border-t ${highlight ? "border-white/20 text-white/90" : "border-ink/5 text-ink/50"}`}>
          {sub}
        </div>
      )}
    </div>
  );
}


function SalesChart({ orders }) {
  const last = [...orders].reverse().slice(-10);
  if (last.length === 0) return <p className="text-sm text-ink/40">Немає даних для графіка.</p>;
  const max = Math.max(...last.map((o) => o.total), 1);
  return (
    <div className="flex items-end gap-1.5 sm:gap-2 h-32 w-full overflow-hidden">
      {last.map((o) => (
        <div key={o.id} className="flex-1 min-w-0 flex flex-col items-center justify-end h-full gap-1" title={`#${o.number}: ${o.total} грн`}>
          <div className="w-full bg-honey/80 rounded-t-md transition-colors" style={{ height: `${Math.max(6, (o.total / max) * 100)}%` }} />
          <span className="text-[10px] text-ink/40 truncate w-full text-center">#{o.number}</span>
        </div>
      ))}
    </div>
  );
}
