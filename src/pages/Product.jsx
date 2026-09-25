import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import ProductImage from "../components/ProductImage";
import { useCart } from "../context/CartContext";
import { Products } from "../data/db";

export default function Product() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { add } = useCart();
  const [product, setProduct] = useState(() => Products.bySlug(slug));
  const [loading, setLoading] = useState(!product);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [activeTab, setActiveTab] = useState("desc");

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    Products.fetchBySlug(slug)
      .then((p) => {
        if (p) setProduct(p);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading && !product) {
    return (
      <div className="container-p py-24 text-center">
        <div className="inline-block animate-spin text-3xl mb-3">🐝</div>
        <p className="text-ink/60 font-medium">Завантаження товару...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container-p py-24 text-center">
        <div className="text-4xl mb-3">🍯</div>
        <h2 className="font-serif text-2xl font-bold text-ink mb-2">Товар не знайдено</h2>
        <p className="text-ink/60 text-sm">Можливо, він був розпроданий або переміщений.</p>
        <Link to="/catalog" className="btn-primary mt-6 inline-flex text-sm">
          Повернутися до каталогу
        </Link>
      </div>
    );
  }

  const handleAddToCart = (andCheckout = false) => {
    add(product, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
    if (andCheckout) {
      navigate("/cart");
    }
  };

  const isAvailable = product.stock > 0;
  const related = Products.byCategory(product.category)
    .filter((p) => p.id !== product.id)
    .slice(0, 4);

  return (
    <div className="container-p py-8 md:py-12">
      {/* Breadcrumbs */}
      <nav className="text-xs text-ink/50 mb-6 flex items-center gap-1.5 flex-wrap">
        <Link to="/" className="hover:text-honey transition-colors">Головна</Link>
        <span>/</span>
        <Link to="/catalog" className="hover:text-honey transition-colors">Каталог</Link>
        <span>/</span>
        <span className="text-ink/80 font-medium">{product.name}</span>
      </nav>

      {/* Main Product Layout */}
      <div className="grid md:grid-cols-12 gap-8 lg:gap-12">
        {/* Left: Product Image */}
        <div className="md:col-span-6 lg:col-span-5">
          <div className="card p-3 sm:p-4 bg-white border border-ink/10 shadow-sm rounded-3xl sticky top-24">
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-[#FAF6EE]">
              <ProductImage
                image={product.image}
                category={product.category}
                alt={product.name}
                className="w-full h-full"
              />
              <span className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm text-ink text-xs font-semibold px-3 py-1 rounded-full shadow-xs border border-ink/5">
                🌿 100% натурально
              </span>
            </div>
          </div>
        </div>

        {/* Right: Product Info & Actions */}
        <div className="md:col-span-6 lg:col-span-7 flex flex-col">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-honey bg-cream px-3 py-1 rounded-full">
                {product.category === "gift-boxes" ? "Подарунковий набір" : "Продукт пасіки"}
              </span>
              <span className={`badge ${isAvailable ? "bg-leaf/10 text-leaf" : "bg-red-50 text-red-500"}`}>
                {isAvailable ? `В наявності (${product.stock} шт.)` : "Немає в наявності"}
              </span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-ink mt-3 leading-tight">
              {product.name}
            </h1>

            {/* Reviews summary */}
            <div className="flex items-center gap-2 mt-2 text-xs sm:text-sm text-ink/65">
              <div className="text-amber-400">★★★★★</div>
              <span className="font-semibold text-ink">4.9</span>
              <span className="text-ink/40">•</span>
              <span>24 задоволених покупців</span>
            </div>

            {/* Price section */}
            <div className="mt-5 p-4 rounded-2xl bg-[#FAF6EE] border border-gold/20 flex items-baseline gap-3">
              <span className="font-serif font-extrabold text-3xl sm:text-4xl text-ink">
                {product.price} грн
              </span>
              {product.oldPrice && (
                <span className="text-base text-ink/40 line-through">
                  {product.oldPrice} грн
                </span>
              )}
            </div>

            {/* Weight / Options */}
            {product.weight && (
              <div className="mt-6">
                <div className="label">Фасування / Вага:</div>
                <div className="inline-flex items-center gap-2 p-1 rounded-xl bg-white border border-ink/10">
                  <span className="px-4 py-1.5 rounded-lg text-xs sm:text-sm font-semibold bg-honey text-ink shadow-2xs">
                    {product.weight}
                  </span>
                </div>
              </div>
            )}

            {/* Quantity & Add to Cart */}
            <div className="mt-7 flex flex-wrap items-center gap-4">
              <div className="flex items-center border border-ink/15 rounded-xl bg-white shadow-2xs overflow-hidden h-12">
                <button
                  type="button"
                  className="px-4 text-lg font-bold text-ink/70 hover:bg-cream hover:text-ink transition-colors h-full flex items-center justify-center"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  aria-label="Зменшити кількість"
                >
                  −
                </button>
                <span className="px-4 font-bold text-sm text-ink min-w-8 text-center">
                  {qty}
                </span>
                <button
                  type="button"
                  className="px-4 text-lg font-bold text-ink/70 hover:bg-cream hover:text-ink transition-colors h-full flex items-center justify-center"
                  onClick={() => setQty((q) => q + 1)}
                  aria-label="Збільшити кількість"
                >
                  +
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleAddToCart(false)}
                disabled={!isAvailable}
                className={`flex-1 h-12 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                  added
                    ? "bg-leaf text-white shadow-md"
                    : "btn-primary disabled:opacity-40 disabled:pointer-events-none"
                }`}
              >
                {added ? (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>Додано в кошик!</span>
                  </>
                ) : (
                  <>
                    <span>В кошик ({qty * product.price} грн)</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleAddToCart(true)}
                disabled={!isAvailable}
                className="btn-secondary h-12 px-5 text-sm whitespace-nowrap"
              >
                Купити зараз
              </button>
            </div>

            {/* Trust highlights */}
            <div className="mt-8 grid grid-cols-3 gap-2 sm:gap-4 p-4 rounded-2xl bg-white border border-ink/5 text-center">
              <div>
                <div className="text-xl">🚚</div>
                <div className="text-xs font-bold text-ink mt-1">1–2 дні</div>
                <div className="text-[11px] text-ink/50">Швидка доставка</div>
              </div>
              <div className="border-x border-ink/5">
                <div className="text-xl">🌿</div>
                <div className="text-xs font-bold text-ink mt-1">100% Чистий</div>
                <div className="text-[11px] text-ink/50">Без домішок</div>
              </div>
              <div>
                <div className="text-xl">🐝</div>
                <div className="text-xs font-bold text-ink mt-1">З пасіки</div>
                <div className="text-[11px] text-ink/50">Свіжий збір</div>
              </div>
            </div>

            {/* Information Tabs */}
            <div className="mt-8 border-t border-ink/10 pt-6">
              <div className="flex gap-4 border-b border-ink/10 pb-2">
                <button
                  onClick={() => setActiveTab("desc")}
                  className={`text-sm font-bold pb-2 transition-colors relative ${
                    activeTab === "desc"
                      ? "text-honey after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-honey"
                      : "text-ink/60 hover:text-ink"
                  }`}
                >
                  Опис
                </button>
                <button
                  onClick={() => setActiveTab("benefits")}
                  className={`text-sm font-bold pb-2 transition-colors relative ${
                    activeTab === "benefits"
                      ? "text-honey after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-honey"
                      : "text-ink/60 hover:text-ink"
                  }`}
                >
                  Склад та зберігання
                </button>
                <button
                  onClick={() => setActiveTab("delivery")}
                  className={`text-sm font-bold pb-2 transition-colors relative ${
                    activeTab === "delivery"
                      ? "text-honey after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-honey"
                      : "text-ink/60 hover:text-ink"
                  }`}
                >
                  Доставка
                </button>
              </div>

              <div className="pt-4 text-sm text-ink/75 leading-relaxed">
                {activeTab === "desc" && (
                  <p>{product.description || "Натуральний свіжий мед прямо з нашої пасіки. Зібраний у чистій екологічній зоні без додавання консервантів."}</p>
                )}
                {activeTab === "benefits" && (
                  <ul className="list-disc list-inside space-y-1.5">
                    <li>Склад: 100% натуральний продукт бджільництва.</li>
                    <li>Термін придатності: 24 місяці з дати фасування.</li>
                    <li>Зберігати у сухому темному місці при температурі від +5°C до +25°C.</li>
                  </ul>
                )}
                {activeTab === "delivery" && (
                  <p>
                    Відправляємо Новою Поштою та Укрпоштою по всій Україні у надійному протиударному пакуванні. Можлива оплата при отриманні або на картку.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {related.length > 0 && (
        <section className="mt-16 sm:mt-24 border-t border-ink/10 pt-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-ink">
              Вам також може сподобатися
            </h2>
            <Link to="/catalog" className="text-xs sm:text-sm font-semibold text-honey hover:underline">
              Більше в каталозі →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-5">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
