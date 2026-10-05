import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import ProductImage from "../components/ProductImage";
import { useCart } from "../context/CartContext";
import { Products, Settings } from "../data/db";
import { getSocialUrl } from "../utils/contacts";
import { IconTruck, IconShieldCheck, IconViber, IconCheckCircle, IconCart } from "../components/Icons";

export default function Product() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { add } = useCart();
  const [product, setProduct] = useState(() => Products.bySlug(slug));
  const [loading, setLoading] = useState(!product);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [activeTab, setActiveTab] = useState("desc");
  const [s, setS] = useState(() => Settings.get());

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    Settings.fetch().then((data) => data && setS(data));
    Products.fetchBySlug(slug)
      .then((p) => {
        if (p) setProduct(p);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const phone = (s?.contacts?.phone || s?.store?.phone || "068 025 78 77").trim();
  const viberRaw = (s?.contacts?.viber || "0680257877").trim();
  const viberUrl = getSocialUrl("viber", viberRaw) || "viber://chat?number=%2B380680257877";

  if (loading && !product) {
    return (
      <div className="container-p py-24 text-center">
        <div className="text-4xl mb-3 animate-bounce">🥩</div>
        <p className="text-[#A3988E] font-medium">Завантаження страви...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container-p py-24 text-center max-w-sm mx-auto">
        <div className="text-5xl mb-4">🥩</div>
        <h2 className="font-serif text-2xl font-bold text-[#F4EFEA] mb-2">Страву не знайдено</h2>
        <p className="text-[#A3988E] text-sm">Можливо, товар уже розпродано або його назва змінилася.</p>
        <Link to="/catalog" className="btn-primary mt-6 inline-flex text-sm">
          Повернутися до каталогу
        </Link>
      </div>
    );
  }

  const availableStock =
    product.availableStock !== undefined ? product.availableStock : Number(product.stock) || 0;
  const isAvailable = availableStock > 0;

  const handleAddToCart = (andCheckout = false) => {
    const res = add(product, qty);
    if (res && res.success === false) {
      return;
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
    if (andCheckout) {
      navigate("/checkout");
    }
  };

  const related = Products.byCategory(product.category)
    .filter((p) => p.id !== product.id)
    .slice(0, 4);

  return (
    <div className="container-p py-8 md:py-12">
      {/* Breadcrumbs */}
      <nav className="text-xs text-[#8C8074] mb-6 flex items-center gap-1.5 flex-wrap">
        <Link to="/" className="hover:text-bronze transition-colors">Головна</Link>
        <span>/</span>
        <Link to="/catalog" className="hover:text-bronze transition-colors">Каталог</Link>
        <span>/</span>
        <span className="text-[#F4EFEA] font-medium">{product.name}</span>
      </nav>

      {/* Main Product Layout */}
      <div className="grid md:grid-cols-12 gap-8 lg:gap-12">
        {/* Left: Product Image */}
        <div className="md:col-span-6 lg:col-span-5">
          <div className="p-3 sm:p-4 rounded-3xl bg-[#1C1815] border border-[#2F2821] shadow-2xl sticky top-24">
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-[#141210] border border-[#332A22]">
              <ProductImage
                image={product.image}
                category={product.category}
                alt={product.name}
                className="w-full h-full"
              />
              <span className="absolute top-3 left-3 bg-black/75 backdrop-blur-md text-[#E8DFD5] text-xs font-semibold px-3 py-1 rounded-full shadow-xs border border-white/10 flex items-center gap-1.5">
                <span>🔥 Натуральне копчення</span>
              </span>
            </div>
          </div>
        </div>

        {/* Right: Product Info & Actions */}
        <div className="md:col-span-6 lg:col-span-7 flex flex-col">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-bronze bg-[#26201B] border border-bronze/30 px-3 py-1 rounded-full">
                Домашні делікатеси
              </span>
              <span className={`badge ${isAvailable ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/40" : "bg-red-950/60 text-red-400 border border-red-800/40"}`}>
                {isAvailable ? `Свіже в наявності` : "Під замовлення"}
              </span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-[#F4EFEA] mt-3 leading-tight">
              {product.name}
            </h1>

            {/* Badges / Rating */}
            <div className="flex items-center gap-2 mt-2 text-xs sm:text-sm text-[#A3988E]">
              <span className="text-bronze">★★★★★</span>
              <span className="font-bold text-[#F4EFEA]">5.0</span>
              <span>•</span>
              <span>100% задоволених покупців</span>
            </div>

            {/* Price section */}
            <div className="mt-5 p-4 rounded-2xl bg-[#1C1815] border border-[#2F2821] flex items-baseline gap-3">
              <span className="font-serif font-extrabold text-3xl sm:text-4xl text-[#F4EFEA]">
                {product.price} <span className="text-xl font-sans font-normal text-bronze">грн</span>
              </span>
              {product.oldPrice && (
                <span className="text-base text-[#7A7065] line-through">
                  {product.oldPrice} грн
                </span>
              )}
              <span className="text-xs text-[#A3988E] ml-auto">
                {product.weight ? `за ${product.weight}` : "за 1 кг"}
              </span>
            </div>

            {/* Weight / Options */}
            {product.weight && (
              <div className="mt-6">
                <div className="label">Фасування / Вага порції:</div>
                <div className="inline-flex items-center gap-2 p-1.5 rounded-xl bg-[#181614] border border-[#332A22]">
                  <span className="px-4 py-1 rounded-lg text-xs sm:text-sm font-bold bg-gradient-to-r from-bronze to-gold text-[#141210] shadow-sm">
                    {product.weight}
                  </span>
                </div>
              </div>
            )}

            {/* Quantity & Add to Cart */}
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <div className="flex items-center border border-[#3A332B] rounded-xl bg-[#181614] shadow-xs overflow-hidden h-12">
                <button
                  type="button"
                  className="px-4 text-lg font-bold text-[#D1C7BD] hover:bg-[#25201C] hover:text-white transition-colors h-full flex items-center justify-center disabled:opacity-30"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  disabled={qty <= 1}
                  aria-label="Зменшити кількість"
                >
                  −
                </button>
                <span className="px-4 font-bold text-sm text-[#F4EFEA] min-w-8 text-center">
                  {qty}
                </span>
                <button
                  type="button"
                  className="px-4 text-lg font-bold text-[#D1C7BD] hover:bg-[#25201C] hover:text-white transition-colors h-full flex items-center justify-center disabled:opacity-30"
                  onClick={() => setQty((q) => Math.min(availableStock, q + 1))}
                  disabled={qty >= availableStock}
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
                    ? "bg-emerald-600 text-white shadow-md"
                    : "btn-primary disabled:opacity-40 disabled:pointer-events-none"
                }`}
              >
                {added ? (
                  <>
                    <IconCheckCircle className="w-5 h-5 text-white" />
                    <span>Додано в кошик!</span>
                  </>
                ) : (
                  <>
                    <IconCart className="w-5 h-5" />
                    <span>Додати до кошика ({qty * product.price} грн)</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleAddToCart(true)}
                disabled={!isAvailable}
                className="btn-secondary h-12 px-5 text-sm whitespace-nowrap font-bold"
              >
                Оформити
              </button>
            </div>

            {/* Direct Viber CTA */}
            <div className="mt-4">
              <a
                href={viberUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full btn-viber text-sm h-12"
              >
                <IconViber className="w-5 h-5 text-white" />
                <span>Замовити або запитати Галину у Viber</span>
              </a>
            </div>

            {/* Trust highlights */}
            <div className="mt-8 grid grid-cols-3 gap-2 sm:gap-4 p-4 rounded-2xl bg-[#1C1815] border border-[#2F2821] text-center">
              <div>
                <IconTruck className="w-5 h-5 mx-auto text-bronze" />
                <div className="text-xs font-bold text-[#F4EFEA] mt-1.5">1–2 дні</div>
                <div className="text-[11px] text-[#8C8074]">Нова Пошта</div>
              </div>
              <div className="border-x border-[#2F2821]">
                <IconShieldCheck className="w-5 h-5 mx-auto text-bronze" />
                <div className="text-xs font-bold text-[#F4EFEA] mt-1.5">На дровах</div>
                <div className="text-[11px] text-[#8C8074]">Без рідкого диму</div>
              </div>
              <div>
                <span className="text-xl block">❄️</span>
                <div className="text-xs font-bold text-[#F4EFEA] mt-1.5">Термобокс</div>
                <div className="text-[11px] text-[#8C8074]">Зберігає свіжість</div>
              </div>
            </div>

            {/* Information Tabs */}
            <div className="mt-8 border-t border-[#2C2621] pt-6">
              <div className="flex gap-4 border-b border-[#2C2621] pb-2">
                <button
                  onClick={() => setActiveTab("desc")}
                  className={`text-sm font-bold pb-2 transition-colors relative ${
                    activeTab === "desc"
                      ? "text-bronze after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-bronze"
                      : "text-[#8C8074] hover:text-[#D1C7BD]"
                  }`}
                >
                  Опис
                </button>
                <button
                  onClick={() => setActiveTab("benefits")}
                  className={`text-sm font-bold pb-2 transition-colors relative ${
                    activeTab === "benefits"
                      ? "text-bronze after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-bronze"
                      : "text-[#8C8074] hover:text-[#D1C7BD]"
                  }`}
                >
                  Склад та зберігання
                </button>
                <button
                  onClick={() => setActiveTab("delivery")}
                  className={`text-sm font-bold pb-2 transition-colors relative ${
                    activeTab === "delivery"
                      ? "text-bronze after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-bronze"
                      : "text-[#8C8074] hover:text-[#D1C7BD]"
                  }`}
                >
                  Доставка та оплата
                </button>
              </div>

              <div className="pt-4 text-sm text-[#CFC5BA] leading-relaxed">
                {activeTab === "desc" && (
                  <p>{product.description || "Натуральні домашні делікатеси власного копчення. Приготовані за родинним рецептом на сухих дровах без додавання шкідливих хімічних речовин."}</p>
                )}
                {activeTab === "benefits" && (
                  <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm">
                    <li>Склад: добірне фермерське м'ясо (свинина / птиця), сіль харчова, свіжий часник, суміш мелених перців.</li>
                    <li>Без сої, крохмалю, глютамату натрію та рідкого диму.</li>
                    <li>Термін придатності: у герметичній вакуумній упаковці — до 30 діб при температурі +2°C...+6°C. Після відкриття — до 7 діб.</li>
                  </ul>
                )}
                {activeTab === "delivery" && (
                  <p>
                    Відправляємо Новою Поштою по всій території України. Кожне замовлення дбайливо вакуумується та пакується у термоізоляційні коробки з холодоелементами. Оплата: при отриманні у відділенні (накладений платіж) або переказ за реквізитами.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {related.length > 0 && (
        <section className="mt-16 sm:mt-24 border-t border-[#2C2621] pt-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#F4EFEA]">
              Також смакує разом
            </h2>
            <Link to="/catalog" className="text-xs sm:text-sm font-bold text-bronze hover:underline">
              Більше страв у каталозі →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
