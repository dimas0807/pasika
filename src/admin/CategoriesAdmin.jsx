import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Categories, Products, subscribe } from "../data/db";
import { transliterateUa } from "../utils/translit";

export default function CategoriesAdmin() {
  const [categories, setCategories] = useState(() => Categories.all());
  const [products, setProducts] = useState(() => Products.all());
  const [loading, setLoading] = useState(false);

  // Edit / Create modal state
  const [editingCategory, setEditingCategory] = useState(null); // null when modal closed, {} or obj when open
  const [isNew, setIsNew] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [icon, setIcon] = useState("🍯");
  const [description, setDescription] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [autoSlug, setAutoSlug] = useState(true);

  // Blocked delete warning modal state
  const [deleteWarning, setDeleteWarning] = useState(null);
  // Confirm delete modal state
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const [saving, setSaving] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  const loadData = () => {
    setLoading(true);
    Promise.all([Categories.fetchAll(), Products.fetchAll()]).then(([cats, prods]) => {
      if (cats) setCategories(cats);
      if (prods) setProducts(prods);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadData();
    const unsub = subscribe(() => {
      setCategories(Categories.all());
      setProducts(Products.all());
    });
    return unsub;
  }, []);

  const showNotification = (msg, isError = false) => {
    setFeedbackMsg({ text: msg, isError });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const getProductCount = (categorySlug) => {
    return products.filter((p) => p.category === categorySlug).length;
  };

  const openCreateModal = () => {
    setIsNew(true);
    setName("");
    setSlug("");
    setIcon("🍯");
    setDescription("");
    setSortOrder((categories.length + 1) * 10);
    setAutoSlug(true);
    setEditingCategory({});
  };

  const openEditModal = (cat) => {
    setIsNew(false);
    setName(cat.name || "");
    setSlug(cat.slug || "");
    setIcon(cat.icon || "🍯");
    setDescription(cat.description || "");
    setSortOrder(cat.sort_order ?? 0);
    setAutoSlug(false);
    setEditingCategory(cat);
  };

  const handleNameChange = (val) => {
    setName(val);
    if (autoSlug && isNew) {
      setSlug(transliterateUa(val));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      showNotification("Вкажіть назву категорії", true);
      return;
    }
    const finalSlug = slug.trim() || transliterateUa(name.trim());
    if (!finalSlug) {
      showNotification("Вкажіть правильний ідентифікатор (slug)", true);
      return;
    }

    setSaving(true);
    try {
      await Categories.save({
        slug: finalSlug,
        name: name.trim(),
        icon: icon.trim() || "🍯",
        description: description.trim(),
        sort_order: Number(sortOrder) || 0,
      });

      showNotification(isNew ? "Категорію успішно створено!" : "Зміни категорії збережено!");
      setEditingCategory(null);
      loadData();
    } catch (err) {
      showNotification("Помилка збереження: " + err.message, true);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (cat) => {
    const count = getProductCount(cat.slug);
    if (count > 0) {
      // Deletion is blocked!
      setDeleteWarning({
        category: cat,
        count,
      });
    } else {
      // Can be deleted with confirmation
      setDeleteConfirm(cat);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;
    setSaving(true);
    try {
      await Categories.delete(deleteConfirm.slug);
      showNotification(`Категорію "${deleteConfirm.name}" успішно видалено`);
      setDeleteConfirm(null);
      loadData();
    } catch (err) {
      showNotification("Помилка видалення: " + err.message, true);
    } finally {
      setSaving(false);
    }
  };

  const COMMON_ICONS = ["🍯", "🌿", "🎁", "🐝", "🕯️", "🌰", "🌸", "📦", "✨"];

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
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-ink">Категорії товарів</h1>
          <p className="text-xs text-ink/50 mt-0.5">
            Керування розділами каталогу магазину • Всього категорій: {categories.length}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadData}
            className="text-xs text-ink/70 border border-ink/15 rounded-xl px-3 py-2 hover:bg-cream transition-colors flex items-center gap-1.5"
            title="Оновити дані"
          >
            🔄 Оновити
          </button>
          <button
            onClick={openCreateModal}
            className="btn-primary text-sm py-2 px-4 shadow-sm flex items-center gap-1.5"
          >
            <span>+</span> Додати категорію
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-x-auto shadow-sm">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="text-left text-ink/50 border-b border-ink/5 bg-cream/30">
              <th className="p-3 w-16 text-center">Іконка</th>
              <th className="p-3">Назва</th>
              <th className="p-3">Ідентифікатор (slug)</th>
              <th className="p-3 text-center">Кількість товарів</th>
              <th className="p-3 text-center">Порядок</th>
              <th className="p-3 text-right">Дії</th>
            </tr>
          </thead>
          <tbody>
            {loading && categories.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-ink/40">
                  <div className="inline-block animate-spin mr-2">⏳</div> Завантаження категорій...
                </td>
              </tr>
            ) : categories.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-ink/40">
                  Категорій ще немає. Додайте першу категорію.
                </td>
              </tr>
            ) : (
              categories.map((c) => {
                const count = getProductCount(c.slug);
                return (
                  <tr
                    key={c.slug}
                    className="border-b border-ink/5 last:border-0 hover:bg-cream/30 transition-colors"
                  >
                    <td className="p-3 text-center text-2xl">
                      {c.icon || "🍯"}
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-ink">{c.name}</div>
                      {c.description && (
                        <div className="text-xs text-ink/50 line-clamp-1">{c.description}</div>
                      )}
                    </td>
                    <td className="p-3 font-mono text-xs text-ink/60">
                      {c.slug}
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          count > 0 ? "bg-honey/15 text-honey" : "bg-ink/5 text-ink/40"
                        }`}
                      >
                        {count} {count === 1 ? "товар" : count >= 2 && count <= 4 ? "товари" : "товарів"}
                      </span>
                    </td>
                    <td className="p-3 text-center text-xs text-ink/60 font-mono">
                      {c.sort_order ?? 0}
                    </td>
                    <td className="p-3 text-right">
                      <div className="inline-flex items-center gap-1.5 text-xs">
                        <button
                          onClick={() => openEditModal(c)}
                          className="px-2.5 py-1 rounded-lg border border-ink/10 text-ink/80 hover:bg-cream hover:text-honey transition-colors font-medium"
                        >
                          Редагувати
                        </button>
                        <button
                          onClick={() => handleDeleteClick(c)}
                          className="px-2.5 py-1 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                          title={count > 0 ? "Категорія містить товари" : "Видалити порожню категорію"}
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

      {/* Blocked Delete Warning Modal */}
      {deleteWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-ink/10 animate-fade-in">
            <div className="flex items-center gap-3 text-amber-600 mb-3">
              <span className="text-3xl">⚠️</span>
              <h3 className="font-serif text-lg font-bold text-ink">Неможливо видалити категорію</h3>
            </div>

            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm mb-4 leading-relaxed">
              <strong>У цій категорії є {deleteWarning.count} {deleteWarning.count === 1 ? "товар" : deleteWarning.count >= 2 && deleteWarning.count <= 4 ? "товари" : "товарів"}.</strong>
              <div className="mt-2 text-amber-800 text-xs">
                Спочатку перенесіть товари в іншу категорію або видаліть їх, перш ніж видаляти цю категорію.
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <Link
                to="/admin/products"
                className="text-xs text-honey font-semibold hover:underline"
              >
                → Перейти до товарів для зміни категорії
              </Link>
              <button
                type="button"
                onClick={() => setDeleteWarning(null)}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-ink text-white hover:bg-ink/90 transition-colors"
              >
                Зрозуміло
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Safe Delete Confirmation Modal (when count is 0) */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-ink/10 animate-fade-in">
            <div className="flex items-center gap-3 text-red-600 mb-3">
              <span className="text-2xl">🗑️</span>
              <h3 className="font-serif text-lg font-bold text-ink">Видалити категорію?</h3>
            </div>

            <p className="text-sm text-ink/70 mb-4">
              Ви впевнені, що бажаєте видалити категорію <strong>«{deleteConfirm.name}»</strong>? В ній наразі немає товарів.
            </p>

            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                disabled={saving}
                className="px-4 py-2 rounded-xl text-sm font-medium border border-ink/15 text-ink/70 hover:bg-cream transition-colors"
              >
                Скасувати
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={saving}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors shadow-sm disabled:opacity-50"
              >
                {saving ? "Видалення..." : "Видалити"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-ink/10 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-ink/10 mb-4">
              <h3 className="font-serif text-lg font-bold text-ink flex items-center gap-2">
                <span>{icon || "🏷️"}</span>
                {isNew ? "Створення категорії" : `Редагування категорії: ${editingCategory.name}`}
              </h3>
              <button
                type="button"
                onClick={() => setEditingCategory(null)}
                className="text-ink/40 hover:text-ink text-sm p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Category Name */}
              <div>
                <label className="label">
                  Назва категорії <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="наприклад, Квітковий мед"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="input"
                />
              </div>

              {/* Category Slug */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="label">
                    Ідентифікатор (slug) <span className="text-red-500">*</span>
                  </label>
                  {isNew && (
                    <button
                      type="button"
                      onClick={() => {
                        setAutoSlug(!autoSlug);
                        if (!autoSlug) setSlug(transliterateUa(name));
                      }}
                      className="text-xs text-honey hover:underline"
                    >
                      {autoSlug ? "✓ Авто-транслітерація" : "Ручне редагування"}
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  required
                  value={slug}
                  disabled={!isNew} // Keep slug stable when editing existing to avoid breaking product links
                  onChange={(e) => {
                    setAutoSlug(false);
                    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ""));
                  }}
                  className={`input font-mono text-xs ${!isNew ? "bg-cream/40 text-ink/60 cursor-not-allowed" : ""}`}
                  placeholder="kvitkoviy-med"
                />
                {!isNew && (
                  <p className="text-[11px] text-ink/40 mt-1">
                    Slug існуючої категорії заблоковано, щоб не розривати зв'язки з наявними товарами.
                  </p>
                )}
              </div>

              {/* Icon / Emoji selection */}
              <div>
                <label className="label">Іконка / Емодзі</label>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={icon}
                    maxLength={4}
                    onChange={(e) => setIcon(e.target.value)}
                    className="input w-16 text-center text-xl"
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {COMMON_ICONS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setIcon(emoji)}
                        className={`w-8 h-8 rounded-lg text-lg flex items-center justify-center transition-colors ${
                          icon === emoji ? "bg-honey/20 border-2 border-honey" : "bg-cream/50 hover:bg-cream border border-ink/10"
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="label">Опис категорії (необов'язково)</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Короткий опис для каталогу..."
                  className="input text-sm"
                />
              </div>

              {/* Sort Order */}
              <div>
                <label className="label">Порядок сортування</label>
                <input
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="input w-28 font-mono text-sm"
                />
                <p className="text-[11px] text-ink/40 mt-1">
                  Менше число = вище в списку та на головній сторінці (наприклад: 10, 20, 30).
                </p>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-2.5 pt-4 border-t border-ink/10">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  disabled={saving}
                  className="px-4 py-2 rounded-xl text-sm font-medium border border-ink/15 text-ink/70 hover:bg-cream transition-colors"
                >
                  Скасувати
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary text-sm py-2 px-5 shadow-sm disabled:opacity-50"
                >
                  {saving ? "Збереження..." : isNew ? "Створити категорію" : "Зберегти зміни"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
