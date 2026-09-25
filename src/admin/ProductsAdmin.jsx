import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import ProductImage from "../components/ProductImage";
import { Categories, Products, subscribe } from "../data/db";

export default function ProductsAdmin() {
  const [products, setProducts] = useState(() => Products.all());
  const [categories, setCategories] = useState(() => Categories.all());
  const [loading, setLoading] = useState(products.length === 0);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all"); // 'all', 'in_stock', 'low_stock', 'out_of_stock'
  const [sortBy, setSortBy] = useState("name_asc"); // 'name_asc', 'name_desc', 'price_asc', 'price_desc', 'stock_desc', 'stock_asc', 'newest'
  const [productToDelete, setProductToDelete] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

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

  const showNotification = (msg, isError = false) => {
    setFeedbackMsg({ text: msg, isError });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const toggleAvailability = async (p) => {
    try {
      setActionLoading(p.id);
      const nextStock = p.stock > 0 ? 0 : 10;
      await Products.save({ ...p, stock: nextStock });
      loadData();
      showNotification(`Наявність для "${p.name}" оновлено (${nextStock > 0 ? "В наявності" : "Немає"})`);
    } catch (err) {
      showNotification("Помилка оновлення наявності: " + err.message, true);
    } finally {
      setActionLoading(null);
    }
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    try {
      setActionLoading(productToDelete.id);
      await Products.remove(productToDelete.id);
      showNotification(`Товар "${productToDelete.name}" успішно видалено`);
      setProductToDelete(null);
      loadData();
    } catch (err) {
      showNotification("Помилка видалення: " + err.message, true);
    } finally {
      setActionLoading(null);
    }
  };

  const duplicate = async (id, name) => {
    try {
      setActionLoading(id);
      await Products.duplicate(id);
      showNotification(`Створено дублікат товару "${name}"`);
      loadData();
    } catch (err) {
      showNotification("Помилка дублювання: " + err.message, true);
    } finally {
      setActionLoading(null);
    }
  };

  // Filter & sort logic
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = (p.name || "").toLowerCase().includes(q);
        const matchSlug = (p.slug || "").toLowerCase().includes(q);
        const matchDesc = (p.description || "").toLowerCase().includes(q);
        if (!matchName && !matchSlug && !matchDesc) return false;
      }
      // Category
      if (categoryFilter !== "all" && p.category !== categoryFilter) {
        return false;
      }
      // Stock
      if (stockFilter === "in_stock" && !(p.stock > 5)) return false;
      if (stockFilter === "low_stock" && !(p.stock > 0 && p.stock <= 5)) return false;
      if (stockFilter === "out_of_stock" && !(p.stock <= 0)) return false;

      return true;
    }).sort((a, b) => {
      switch (sortBy) {
        case "name_asc":
          return (a.name || "").localeCompare(b.name || "", "uk");
        case "name_desc":
          return (b.name || "").localeCompare(a.name || "", "uk");
        case "price_asc":
          return Number(a.price || 0) - Number(b.price || 0);
        case "price_desc":
          return Number(b.price || 0) - Number(a.price || 0);
        case "stock_desc":
          return Number(b.stock || 0) - Number(a.stock || 0);
        case "stock_asc":
          return Number(a.stock || 0) - Number(b.stock || 0);
        case "newest":
          return (b.createdAt || 0) - (a.createdAt || 0);
        default:
          return 0;
      }
    });
  }, [products, search, categoryFilter, stockFilter, sortBy]);

  return (
    <div>
      {/* Toast Notification */}
      {feedbackMsg && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all ${
            feedbackMsg.isError ? "bg-red-600 text-white" : "bg-leaf text-white"
          }`}
        >
          {feedbackMsg.isError ? "⚠️ " : "✓ "}
          {feedbackMsg.text}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-ink">Товари</h1>
          <p className="text-xs text-ink/50 mt-0.5">
            Всього товарів: {products.length} • Знайдено за фільтрами: {filteredProducts.length}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadData}
            className="text-xs text-ink/70 border border-ink/15 rounded-xl px-3 py-2 hover:bg-cream transition-colors flex items-center gap-1.5"
            title="Оновити дані з сервера"
          >
            🔄 Оновити
          </button>
          <Link to="/admin/products/new" className="btn-primary text-sm py-2 px-4 shadow-sm flex items-center gap-1.5">
            <span>+</span> Додати товар
          </Link>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="card p-4 mb-6 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40 text-sm">🔍</span>
            <input
              type="text"
              placeholder="Пошук за назвою або описом..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-9 text-sm"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink/40 hover:text-ink"
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="input text-sm cursor-pointer"
            >
              <option value="all">Усі категорії ({categories.length})</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Stock Filter */}
          <div>
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="input text-sm cursor-pointer"
            >
              <option value="all">Будь-яка наявність</option>
              <option value="in_stock">У наявності (&gt; 5 шт)</option>
              <option value="low_stock">Закінчується (1–5 шт)</option>
              <option value="out_of_stock">Немає в наявності (0 шт)</option>
            </select>
          </div>

          {/* Sorting */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="input text-sm cursor-pointer"
            >
              <option value="name_asc">Назва: А → Я</option>
              <option value="name_desc">Назва: Я → А</option>
              <option value="price_asc">Ціна: від дешевих</option>
              <option value="price_desc">Ціна: від дорогих</option>
              <option value="stock_desc">Залишок: від більшого</option>
              <option value="stock_asc">Залишок: від меншого</option>
              <option value="newest">Найновіші спочатку</option>
            </select>
          </div>
        </div>

        {/* Quick status counters */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-ink/5 text-xs text-ink/60">
          <span>Швидкі фільтри:</span>
          <button
            onClick={() => setStockFilter("all")}
            className={`px-2.5 py-1 rounded-lg transition-colors ${
              stockFilter === "all" ? "bg-ink text-white font-medium" : "bg-cream/60 hover:bg-cream text-ink/70"
            }`}
          >
            Всі ({products.length})
          </button>
          <button
            onClick={() => setStockFilter("in_stock")}
            className={`px-2.5 py-1 rounded-lg transition-colors ${
              stockFilter === "in_stock" ? "bg-leaf text-white font-medium" : "bg-leaf/10 text-leaf hover:bg-leaf/20"
            }`}
          >
            В наявності ({products.filter((p) => p.stock > 5).length})
          </button>
          <button
            onClick={() => setStockFilter("low_stock")}
            className={`px-2.5 py-1 rounded-lg transition-colors ${
              stockFilter === "low_stock" ? "bg-amber-600 text-white font-medium" : "bg-amber-50 text-amber-700 hover:bg-amber-100"
            }`}
          >
            Закінчується ({products.filter((p) => p.stock > 0 && p.stock <= 5).length})
          </button>
          <button
            onClick={() => setStockFilter("out_of_stock")}
            className={`px-2.5 py-1 rounded-lg transition-colors ${
              stockFilter === "out_of_stock" ? "bg-red-500 text-white font-medium" : "bg-red-50 text-red-600 hover:bg-red-100"
            }`}
          >
            Немає ({products.filter((p) => p.stock <= 0).length})
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-x-auto shadow-sm">
        <table className="w-full text-sm min-w-[760px]">
          <thead>
            <tr className="text-left text-ink/50 border-b border-ink/5 bg-cream/30">
              <th className="p-3 w-16 text-center">Фото</th>
              <th className="p-3">Назва та вага</th>
              <th className="p-3">Категорія</th>
              <th className="p-3">Ціна</th>
              <th className="p-3">Залишок / Статус</th>
              <th className="p-3 text-right">Дії</th>
            </tr>
          </thead>
          <tbody>
            {loading && products.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-ink/40">
                  <div className="inline-block animate-spin mr-2">⏳</div> Завантаження товарів...
                </td>
              </tr>
            ) : filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-ink/40">
                  Товарів за вказаними фільтрами не знайдено.
                </td>
              </tr>
            ) : (
              filteredProducts.map((p) => {
                const isOutOfStock = p.stock <= 0;
                const isLowStock = p.stock > 0 && p.stock <= 5;

                return (
                  <tr
                    key={p.id}
                    className="border-b border-ink/5 last:border-0 hover:bg-cream/30 transition-colors"
                  >
                    <td className="p-3 text-center">
                      <div className="w-12 h-12 mx-auto rounded-lg overflow-hidden border border-ink/10 bg-cream/40 flex items-center justify-center">
                        <ProductImage image={p.image} category={p.category} className="w-full h-full object-cover" />
                      </div>
                    </td>
                    <td className="p-3">
                      <Link
                        to={`/admin/products/${p.id}`}
                        className="font-medium text-ink hover:text-honey transition-colors block"
                      >
                        {p.name}
                      </Link>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-ink/50">{p.weight}</span>
                        <span className="text-[11px] text-ink/30 font-mono">/{p.slug}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-xs bg-cream/70 text-ink/70">
                        {catName(p.category)}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-ink whitespace-nowrap">
                      {p.price} грн
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => toggleAvailability(p)}
                        disabled={actionLoading === p.id}
                        title="Натисніть для швидкої зміни наявності"
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                          isOutOfStock
                            ? "bg-red-50 text-red-600 hover:bg-red-100"
                            : isLowStock
                            ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                            : "bg-leaf/10 text-leaf hover:bg-leaf/20"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isOutOfStock ? "bg-red-500" : isLowStock ? "bg-amber-500" : "bg-leaf"
                          }`}
                        />
                        {isOutOfStock
                          ? "Немає в наявності"
                          : isLowStock
                          ? `Закінчується (${p.stock} шт)`
                          : `В наявності (${p.stock} шт)`}
                      </button>
                    </td>
                    <td className="p-3 text-right">
                      <div className="inline-flex items-center gap-1.5 text-xs">
                        <Link
                          to={`/admin/products/${p.id}`}
                          className="px-2.5 py-1 rounded-lg border border-ink/10 text-ink/80 hover:bg-cream hover:text-honey transition-colors font-medium"
                          title="Редагувати товар"
                        >
                          Редагувати
                        </Link>
                        <button
                          onClick={() => duplicate(p.id, p.name)}
                          disabled={actionLoading === p.id}
                          className="px-2.5 py-1 rounded-lg border border-ink/10 text-ink/70 hover:bg-cream transition-colors disabled:opacity-40"
                          title="Створити копію товару"
                        >
                          {actionLoading === p.id ? "..." : "Дублювати"}
                        </button>
                        <button
                          onClick={() => setProductToDelete(p)}
                          className="px-2.5 py-1 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                          title="Видалити товар"
                        >
                          Видалити
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-ink/10 animate-fade-in">
            <div className="flex items-center gap-3 text-red-600 mb-3">
              <span className="text-2xl">⚠️</span>
              <h3 className="font-serif text-lg font-bold text-ink">Видалити товар?</h3>
            </div>

            <p className="text-sm text-ink/70 mb-4">
              Ви впевнені, що бажаєте видалити цей товар з каталогу?
            </p>

            {/* Product preview card */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-cream/40 border border-ink/5 mb-4">
              <div className="w-14 h-14 rounded-lg overflow-hidden border border-ink/10 bg-white shrink-0">
                <ProductImage
                  image={productToDelete.image}
                  category={productToDelete.category}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-ink text-sm truncate">{productToDelete.name}</div>
                <div className="text-xs text-ink/60">
                  {catName(productToDelete.category)} • {productToDelete.weight}
                </div>
                <div className="text-xs font-semibold text-honey mt-0.5">
                  {productToDelete.price} грн
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-leaf/10 border border-leaf/20 text-xs text-ink/70 mb-6">
              ℹ️ <strong>Безпечне видалення:</strong> історичні замовлення, які містять цей товар, не постраждають і збережуться у повному обсязі в історії замовлень.
            </div>

            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                disabled={actionLoading === productToDelete.id}
                className="px-4 py-2 rounded-xl text-sm font-medium border border-ink/15 text-ink/70 hover:bg-cream transition-colors"
              >
                Скасувати
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={actionLoading === productToDelete.id}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors shadow-sm disabled:opacity-50"
              >
                {actionLoading === productToDelete.id ? "Видалення..." : "Так, видалити товар"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
