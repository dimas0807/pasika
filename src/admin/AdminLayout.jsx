import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Auth } from "../data/db";

const NAV = [
  { to: "/admin", label: "Головна", icon: "📊", end: true },
  { to: "/admin/orders", label: "Замовлення", icon: "📦" },
  { to: "/admin/customers", label: "Клієнти", icon: "👥" },
  { to: "/admin/products", label: "Товари", icon: "🥩" },
  { to: "/admin/categories", label: "Категорії", icon: "🏷️" },
  { to: "/admin/settings", label: "Налаштування", icon: "⚙️" },
  { to: "/admin/help", label: "Довідка", icon: "📖" },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <div className="admin-panel min-h-screen md:min-h-[85vh] md:grid md:grid-cols-[220px_1fr] bg-[#121110] text-[#F4EFEA]">
      {/* MOBILE TOP HEADER BAR (md:hidden) */}
      <header className="md:hidden sticky top-0 z-30 bg-[#161413] text-[#F4EFEA] px-4 py-3 flex items-center justify-between border-b border-[#2C2621] shadow-md">
        <div className="font-serif font-bold text-base flex items-center gap-2">
          <span>🥩 М'ясний рай</span>
          <span className="text-bronze text-xs font-sans font-semibold">/admin</span>
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Відкрити меню навігації"
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-[#26211D] active:bg-[#332C26] text-[#F4EFEA] min-h-[44px] transition-colors border border-[#3A332B]"
        >
          <span className="text-base leading-none">☰</span>
          <span>Меню</span>
        </button>
      </header>

      {/* MOBILE SLIDE-OVER DRAWER (md:hidden) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
          />

          {/* Drawer panel */}
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-[#161413] text-[#F4EFEA] p-5 flex flex-col justify-between shadow-2xl z-10 border-r border-[#2C2621]">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#2C2621]">
                <div className="font-serif font-bold text-lg flex items-center gap-2">
                  <span>🥩 М'ясний рай</span>
                  <span className="text-bronze text-xs font-sans font-semibold">/admin</span>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Закрити меню"
                  className="w-10 h-10 rounded-xl bg-[#26211D] active:bg-[#332C26] flex items-center justify-center text-[#F4EFEA] text-base transition-colors"
                >
                  ✕
                </button>
              </div>

              <nav className="mt-4 flex flex-col gap-1.5">
                {NAV.map((n) => (
                  <NavLink
                    key={n.to}
                    to={n.to}
                    end={n.end}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-colors min-h-[44px] ${
                        isActive
                          ? "bg-bronze text-[#141210] shadow-sm font-bold"
                          : "text-[#D1C7BD] hover:bg-[#26211D] hover:text-white"
                      }`
                    }
                  >
                    <span className="text-base">{n.icon}</span>
                    <span>{n.label}</span>
                  </NavLink>
                ))}
              </nav>
            </div>

            <div className="pt-4 border-t border-[#2C2621] space-y-1">
              <NavLink
                to="/"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-medium text-[#A3988E] hover:bg-[#26211D] hover:text-white transition-colors min-h-[44px]"
              >
                <span>←</span> На сайт
              </NavLink>
              <button
                type="button"
                onClick={async () => {
                  setMobileOpen(false);
                  await Auth.logout();
                  navigate("/admin/login");
                }}
                className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-medium text-red-400 hover:bg-red-950/30 hover:text-red-300 transition-colors w-full text-left min-h-[44px]"
              >
                <span>⏻</span> Вийти
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DESKTOP SIDEBAR (hidden md:flex) */}
      <aside className="hidden md:flex bg-[#161413] text-[#F4EFEA] p-4 md:min-h-[85vh] flex-col justify-between border-r border-[#2C2621]">
        <div>
          <div className="font-serif font-bold text-lg flex items-center gap-2 px-2 py-3 border-b border-[#2C2621] mb-2">
            <span>🥩 М'ясний рай</span>
            <span className="text-bronze text-xs font-sans font-semibold">/admin</span>
          </div>
          <nav className="mt-4 flex flex-col gap-1">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? "bg-bronze text-[#141210] shadow-sm font-bold"
                      : "text-[#D1C7BD] hover:bg-[#25201C] hover:text-white"
                  }`
                }
              >
                <span>{n.icon}</span>{n.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="pt-6 border-t border-[#2C2621] mt-6 space-y-1">
          <NavLink
            to="/"
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-[#A3988E] hover:bg-[#25201C] hover:text-[#F4EFEA] transition-colors"
          >
            ← На сайт
          </NavLink>
          <button
            onClick={async () => {
              await Auth.logout();
              navigate("/admin/login");
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-red-400 hover:bg-red-950/30 hover:text-red-300 transition-colors w-full text-left"
          >
            ⏻ Вийти
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="w-full min-w-0 p-4 sm:p-6 md:p-8 bg-[#121110]">
        <Outlet />
      </main>
    </div>
  );
}
