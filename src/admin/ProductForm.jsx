import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ProductImage from "../components/ProductImage";
import { Categories, Products, Storage } from "../data/db";
import { transliterateUa } from "../utils/translit";

const emptyProduct = {
  id: "",
  slug: "",
  name: "",
  category: "honey",
  weight: "",
  price: "",
  oldPrice: "",
  stock: 10,
  featured: false,
  giftBox: false,
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
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  useEffect(() => {
    Categories.fetchAll().then(setCategories);
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

  const save = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    const name = form.name.trim();
    if (!name) {
      setErrorMsg("Вкажіть назву товару");
      return;
    }

    // MANDATORY PHOTO VALIDATION
    if (!form.image || !form.image.trim()) {
      setErrorMsg("Фото товару обов'язкове для збереження. Будь ласка, завантажте фото.");
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

      const productPayload = {
        ...form,
        id: form.id || undefined,
        name,
        slug: transliterateUa(slug),
        category: form.category || "honey",
        price,
        oldPrice: form.oldPrice ? Number(form.oldPrice) : null,
        stock: Number.isInteger(Number(form.stock)) ? Number(form.stock) : 0,
        giftBox: form.category === "gift-boxes" || form.giftBox,
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

      <form onSubmit={save} className="card p-6 sm:p-7 space-y-6 bg-white border border-ink/10 shadow-sm rounded-3xl">
        {/* 1. ФОТО ТОВАРУ (ОБОВ'ЯЗКОВЕ) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
              <span>📷</span> Фото товару <span className="text-red-500">*</span>
            </label>
            {!hasPhoto ? (
              <span className="text-[11px] font-bold text-red-600 bg-red-50 px-2.5 py-0.5 rounded-full border border-red-200">
                Фото обов'язкове
              </span>
            ) : (
              <span className="text-[11px] font-semibold text-leaf bg-leaf/10 px-2.5 py-0.5 rounded-full">
                ✓ Фото завантажено
              </span>
            )}
          </div>

          {hasPhoto ? (
            /* Uploaded Photo Preview Card */
            <div className="p-4 rounded-2xl bg-cream/40 border border-ink/10 flex flex-col sm:flex-row items-center gap-4">
              <div className="w-28 h-28 shrink-0 rounded-2xl overflow-hidden border border-ink/10 shadow-2xs bg-white">
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
                    Фото є обов'язковим для публікації.
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
            placeholder="Наприклад: Мед натуральний 500 г"
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
              Залишок, шт <span className="text-red-500">*</span>
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
          </div>
        </div>

        {/* 6. ПОКАЗУВАТИ НА ГОЛОВНІЙ */}
        <label className="flex items-center gap-2.5 text-sm text-ink/80 font-medium cursor-pointer p-2 rounded-xl hover:bg-cream/40 transition-colors">
          <input
            type="checkbox"
            checked={Boolean(form.featured)}
            onChange={setField("featured")}
            className="w-4 h-4 rounded text-honey focus:ring-honey"
          />
          <span>Показувати на головній сторінці (рекомендований товар)</span>
        </label>

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
