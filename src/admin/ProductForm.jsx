import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ProductImage from "../components/ProductImage";
import { Categories, Products, Storage } from "../data/db";
import { transliterateUa } from "../utils/translit";

const emptyProduct = {
  id: "",
  slug: "",
  name: "",
  category: "domashni-kovbasy",
  weight: "1 кг",
  price: "",
  oldPrice: "",
  stock: 20,
  reservedStock: 0,
  isActive: true,
  featured: false,
  giftBox: false,
  boxItems: [],
  description: "",
  image: "",
};

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === "new";

  const fileInputRef = useRef(null);
  const replaceInputRef = useRef(null);

  const [form, setForm] = useState(() => (!isNew ? Products.byId(id) || emptyProduct : emptyProduct));
  const [categories, setCategories] = useState(() => Categories.all());
  const [allProducts, setAllProducts] = useState([]);
  const [selectedSubProdId, setSelectedSubProdId] = useState("");
  const [selectedSubQty, setSelectedSubQty] = useState(1);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  useEffect(() => {
    Categories.fetchAll().then(setCategories);
    Products.fetchAll().then((p) => p && setAllProducts(p));
    if (!isNew) {
      Products.fetchById(id).then((p) => {
        if (p) {
          setForm(p);
          setSlugManuallyEdited(true);
        }
      });
    }
  }, [id, isNew]);

  const handleNameChange = (e) => {
    const val = e.target.value;
    setForm((f) => ({
      ...f,
      name: val,
      slug: slugManuallyEdited ? f.slug : transliterateUa(val),
    }));
  };

  const setField = (k) => (e) => {
    const v = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [k]: v }));
  };

  const handleFile = async (file) => {
    if (!file) return;

    const lowerName = file.name.toLowerCase();
    const validExts = [".jpg", ".jpeg", ".png", ".webp"];
    const isExtValid = validExts.some((ext) => lowerName.endsWith(ext));
    const isMimeValid =
      file.type === "image/jpeg" ||
      file.type === "image/png" ||
      file.type === "image/webp";

    if (!isExtValid && !isMimeValid) {
      setErrorMsg("Дозволено завантажувати фото лише у форматах JPG, JPEG, PNG або WEBP");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg("Розмір файлу не повинен перевищувати 10 МБ");
      return;
    }

    setUploadingImage(true);
    setErrorMsg("");

    try {
      const uploaded = await Storage.uploadProductImage(file);
      setForm((f) => ({ ...f, image: uploaded.fileUrl }));
    } catch (err) {
      setErrorMsg(err.message || "Помилка при завантаженні фото товару");
    } finally {
      setUploadingImage(false);
    }
  };

  const onFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const removePhoto = () => {
    setForm((f) => ({ ...f, image: "" }));
  };

  const addBoxItem = () => {
    if (!selectedSubProdId) return;
    const prod = allProducts.find((p) => p.id === selectedSubProdId);
    if (!prod) return;
    const currentItems = Array.isArray(form.boxItems) ? form.boxItems : [];
    const existingIdx = currentItems.findIndex((i) => i.id === prod.id);
    if (existingIdx >= 0) {
      const next = [...currentItems];
      next[existingIdx] = { ...next[existingIdx], qty: next[existingIdx].qty + Number(selectedSubQty) };
      setForm((f) => ({ ...f, boxItems: next }));
    } else {
      setForm((f) => ({
        ...f,
        boxItems: [
          ...currentItems,
          { id: prod.id, name: prod.name, price: prod.price, qty: Number(selectedSubQty) || 1 },
        ],
      }));
    }
    setSelectedSubProdId("");
    setSelectedSubQty(1);
  };

  const removeBoxItem = (idx) => {
    setForm((f) => ({
      ...f,
      boxItems: (f.boxItems || []).filter((_, i) => i !== idx),
    }));
  };

  const save = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    const name = form.name.trim();
    if (!name) {
      setErrorMsg("Вкажіть назву товару");
      return;
    }

    const price = Number(form.price);
    if (!price || price <= 0) {
      setErrorMsg("Вкажіть коректну ціну товару");
      return;
    }

    setSaving(true);

    try {
      const slug = (form.slug || "").trim() || transliterateUa(name);
      const isBox = form.category === "podarunkovi-boksy" || form.category === "gift-boxes" || Boolean(form.giftBox);

      const productPayload = {
        ...form,
        id: form.id || undefined,
        name,
        slug: transliterateUa(slug),
        category: form.category || "domashni-kovbasy",
        price,
        image: form.image?.trim() || "",
        oldPrice: form.oldPrice ? Number(form.oldPrice) : null,
        stock: Number.isInteger(Number(form.stock)) ? Number(form.stock) : 0,
        giftBox: isBox,
        boxItems: Array.isArray(form.boxItems) ? form.boxItems : [],
      };

      await Products.save(productPayload);
      navigate("/admin/products");
    } catch (err) {
      setErrorMsg(err.message || "Не вдалося зберегти товар");
      setSaving(false);
    }
  };

  const hasPhoto = Boolean(form.image && form.image.trim());

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-ink">
            {isNew ? "Новий товар" : "Редагувати товар"}
          </h1>
          <p className="text-xs text-ink/50 mt-1">
            {isNew ? "Заповніть інформацію та обов'язково додайте фото товару" : `Редагування товару: ${form.name || form.id}`}
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg("")} className="text-red-500 font-bold ml-2 hover:opacity-75">
            ✕
          </button>
        </div>
      )}

      <form onSubmit={save} className="card p-6 sm:p-7 space-y-6 bg-[#1C1A17] border border-[#3A332B] shadow-lg rounded-3xl text-[#F4EFEA]">
        {/* 1. ФОТО ТОВАРУ */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-[#FBF7EE] uppercase tracking-wider flex items-center gap-1.5">
              <span>📷</span> Фото товару <span className="text-[#A89C8E] font-normal">(опціонально)</span>
            </label>
            {!hasPhoto ? (
              <span className="text-[11px] font-medium text-[#D1C7BD] bg-[#221D19] px-2.5 py-0.5 rounded-full border border-[#3A332B]">
                Фото категорії за замовчуванням
              </span>
            ) : (
              <span className="text-[11px] font-semibold text-emerald-300 bg-emerald-950/80 border border-emerald-700/60 px-2.5 py-0.5 rounded-full">
                ✓ Власне фото завантажено
              </span>
            )}
          </div>

          {hasPhoto ? (
            /* Uploaded Photo Preview Card */
            <div className="p-4 rounded-2xl bg-[#221D19] border border-[#3A332B] flex flex-col sm:flex-row items-center gap-4">
              <div className="w-28 h-28 shrink-0 rounded-2xl overflow-hidden border border-[#3A332B] shadow-2xs bg-[#151311]">
                <ProductImage
                  image={form.image}
                  category={form.category}
                  alt={form.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 min-w-0 space-y-2 text-center sm:text-left">
                <div className="text-xs font-semibold text-ink truncate">
                  {form.image.startsWith("/uploads/") ? form.image.replace("/uploads/products/", "") : "Зображення товару"}
                </div>
                <p className="text-[11px] text-ink/50 leading-relaxed">
                  Фото готове для відображення в каталозі та на сторінці товару.
                </p>

                <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                  <input
                    type="file"
                    ref={replaceInputRef}
                    accept="image/*,.jpg,.jpeg,.png,.webp"
                    onChange={onFileInputChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => replaceInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="px-3.5 py-2.5 rounded-xl border border-honey text-xs font-bold text-ink hover:bg-honey/10 min-h-[44px] inline-flex items-center justify-center transition-colors disabled:opacity-50"
                  >
                    {uploadingImage ? "Завантаження..." : "Замінити фото"}
                  </button>

                  <button
                    type="button"
                    onClick={removePhoto}
                    disabled={uploadingImage}
                    className="px-3.5 py-2.5 rounded-xl border border-red-200 text-xs font-bold text-red-600 hover:bg-red-50 min-h-[44px] inline-flex items-center justify-center transition-colors"
                  >
                    Видалити фото
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Upload Dropzone */
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-6 sm:p-8 text-center cursor-pointer transition-all ${
                dragOver
                  ? "border-honey bg-honey/15 scale-[1.01]"
                  : "border-gold/50 bg-[#FAF6EE] hover:bg-cream/50"
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*,.jpg,.jpeg,.png,.webp"
                onChange={onFileInputChange}
                className="hidden"
              />

              {uploadingImage ? (
                <div className="py-4 space-y-2">
                  <div className="text-2xl animate-spin">🐝</div>
                  <p className="text-xs font-bold text-honey">Завантаження фото на сервер...</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="w-12 h-12 rounded-full bg-honey/15 text-honey text-2xl flex items-center justify-center mx-auto shadow-2xs">
                    📷
                  </div>
                  <div className="text-sm font-bold text-ink">
                    Натисніть або перетягніть фото товару сюди
                  </div>
                  <p className="text-xs text-ink/55 max-w-sm mx-auto">
                    Підтримуються формати: <span className="font-semibold text-ink">JPG, PNG, WEBP</span> (до 10 МБ).
                    Якщо фото не завантажено, буде показано стандартну ілюстрацію категорії.
                  </p>
                  <button
                    type="button"
                    className="mt-2 btn-secondary text-xs py-2.5 px-4 min-h-[44px] inline-flex"
                  >
                    Завантажити фото
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 2. НАЗВА ТОВАРУ */}
        <div>
          <label className="label">
            Назва товару <span className="text-red-500">*</span>
          </label>
          <input
            className="input text-base font-medium"
            value={form.name}
            onChange={handleNameChange}
            placeholder="Наприклад: Ковбаса домашня запечена 1 кг"
            required
          />
        </div>

        {/* 3. КАТЕГОРІЯ ТА ВАГА */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">
              Категорія <span className="text-red-500">*</span>
            </label>
            <select
              className="input cursor-pointer font-medium"
              value={form.category}
              onChange={setField("category")}
              required
            >
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.icon || "🍯"} {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Вага / об'єм</label>
            <input
              className="input"
              value={form.weight}
              onChange={setField("weight")}
              placeholder="500 г, 1 кг, набір тощо"
            />
          </div>
        </div>

        {/* 4. ОПИС */}
        <div>
          <label className="label">Опис товару</label>
          <textarea
            className="input leading-relaxed"
            rows={3}
            value={form.description}
            onChange={setField("description")}
            placeholder="Опишіть смак, походження, консистенцію та властивості..."
          />
        </div>

        {/* 5. ЦІНА, СТАРА ЦІНА ТА ЗАЛИШОК */}
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="label">
              Ціна, грн <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              step="1"
              className="input font-semibold text-ink"
              value={form.price}
              onChange={setField("price")}
              placeholder="220"
              required
            />
          </div>

          <div>
            <label className="label">
              Стара ціна, грн <span className="text-ink/40 font-normal">(опціонально)</span>
            </label>
            <input
              type="number"
              min="0"
              step="1"
              className="input"
              value={form.oldPrice || ""}
              onChange={setField("oldPrice")}
              placeholder="250"
            />
          </div>

          <div>
            <label className="label">
              Загальний склад, шт <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              step="1"
              className="input font-semibold"
              value={form.stock}
              onChange={setField("stock")}
              required
            />
            {Number(form.reservedStock) > 0 && (
              <div className="text-[11px] text-ink/50 mt-1">
                Зарезервовано: <strong className="text-amber-800">{form.reservedStock} шт</strong> • Доступно: <strong className="text-leaf">{Math.max(0, (Number(form.stock) || 0) - form.reservedStock)} шт</strong>
              </div>
            )}
          </div>
        </div>

        {/* 6. АКТИВНІСТЬ ТА РЕКОМЕНДАЦІЇ */}
        <div className="space-y-2">
          <label className="flex items-center gap-2.5 text-sm text-ink/80 font-medium cursor-pointer p-2 rounded-xl hover:bg-cream/40 transition-colors">
            <input
              type="checkbox"
              checked={form.isActive !== false}
              onChange={setField("isActive")}
              className="w-4 h-4 rounded text-leaf focus:ring-leaf"
            />
            <span>Активний товар (відображається в каталозі для клієнтів)</span>
          </label>

          <label className="flex items-center gap-2.5 text-sm text-ink/80 font-medium cursor-pointer p-2 rounded-xl hover:bg-cream/40 transition-colors">
            <input
              type="checkbox"
              checked={Boolean(form.featured)}
              onChange={setField("featured")}
              className="w-4 h-4 rounded text-honey focus:ring-honey"
            />
            <span>Показувати на головній сторінці (рекомендований товар)</span>
          </label>

          <label className="flex items-center gap-2.5 text-sm text-ink/80 font-medium cursor-pointer p-2 rounded-xl hover:bg-cream/40 transition-colors">
            <input
              type="checkbox"
              checked={form.category === "podarunkovi-boksy" || Boolean(form.giftBox)}
              onChange={(e) => {
                const checked = e.target.checked;
                setForm((f) => ({
                  ...f,
                  giftBox: checked,
                  category: checked && f.category !== "podarunkovi-boksy" ? "podarunkovi-boksy" : f.category,
                }));
              }}
              className="w-4 h-4 rounded text-bronze focus:ring-bronze"
            />
            <span>Подарунковий бокс (складається з набору делікатесів)</span>
          </label>
        </div>

        {/* Склад подарункового боксу */}
        {(form.category === "podarunkovi-boksy" || form.giftBox) && (
          <div className="p-5 rounded-2xl bg-[#FAF6EE] border border-gold/40 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-base text-ink flex items-center gap-2">
                  <span>🎁</span> Склад подарункового боксу
                </h3>
                <p className="text-xs text-ink/60 mt-0.5">
                  Виберіть страви з каталогу, які входять у цей подарунковий набір
                </p>
              </div>
            </div>

            {/* Selector to add items */}
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={selectedSubProdId}
                onChange={(e) => setSelectedSubProdId(e.target.value)}
                className="input flex-1 text-xs"
              >
                <option value="">-- Оберіть товар для додавання --</option>
                {allProducts
                  .filter((p) => p.id !== form.id && p.category !== "podarunkovi-boksy")
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.price} грн)
                    </option>
                  ))}
              </select>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  value={selectedSubQty}
                  onChange={(e) => setSelectedSubQty(Math.max(1, Number(e.target.value)))}
                  className="input w-20 text-xs text-center"
                  placeholder="К-сть"
                />
                <button
                  type="button"
                  onClick={addBoxItem}
                  disabled={!selectedSubProdId}
                  className="btn-secondary text-xs px-4 py-2 shrink-0 disabled:opacity-40"
                >
                  + Додати
                </button>
              </div>
            </div>

            {/* List of items in box */}
            {Array.isArray(form.boxItems) && form.boxItems.length > 0 ? (
              <div className="space-y-2 pt-2">
                {form.boxItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-ink/10 text-xs"
                  >
                    <span className="font-semibold text-ink">
                      • {item.name}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-ink/60 font-medium">{item.qty} шт</span>
                      <button
                        type="button"
                        onClick={() => removeBoxItem(idx)}
                        className="text-red-500 hover:text-red-700 font-bold px-1"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-ink/50 italic">
                У бокс поки не додано товарів. Додайте товари або клієнти бачитимуть загальний опис набору.
              </div>
            )}
          </div>
        )}

        {/* 7. РОЗКРИВНА СЕКЦІЯ: ДОДАТКОВІ НАЛАШТУВАННЯ (SLUG) */}
        <div className="pt-2 border-t border-ink/5">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-xs font-semibold text-ink/70 hover:text-honey flex items-center gap-1.5 transition-colors py-1"
          >
            <span>{showAdvanced ? "▾" : "▸"}</span>
            <span>Додаткові налаштування</span>
          </button>

          {showAdvanced && (
            <div className="mt-3 p-4 bg-cream/40 rounded-2xl border border-ink/5 space-y-2 animate-fadeIn">
              <label className="label">Адреса сторінки (slug)</label>
              <input
                className="input bg-white text-xs sm:text-sm font-mono"
                value={form.slug}
                onChange={(e) => {
                  setSlugManuallyEdited(true);
                  setForm((f) => ({ ...f, slug: transliterateUa(e.target.value) }));
                }}
                placeholder="med-naturalnyi-500g"
              />
              <p className="text-xs text-ink/50 leading-relaxed">
                💡 Автоматично створюється з назви товару. Змінюйте лише за потреби.
              </p>
            </div>
          )}
        </div>

        {/* BUTTONS */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-ink/10">
          <button
            type="button"
            onClick={() => navigate("/admin/products")}
            className="btn-secondary w-full sm:w-auto text-sm py-3 px-5 min-h-[44px] order-2 sm:order-1"
          >
            Скасувати
          </button>
          <button
            type="submit"
            className="btn-primary w-full sm:flex-1 text-sm py-3 font-bold disabled:opacity-50 min-h-[44px] order-1 sm:order-2"
            disabled={saving || uploadingImage}
          >
            {saving ? "Збереження товару..." : "Зберегти товар"}
          </button>
        </div>
      </form>
    </div>
  );
}
