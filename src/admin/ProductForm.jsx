import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ProductImage from "../components/ProductImage";
import { Categories, Products } from "../data/db";

const emptyProduct = {
  id: "", slug: "", name: "", category: "honey", weight: "", price: 0, oldPrice: "",
  stock: 10, featured: false, giftBox: false, description: "", image: "honey-jar",
};

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === "new";

  const [form, setForm] = useState(() => (!isNew ? Products.byId(id) || emptyProduct : emptyProduct));
  const [categories, setCategories] = useState(() => Categories.all());
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    Categories.fetchAll().then(setCategories);
    if (!isNew) {
      Products.fetchById(id).then((p) => {
        if (p) setForm(p);
      });
    }
  }, [id, isNew]);

  const set = (k) => (e) => {
    const v = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [k]: v }));
  };

  const save = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSaving(true);

    try {
      const product = {
        ...form,
        id: form.id || undefined,
        name: form.name.trim(),
        slug: (form.slug || "").trim() || form.name.toLowerCase().replace(/[^a-zа-яіїєґ0-9]+/gi, "-"),
        price: Number(form.price) || 0,
        oldPrice: form.oldPrice ? Number(form.oldPrice) : null,
        stock: Number(form.stock) || 0,
        giftBox: form.category === "gift-boxes" || form.giftBox,
      };

      await Products.save(product);
      navigate("/admin/products");
    } catch (err) {
      setErrorMsg(err.message || "Не вдалося зберегти товар");
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="font-serif text-2xl font-bold text-ink mb-6">
        {isNew ? "Новий товар" : "Редагувати товар"}
      </h1>

      {errorMsg && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600 text-sm">
          ⚠️ {errorMsg}
        </div>
      )}

      <form onSubmit={save} className="card p-6 space-y-4">
        <div className="w-24 h-24">
          <ProductImage image={form.image} category={form.category} className="w-full h-full" />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Назва</label>
            <input className="input" value={form.name} onChange={set("name")} required />
          </div>
          <div>
            <label className="label">Slug (URL)</label>
            <input className="input" value={form.slug} onChange={set("slug")} placeholder="автоматично з назви" />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Категорія</label>
            <select className="input" value={form.category} onChange={set("category")}>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Вага / об'єм</label>
            <input className="input" value={form.weight} onChange={set("weight")} placeholder="500 г" />
          </div>
        </div>

        <div>
          <label className="label">Опис</label>
          <textarea className="input" rows={3} value={form.description} onChange={set("description")} />
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="label">Ціна, грн</label>
            <input type="number" className="input" value={form.price} onChange={set("price")} required />
          </div>
          <div>
            <label className="label">Стара ціна</label>
            <input type="number" className="input" value={form.oldPrice || ""} onChange={set("oldPrice")} />
          </div>
          <div>
            <label className="label">Залишок</label>
            <input type="number" className="input" value={form.stock} onChange={set("stock")} />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-ink/70">
          <input type="checkbox" checked={form.featured} onChange={set("featured")} /> Показувати на головній (featured)
        </label>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => navigate("/admin/products")} className="btn-secondary">
            Скасувати
          </button>
          <button className="btn-primary flex-1 disabled:opacity-50" disabled={saving}>
            {saving ? "Збереження..." : "Зберегти"}
          </button>
        </div>
      </form>
    </div>
  );
}
