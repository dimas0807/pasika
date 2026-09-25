import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useCart } from "../context/CartContext";

const NAV = [
  { to: "/", label: "Головна" },
  { to: "/about", label: "Про пасіку" },
  { to: "/catalog", label: "Магазин" },
  { to: "/gift-boxes", label: "Подарункові бокси" },
  { to: "/delivery", label: "Доставка" },
  { to: "/contacts", label: "Контакти" },
];

export default function Header() {
  const { count } = useCart();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-clean/90 backdrop-blur border-b border-ink/5">
      <div className="container-p flex items-center justify-between h-16 md:h-20">
        <Link to="/" className="flex items-center gap-2 font-serif text-xl md:text-2xl font-bold text-ink shrink-0">
          <span className="text-2xl">🐝</span> Honey Pasika
        </Link>

        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) =>
                `hover:text-honey transition-colors ${isActive ? "text-honey" : "text-ink/80"}`
              }
            >
              {n.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3 md:gap-4">
          <a
            href="https://tiktok.com"
            target="_blank" rel="noreferrer"
            className="hidden md:inline-flex text-ink/70 hover:text-honey text-sm font-medium"
          >
            TikTok
          </a>
          <a
            href="https://t.me"
            target="_blank" rel="noreferrer"
            className="hidden md:inline-flex text-ink/70 hover:text-honey text-sm font-medium"
          >
            Telegram
          </a>
          <Link to="/cart" className="relative p-2 rounded-full hover:bg-cream transition-colors" aria-label="Кошик">
            <CartIcon />
            {count > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-honey text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {count}
              </span>
            )}
          </Link>
          <button className="lg:hidden p-2" onClick={() => setOpen((o) => !o)} aria-label="Меню">
            <MenuIcon open={open} />
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden border-t border-ink/5 bg-clean">
          <nav className="container-p py-3 flex flex-col gap-1">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `py-2.5 text-sm font-medium border-b border-ink/5 ${isActive ? "text-honey" : "text-ink/80"}`
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}

function CartIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 4h2l2.4 12.2a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.6L21 8H6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="10" cy="21" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="17" cy="21" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}
function MenuIcon({ open }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      {open ? <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" /> : <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />}
    </svg>
  );
}
