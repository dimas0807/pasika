import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { request } from "../data/db";

const ORDER_STATUS_CONFIG = {
  NEW: { label: "Нове", badge: "bg-blue-950 text-blue-200 border-blue-500/60" },
  CONFIRMED: { label: "Підтверджено", badge: "bg-amber-950 text-amber-200 border-amber-500/60" },
  COOKING: { label: "Готується", badge: "bg-orange-950 text-orange-200 border-orange-500/60" },
  PREPARING: { label: "Готується", badge: "bg-orange-950 text-orange-200 border-orange-500/60" },
  PROCESSING: { label: "В обробці", badge: "bg-sky-950 text-sky-200 border-sky-500/60" },
  AWAITING_PAYMENT: { label: "Очікує оплати", badge: "bg-yellow-950 text-yellow-200 border-yellow-500/60" },
  PAID: { label: "Оплачено", badge: "bg-emerald-950 text-emerald-200 border-emerald-500/60" },
  PACKED: { label: "Запаковано", badge: "bg-purple-950 text-purple-200 border-purple-500/60" },
  SHIPMENT_CREATED: { label: "Створено ТТН", badge: "bg-violet-950 text-violet-200 border-violet-500/60" },
  SHIPPED: { label: "Відправлено", badge: "bg-indigo-950 text-indigo-200 border-indigo-500/60" },
  DELIVERED: { label: "Доставлено", badge: "bg-teal-950 text-teal-200 border-teal-500/60" },
  COMPLETED: { label: "Виконано", badge: "bg-emerald-900 text-emerald-100 border-emerald-400 font-bold" },
  CANCELLED: { label: "Скасовано", badge: "bg-red-950 text-red-200 border-red-500/60" },
};

