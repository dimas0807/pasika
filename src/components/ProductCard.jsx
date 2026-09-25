import { useState } from "react";
import { Link } from "react-router-dom";
import ProductImage from "./ProductImage";
import { useCart } from "../context/CartContext";

export default function ProductCard({ product }) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);

  const handleAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    add(product, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  const isAvailable = product.stock > 0;

  return (
    <div className="card card-hover overflow-hidden flex flex-col group border border-ink/10 bg-white shadow-sm hover:border-honey/40 transition-all">
      {/* Product Image Link */}
      <Link
        to={`/product/${product.slug}`}
        className="block relative overflow-hidden bg-[#FAF6EE] aspect-square"
      >
        <ProductImage
          image={product.image}
          category={product.category}
          alt={product.name}
          className="w-full h-full group-hover:scale-105 transition-transform duration-500 ease-out"
        />

        {/* Floating Weight or Stock Badge */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 items-start pointer-events-none">
          {product.weight && (
            <span className="text-[11px] font-semibold bg-white/95 backdrop-blur-sm text-ink/75 px-2 py-0.5 rounded-full shadow-xs border border-ink/5">
              {product.weight}
            </span>
          )}
        </div>

        {product.oldPrice && (
          <span className="absolute top-2.5 right-2.5 text-[10px] font-bold uppercase tracking-wider bg-accent text-ink px-2 py-0.5 rounded-full shadow-xs">
            Акція
          </span>
        )}
      </Link>

      {/* Product Details */}
      <div className="p-4 flex flex-col flex-1">
        <Link
          to={`/product/${product.slug}`}
          className="font-serif font-bold text-base md:text-lg text-ink hover:text-honey transition-colors line-clamp-1 leading-snug"
        >
          {product.name}
        </Link>

        {/* Short description / stock indicator */}
        <div className="mt-1 flex items-center justify-between text-xs text-ink/55">
          <span className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${isAvailable ? "bg-leaf" : "bg-red-400"}`} />
            {isAvailable ? "В наявності" : "Під замовлення"}
          </span>
          {product.category === "gift-boxes" && (
            <span className="text-honey font-medium">🎁 Подарунок</span>
          )}
        </div>

        {/* Pricing & Add to Cart Action */}
        <div className="mt-auto pt-3 flex flex-col gap-2.5">
          <div className="flex items-baseline gap-2">
            <span className="font-serif font-bold text-xl text-ink">
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
              className={`w-full py-2.5 px-3 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                added
                  ? "bg-leaf text-white shadow-sm"
                  : "bg-gradient-to-r from-honey to-accent hover:brightness-105 text-ink shadow-xs hover:shadow-md active:scale-[0.98]"
              }`}
            >
              {added ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Додано</span>
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <path d="M16 10a4 4 0 0 1-8 0" />
                  </svg>
                  <span>В кошик</span>
                </>
              )}
            </button>
          ) : (
            <div className="w-full py-2.5 text-center text-xs font-medium rounded-xl bg-ink/5 text-ink/40">
              Немає в наявності
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
