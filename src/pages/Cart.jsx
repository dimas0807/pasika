import { useEffect } from "react";
import { Link } from "react-router-dom";
import ProductImage from "../components/ProductImage";
import { useCart } from "../context/CartContext";
import { IconCart, IconClose, IconClock, IconShieldCheck } from "../components/Icons";

export default function Cart() {
  const { items, remove, setQty, clear, subtotal, stockNotice, setStockNotice, validateStockWithServer } = useCart();

  useEffect(() => {
    validateStockWithServer();
  }, [validateStockWithServer]);

  if (items.length === 0) {
    return (
      <div className="container-p py-20 text-center max-w-md mx-auto">
        <div className="text-6xl mb-4">🥩</div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#F4EFEA]">Кошик порожній</h1>
        <p className="text-[#A3988E] text-sm mt-2 leading-relaxed">
          Оберіть домашні ковбаси, копчену шинку, генеральське сало або інші делікатеси з нашого каталогу, щоб розпочати покупку.
        </p>
        <Link to="/catalog" className="btn-primary mt-6 inline-flex text-sm font-bold">
          Переглянути каталог страв →
        </Link>
      </div>
    );
  }

  const totalItemsCount = items.reduce((s, i) => s + i.qty, 0);

  return (
    <div className="container-p py-8 md:py-12 pb-32 md:pb-16">
      {stockNotice && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-950/40 border border-amber-600/30 text-amber-200 text-sm flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <IconClock className="w-4 h-4 text-bronze shrink-0" />
            <span className="font-medium">{stockNotice}</span>
          </div>
          <button
            onClick={() => setStockNotice(null)}
            className="text-amber-200/60 hover:text-amber-200 p-1 rounded-lg hover:bg-amber-900/30 transition-colors"
            aria-label="Закрити"
          >
            <IconClose className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-[#2C2621] mb-8">
        <div>
          <nav className="text-xs text-[#8C8074] mb-1">
            <Link to="/" className="hover:text-bronze">Головна</Link> / Кошик
          </nav>
          <h1 className="font-serif text-3xl font-bold text-[#F4EFEA]">
            Ваш кошик ({totalItemsCount} {totalItemsCount === 1 ? "страва" : "страв"})
          </h1>
        </div>
        <button
          onClick={clear}
          className="text-xs text-[#8C8074] hover:text-red-400 transition-colors py-1 px-2.5 rounded-lg hover:bg-red-950/30"
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
              className="p-3.5 sm:p-5 rounded-2xl bg-[#1C1815] border border-[#2F2821] flex gap-4 items-center hover:border-bronze/40 transition-all shadow-md"
            >
              {/* Product Thumbnail */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden shrink-0 bg-[#141210] border border-[#332A22]">
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
                    {i.slug ? (
                      <Link
                        to={i.category === "podarunkovi-boksy" ? "/gift-boxes" : `/product/${i.slug}`}
                        className="font-serif font-bold text-base sm:text-lg text-[#F4EFEA] hover:text-bronze transition-colors line-clamp-1"
                      >
                        {i.name}
                      </Link>
                    ) : (
                      <span className="font-serif font-bold text-base sm:text-lg text-[#F4EFEA] line-clamp-1">
                        {i.name}
                      </span>
                    )}
                    {i.weight && (
                      <div className="text-xs text-[#8C8074] font-medium mt-0.5">{i.weight}</div>
                    )}
                    {i.boxItems && Array.isArray(i.boxItems) && i.boxItems.length > 0 && (
                      <div className="mt-1.5 text-xs text-bronze/90 bg-[#25201C] py-1 px-2 rounded-lg border border-[#3A332B]/50">
                        <span className="font-semibold text-[#D4C3B3]">Склад:</span> {i.boxItems.map((b) => `${b.name} (${b.qty} шт)`).join(", ")}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => remove(i.id)}
                    className="text-[#7A7065] hover:text-red-400 transition-colors p-1"
                    aria-label="Видалити"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>

                <div className="mt-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center border border-[#3A332B] rounded-xl bg-[#141210] shadow-xs overflow-hidden h-9">
                      <button
                        className="px-3 text-sm font-bold text-[#A3988E] hover:bg-[#25201C] hover:text-white transition-colors h-full disabled:opacity-30"
                        onClick={() => setQty(i.id, i.qty - 1)}
                        disabled={i.qty <= 1}
                        aria-label="Зменшити кількість"
                      >
                        −
                      </button>
                      <span className="px-3 text-xs sm:text-sm font-bold text-[#F4EFEA] min-w-6 text-center">
                        {i.qty}
                      </span>
                      <button
                        className="px-3 text-sm font-bold text-[#A3988E] hover:bg-[#25201C] hover:text-white transition-colors h-full disabled:opacity-30"
                        onClick={() => setQty(i.id, i.qty + 1)}
                        disabled={i.availableStock !== undefined && i.qty >= i.availableStock}
                        title={i.availableStock !== undefined && i.qty >= i.availableStock ? "Досягнуто максимум в наявності" : "Збільшити кількість"}
                        aria-label="Збільшити кількість"
                      >
                        +
                      </button>
                    </div>
                    {i.availableStock !== undefined && i.qty >= i.availableStock && (
                      <span className="text-[10px] text-bronze bg-[#26201B] px-1.5 py-0.5 rounded border border-bronze/30 font-medium">
                        Макс. {i.availableStock} шт.
                      </span>
                    )}
                  </div>

                  <div className="text-right">
                    <div className="font-serif font-bold text-base sm:text-lg text-[#F4EFEA]">
                      {i.qty * i.price} <span className="text-xs text-bronze">грн</span>
                    </div>
                    {i.qty > 1 && (
                      <div className="text-[11px] text-[#7A7065]">{i.price} грн / шт.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary (Desktop Sticky Sidebar) */}
        <div className="lg:col-span-4 sticky top-24">
          <div className="p-6 rounded-2xl bg-[#1C1815] border border-[#2F2821] shadow-xl">
            <h3 className="font-serif font-bold text-lg text-[#F4EFEA] pb-3 border-b border-[#2C2621]">
              Підсумок замовлення
            </h3>

            <div className="py-4 space-y-2.5 text-sm text-[#CFC5BA]">
              <div className="flex justify-between">
                <span>Страви ({totalItemsCount} шт.)</span>
                <span className="font-semibold text-[#F4EFEA]">{subtotal} грн</span>
              </div>
              <div className="flex justify-between text-[#8C8074] text-xs">
                <span>Доставка</span>
                <span>за тарифами Нової Пошти</span>
              </div>
            </div>

            <div className="border-t border-[#2C2621] pt-4 flex justify-between items-baseline">
              <span className="font-serif font-bold text-lg text-[#F4EFEA]">Разом:</span>
              <span className="font-serif font-extrabold text-2xl text-bronze">{subtotal} грн</span>
            </div>

            <Link
              to="/checkout"
              className="btn-primary w-full mt-6 py-4 text-center text-base font-bold"
            >
              Перейти до оформлення →
            </Link>

            <div className="mt-4 text-[11px] text-[#8C8074] text-center flex items-center justify-center gap-1.5">
              <IconShieldCheck className="w-3.5 h-3.5 text-bronze inline-block" />
              <span>Швидке оформлення без реєстрації</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Checkout Bar */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden bg-[#161412]/95 backdrop-blur-md border-t border-[#2C2621] p-3.5 px-4 pb-[calc(0.875rem+env(safe-area-inset-bottom,0px))] flex items-center justify-between gap-4 z-30 shadow-2xl">
        <div>
          <div className="text-[11px] text-[#8C8074] font-medium">Разом:</div>
          <div className="font-serif font-extrabold text-xl text-bronze leading-tight">{subtotal} грн</div>
        </div>
        <Link to="/checkout" className="btn-primary flex-1 py-3 text-sm text-center font-bold">
          Оформити замовлення →
        </Link>
      </div>
    </div>
  );
}