function getStatusBadge(status) {
  const conf = ORDER_STATUS_CONFIG[status] || {
    label: status || "Невідомо",
    badge: "bg-[#25201C] text-[#E8DFD5] border-[#453D34]",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border ${conf.badge}`}
    >
      {conf.label}
    </span>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartPeriod, setChartPeriod] = useState("day"); // 'day' | 'week' | 'month'

  useEffect(() => {
    request("/api/admin/dashboard")
      .then((d) => {
        if (d) setData(d);
      })
      .catch((err) => console.error("Error loading dashboard:", err))
      .finally(() => setLoading(false));
  }, []);

  const rawKpis = data?.kpis || {};
  const kpis = {
    totalOrders: Number(rawKpis.totalOrders ?? 0) || 0,
    ordersToday: Number(rawKpis.ordersToday ?? 0) || 0,
    ordersThisWeek: Number(rawKpis.ordersThisWeek ?? 0) || 0,
    ordersThisMonth: Number(rawKpis.ordersThisMonth ?? 0) || 0,
    newOrders: Number(rawKpis.newOrders ?? 0) || 0,
    pendingOrders: Number(rawKpis.pendingOrders ?? 0) || 0,
    processingOrders: Number(rawKpis.processingOrders ?? 0) || 0,
    packedOrders: Number(rawKpis.packedOrders ?? 0) || 0,
    shippedOrders: Number(rawKpis.shippedOrders ?? 0) || 0,
    completedOrders: Number(rawKpis.completedOrders ?? 0) || 0,
    cancelledOrders: Number(rawKpis.cancelledOrders ?? 0) || 0,
    totalRevenue: Number(rawKpis.totalRevenue ?? 0) || 0,
    completedRevenue: Number(rawKpis.completedRevenue ?? 0) || 0,
    averageCheck: Number(rawKpis.averageCheck ?? 0) || 0,
    totalCustomers: Number(rawKpis.totalCustomers ?? 0) || 0,
    newCustomers: Number(rawKpis.newCustomers ?? 0) || 0,
    repeatCustomers: Number(rawKpis.repeatCustomers ?? 0) || 0,
  };

  const inventory = data?.inventory || {
    totalProducts: 0,
    inStock: 0,
    lowStock: 0,
    outOfStock: 0,
    lowStockItems: [],
  };

  const recentOrders = Array.isArray(data?.recentOrders) ? data.recentOrders : [];
  const topProducts = Array.isArray(data?.topProducts) ? data.topProducts : [];
  const telegramLogs = Array.isArray(data?.telegramLogs) ? data.telegramLogs : [];
  const salesCharts = data?.salesCharts || { day: [], week: [], month: [] };
  const currentChartData = salesCharts[chartPeriod] || [];

  const maxChartRevenue = Math.max(...currentChartData.map((d) => d.revenue || 0), 1000);

  return (
    <div className="space-y-6 text-[#F4EFEA]">
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#2C2621]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🥩</span>
            <h1 className="font-serif text-2xl md:text-3xl font-bold text-[#FBF7EE]">
              Панель керування
            </h1>
          </div>
          <p className="text-xs text-[#B8ADA0] mt-1 font-medium">
            «М'ясний рай у Галинки» • Реальні дані бази SQLite • Постійне збереження
          </p>
        </div>

        {/* QUICK ACTIONS ROW */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/admin/products/new"
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-meat to-[#DC4538] hover:from-[#DC4538] hover:to-meat text-white shadow-md transition-all flex items-center gap-1.5"
          >
            <span>+</span> Додати товар
          </Link>
          <Link
            to="/admin/products/new?giftBox=1"
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-bronze to-gold hover:from-gold hover:to-bronze text-[#141210] shadow-md transition-all flex items-center gap-1.5"
          >
            <span>🎁</span> Створити бокс
          </Link>
          <Link
            to="/admin/orders"
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#26211D] hover:bg-[#332C26] text-[#F4EFEA] border border-[#3E362E] transition-all flex items-center gap-1.5"
          >
            <span>📦</span> Замовлення
          </Link>
          <Link
            to="/admin/settings"
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-[#26211D] hover:bg-[#332C26] text-[#D1C7BD] border border-[#3E362E] transition-all flex items-center gap-1"
          >
            <span>⚙️</span>
          </Link>
        </div>
      </div>

      {loading && !data ? (
        <div className="text-sm text-[#B8ADA0] py-16 text-center bg-[#1A1816] rounded-2xl border border-[#2E2822]">
          <div className="inline-block animate-spin mr-2 text-xl">⏳</div>
          <span className="font-medium">Завантаження показників із бази даних...</span>
        </div>
      ) : (
        <>
          {/* ======================================================== */}
          {/* 1. UPPER BLOCK: 6 MAIN KPI CARDS                         */}
          {/* ======================================================== */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {/* 1. Виручка */}
            <div className="bg-[#1C1A17] rounded-2xl p-4 border border-[#3A332B] shadow-md flex flex-col justify-between">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#DF9E33] flex items-center justify-between">
                  <span>Виручка</span>
                  <span className="text-sm">💰</span>
                </div>
                <div className="text-xl sm:text-2xl font-extrabold text-[#FBF7EE] mt-1.5 font-serif">
                  {kpis.totalRevenue.toLocaleString("uk-UA")} <span className="text-sm font-sans text-[#B8ADA0]">грн</span>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-[#2C2621] text-[11px] text-[#A89C8E]">
                Виконано: <span className="text-emerald-400 font-bold">{kpis.completedRevenue.toLocaleString("uk-UA")} грн</span>
              </div>
            </div>

            {/* 2. Замовлення */}
            <div className="bg-[#1C1A17] rounded-2xl p-4 border border-[#3A332B] shadow-md flex flex-col justify-between">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#E5A93C] flex items-center justify-between">
                  <span>Замовлення</span>
                  <span className="text-sm">📦</span>
                </div>
                <div className="text-xl sm:text-2xl font-extrabold text-[#FBF7EE] mt-1.5 font-serif">
                  {kpis.totalOrders}
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-[#2C2621] text-[11px] text-[#A89C8E]">
                Сьогодні: <span className="text-[#FBF7EE] font-bold">{kpis.ordersToday}</span> • Тжд: <span className="font-bold">{kpis.ordersThisWeek}</span>
              </div>
            </div>

            {/* 3. Середній чек */}
            <div className="bg-[#1C1A17] rounded-2xl p-4 border border-[#3A332B] shadow-md flex flex-col justify-between">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#A3988E] flex items-center justify-between">
                  <span>Середній чек</span>
                  <span className="text-sm">🏷️</span>
                </div>
                <div className="text-xl sm:text-2xl font-extrabold text-[#FBF7EE] mt-1.5 font-serif">
                  {kpis.averageCheck.toLocaleString("uk-UA")} <span className="text-sm font-sans text-[#B8ADA0]">грн</span>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-[#2C2621] text-[11px] text-[#A89C8E]">
                По активних замовленнях
              </div>
            </div>

            {/* 4. Виконано */}
            <div className="bg-[#1C1A17] rounded-2xl p-4 border border-emerald-900/60 shadow-md flex flex-col justify-between">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center justify-between">
                  <span>Виконано</span>
                  <span className="text-sm">✅</span>
                </div>
                <div className="text-xl sm:text-2xl font-extrabold text-emerald-300 mt-1.5 font-serif">
                  {kpis.completedOrders}
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-[#2C2621] text-[11px] text-[#A89C8E]">
                Конверсія: <span className="text-emerald-400 font-bold">{kpis.totalOrders > 0 ? Math.round((kpis.completedOrders / kpis.totalOrders) * 100) : 0}%</span>
              </div>
            </div>

            {/* 5. Очікують */}
            <div className="bg-[#1C1A17] rounded-2xl p-4 border border-amber-900/60 shadow-md flex flex-col justify-between">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center justify-between">
                  <span>Очікують</span>
                  <span className="text-sm">⏳</span>
                </div>
                <div className="text-xl sm:text-2xl font-extrabold text-amber-300 mt-1.5 font-serif">
                  {kpis.pendingOrders}
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-[#2C2621] text-[11px] text-[#A89C8E]">
                Нових: <span className="text-blue-400 font-bold">{kpis.newOrders}</span> • В обробці: <span className="font-bold">{kpis.processingOrders}</span>
              </div>
            </div>

            {/* 6. Скасовано */}
            <div className="bg-[#1C1A17] rounded-2xl p-4 border border-red-950 shadow-md flex flex-col justify-between">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-red-400 flex items-center justify-between">
                  <span>Скасовано</span>
                  <span className="text-sm">❌</span>
                </div>
                <div className="text-xl sm:text-2xl font-extrabold text-red-300 mt-1.5 font-serif">
                  {kpis.cancelledOrders}
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-[#2C2621] text-[11px] text-[#A89C8E]">
                Втрати: {kpis.totalOrders > 0 ? Math.round((kpis.cancelledOrders / kpis.totalOrders) * 100) : 0}%
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* 2. SALES CHART & INVENTORY STATUS GRID                   */}
          {/* ======================================================== */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* SALES CHART (2 COLS) */}
            <div className="lg:col-span-2 bg-[#1C1A17] rounded-2xl p-5 border border-[#3A332B] shadow-md flex flex-col justify-between">
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#2C2621]">
                  <div>
                    <h2 className="font-serif font-bold text-lg text-[#FBF7EE] flex items-center gap-2">
                      <span>📈</span> Графік продажів
                    </h2>
                    <p className="text-xs text-[#B8ADA0] mt-0.5">
                      Динаміка виручки та кількості замовлень
                    </p>
                  </div>

                  {/* CHART PERIOD TOGGLE */}
                  <div className="flex items-center gap-1 bg-[#141210] p-1 rounded-xl border border-[#332C26]">
                    {[
                      { key: "day", label: "За 7 днів" },
                      { key: "week", label: "За 4 тижні" },
                      { key: "month", label: "За 6 місяців" },
                    ].map((tab) => (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setChartPeriod(tab.key)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          chartPeriod === tab.key
                            ? "bg-bronze text-[#141210] font-bold shadow-xs"
                            : "text-[#CFC4B6] hover:text-white hover:bg-[#221D19]"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* CHART BARS */}
                <div className="mt-6">
                  {currentChartData.length === 0 ? (
                    <div className="py-12 text-center text-sm text-[#887F75]">
                      Немає замовлень за обраний період
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-end gap-2 sm:gap-4 h-44 pt-6 pb-2 px-2 border-b border-[#332C26]">
                        {currentChartData.map((item, idx) => {
                          const heightPercent = maxChartRevenue > 0
                            ? Math.max(8, Math.round(((item.revenue || 0) / maxChartRevenue) * 100))
                            : 8;
                          return (
                            <div
                              key={idx}
                              className="flex-1 flex flex-col items-center justify-end h-full group relative"
                            >
                              {/* Hover Tooltip */}
                              <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-[#28221D] text-[#FBF7EE] text-[11px] font-mono px-2 py-1 rounded-md border border-[#483F34] shadow-lg whitespace-nowrap pointer-events-none z-10">
                                {item.revenue?.toLocaleString("uk-UA")} грн ({item.count} зам.)
                              </div>

                              {/* Bar */}
                              <div
                                style={{ height: `${heightPercent}%` }}
                                className={`w-full rounded-t-lg transition-all duration-300 ${
                                  (item.revenue || 0) > 0
                                    ? "bg-gradient-to-t from-bronze to-gold group-hover:from-gold group-hover:to-bronze"
                                    : "bg-[#2A241F]"
                                }`}
                              />
                            </div>
                          );
                        })}
                      </div>

                      {/* X-Axis Labels */}
                      <div className="flex gap-2 sm:gap-4 px-2 text-[11px] text-[#A89C8E] font-medium">
                        {currentChartData.map((item, idx) => (
                          <div key={idx} className="flex-1 text-center truncate">
                            {item.label}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Chart footer stats */}
              <div className="mt-4 pt-3 border-t border-[#2C2621] flex items-center justify-between text-xs text-[#B8ADA0]">
                <span>
                  Всього за період:{" "}
                  <strong className="text-[#FBF7EE]">
                    {currentChartData.reduce((acc, c) => acc + (c.revenue || 0), 0).toLocaleString("uk-UA")} грн
                  </strong>
                </span>
                <span>
                  Замовлень:{" "}
                  <strong className="text-[#FBF7EE]">
                    {currentChartData.reduce((acc, c) => acc + (c.count || 0), 0)}
                  </strong>
                </span>
              </div>
            </div>

            {/* INVENTORY STATE CARD (1 COL) */}
            <div className="bg-[#1C1A17] rounded-2xl p-5 border border-[#3A332B] shadow-md flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#2C2621]">
                  <div>
                    <h2 className="font-serif font-bold text-lg text-[#FBF7EE] flex items-center gap-2">
                      <span>🥩</span> Стан залишків
                    </h2>
                    <p className="text-xs text-[#B8ADA0] mt-0.5">
                      Контроль запасів товарів на складі
                    </p>
                  </div>
                  <Link
                    to="/admin/products"
                    className="text-xs font-semibold text-bronze hover:underline"
                  >
                    Всі товари →
                  </Link>
                </div>

                {/* Stock Summary Badges */}
                <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
                  <div className="p-2.5 rounded-xl bg-[#221D19] border border-[#3A332B]">
                    <div className="text-[#A89C8E] text-[11px]">Всього активних:</div>
                    <div className="text-base font-bold text-[#FBF7EE] mt-0.5">
                      {inventory.totalProducts} поз.
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#221D19] border border-emerald-900/60">
                    <div className="text-emerald-400 text-[11px]">В наявності (&gt;10):</div>
                    <div className="text-base font-bold text-emerald-300 mt-0.5">
                      {inventory.inStock} поз.
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#221D19] border border-amber-900/60">
                    <div className="text-amber-400 text-[11px]">Мало залишків (≤10):</div>
                    <div className="text-base font-bold text-amber-300 mt-0.5">
                      {inventory.lowStock} поз.
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#221D19] border border-red-950">
                    <div className="text-red-400 text-[11px]">Закінчилися:</div>
                    <div className="text-base font-bold text-red-300 mt-0.5">
                      {inventory.outOfStock} поз.
                    </div>
                  </div>
                </div>

                {/* Critical Stock Items List */}
                <div className="mt-4">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#A89C8E] mb-2">
                    Потребують уваги:
                  </div>
                  {(!inventory.lowStockItems || inventory.lowStockItems.length === 0) ? (
                    <div className="text-xs text-[#887F75] py-3 text-center">
                      Усі позиції мають достатній запас
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {inventory.lowStockItems.slice(0, 5).map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-[#141210] border border-[#2E2822] text-xs"
                        >
                          <div className="min-w-0 pr-2">
                            <div className="font-semibold text-[#FBF7EE] truncate">
                              {item.name}
                            </div>
                            <div className="text-[10px] text-[#A89C8E]">
                              {item.price} грн • кат: {item.category}
                            </div>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold whitespace-nowrap ${
                              (item.available || 0) <= 0
                                ? "bg-red-950 text-red-300 border border-red-700/60"
                                : "bg-amber-950 text-amber-300 border border-amber-700/60"
                            }`}
                          >
                            {item.available} шт.
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#2C2621]">
                <Link
                  to="/admin/products"
                  className="block text-center py-2 rounded-xl text-xs font-semibold bg-[#26211D] hover:bg-[#332C26] text-[#FBF7EE] border border-[#3E362E] transition-colors"
                >
                  Оновити залишки товарів
                </Link>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* 3. RECENT ORDERS & POPULAR PRODUCTS GRID                 */}
          {/* ======================================================== */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* RECENT ORDERS TABLE (2 COLS) */}
            <div className="lg:col-span-2 bg-[#1C1A17] rounded-2xl p-5 border border-[#3A332B] shadow-md">
              <div className="flex items-center justify-between pb-3 border-b border-[#2C2621]">
                <div>
                  <h2 className="font-serif font-bold text-lg text-[#FBF7EE] flex items-center gap-2">
                    <span>📋</span> Останні замовлення
                  </h2>
                  <p className="text-xs text-[#B8ADA0] mt-0.5">
                    Найновіші надходження в реальному часі
                  </p>
                </div>
                <Link
                  to="/admin/orders"
                  className="text-xs font-semibold text-bronze hover:underline"
                >
                  Усі замовлення ({kpis.totalOrders}) →
                </Link>
              </div>

              {recentOrders.length === 0 ? (
                <div className="py-12 text-center text-sm text-[#887F75]">
                  Замовлень поки немає. Коли клієнт оформить покупку, вона з'явиться тут.
                </div>
              ) : (
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#332C26] text-[#A89C8E] uppercase tracking-wider text-[10px]">
                        <th className="py-2.5 px-3 font-semibold">Номер</th>
                        <th className="py-2.5 px-3 font-semibold">Клієнт</th>
                        <th className="py-2.5 px-3 font-semibold">Місто / Доставка</th>
                        <th className="py-2.5 px-3 font-semibold">Сума</th>
                        <th className="py-2.5 px-3 font-semibold">Статус</th>
                        <th className="py-2.5 px-3 font-semibold text-right">Дія</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#26211D]">
                      {recentOrders.map((ord) => (
                        <tr
                          key={ord.id}
                          className="hover:bg-[#221D19] transition-colors"
                        >
                          <td className="py-3 px-3 font-mono font-bold text-bronze">
                            {ord.orderCode || `GAL-${ord.number}`}
                          </td>
                          <td className="py-3 px-3 font-medium text-[#FBF7EE]">
                            <div>{ord.customer?.firstName} {ord.customer?.lastName || ""}</div>
                            <div className="text-[10px] text-[#A89C8E]">
                              {new Date(ord.createdAt).toLocaleString("uk-UA", {
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-[#D1C7BD]">
                            <div className="truncate max-w-[140px]">
                              {ord.deliveryCity || "Не вказано"}
                            </div>
                            <div className="text-[10px] text-[#A89C8E]">
                              {ord.deliveryService || "Нова Пошта"}
                            </div>
                          </td>
                          <td className="py-3 px-3 font-bold text-[#FBF7EE] font-mono">
                            {Number(ord.total).toLocaleString("uk-UA")} грн
                          </td>
                          <td className="py-3 px-3">
                            {getStatusBadge(ord.status)}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <Link
                              to={`/admin/orders/${ord.id}`}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#26211D] hover:bg-bronze hover:text-[#141210] border border-[#3E362E] text-[#FBF7EE] transition-colors"
                            >
                              Відкрити
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* TOP PRODUCTS & TELEGRAM LOG (1 COL) */}
            <div className="space-y-6">
              {/* TOP PRODUCTS CARD */}
              <div className="bg-[#1C1A17] rounded-2xl p-5 border border-[#3A332B] shadow-md">
                <div className="flex items-center justify-between pb-3 border-b border-[#2C2621]">
                  <div>
                    <h2 className="font-serif font-bold text-lg text-[#FBF7EE] flex items-center gap-2">
                      <span>🏆</span> Популярні товари
                    </h2>
                    <p className="text-xs text-[#B8ADA0] mt-0.5">
                      Лідери продажів за кількістю
                    </p>
                  </div>
                </div>

                {topProducts.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[#887F75]">
                    Дані про продажі з'являться після перших замовлень
                  </div>
                ) : (
                  <div className="mt-3 space-y-2">
                    {topProducts.map((p, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-[#141210] border border-[#2E2822] text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-2">
                          <span className="w-5 h-5 rounded-full bg-bronze/20 text-bronze flex items-center justify-center font-bold text-[10px]">
                            {idx + 1}
                          </span>
                          <span className="font-semibold text-[#FBF7EE] truncate">
                            {p.name}
                          </span>
                        </div>
                        <div className="text-right whitespace-nowrap font-mono">
                          <div className="font-bold text-gold">{p.qty} шт.</div>
                          <div className="text-[10px] text-[#A89C8E]">
                            {(Number(p.revenue) || 0).toLocaleString("uk-UA")} грн
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* TELEGRAM LOG PREVIEW */}
              <div className="bg-[#1C1A17] rounded-2xl p-4 border border-[#3A332B] shadow-md">
                <div className="flex items-center justify-between pb-2 border-b border-[#2C2621]">
                  <h3 className="font-serif font-bold text-sm text-[#FBF7EE] flex items-center gap-1.5">
                    <span>🟣</span> Telegram-сповіщення
                  </h3>
                  <Link
                    to="/admin/settings"
                    className="text-[11px] font-semibold text-bronze hover:underline"
                  >
                    Бот →
                  </Link>
                </div>
                <div className="mt-2 text-xs space-y-1.5">
                  {telegramLogs.length === 0 ? (
                    <div className="text-[11px] text-[#887F75] py-2 text-center">
                      Логов сповіщень ще немає
                    </div>
                  ) : (
                    telegramLogs.slice(0, 3).map((tl) => (
                      <div
                        key={tl.id}
                        className="p-2 rounded-lg bg-[#141210] border border-[#2E2822] text-[11px] flex items-center justify-between"
                      >
                        <span className="text-[#D1C7BD] truncate max-w-[170px]">
                          {tl.text?.substring(0, 45) || "Повідомлення"}...
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            tl.status === "SENT"
                              ? "bg-emerald-950 text-emerald-300"
                              : "bg-amber-950 text-amber-300"
                          }`}
                        >
                          {tl.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
