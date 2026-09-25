import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Auth } from "../data/db";

const NAV = [
  { to: "/admin", label: "Головна", icon: "📊", end: true },
  { to: "/admin/orders", label: "Замовлення", icon: "📦" },
  { to: "/admin/products", label: "Товари", icon: "🍯" },
  { to: "/admin/categories", label: "Категорії", icon: "🏷️" },
  { to: "/admin/settings", label: "Налаштування", icon: "⚙️" },
  { to: "/admin/help", label: "Довідка", icon: "📖" },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  return (
    <div className="min-h-[85vh] grid md:grid-cols-[220px_1fr] bg-cream/30">
      <aside className="bg-ink text-cream p-4 md:min-h-[85vh] flex flex-col justify-between">
        <div>
          <div className="font-serif font-bold text-lg flex items-center gap-2 px-2 py-3">
            🐝 Honey <span className="text-cream/40 text-xs font-sans font-normal">/admin</span>
          </div>
          <nav className="mt-4 flex md:flex-col gap-1 overflow-x-auto">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                    isActive ? "bg-honey text-white shadow-2xs font-semibold" : "text-cream/70 hover:bg-cream/10 hover:text-white"
                  }`
                }
              >
                <span>{n.icon}</span>{n.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="pt-6 border-t border-cream/10 mt-6 space-y-1">
          <NavLink
            to="/"
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-cream/60 hover:bg-cream/10 hover:text-cream transition-colors"
          >
            ← На сайт
          </NavLink>
          <button
            onClick={async () => {
              await Auth.logout();
              navigate("/admin/login");
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-red-300 hover:bg-red-500/20 hover:text-red-200 transition-colors w-full text-left"
          >
            ⏻ Вийти
          </button>
        </div>
      </aside>
      <main className="p-5 md:p-8 overflow-x-auto">
        <Outlet />
      </main>
    </div>
  );
}
