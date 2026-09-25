import { Link } from "react-router-dom";
import ProductImage from "../components/ProductImage";
import { useCart } from "../context/CartContext";

export default function Cart() {
  const { items, remove, setQty, clear, subtotal } = useCart();

  if (items.length === 0) {
    return (
      <div className="container-p py-24 text-center">
        <div className="text-5xl mb-4">🛒</div>
        <h1 className="font-serif text-2xl font-bold text-ink">Кошик порожній</h1>
        <p className="text-ink/60 mt-2">Додайте товари з каталогу, щоб оформити замовлення.</p>
        <Link to="/catalog" className="btn-primary mt-6 inline-flex">До каталогу</Link>
      </div>
    );
  }

  return (
    <div className="container-p py-10 pb-32 md:pb-10">
      <h1 className="font-serif text-3xl font-bold text-ink mb-8">Кошик ({items.length} товари)</h1>
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map((i) => (
            <div key={i.id} className="card p-4 flex gap-4 items-center">
              <div className="w-20 h-20 shrink-0">
                <ProductImage image={i.image} category="" className="w-full h-full" />
              </div>
              <div className="flex-1 min-w-0">
                <Link to={`/product/${i.slug}`} className="font-medium text-ink hover:text-honey line-clamp-1">{i.name}</Link>
                <div className="text-xs text-ink/50">{i.weight}</div>
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex items-center border border-ink/15 rounded-full overflow-hidden">
                    <button className="px-3 py-1" onClick={() => setQty(i.id, i.qty - 1)}>−</button>
                    <span className="px-3 text-sm font-medium">{i.qty}</span>
                    <button className="px-3 py-1" onClick={() => setQty(i.id, i.qty + 1)}>+</button>
                  </div>
                  <button onClick={() => remove(i.id)} className="text-xs text-red-500/70 hover:text-red-500">Видалити</button>
                </div>
              </div>
              <div className="font-serif font-bold text-ink shrink-0">{i.qty * i.price} грн</div>
            </div>
          ))}
          <button onClick={clear} className="text-sm text-ink/40 hover:text-red-500">Очистити кошик</button>
        </div>

        <div className="card p-6 h-fit sticky top-24">
          <div className="flex justify-between text-ink/70 text-sm mb-2">
            <span>Товарів</span><span>{items.reduce((s, i) => s + i.qty, 0)}</span>
          </div>
          <div className="flex justify-between font-serif text-xl font-bold text-ink border-t border-ink/10 pt-3 mt-3">
            <span>Разом:</span><span>{subtotal} грн</span>
          </div>
          <Link to="/checkout" className="btn-primary w-full mt-6">Оформити замовлення</Link>
        </div>
      </div>

      {/* mobile sticky checkout */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden bg-clean border-t border-ink/10 p-4 flex items-center justify-between gap-4 z-30">
        <div>
          <div className="text-xs text-ink/50">Разом</div>
          <div className="font-serif font-bold text-lg text-ink">{subtotal} грн</div>
        </div>
        <Link to="/checkout" className="btn-primary flex-1">Оформити</Link>
      </div>
    </div>
  );
}
