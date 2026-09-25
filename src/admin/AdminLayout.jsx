import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Auth } from "../data/db";

const NAV = [
  { to: "/admin", label: "Дашборд", icon: "📊", end: true },
  { to: "/admin/orders", label: "Замовлення", icon: "📦" },
  { to: "/admin/products", label: "Товари", icon: "🍯" },
  { to: "/admin/settings", label: "Налаштування", icon: "⚙️" },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  return (
    <div className="min-h-[85vh] grid md:grid-cols-[220px_1fr] bg-cream/30">
      <aside className="bg-ink text-cream p-4 md:min-h-[85vh]">
        <div className="font-serif font-bold text-lg flex items-center gap-2 px-2 py-3">🐝 Honey <span className="text-cream/40 text-xs font-sans font-normal">/admin</span></div>
        <nav className="mt-4 flex md:flex-col gap-1 overflow-x-auto">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap ${isActive ? "bg-honey text-white" : "text-cream/70 hover:bg-cream/10"}`
              }
            >
              <span>{n.icon}</span>{n.label}
            </NavLink>
          ))}
        </nav>
        <button
          onClick={async () => {
            await Auth.logout();
            navigate("/admin/login");
          }}
          className="mt-6 md:mt-10 flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-cream/60 hover:bg-cream/10 w-full"
        >
          ⏻ Вийти
        </button>
        <NavLink to="/" className="hidden md:flex items-center gap-2 px-3 py-2.5 mt-2 rounded-xl text-sm text-cream/40 hover:bg-cream/10">
          ← На сайт
        </NavLink>
      </aside>
      <main className="p-5 md:p-8 overflow-x-auto">
        <Outlet />
      </main>
    </div>
  );
}
