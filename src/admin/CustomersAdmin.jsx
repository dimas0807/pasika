import { useEffect, useState, useMemo, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Customers } from "../data/db";

const STATUS_LABEL = {
  NEW: "Нове",
  PROCESSING: "В обробці",
  PACKED: "Запаковано",
  SHIPPED: "Відправлено",
  COMPLETED: "Виконано",
  CANCELLED: "Скасовано",
};

const STATUS_COLOR = {
  NEW: "bg-honey/15 text-honey",
  PROCESSING: "bg-amber-100 text-amber-900",
  PACKED: "bg-blue-100 text-blue-900",
  SHIPPED: "bg-indigo-100 text-indigo-900",
  COMPLETED: "bg-leaf/20 text-leaf",
  CANCELLED: "bg-red-100 text-red-600",
};

export default function CustomersAdmin() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = searchParams.get("search") || "";

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(initialSearch);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const loadCustomers = useCallback(() => {
    setLoading(true);
    Customers.fetchAll()
      .then((data) => setCustomers(data || []))
      .catch((err) => console.error("Error loading customers:", err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const handleOpenCustomerOrders = async (c) => {
    setSelectedCustomer(c);
    setOrdersLoading(true);
    try {
      const data = await Customers.fetchById(c.id);
      setCustomerOrders(data?.orders || []);
    } catch (err) {
      console.error("Error loading customer orders:", err);
      setCustomerOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  };

  const filteredCustomers = useMemo(() => {
    if (!search.trim()) return customers;
    const q = search.toLowerCase();
    return customers.filter((c) => {
      const name = `${c.first_name || ""} ${c.last_name || ""}`.toLowerCase();
      const phone = String(c.phone || "").toLowerCase();
      const email = String(c.email || "").toLowerCase();
      return name.includes(q) || phone.includes(q) || email.includes(q);
    });
  }, [customers, search]);

  const totalSpentAll = useMemo(() => {
    return customers.reduce((sum, c) => sum + (c.total_spent || 0), 0);
  }, [customers]);

  const repeatCustomersCount = useMemo(() => {
    return customers.filter((c) => (c.total_orders || 0) > 1).length;
  }, [customers]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-ink">
            Клієнти
          </h1>
          <p className="text-xs text-ink/50 mt-0.5">
            Дедуплікація за номером телефону • 1 клієнт = історія всіх його покупок
          </p>
        </div>

        <button
          onClick={loadCustomers}
          className="text-xs text-ink/70 border border-ink/15 rounded-xl px-3 py-2 hover:bg-cream transition-colors flex items-center gap-1.5 self-start sm:self-auto min-h-[40px]"
        >
          🔄 Оновити
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="card p-4">
          <div className="text-xs text-ink/50">Всього покупців</div>
          <div className="font-serif text-2xl font-bold text-ink mt-1">{customers.length}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-ink/50">Постійні клієнти (2+ замовлення)</div>
          <div className="font-serif text-2xl font-bold text-honey mt-1">{repeatCustomersCount}</div>
        </div>
        <div className="card p-4 col-span-2 sm:col-span-1">
          <div className="text-xs text-ink/50">Загальний оборот по клієнтах</div>
          <div className="font-serif text-2xl font-bold text-ink mt-1">
            {totalSpentAll.toLocaleString("uk-UA")} грн
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="card p-4">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40 text-sm">🔍</span>
          <input
            type="text"
            placeholder="Пошук клієнта за номером телефону, ім'ям або email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9 text-sm"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink/40 hover:text-ink"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Customer Modal / Drawer */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-xs">
          <div className="card p-6 max-w-2xl w-full bg-white shadow-2xl rounded-2xl border border-ink/10 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-ink/10">
              <div>
                <h3 className="font-serif font-bold text-xl text-ink">
                  {selectedCustomer.first_name} {selectedCustomer.last_name || ""}
                </h3>
                <div className="text-xs text-ink/50 mt-0.5 flex items-center gap-2">
                  <span className="font-mono text-honey font-semibold">{selectedCustomer.phone}</span>
                  {selectedCustomer.email && <span>• {selectedCustomer.email}</span>}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="w-8 h-8 rounded-lg bg-cream/60 hover:bg-cream text-ink/70 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-3 gap-2 p-3 bg-cream/30 rounded-xl border border-ink/5 text-center text-xs">
              <div>
                <span className="text-ink/40 block">Замовлень:</span>
                <span className="font-bold text-ink text-sm">{selectedCustomer.total_orders}</span>
              </div>
              <div>
                <span className="text-ink/40 block">Витрачено:</span>
                <span className="font-bold text-honey text-sm">{selectedCustomer.total_spent} грн</span>
              </div>
              <div>
                <span className="text-ink/40 block">Останнє:</span>
                <span className="font-medium text-ink text-xs">
                  {selectedCustomer.last_order_at
                    ? new Date(selectedCustomer.last_order_at).toLocaleDateString("uk-UA")
                    : "—"}
                </span>
              </div>
            </div>

            {/* Orders list */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              <h4 className="font-semibold text-xs text-ink/60 uppercase tracking-wider">
                Історія замовлень клієнта ({customerOrders.length})
              </h4>

              {ordersLoading ? (
                <div className="text-center py-8 text-xs text-ink/40">
                  <span className="inline-block animate-spin mr-2">⏳</span> Завантаження замовлень...
                </div>
              ) : customerOrders.length === 0 ? (
                <p className="text-xs text-ink/40 italic py-4">Немає замовлень.</p>
              ) : (
                customerOrders.map((o) => (
                  <div
                    key={o.id}
                    className="p-3 bg-cream/20 hover:bg-cream/40 rounded-xl border border-ink/5 flex items-center justify-between gap-3 text-xs transition-colors"
                  >
                    <div>
                      <div className="font-bold text-ink text-sm">
                        Замовлення #{o.number}
                      </div>
                      <div className="text-ink/50 text-[11px] mt-0.5">
                        {new Date(o.createdAt).toLocaleString("uk-UA")} • {o.delivery?.city || "Місто не вказано"}
                      </div>
                      {o.delivery?.trackingNumber && (
                        <div className="text-indigo-800 font-mono text-[10px] mt-1">
                          ТТН: {o.delivery.trackingNumber}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-bold text-ink">{o.total} грн</span>
                      <span className={`badge ${STATUS_COLOR[o.status] || "bg-cream text-ink"} text-[10px]`}>
                        {STATUS_LABEL[o.status] || o.status}
                      </span>
                      <Link
                        to={`/admin/orders/${o.id}`}
                        onClick={() => setSelectedCustomer(null)}
                        className="btn-secondary text-[11px] py-1 px-2.5 rounded-lg"
                      >
                        Переглянути →
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-ink/10 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="btn-secondary text-xs py-2 px-4 rounded-xl"
              >
                Закрити
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customers List View */}
      <div className="card overflow-x-auto shadow-sm">
        <table className="w-full text-sm min-w-[700px]">
          <thead>
            <tr className="text-left text-ink/50 border-b border-ink/5 bg-cream/30 text-xs">
              <th className="p-3">Клієнт</th>
              <th className="p-3">Телефон</th>
              <th className="p-3">Email</th>
              <th className="p-3 text-center">Замовлень</th>
              <th className="p-3 text-right">Сума покупок</th>
              <th className="p-3">Останнє замовлення</th>
              <th className="p-3 text-right">Дії</th>
            </tr>
          </thead>
          <tbody>
            {loading && customers.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-ink/40">
                  <div className="inline-block animate-spin mr-2">⏳</div> Завантаження списку клієнтів...
                </td>
              </tr>
            ) : filteredCustomers.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-ink/40">
                  Клієнтів не знайдено.
                </td>
              </tr>
            ) : (
              filteredCustomers.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-ink/5 last:border-0 hover:bg-cream/30 transition-colors"
                >
                  <td className="p-3">
                    <div className="font-semibold text-ink">
                      {c.first_name} {c.last_name || ""}
                    </div>
                  </td>
                  <td className="p-3 font-mono text-xs text-honey font-medium">
                    <a href={`tel:${c.phone}`} className="hover:underline">
                      {c.phone}
                    </a>
                  </td>
                  <td className="p-3 text-xs text-ink/60">
                    {c.email || "—"}
                  </td>
                  <td className="p-3 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                      c.total_orders > 1 ? "bg-honey/15 text-honey" : "bg-ink/5 text-ink/60"
                    }`}>
                      {c.total_orders}
                    </span>
                  </td>
                  <td className="p-3 text-right font-bold text-ink whitespace-nowrap">
                    {c.total_spent} грн
                  </td>
                  <td className="p-3 text-xs text-ink/60 whitespace-nowrap">
                    {c.last_order_at
                      ? new Date(c.last_order_at).toLocaleDateString("uk-UA")
                      : "—"}
                  </td>
                  <td className="p-3 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => handleOpenCustomerOrders(c)}
                      className="px-2.5 py-1 rounded-lg border border-ink/10 text-xs font-semibold text-ink/80 hover:bg-honey hover:text-white hover:border-honey transition-colors"
                    >
                      Історія покупок →
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
