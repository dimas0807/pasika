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
    ordersToday: 0,
    newOrders: 0,
    processingOrders: 0,
    completedOrders: 0,
    totalRevenue: 0,
  };
  const recentOrders = data?.recentOrders || [];
  const top = data?.topProducts || [];
  const telegram = data?.telegramLogs || [];
  const salesOrders = data?.salesOrders || [];

  return (
    <div>
      <h1 className="font-serif text-2xl md:text-3xl font-bold text-ink mb-6">Дашборд</h1>

      {loading && !data ? (
        <div className="text-sm text-ink/40 py-8">Завантаження показників...</div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
            <Kpi label="Замовлень сьогодні" value={kpis.ordersToday} />
            <Kpi label="Нові" value={kpis.newOrders} />
            <Kpi label="В обробці" value={kpis.processingOrders} />
            <Kpi label="Виконано" value={kpis.completedOrders} />
            <Kpi label="Виручка" value={`${kpis.totalRevenue} грн`} highlight className="col-span-2 sm:col-span-1" />
          </div>

          <div className="grid lg:grid-cols-3 gap-5 mt-6 sm:mt-8">
            <div className="card p-4 sm:p-5 lg:col-span-2">
              <h3 className="font-semibold text-ink mb-4">Останні замовлення</h3>
              {recentOrders.length === 0 ? (
                <p className="text-sm text-ink/40">Замовлень ще немає.</p>
              ) : (
                <div className="space-y-2">
                  {recentOrders.map((o) => (
                    <Link
                      key={o.id}
                      to={`/admin/orders/${o.id}`}
                      className="flex items-center justify-between gap-2 p-3 sm:py-2 sm:px-2 border border-ink/5 sm:border-0 sm:border-b last:border-0 text-sm hover:bg-cream/40 rounded-xl sm:rounded-lg min-h-[44px] transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="font-semibold text-ink truncate">
                          #{o.number} {o.customer?.firstName} {o.customer?.lastName || ""}
                        </div>
                        <div className="text-xs text-ink/50 sm:hidden">
                          {o.total} грн
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
              <h3 className="font-semibold text-ink mb-4">Топ товарів</h3>
              {top.length === 0 ? (
                <p className="text-sm text-ink/40">Немає даних.</p>
              ) : (
                <div className="space-y-2.5 text-sm">
                  {top.map((item) => (
                    <div key={item.name} className="flex justify-between items-center gap-2">
                      <span className="text-ink/70 line-clamp-1">{item.name}</span>
                      <span className="font-semibold text-ink shrink-0 bg-cream/60 px-2 py-0.5 rounded-md text-xs">{item.qty} шт</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="card p-4 sm:p-5 mt-5">
            <h3 className="font-semibold text-ink mb-4">Продажі (останні замовлення)</h3>
            <SalesChart orders={salesOrders} />
          </div>

          <div className="card p-4 sm:p-5 mt-5">
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

function Kpi({ label, value, highlight, className = "" }) {
  return (
    <div className={`card p-4 ${highlight ? "bg-honey text-white" : ""} ${className}`}>
      <div className={`text-xs ${highlight ? "text-white/80" : "text-ink/50"}`}>{label}</div>
      <div className="font-serif text-xl sm:text-2xl font-bold mt-1 truncate">{value}</div>
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
