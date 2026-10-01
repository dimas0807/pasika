import { useState } from "react";
import { Link } from "react-router-dom";
import ProductImage from "./ProductImage";
import { useCart } from "../context/CartContext";
import { IconSparkles, IconCheckCircle, IconCart } from "./Icons";

export default function ProductCard({ product }) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);

  const handleAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const res = add(product, 1);
    if (res && res.success === false) return;
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  const availableStock =
    product.availableStock !== undefined ? product.availableStock : Number(product.stock) || 0;
  const isAvailable = availableStock > 0;

  return (
    <div className="rounded-3xl overflow-hidden flex flex-col group bg-white/85 backdrop-blur-md border border-amber-900/10 shadow-[0_4px_20px_rgba(41,40,33,0.03)] hover:shadow-[0_16px_36px_rgba(41,40,33,0.08)] hover:border-honey/40 hover:-translate-y-1 transition-all duration-300">
      {/* Product Image Link */}
      <Link
        to={`/product/${product.slug}`}
        className="block relative overflow-hidden bg-[#FAF6EE] aspect-square"
      >
        <ProductImage
          image={product.image}
          category={product.category}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
        />

        {/* Floating Weight Badge */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 items-start pointer-events-none">
          {product.weight && (
            <span className="text-[11px] font-semibold bg-white/95 backdrop-blur-md text-ink/75 px-2.5 py-0.5 rounded-full shadow-2xs border border-amber-900/10">
              {product.weight}
            </span>
          )}
        </div>

        {/* Sale Pill */}
        {product.oldPrice && (
          <span className="absolute top-2.5 right-2.5 text-[10px] font-bold uppercase tracking-wider bg-accent text-ink px-2.5 py-0.5 rounded-full shadow-2xs border border-white/60">
            Акція
          </span>
        )}
      </Link>

      {/* Product Details */}
      <div className="p-3.5 sm:p-4 flex flex-col flex-1">
        <Link
          to={`/product/${product.slug}`}
          className="font-serif font-bold text-base md:text-lg text-ink hover:text-honey transition-colors line-clamp-1 leading-snug"
        >
          {product.name}
        </Link>

        {/* Stock / Feature indicator */}
        <div className="mt-1 flex items-center justify-between text-xs text-ink/55">
          <span className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${isAvailable ? "bg-leaf" : "bg-red-400"}`} />
            {isAvailable ? "В наявності" : "Під замовлення"}
          </span>
          {product.category === "gift-boxes" && (
            <span className="inline-flex items-center gap-1 text-honey font-semibold text-[11px]">
              <IconSparkles className="w-3 h-3" /> Подарунковий
            </span>
          )}
        </div>

        {/* Pricing & Add to Cart Action */}
        <div className="mt-auto pt-3 flex flex-col gap-2.5">
          <div className="flex items-baseline gap-2">
            <span className="font-serif font-bold text-lg sm:text-xl text-ink">
              {product.price} грн
            </span>
            {product.oldPrice && (
              <span className="text-xs text-ink/40 line-through">
                {product.oldPrice} грн
              </span>
            )}
          </div>

          {isAvailable ? (
            <button
              onClick={handleAdd}
              className={`w-full py-2.5 px-3 rounded-xl font-semibold text-xs sm:text-sm transition-all duration-200 flex items-center justify-center gap-1.5 min-h-[42px] ${
                added
                  ? "bg-leaf text-white shadow-sm"
                  : "bg-gradient-to-r from-honey to-accent hover:brightness-105 text-ink shadow-[0_2px_10px_rgba(217,154,25,0.2)] hover:shadow-[0_4px_16px_rgba(217,154,25,0.3)] active:scale-[0.98]"
              }`}
            >
              {added ? (
                <>
                  <IconCheckCircle className="w-4 h-4 text-white" />
                  <span>Додано</span>
                </>
              ) : (
                <>
                  <IconCart className="w-4 h-4" />
                  <span>В кошик</span>
                </>
              )}
            </button>
          ) : (
            <div className="w-full py-2.5 text-center text-xs font-medium rounded-xl bg-ink/5 text-ink/40 min-h-[42px] flex items-center justify-center">
              Немає в наявності
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
