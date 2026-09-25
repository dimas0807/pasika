import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { Orders, Settings, Storage } from "../data/db";
import { DELIVERY_PROVIDERS } from "../lib/delivery";

const STEPS = ["Дані", "Доставка", "Оплата"];

export default function Checkout() {
  const { items, subtotal, clear } = useCart();
  const navigate = useNavigate();
  const [settings, setSettings] = useState(() => Settings.get());
  const [checkoutToken] = useState(() => "chk_" + Date.now() + "_" + Math.random().toString(36).slice(2, 12));

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    providerKey: "np",
    city: null, // { id, name }
    branch: null, // { id, name }
    comment: "",
    paymentMethod: "cod",
    receiptFile: null,
    receiptUrl: null,
    receiptName: null,
  });

  const [cityQuery, setCityQuery] = useState("");
  const [cityOptions, setCityOptions] = useState([]);
  const [branchOptions, setBranchOptions] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    Settings.fetch().then(setSettings).catch(() => {});
  }, []);

  const provider = DELIVERY_PROVIDERS[form.providerKey];

  useEffect(() => {
    if (!cityQuery.trim()) return;
    let active = true;
    const timer = setTimeout(() => {
      provider.searchCities(cityQuery).then((res) => {
        if (active) setCityOptions(res);
      });
    }, 200);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [cityQuery, provider]);

  const onProviderChange = (key) => {
    setForm((f) => ({ ...f, providerKey: key, city: null, branch: null }));
    setCityQuery("");
    setCityOptions([]);
    setBranchOptions([]);
  };

  const pickCity = (cityObj) => {
    setForm((f) => ({ ...f, city: cityObj, branch: null }));
    setCityQuery(cityObj.name);
    setCityOptions([]);
    setLoadingBranches(true);
    provider.getBranches(cityObj.id).then((branches) => {
      setBranchOptions(branches);
      setLoadingBranches(false);
    });
  };

  const pickBranch = (branchId) => {
    const selected = branchOptions.find((b) => b.id === branchId) || null;
    setForm((f) => ({ ...f, branch: selected }));
  };

  const set = (k) => (e) => {
    setErrorMsg("");
    setForm((f) => ({ ...f, [k]: e.target.value }));
  };

  const onReceipt = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg("");

    const lowerName = file.name.toLowerCase();
    const validExts = [".jpg", ".jpeg", ".png", ".pdf"];
    const isExtValid = validExts.some((ext) => lowerName.endsWith(ext));
    const isMimeValid =
      file.type === "image/jpeg" ||
      file.type === "image/png" ||
      file.type === "application/pdf" ||
      file.type.startsWith("image/");

    if (!isExtValid && !isMimeValid) {
      setErrorMsg("Дозволено завантажувати чек лише у форматах JPG, JPEG, PNG або PDF");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg("Розмір файлу не повинен перевищувати 10 МБ");
      return;
    }

    setUploadingReceipt(true);
    try {
      if (file.type.startsWith("image/") || lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg") || lowerName.endsWith(".png")) {
        setReceiptPreview(URL.createObjectURL(file));
      } else {
        setReceiptPreview("pdf");
      }

      const uploaded = await Storage.uploadReceipt(file, checkoutToken);
      setForm((f) => ({
        ...f,
        receiptFile: file,
        receiptUrl: uploaded.fileUrl,
        receiptName: uploaded.name || file.name,
      }));
    } catch (err) {
      setReceiptPreview(null);
      setErrorMsg(err.message || "Помилка при завантаженні чека");
    } finally {
      setUploadingReceipt(false);
      e.target.value = "";
    }
  };

  const removeReceipt = () => {
    setForm((f) => ({
      ...f,
      receiptFile: null,
      receiptUrl: null,
      receiptName: null,
    }));
    setReceiptPreview(null);
  };

  const step1Valid = form.firstName.trim() && form.lastName.trim() && form.phone.trim();
  const step2Valid = form.city && form.branch;

  const copyCard = () => {
    const cardNum = settings?.payment?.card || "";
    if (!cardNum) return;
    navigator.clipboard?.writeText(cardNum.replace(/\s+/g, ""));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const submitOrder = async () => {
    setErrorMsg("");

    if (form.paymentMethod === "card" && !form.receiptUrl) {
      setErrorMsg("Для способу «Оплатити зараз» обов'язково завантажте чек про оплату");
      return;
    }

    setSubmitting(true);

    try {
      const idempotencyKey = `pasika_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

      const orderPayload = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        providerKey: form.providerKey,
        city: form.city,
        branch: form.branch,
        paymentMethod: form.paymentMethod,
        comment: form.comment.trim() || undefined,
        receiptUrl: form.paymentMethod === "card" ? form.receiptUrl : undefined,
        receiptName: form.paymentMethod === "card" ? form.receiptName : undefined,
        items: items.map((i) => ({ id: i.id, qty: i.qty })),
        idempotencyKey,
        checkoutToken,
      };

      const created = await Orders.create(orderPayload);
      clear();
      const tokenQuery = created.customerToken ? `?token=${encodeURIComponent(created.customerToken)}` : "";
      navigate(`/order-success/${created.id}${tokenQuery}`);
    } catch (err) {
      setErrorMsg(err.message || "Не вдалося оформити замовлення. Спробуйте ще раз.");
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="container-p py-24 text-center max-w-md mx-auto">
        <div className="text-4xl mb-3">🛒</div>
        <h1 className="font-serif text-2xl font-bold text-ink">Кошик порожній</h1>
        <p className="text-ink/65 text-sm mt-2">Додайте товари з каталогу, щоб оформити замовлення.</p>
        <Link to="/catalog" className="btn-primary mt-6 inline-flex text-sm">
          До каталогу
        </Link>
      </div>
    );
  }

  return (
    <div className="container-p py-8 md:py-12 pb-16">
      {/* Breadcrumbs */}
      <nav className="text-xs text-ink/50 mb-3 flex items-center gap-1.5">
        <Link to="/" className="hover:text-honey">Головна</Link>
        <span>/</span>
        <Link to="/cart" className="hover:text-honey">Кошик</Link>
        <span>/</span>
        <span className="text-ink/80 font-medium">Оформлення замовлення</span>
      </nav>

      <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-ink mb-6">
        Оформлення замовлення
      </h1>

      {/* Global Error Banner */}
      {errorMsg && (
        <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg("")} className="text-red-500 font-bold ml-2 hover:opacity-75">
            ✕
          </button>
        </div>
      )}

      {/* Stepper Header */}
      <div className="flex items-center gap-2 sm:gap-4 mb-8 bg-cream/50 p-2.5 sm:p-3 rounded-2xl border border-ink/5 max-w-xl">
        {STEPS.map((s, i) => {
          const stepNumber = i + 1;
          const isActive = step === stepNumber;
          const isDone = step > stepNumber;

          return (
            <div key={s} className="flex items-center gap-2 flex-1">
              <span
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  isActive
                    ? "bg-honey text-ink shadow-2xs scale-105"
                    : isDone
                    ? "bg-leaf text-white"
                    : "bg-ink/10 text-ink/40"
                }`}
              >
                {isDone ? "✓" : stepNumber}
              </span>
              <span className={`text-xs sm:text-sm font-semibold ${isActive ? "text-ink" : isDone ? "text-leaf" : "text-ink/40"}`}>
                {s}
              </span>
              {i < STEPS.length - 1 && <span className="flex-1 h-px bg-ink/10 mx-1 hidden sm:block" />}
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Main Step Form Card */}
        <div className="lg:col-span-8 card p-6 sm:p-8 bg-white border border-ink/10 shadow-sm rounded-3xl">
          {/* STEP 1: Контактні дані */}
          {step === 1 && (
            <div className="space-y-5 animate-fadeIn">
              <div className="border-b border-ink/5 pb-3">
                <h2 className="font-serif text-xl font-bold text-ink">1. Контактні дані</h2>
                <p className="text-xs text-ink/60 mt-0.5">Вкажіть дані отримувача замовлення</p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Ім'я *</label>
                  <input
                    className="input"
                    value={form.firstName}
                    onChange={set("firstName")}
                    placeholder="Олена"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="label">Прізвище *</label>
                  <input
                    className="input"
                    value={form.lastName}
                    onChange={set("lastName")}
                    placeholder="Петрова"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Телефон *</label>
                  <input
                    className="input"
                    type="tel"
                    value={form.phone}
                    onChange={set("phone")}
                    placeholder="+380 67 123 45 67"
                  />
                </div>
                <div>
                  <label className="label">Email (для квитанції)</label>
                  <input
                    className="input"
                    type="email"
                    value={form.email}
                    onChange={set("email")}
                    placeholder="olena@example.com"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  disabled={!step1Valid}
                  onClick={() => setStep(2)}
                  className="btn-primary w-full sm:w-auto text-sm px-8 py-3 disabled:opacity-40"
                >
                  Далі до доставки →
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Спосіб доставки */}
          {step === 2 && (
            <div className="space-y-5 animate-fadeIn">
              <div className="border-b border-ink/5 pb-3">
                <h2 className="font-serif text-xl font-bold text-ink">2. Доставка</h2>
                <p className="text-xs text-ink/60 mt-0.5">Оберіть службу доставки та пункт видачі</p>
              </div>

              {/* Delivery Carrier Tabs */}
              <div>
                <label className="label">Служба доставки</label>
                <div className="grid grid-cols-2 gap-3">
                  {Object.values(DELIVERY_PROVIDERS).map((p) => {
                    const isSelected = form.providerKey === p.key;
                    return (
                      <button
                        key={p.key}
                        type="button"
                        onClick={() => onProviderChange(p.key)}
                        className={`p-3.5 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                          isSelected
                            ? "border-honey bg-honey/15 ring-2 ring-honey/30 shadow-2xs font-bold text-ink"
                            : "border-ink/10 bg-[#FAF6EE] text-ink/70 hover:border-honey/40"
                        }`}
                      >
                        <span className="text-2xl">{p.key === "np" ? "🔴" : "🟡"}</span>
                        <div>
                          <div className="text-sm leading-tight">{p.name}</div>
                          <div className="text-[11px] text-ink/50 mt-0.5 font-normal">
                            {p.key === "np" ? "1–2 дні" : "2–4 дні"}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* City Autocomplete */}
              <div className="relative">
                <label className="label">Місто / населений пункт *</label>
                <div className="relative">
                  <input
                    className="input pl-10"
                    value={cityQuery}
                    onChange={(e) => {
                      setCityQuery(e.target.value);
                      setForm((f) => ({ ...f, city: null, branch: null }));
                    }}
                    placeholder="Почніть вводити: напр. Київ, Львів, Житомир"
                  />
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40 text-base">
                    🔍
                  </span>
                </div>

                {cityOptions.length > 0 && (
                  <div className="absolute z-30 bg-white border border-ink/10 rounded-2xl mt-1.5 w-full shadow-xl max-h-56 overflow-auto divide-y divide-ink/5">
                    {cityOptions.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => pickCity(c)}
                        className="block w-full text-left px-4 py-2.5 text-sm hover:bg-cream transition-colors text-ink"
                      >
                        📍 {c.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Branch Selector */}
              {form.city && (
                <div className="animate-fadeIn">
                  <label className="label">Відділення або поштомат *</label>
                  {loadingBranches ? (
                    <div className="text-xs text-ink/50 py-3 flex items-center gap-2">
                      <span className="animate-spin">🔄</span>
                      <span>Завантаження списку відділень у м. {form.city.name}...</span>
                    </div>
                  ) : (
                    <select
                      className="input cursor-pointer"
                      value={form.branch?.id || ""}
                      onChange={(e) => pickBranch(e.target.value)}
                    >
                      <option value="">Оберіть відділення або поштомат</option>
                      {branchOptions.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {/* Order Comment */}
              <div>
                <label className="label">Коментар до замовлення (необов'язково)</label>
                <textarea
                  className="input"
                  rows={2}
                  value={form.comment}
                  onChange={set("comment")}
                  placeholder="Додаткові побажання, зручний час для дзвінка тощо"
                />
              </div>

              <div className="pt-4 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="btn-secondary text-sm px-6 py-3"
                >
                  ← Назад
                </button>
                <button
                  type="button"
                  disabled={!step2Valid}
                  onClick={() => setStep(3)}
                  className="btn-primary text-sm px-8 py-3 disabled:opacity-40"
                >
                  Далі до оплати →
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Оплата */}
          {step === 3 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b border-ink/5 pb-3">
                <h2 className="font-serif text-xl font-bold text-ink">3. Спосіб оплати</h2>
                <p className="text-xs text-ink/60 mt-0.5">Оберіть зручний для вас варіант розрахунку</p>
              </div>

              {/* Payment Method Cards */}
              <div className="grid sm:grid-cols-2 gap-3.5">
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, paymentMethod: "cod" }))}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    form.paymentMethod === "cod"
                      ? "border-honey bg-honey/15 ring-2 ring-honey/30 shadow-2xs font-bold text-ink"
                      : "border-ink/10 bg-[#FAF6EE] text-ink/75 hover:border-honey/40"
                  }`}
                >
                  <div className="text-xl mb-1">💵</div>
                  <div className="text-sm font-bold text-ink">Оплата при отриманні</div>
                  <div className="text-xs text-ink/55 mt-1 font-normal leading-relaxed">
                    Оплатіть замовлення під час отримання посилки.
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, paymentMethod: "card" }))}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    form.paymentMethod === "card"
                      ? "border-honey bg-honey/15 ring-2 ring-honey/30 shadow-2xs font-bold text-ink"
                      : "border-ink/10 bg-[#FAF6EE] text-ink/75 hover:border-honey/40"
                  }`}
                >
                  <div className="text-xl mb-1">💳</div>
                  <div className="text-sm font-bold text-ink">Оплатити зараз</div>
                  <div className="text-xs text-ink/55 mt-1 font-normal leading-relaxed">
                    Переказ на картку або IBAN за реквізитами
                  </div>
                </button>
              </div>

              {/* 1. Оплата при отриманні — пояснення (Чек не потрібен) */}
              {form.paymentMethod === "cod" && (
                <div className="p-4 rounded-2xl bg-[#FAF6EE] border border-gold/30 text-ink/80 text-sm flex items-start gap-3 animate-fadeIn">
                  <span className="text-2xl shrink-0">📦</span>
                  <div>
                    <div className="font-bold text-ink">Оплата при отриманні</div>
                    <p className="text-xs text-ink/65 mt-1 leading-relaxed">
                      Оплатіть замовлення під час отримання посилки. Чек про оплату не потрібен.
                    </p>
                  </div>
                </div>
              )}

              {/* 2. Оплатити зараз — Реквізити та обов'язкове завантаження чека */}
              {form.paymentMethod === "card" && (
                <div className="p-5 rounded-2xl bg-gradient-to-br from-[#FDFBF7] to-[#F5EEDF] border border-gold/40 space-y-4 animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-ink/5 pb-2.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-honey flex items-center gap-1.5">
                      <span>💳</span> Реквізити для оплати
                    </span>
                    {settings?.payment?.bank && (
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-ink text-white">
                        {settings.payment.bank}
                      </span>
                    )}
                  </div>

                  {/* Requisites Details */}
                  <div className="space-y-2.5 bg-white p-4 rounded-xl border border-ink/10 text-xs sm:text-sm">
                    {settings?.payment?.holder && (
                      <div className="flex justify-between items-baseline gap-2">
                        <span className="text-ink/50 shrink-0">Отримувач:</span>
                        <span className="font-semibold text-ink text-right">{settings.payment.holder}</span>
                      </div>
                    )}

                    {settings?.payment?.card && (
                      <div className="flex justify-between items-center gap-2 pt-1 border-t border-ink/5">
                        <span className="text-ink/50 shrink-0">Картка / IBAN:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-ink tracking-wider text-xs sm:text-sm">
                            {settings.payment.card}
                          </span>
                          <button
                            type="button"
                            onClick={copyCard}
                            className="px-2 py-1 rounded-lg border border-honey/60 text-[11px] font-bold hover:bg-cream text-ink transition-colors flex items-center gap-1 shrink-0"
                            title="Скопіювати реквізити"
                          >
                            {copied ? "✓ Скопійовано" : "❐ Скопіювати"}
                          </button>
                        </div>
                      </div>
                    )}

                    {settings?.payment?.bank && (
                      <div className="flex justify-between items-baseline gap-2 pt-1 border-t border-ink/5">
                        <span className="text-ink/50 shrink-0">Банк:</span>
                        <span className="font-medium text-ink text-right">{settings.payment.bank}</span>
                      </div>
                    )}

                    <div className="flex justify-between items-baseline gap-2 pt-1 border-t border-ink/5">
                      <span className="text-ink/50 shrink-0">Призначення:</span>
                      <span className="font-medium text-ink text-right">
                        {settings?.payment?.purpose || "Оплата замовлення"}
                      </span>
                    </div>
                  </div>

                  {settings?.payment?.instruction && (
                    <p className="text-xs text-ink/65 leading-relaxed bg-white/70 p-3 rounded-xl border border-ink/5">
                      💡 {settings.payment.instruction}
                    </p>
                  )}

                  {/* Receipt Upload Block */}
                  <div className="pt-2 border-t border-ink/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
                        <span>🧾</span> Завантажте чек про оплату *
                      </label>
                      <span className="text-[11px] text-ink/50">JPG, JPEG, PNG, PDF</span>
                    </div>

                    {form.receiptUrl ? (
                      /* Preview of uploaded receipt */
                      <div className="p-3.5 rounded-2xl bg-white border border-leaf/30 shadow-xs flex items-center justify-between gap-3 animate-fadeIn">
                        <div className="flex items-center gap-3 min-w-0">
                          {receiptPreview && receiptPreview !== "pdf" ? (
                            <img
                              src={receiptPreview}
                              alt="Прев'ю чека"
                              className="w-14 h-14 object-cover rounded-xl border border-ink/10 shadow-2xs shrink-0"
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-xl bg-red-50 border border-red-200 flex flex-col items-center justify-center text-red-600 font-bold text-[10px] shrink-0">
                              <span className="text-lg">📄</span>
                              <span>PDF</span>
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="text-xs sm:text-sm font-bold text-ink truncate">
                              {form.receiptName || "Чек про оплату"}
                            </div>
                            <div className="text-xs text-leaf font-medium flex items-center gap-1 mt-0.5">
                              <span>✓</span> Чек успішно прикріплено
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <label
                            htmlFor="receipt-input-change"
                            className="text-xs text-honey hover:underline cursor-pointer font-semibold px-2 py-1"
                          >
                            Замінити
                          </label>
                          <input
                            type="file"
                            accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                            onChange={onReceipt}
                            id="receipt-input-change"
                            className="hidden"
                          />
                          <button
                            type="button"
                            onClick={removeReceipt}
                            className="text-xs text-red-500 hover:text-red-700 font-bold px-2 py-1 hover:bg-red-50 rounded-lg transition-colors"
                            title="Видалити чек"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Upload Button / Dropzone */
                      <div className="border-2 border-dashed border-gold/60 rounded-2xl p-5 text-center bg-white hover:bg-cream/40 transition-colors">
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                          onChange={onReceipt}
                          id="receipt-input"
                          className="hidden"
                        />
                        <label htmlFor="receipt-input" className="cursor-pointer block space-y-2">
                          {uploadingReceipt ? (
                            <div className="text-xs text-honey font-semibold animate-pulse py-2 flex items-center justify-center gap-2">
                              <span className="animate-spin">🔄</span>
                              <span>Завантаження чека на сервер...</span>
                            </div>
                          ) : (
                            <>
                              <div className="w-10 h-10 rounded-full bg-honey/15 text-honey text-xl flex items-center justify-center mx-auto">
                                📎
                              </div>
                              <div className="text-xs sm:text-sm font-bold text-ink">
                                Натисніть, щоб завантажити чек
                              </div>
                              <div className="text-[11px] text-ink/50">
                                Дозволені формати: JPG, JPEG, PNG, PDF (до 10 МБ)
                              </div>
                              <div className="pt-1">
                                <span className="inline-flex btn-primary text-xs py-2 px-5 pointer-events-none">
                                  Завантажити чек 🧾
                                </span>
                              </div>
                            </>
                          )}
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Notice when card payment selected but receipt missing */}
              {form.paymentMethod === "card" && !form.receiptUrl && (
                <div className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-3 text-center font-medium animate-fadeIn">
                  ⚠️ Для остаточного підтвердження замовлення завантажте чек про оплату.
                </div>
              )}

              <div className="pt-4 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="btn-secondary text-sm px-6 py-3"
                >
                  ← Назад
                </button>
                <button
                  type="button"
                  disabled={submitting || (form.paymentMethod === "card" && !form.receiptUrl)}
                  onClick={submitOrder}
                  className="btn-primary text-sm px-8 py-3.5 flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                >
                  {submitting ? (
                    <>
                      <span className="animate-spin">🔄</span>
                      <span>Обробка замовлення...</span>
                    </>
                  ) : (
                    <span>Підтвердити замовлення ({subtotal} грн) ✓</span>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-4 sticky top-24">
          <div className="card p-6 bg-[#FAF6EE] border border-gold/30 shadow-sm rounded-3xl">
            <h3 className="font-serif font-bold text-lg text-ink pb-3 border-b border-ink/10">
              Ваше замовлення
            </h3>

            {/* Items mini list */}
            <div className="py-3 divide-y divide-ink/5 max-h-60 overflow-y-auto pr-1">
              {items.map((i) => (
                <div key={i.id} className="py-2 flex items-center justify-between gap-2 text-xs">
                  <div className="min-w-0">
                    <div className="font-semibold text-ink truncate">{i.name}</div>
                    <div className="text-ink/50">{i.qty} шт. × {i.price} грн</div>
                  </div>
                  <div className="font-serif font-bold text-ink shrink-0">
                    {i.qty * i.price} грн
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="pt-3 border-t border-ink/10 space-y-2 text-xs text-ink/75">
              <div className="flex justify-between">
                <span>Товари</span>
                <span>{subtotal} грн</span>
              </div>
              <div className="flex justify-between text-ink/50">
                <span>Доставка</span>
                <span>за тарифами пошти</span>
              </div>
              <div className="flex justify-between font-serif font-extrabold text-lg text-ink pt-2 border-t border-ink/10">
                <span>Разом:</span>
                <span>{subtotal} грн</span>
              </div>
            </div>

            {/* Quick Summary of Choice */}
            <div className="mt-5 p-3 rounded-xl bg-white/70 border border-ink/5 text-[11px] text-ink/65 space-y-1">
              <div>📍 <b>Отримувач:</b> {form.firstName} {form.lastName || "—"}</div>
              <div>🚚 <b>Доставка:</b> {provider?.name} {form.city?.name ? `(${form.city.name})` : ""}</div>
              <div>💳 <b>Оплата:</b> {form.paymentMethod === "card" ? "Оплатити зараз" : "Оплата при отриманні"}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
