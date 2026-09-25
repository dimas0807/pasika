import { Link } from "react-router-dom";
import ProductImage from "./ProductImage";
import { useCart } from "../context/CartContext";

export default function ProductCard({ product }) {
  const { add } = useCart();
  return (
    <div className="card overflow-hidden group flex flex-col">
      <Link to={`/product/${product.slug}`} className="block p-3">
        <ProductImage image={product.image} category={product.category} className="aspect-square group-hover:scale-[1.02] transition-transform duration-300" />
      </Link>
      <div className="p-4 pt-1 flex flex-col flex-1">
        <Link to={`/product/${product.slug}`} className="font-medium text-ink hover:text-honey transition-colors leading-snug">
          {product.name}
        </Link>
        <div className="text-xs text-ink/50 mt-0.5">{product.weight}</div>
        <div className="mt-auto pt-3 flex items-center justify-between gap-2">
          <div className="flex items-baseline gap-2">
            <span className="font-serif font-bold text-lg text-ink">{product.price} грн</span>
            {product.oldPrice && <span className="text-xs text-ink/40 line-through">{product.oldPrice} грн</span>}
          </div>
        </div>
        {product.stock > 0 ? (
          <button
            onClick={() => add(product, 1)}
            className="btn-primary mt-3 w-full text-sm py-2.5"
          >
            В кошик
          </button>
        ) : (
          <div className="mt-3 w-full text-center text-sm py-2.5 rounded-full bg-ink/5 text-ink/40 font-medium">
            Немає в наявності
          </div>
        )}
      </div>
    </div>
  );
}
