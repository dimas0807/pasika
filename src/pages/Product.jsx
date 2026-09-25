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

  useEffect(() => {
    Products.fetchBySlug(slug)
      .then((p) => {
        if (p) setProduct(p);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading && !product) {
    return (
      <div className="container-p py-24 text-center">
        <p className="text-ink/60">Завантаження товару...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container-p py-24 text-center">
        <p className="text-ink/60">Товар не знайдено.</p>
        <Link to="/catalog" className="btn-primary mt-4 inline-flex">До каталогу</Link>
      </div>
    );
  }

  const related = Products.byCategory(product.category).filter((p) => p.id !== product.id).slice(0, 4);

  return (
    <div className="container-p py-10">
      <nav className="text-xs text-ink/50 mb-6">
        <Link to="/catalog" className="hover:text-honey">Каталог</Link> / {product.name}
      </nav>
      <div className="grid md:grid-cols-2 gap-10">
        <div className="card p-6">
          <ProductImage image={product.image} category={product.category} className="aspect-square" />
        </div>
        <div>
          <h1 className="font-serif text-3xl font-bold text-ink">{product.name}</h1>
          <div className="flex items-center gap-2 mt-2 text-sm text-ink/60">
            <span>★★★★★</span><span>(24 відгуки)</span>
          </div>
          <div className="mt-5 flex items-baseline gap-3">
            <span className="font-serif text-3xl font-bold text-ink">{product.price} грн</span>
            {product.oldPrice && <span className="text-ink/40 line-through">{product.oldPrice} грн</span>}
            <span className={`badge ${product.stock > 0 ? "bg-leaf/10 text-leaf" : "bg-red-50 text-red-500"}`}>
              {product.stock > 0 ? `В наявності (${product.stock})` : "Немає в наявності"}
            </span>
          </div>

          <div className="mt-5">
            <div className="label">Вага / об'єм</div>
            <span className="badge bg-cream text-ink/70">{product.weight}</span>
          </div>

          <p className="mt-6 text-ink/70 leading-relaxed">{product.description}</p>

          <div className="mt-8 flex items-center gap-4">
            <div className="flex items-center border border-ink/15 rounded-full overflow-hidden">
              <button className="px-4 py-2.5 text-lg" onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
              <span className="px-4 font-medium">{qty}</span>
              <button className="px-4 py-2.5 text-lg" onClick={() => setQty((q) => q + 1)}>+</button>
            </div>
            <button
              onClick={() => { add(product, qty); navigate("/cart"); }}
              disabled={product.stock <= 0}
              className="btn-primary flex-1 disabled:opacity-40"
            >
              {product.stock > 0 ? "До кошика" : "Немає в наявності"}
            </button>
          </div>

          <div className="mt-8 border-t border-ink/10 pt-6 grid grid-cols-3 gap-3 text-center text-xs text-ink/70">
            <div>🚚 Швидка доставка</div>
            <div>🌿 100% натурально</div>
            <div>🍯 Власна пасіка</div>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-16 border-t border-ink/10 pt-10">
          <h2 className="font-serif text-2xl font-bold text-ink mb-6">Схожі товари</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}
