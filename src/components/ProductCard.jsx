import { useState } from "react";
import { Link } from "react-router-dom";
import ProductImage from "./ProductImage";
import { useCart } from "../context/CartContext";
import { IconCheckCircle, IconCart } from "./Icons";

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
    <div className="rounded-2xl overflow-hidden flex flex-col group bg-[#1C1A18] border border-[#2D2824] shadow-[0_8px_24px_rgba(0,0,0,0.35)] hover:shadow-[0_12px_32px_rgba(200,132,50,0.18)] hover:border-bronze/50 hover:-translate-y-1 transition-all duration-300">
      {/* Product Image Link */}
      <Link
        to={`/product/${product.slug}`}
        className="block relative overflow-hidden bg-[#141211] aspect-square"
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
            <span className="text-[11px] font-semibold bg-black/75 backdrop-blur-md text-[#E8DFD5] px-2.5 py-0.5 rounded-full border border-white/10 shadow-xs">
              {product.weight}
            </span>
          )}
        </div>

        {/* Sale Pill */}
        {product.oldPrice && (
          <span className="absolute top-2.5 right-2.5 text-[10px] font-bold uppercase tracking-wider bg-meat text-white px-2.5 py-0.5 rounded-full shadow-xs border border-white/20">
            Акція
          </span>
        )}
      </Link>

      {/* Product Details */}
      <div className="p-3.5 sm:p-4 flex flex-col flex-1">
        <Link
          to={`/product/${product.slug}`}
          className="font-serif font-bold text-base md:text-lg text-[#F4EFEA] hover:text-bronze transition-colors line-clamp-1 leading-snug"
        >
          {product.name}
        </Link>

        {product.description && (
          <p className="text-xs text-[#A89B8F] line-clamp-2 mt-1 leading-relaxed">
            {product.description}
          </p>
        )}

        {/* Stock status */}
        <div className="mt-1 flex items-center justify-between text-xs text-[#9E9184]">
          <span className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${isAvailable ? "bg-emerald-500" : "bg-red-500"}`} />
            {isAvailable ? "Свіже в наявності" : "Під замовлення"}
          </span>
          <span className="text-[11px] text-[#A69A8E]">
            {product.weight ? product.weight : "1 кг"}
          </span>
        </div>

        {/* Pricing & Add to Cart Action */}
        <div className="mt-auto pt-3.5 flex flex-col gap-2.5">
          <div className="flex items-baseline gap-2">
            <span className="font-serif font-bold text-lg sm:text-xl text-[#F4EFEA]">
              {product.price} <span className="text-sm font-sans font-normal text-[#C88432]">грн</span>
            </span>
            {product.oldPrice && (
              <span className="text-xs text-[#7A7167] line-through">
                {product.oldPrice} грн
              </span>
            )}
          </div>

          {isAvailable ? (
            <button
              onClick={handleAdd}
              className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 flex items-center justify-center gap-1.5 min-h-[42px] ${
                added
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-gradient-to-r from-bronze via-[#D9903E] to-gold hover:from-gold hover:to-bronze text-[#141210] shadow-[0_2px_12px_rgba(200,132,50,0.25)] hover:shadow-[0_4px_18px_rgba(200,132,50,0.4)] active:scale-[0.98]"
              }`}
            >
              {added ? (
                <>
                  <IconCheckCircle className="w-4 h-4 text-white" />
                  <span>Додано в кошик</span>
                </>
              ) : (
                <>
                  <IconCart className="w-4 h-4" />
                  <span>В кошик</span>
                </>
              )}
            </button>
          ) : (
            <div className="w-full py-2.5 text-center text-xs font-medium rounded-xl bg-[#24201C] text-[#8C8074] min-h-[42px] flex items-center justify-center">
              Під замовлення
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
