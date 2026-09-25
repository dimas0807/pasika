import { Link } from "react-router-dom";
import ProductImage from "../components/ProductImage";
import { useCart } from "../context/CartContext";

export default function Cart() {
  const { items, remove, setQty, clear, subtotal } = useCart();

  if (items.length === 0) {
    return (
      <div className="container-p py-24 text-center max-w-md mx-auto">
        <div className="w-20 h-20 rounded-full bg-cream mx-auto flex items-center justify-center text-4xl mb-4">
          🛒
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink">Кошик порожній</h1>
        <p className="text-ink/65 text-sm mt-2 leading-relaxed">
          Оберіть натуральний мед, крем-мед або подарунковий набір з нашого каталогу, щоб розпочати покупку.
        </p>
        <Link to="/catalog" className="btn-primary mt-6 inline-flex">
          Переглянути каталог
        </Link>
      </div>
    );
  }

  const totalItemsCount = items.reduce((s, i) => s + i.qty, 0);

  return (
    <div className="container-p py-8 md:py-12 pb-32 md:pb-16">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-ink/5 mb-8">
        <div>
          <nav className="text-xs text-ink/50 mb-1">
            <Link to="/" className="hover:text-honey">Головна</Link> / Кошик
          </nav>
          <h1 className="font-serif text-3xl font-bold text-ink">
            Ваш кошик ({totalItemsCount} {totalItemsCount === 1 ? "товар" : "товарів"})
          </h1>
        </div>
        <button
          onClick={clear}
          className="text-xs text-ink/40 hover:text-red-500 transition-colors py-1 px-2.5 rounded-lg hover:bg-red-50"
        >
          Очистити все
        </button>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Cart Items List */}
        <div className="lg:col-span-8 space-y-3.5">
          {items.map((i) => (
            <div
              key={i.id}
              className="card p-3.5 sm:p-5 flex gap-4 items-center border border-ink/10 shadow-xs hover:border-honey/30 transition-all"
            >
              {/* Product Thumbnail */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden shrink-0 bg-[#FAF6EE] border border-ink/5">
                <ProductImage
                  image={i.image}
                  category={i.category || ""}
                  alt={i.name}
                  className="w-full h-full"
                />
              </div>

              {/* Info & Quantity controls */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Link
                      to={`/product/${i.slug}`}
                      className="font-serif font-bold text-base sm:text-lg text-ink hover:text-honey transition-colors line-clamp-1"
                    >
                      {i.name}
                    </Link>
                    {i.weight && (
                      <div className="text-xs text-ink/50 font-medium mt-0.5">{i.weight}</div>
                    )}
                  </div>
                  <button
                    onClick={() => remove(i.id)}
                    className="text-ink/30 hover:text-red-500 transition-colors p-1"
                    aria-label="Видалити"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>

                <div className="mt-3 flex items-center justify-between gap-2">
                  <div className="flex items-center border border-ink/15 rounded-xl bg-white shadow-2xs overflow-hidden h-9">
                    <button
                      className="px-3 text-sm font-bold text-ink/60 hover:bg-cream transition-colors h-full"
                      onClick={() => setQty(i.id, i.qty - 1)}
                    >
                      −
                    </button>
                    <span className="px-3 text-xs sm:text-sm font-bold text-ink min-w-6 text-center">
                      {i.qty}
                    </span>
                    <button
                      className="px-3 text-sm font-bold text-ink/60 hover:bg-cream transition-colors h-full"
                      onClick={() => setQty(i.id, i.qty + 1)}
                    >
                      +
                    </button>
                  </div>

                  <div className="text-right">
                    <div className="font-serif font-bold text-base sm:text-lg text-ink">
                      {i.qty * i.price} грн
                    </div>
                    {i.qty > 1 && (
                      <div className="text-[11px] text-ink/40">{i.price} грн / шт.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary (Desktop Sticky Sidebar) */}
        <div className="lg:col-span-4 sticky top-24">
          <div className="card p-6 bg-[#FAF6EE] border border-gold/30 shadow-sm">
            <h3 className="font-serif font-bold text-lg text-ink pb-3 border-b border-ink/10">
              Підсумок замовлення
            </h3>

            <div className="py-4 space-y-2.5 text-sm text-ink/75">
              <div className="flex justify-between">
                <span>Товари ({totalItemsCount} шт.)</span>
                <span>{subtotal} грн</span>
              </div>
              <div className="flex justify-between text-ink/60 text-xs">
                <span>Доставка</span>
                <span>за тарифами перевізника</span>
              </div>
            </div>

            <div className="border-t border-ink/10 pt-4 flex justify-between items-baseline">
              <span className="font-serif font-bold text-lg text-ink">До сплати:</span>
              <span className="font-serif font-extrabold text-2xl text-ink">{subtotal} грн</span>
            </div>

            <Link
              to="/checkout"
              className="btn-primary w-full mt-6 py-3.5 text-center text-base"
            >
              Перейти до оформлення →
            </Link>

            <div className="mt-4 text-[11px] text-ink/50 text-center flex items-center justify-center gap-1.5">
              <span>🔒</span> Безпечне оформлення замовлення
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Checkout Bar */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden bg-white/95 backdrop-blur-md border-t border-ink/10 p-3.5 px-4 flex items-center justify-between gap-4 z-30 shadow-2xl">
        <div>
          <div className="text-[11px] text-ink/50 font-medium">Разом до сплати</div>
          <div className="font-serif font-extrabold text-xl text-ink leading-tight">{subtotal} грн</div>
        </div>
        <Link to="/checkout" className="btn-primary flex-1 py-3 text-sm text-center">
          Оформити замовлення →
        </Link>
      </div>
    </div>
  );
}
