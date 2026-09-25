import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ProductImage from "../components/ProductImage";
import { Categories, Products, subscribe } from "../data/db";

export default function ProductsAdmin() {
  const [products, setProducts] = useState(() => Products.all());
  const [categories, setCategories] = useState(() => Categories.all());
  const [loading, setLoading] = useState(products.length === 0);

  const loadData = () => {
    Promise.all([Products.fetchAll(), Categories.fetchAll()]).then(([prods, cats]) => {
      if (prods) setProducts(prods);
      if (cats) setCategories(cats);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadData();
    const unsub = subscribe(() => {
      setProducts(Products.all());
      setCategories(Categories.all());
    });
    return unsub;
  }, []);

  const catName = (slug) => categories.find((c) => c.slug === slug)?.name || slug;

  const toggleAvailability = async (p) => {
    try {
      const nextStock = p.stock > 0 ? 0 : 10;
      await Products.save({ ...p, stock: nextStock });
      loadData();
    } catch (err) {
      alert("Помилка оновлення наявності: " + err.message);
    }
  };

  const remove = async (id) => {
    if (confirm("Видалити товар?")) {
      try {
        await Products.remove(id);
        loadData();
      } catch (err) {
        alert("Помилка видалення: " + err.message);
      }
    }
  };

  const duplicate = async (id) => {
    try {
      await Products.duplicate(id);
      loadData();
    } catch (err) {
      alert("Помилка дублювання: " + err.message);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-2xl md:text-3xl font-bold text-ink">Товари</h1>
        <div className="flex gap-2">
          <button
            onClick={loadData}
            className="text-xs text-ink/60 border border-ink/15 rounded-lg px-3 py-2 hover:bg-cream"
          >
            🔄 Оновити
          </button>
          <Link to="/admin/products/new" className="btn-primary text-sm py-2.5">
            + Додати товар
          </Link>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead>
            <tr className="text-left text-ink/50 border-b border-ink/5">
              <th className="p-3">Фото</th>
              <th className="p-3">Назва</th>
              <th className="p-3">Категорія</th>
              <th className="p-3">Ціна</th>
              <th className="p-3">Наявність</th>
              <th className="p-3">Дії</th>
            </tr>
          </thead>
          <tbody>
            {loading && products.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-ink/40">
                  Завантаження товарів...
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-ink/40">
                  Товарів немає.
                </td>
              </tr>
            ) : (
              products.map((p) => (
                <tr key={p.id} className="border-b border-ink/5 last:border-0 hover:bg-cream/20">
                  <td className="p-3">
                    <div className="w-12 h-12">
                      <ProductImage image={p.image} category={p.category} className="w-full h-full" />
                    </div>
                  </td>
                  <td className="p-3 font-medium text-ink">
                    {p.name} <span className="text-ink/40 font-normal">({p.weight})</span>
                  </td>
                  <td className="p-3 text-ink/60">{catName(p.category)}</td>
                  <td className="p-3 font-semibold">{p.price} грн</td>
                  <td className="p-3">
                    <button
                      onClick={() => toggleAvailability(p)}
                      className={`badge cursor-pointer ${p.stock > 0 ? "bg-leaf/10 text-leaf" : "bg-red-50 text-red-500"}`}
                    >
                      {p.stock > 0 ? `В наявності (${p.stock})` : "Немає"}
                    </button>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-2 text-xs">
                      <Link to={`/admin/products/${p.id}`} className="text-honey hover:underline">
                        Edit
                      </Link>
                      <button onClick={() => duplicate(p.id)} className="text-ink/50 hover:underline">
                        Duplicate
                      </button>
                      <button onClick={() => remove(p.id)} className="text-red-400 hover:underline">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
