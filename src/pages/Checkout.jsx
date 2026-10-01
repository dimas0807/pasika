import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { Orders, Products, Settings, Storage } from "../data/db";
import {
  NovaPoshtaLogo,
  UkrposhtaLogo,
  IconCreditCard,
  IconCash,
  IconBox,
  IconTruck,
  IconMapPin,
  IconCopy,
  IconCheckCircle,
  IconCart,
  IconReceipt,
  IconClose,
  IconClock,
} from "../components/Icons";

const STEPS = ["Дані", "Доставка", "Оплата"];

const DELIVERY_SERVICES = [
  { key: "np", name: "Нова Пошта", logo: <NovaPoshtaLogo className="w-7 h-7" />, note: "1–2 дні" },
  { key: "up", name: "Укрпошта", logo: <UkrposhtaLogo className="w-7 h-7" />, note: "2–4 дні" },
];

export default function Checkout() {
  const { items, subtotal, clear } = useCart();
  const navigate = useNavigate();
  const [settings, setSettings] = useState(() => Settings.get());
  const [checkoutToken] = useState(() => "chk_" + Date.now() + "_" + Math.random().toString(36).slice(2, 12));

  const [step, setStep] = useState(1);
  const FORM_STORAGE_KEY = "pasika_checkout_form";

  const [form, setForm] = useState(() => {
    try {
      const saved = localStorage.getItem("pasika_checkout_form");
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          firstName: parsed.firstName || "",
          lastName: parsed.lastName || "",
          phone: parsed.phone || "",
          email: parsed.email || "",
          providerKey: parsed.providerKey || "np",
          deliveryCity: parsed.deliveryCity || "",
          deliveryRegion: parsed.deliveryRegion || "",
          deliveryBranch: parsed.deliveryBranch || "",
          cityRef: parsed.cityRef || "",
          branchRef: parsed.branchRef || "",
          branchNumber: parsed.branchNumber || "",
          warehouseAddress: parsed.warehouseAddress || "",
          warehouseType: parsed.warehouseType || "",
          comment: parsed.comment || "",
          paymentMethod: parsed.paymentMethod || "cod",
          receiptFile: null,
          receiptUrl: parsed.receiptUrl || null,
          receiptName: parsed.receiptName || null,
        };
      }
    } catch {}
    return {
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      providerKey: "np",
      deliveryCity: "",
      deliveryRegion: "",
      deliveryBranch: "",
      cityRef: "",
      branchRef: "",
      branchNumber: "",
      warehouseAddress: "",
      warehouseType: "",
      comment: "",
      paymentMethod: "cod",
      receiptFile: null,
      receiptUrl: null,
      receiptName: null,
    };
  });

  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [copied, setCopied] = useState(false);

  // Delivery autocomplete states
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [cityLoading, setCityLoading] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [branchOptions, setBranchOptions] = useState([]);
  const [branchLoading, setBranchLoading] = useState(false);
  const [branchFilter, setBranchFilter] = useState("");
  const [stockIssue, setStockIssue] = useState(null);

  const loadBranches = async (cId, cName = "", searchStr = "", providerKey = form.providerKey) => {
    if (!cId && !cName) return;
    setBranchLoading(true);
    try {
      let url = `/api/delivery/branches?provider=${encodeURIComponent(providerKey)}`;
      if (cId) url += `&cityId=${encodeURIComponent(cId)}`;
      if (cName) url += `&cityName=${encodeURIComponent(cName)}`;
      if (searchStr) url += `&search=${encodeURIComponent(searchStr)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (Array.isArray(data)) {
        setBranchOptions(data);
      }
    } catch {
      setBranchOptions([]);
    } finally {
      setBranchLoading(false);
    }
  };

  // Persist form to localStorage
  useEffect(() => {
    try {
      const { receiptFile: _receiptFile, ...saveable } = form;
      localStorage.setItem("pasika_checkout_form", JSON.stringify(saveable));
    } catch {}
  }, [form]);

  useEffect(() => {
    Settings.fetch().then(setSettings).catch(() => {});
  }, []);

  // Auto-reload branches on mount if city was previously chosen
  useEffect(() => {
    if (form.cityRef || (form.deliveryCity && form.providerKey === "np")) {
      loadBranches(form.cityRef, form.deliveryCity, "", form.providerKey);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Stock pre-check on checkout mount
  useEffect(() => {
    if (items.length > 0) {
      Products.validateStock(items)
        .then((data) => {
          if (data && !data.valid && Array.isArray(data.items)) {
            const prob = data.items.find((i) => !i.isAvailable);
            if (prob) {
              setStockIssue(
                `Товар «${prob.name}» має доступний залишок лише ${prob.availableStock} шт. (у кошику: ${prob.requestedQty} шт.). Будь ласка, скоригуйте кількість у кошику.`
              );
            }
          }
        })
        .catch(() => {});
    }
  }, [items]);

  // Search cities with debounce
  useEffect(() => {
    const q = (form.deliveryCity || "").trim();
    if (q.length < 2) {
      setCitySuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      setCityLoading(true);
      try {
        const res = await fetch(
          `/api/delivery/cities?provider=${encodeURIComponent(form.providerKey)}&query=${encodeURIComponent(q)}`
        );
        const data = await res.json();
        if (Array.isArray(data)) {
          setCitySuggestions(data);
          setShowCityDropdown(true);
        }
      } catch {
        setCitySuggestions([]);
      } finally {
        setCityLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [form.deliveryCity, form.providerKey]);

  const selectCity = (city) => {
    const cityName = city.name || city.description || "";
    const cityRegion = city.area || city.region || "";
    const cityRef = city.id || city.ref || "";
    setForm((f) => ({
      ...f,
      deliveryCity: cityName,
      deliveryRegion: cityRegion,
      cityRef: cityRef,
      deliveryBranch: "",
      branchRef: "",
      branchNumber: "",
      warehouseAddress: "",
      warehouseType: "",
    }));
    setShowCityDropdown(false);
    setBranchFilter("");
    loadBranches(cityRef, cityName);
  };

  const selectBranch = (branch) => {
    setForm((f) => ({
      ...f,
      deliveryBranch: branch.name || branch.description || "",
      branchRef: branch.ref || branch.id || "",
      branchNumber: branch.number || "",
      warehouseAddress: branch.address || branch.shortAddress || branch.name || "",
      warehouseType: branch.type || branch.category || "",
    }));
  };

  const onProviderChange = (key) => {
    setForm((f) => ({
      ...f,
      providerKey: key,
      cityRef: "",
      branchRef: "",
      branchNumber: "",
      warehouseAddress: "",
      warehouseType: "",
      deliveryBranch: "",
    }));
    setCitySuggestions([]);
    setBranchOptions([]);
    setBranchFilter("");
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
    const validExts = [".jpg", ".jpeg", ".png", ".webp", ".pdf"];
    const isExtValid = validExts.some((ext) => lowerName.endsWith(ext));
    const isMimeValid =
      file.type === "image/jpeg" ||
      file.type === "image/png" ||
      file.type === "image/webp" ||
      file.type === "application/pdf" ||
      file.type.startsWith("image/");

    if (!isExtValid && !isMimeValid) {
      setErrorMsg("Дозволено завантажувати чек лише у форматах JPG, JPEG, PNG, WEBP або PDF");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg("Розмір файлу не повинен перевищувати 10 МБ");
      return;
    }

    setUploadingReceipt(true);
    try {
      if (
        file.type.startsWith("image/") ||
        lowerName.endsWith(".jpg") ||
        lowerName.endsWith(".jpeg") ||
        lowerName.endsWith(".png") ||
        lowerName.endsWith(".webp")
      ) {
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
    if (receiptPreview && typeof receiptPreview === "string" && receiptPreview.startsWith("blob:")) {
      try {
        URL.revokeObjectURL(receiptPreview);
      } catch {
        // ignore
      }
    }
    setForm((f) => ({
      ...f,
      receiptFile: null,
      receiptUrl: null,
      receiptName: null,
    }));
    setReceiptPreview(null);
  };

  const step1Valid = Boolean(form.firstName.trim() && form.lastName.trim() && form.phone.trim());
  const step2Valid = Boolean(
    form.providerKey &&
    form.deliveryCity.trim() &&
    (form.providerKey === "np"
      ? Boolean(form.branchRef || form.deliveryBranch.trim())
      : Boolean(form.deliveryRegion.trim() && form.deliveryBranch.trim()))
  );

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
      // Real-time stock verification before order placement
      try {
        const stockData = await Products.validateStock(items);
        if (stockData && !stockData.valid && Array.isArray(stockData.items)) {
          const prob = stockData.items.find((i) => !i.isAvailable);
          setErrorMsg(
            `Неможливо оформити: товару «${prob?.name || ""}» доступно лише ${prob?.availableStock ?? 0} шт.`
          );
          setSubmitting(false);
          return;
        }
      } catch {
        // proceed to backend atomic reservation check
      }

      const idempotencyKey = `pasika_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

      const isNp = form.providerKey === "np";
      const cityDisplay = form.deliveryCity.trim();
      const regionDisplay = form.deliveryRegion.trim();
      const branchDisplay = form.deliveryBranch.trim();
      const warehouseAddressDisplay = form.warehouseAddress.trim() || branchDisplay;

      const isCard = form.paymentMethod === "card";
      const cleanPaymentMethod = isCard ? "card" : "cash_on_delivery";

      const orderPayload = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        providerKey: form.providerKey,
        deliveryCity: cityDisplay,
        deliveryRegion: regionDisplay || undefined,
        deliveryBranch: branchDisplay,
        deliveryWarehouseAddress: warehouseAddressDisplay,
        deliveryWarehouseRef: form.branchRef || undefined,
        deliveryBranchNumber: form.branchNumber || undefined,
        deliveryCityId: form.cityRef || undefined,
        deliveryBranchId: form.branchRef || undefined,
        city: cityDisplay,
        region: regionDisplay || undefined,
        branch: branchDisplay,
        warehouseAddress: warehouseAddressDisplay,
        warehouseRef: form.branchRef || undefined,
        branchNumber: form.branchNumber || undefined,
        paymentMethod: cleanPaymentMethod,
        comment: form.comment.trim() || undefined,
        receiptUrl: isCard ? form.receiptUrl : undefined,
        receiptName: isCard ? form.receiptName : undefined,
        customer: {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          phone: form.phone.trim(),
          email: form.email.trim() || undefined,
        },
        delivery: {
          provider: isNp ? "Нова пошта" : "Укрпошта",
          providerKey: form.providerKey,
          deliveryService: isNp ? "Нова пошта" : "Укрпошта",
          city: cityDisplay,
          region: regionDisplay || undefined,
          branch: branchDisplay,
          warehouseAddress: warehouseAddressDisplay,
          warehouseRef: form.branchRef || undefined,
          branchNumber: form.branchNumber || undefined,
          cityId: form.cityRef || undefined,
          branchId: form.branchRef || undefined,
        },
        payment: {
          method: cleanPaymentMethod,
          paymentMethod: cleanPaymentMethod,
          methodLabel: isCard ? "Оплачено наперед" : "Оплата при отриманні",
          receiptUrl: isCard ? form.receiptUrl : undefined,
          receiptName: isCard ? form.receiptName : undefined,
        },
        items: items.map((i) => ({ id: i.id, qty: i.qty })),
        idempotencyKey,
        checkoutToken,
      };

      const created = await Orders.create(orderPayload);
      try {
        localStorage.removeItem(FORM_STORAGE_KEY);
      } catch {}
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
        <div className="w-20 h-20 rounded-2xl bg-amber-500/10 border border-amber-500/20 mx-auto flex items-center justify-center text-amber-800 mb-5 shadow-xs">
          <IconCart className="w-9 h-9" />
        </div>
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
        <Link to="/" className="hover:text-honey transition-colors">Головна</Link>
        <span>/</span>
        <Link to="/cart" className="hover:text-honey transition-colors">Кошик</Link>
        <span>/</span>
        <span className="text-ink/80 font-medium">Оформлення замовлення</span>
      </nav>

      <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-ink mb-6">
        Оформлення замовлення
      </h1>

      {/* Global Error Banner */}
      {errorMsg && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center justify-between shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2">
            <IconClose className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg("")} className="text-rose-500 hover:text-rose-800 p-1" aria-label="Закрити">
            <IconClose className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {stockIssue && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900 text-sm flex items-start justify-between gap-3 animate-fadeIn">
          <div className="flex items-start gap-2.5">
            <IconClock className="w-4 h-4 text-amber-800 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold">{stockIssue}</div>
              <Link to="/cart" className="text-xs text-amber-800 underline mt-1 inline-block">
                Перейти до кошика для коригування кількості →
              </Link>
            </div>
          </div>
          <button
            onClick={() => setStockIssue(null)}
            className="text-amber-800/60 hover:text-amber-900 p-1"
            aria-label="Закрити"
          >
            <IconClose className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Stepper Header */}
      <div className="flex items-center gap-2 sm:gap-4 mb-8 bg-cream/50 p-2.5 sm:p-3 rounded-2xl border border-amber-900/10 max-w-xl">
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
        <div className="lg:col-span-8 glass-card p-6 sm:p-8 rounded-3xl shadow-sm">
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
                <p className="text-xs text-ink/60 mt-0.5">Оберіть службу доставки та вкажіть пункт отримання</p>
              </div>

              {/* Delivery Carrier Selection */}
              <div>
                <label className="label">Служба доставки *</label>
                <div className="grid grid-cols-2 gap-3">
                  {DELIVERY_SERVICES.map((p) => {
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
                        <div className="shrink-0">{p.logo}</div>
                        <div>
                          <div className="text-sm font-bold leading-tight">{p.name}</div>
                          <div className="text-[11px] text-ink/50 mt-0.5 font-normal">
                            {p.note}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* NOVA POSHTA FLOW */}
              {form.providerKey === "np" ? (
                <div className="space-y-4">
                  {/* 1. City / Settlement Autocomplete */}
                  <div className="relative">
                    <div className="flex items-center justify-between mb-1">
                      <label className="label mb-0" htmlFor="deliveryCity">
                        Місто / населений пункт *
                      </label>
                      {cityLoading && (
                        <span className="text-xs text-ink/50 flex items-center gap-1">
                          <span className="w-3 h-3 border-2 border-honey border-t-transparent rounded-full animate-spin" />
                          Пошук міст...
                        </span>
                      )}
                    </div>

                    {form.cityRef ? (
                      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25">
                        <div className="flex items-center gap-2.5">
                          <span className="text-lg">📍</span>
                          <div>
                            <div className="text-sm font-bold text-ink">{form.deliveryCity}</div>
                            {form.deliveryRegion && (
                              <div className="text-xs text-amber-900 font-medium">{form.deliveryRegion}</div>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setForm((f) => ({
                              ...f,
                              deliveryCity: "",
                              deliveryRegion: "",
                              cityRef: "",
                              deliveryBranch: "",
                              branchRef: "",
                              branchNumber: "",
                              warehouseAddress: "",
                              warehouseType: "",
                            }));
                            setBranchOptions([]);
                            setCitySuggestions([]);
                            setBranchFilter("");
                          }}
                          className="text-xs text-amber-900 hover:text-amber-700 font-semibold underline underline-offset-2"
                        >
                          Змінити місто
                        </button>
                      </div>
                    ) : (
                      <>
                        <input
                          id="deliveryCity"
                          name="deliveryCity"
                          className="input"
                          value={form.deliveryCity}
                          onChange={(e) => {
                            set("deliveryCity")(e);
                            setShowCityDropdown(true);
                          }}
                          onFocus={() => {
                            if (citySuggestions.length > 0) setShowCityDropdown(true);
                          }}
                          placeholder="Введіть назву міста (наприклад: Коростень, Київ, Львів)"
                          autoFocus
                          autoComplete="off"
                        />

                        {/* City Suggestions Dropdown */}
                        {showCityDropdown && citySuggestions.length > 0 && (
                          <div className="absolute z-20 left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-white rounded-2xl shadow-xl border border-ink/10 py-1.5 divide-y divide-ink/5">
                            {citySuggestions.map((c, idx) => (
                              <button
                                key={c.id || c.ref || idx}
                                type="button"
                                onClick={() => selectCity(c)}
                                className="w-full text-left px-4 py-2.5 text-xs sm:text-sm hover:bg-honey/15 transition-colors flex items-center justify-between"
                              >
                                <div>
                                  <div className="font-semibold text-ink">{c.name || c.description}</div>
                                  {(c.region || c.area) && (
                                    <div className="text-[11px] text-ink/50">{c.region || c.area}</div>
                                  )}
                                </div>
                                <span className="text-xs text-ink/40">Обрати →</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* 2. Auto-detected Region Badge */}
                  {form.deliveryRegion && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#FAF6EE] border border-ink/10 text-xs text-ink/75">
                      <span className="font-semibold text-ink">Область:</span>
                      <span className="font-medium text-amber-950">{form.deliveryRegion}</span>
                      <span className="text-[10px] text-ink/40 ml-auto">(визначено автоматично)</span>
                    </div>
                  )}

                  {/* 3. Branch / Postomat Selection */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="label mb-0" htmlFor="deliveryBranch">
                        Відділення або поштомат *
                      </label>
                      {branchLoading && (
                        <span className="text-xs text-ink/50 flex items-center gap-1">
                          <span className="w-3 h-3 border-2 border-honey border-t-transparent rounded-full animate-spin" />
                          Завантаження списку...
                        </span>
                      )}
                    </div>

                    {!form.cityRef && !form.deliveryCity ? (
                      <div className="text-xs text-ink/50 italic p-3 bg-ink/5 rounded-xl border border-ink/5">
                        💡 Спочатку оберіть населений пункт зі списку вище, щоб завантажити актуальні відділення та поштомати.
                      </div>
                    ) : branchLoading ? (
                      <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-center text-xs text-ink/60 flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-honey border-t-transparent rounded-full animate-spin" />
                        Завантажуємо актуальний список відділень Нової пошти...
                      </div>
                    ) : form.branchRef ? (
                      /* Selected Branch Card */
                      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2 animate-fadeIn">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                            <span>{form.warehouseType?.toLowerCase().includes("поштомат") ? "📮" : "📦"}</span>
                            <span>{form.warehouseType?.toLowerCase().includes("поштомат") ? "Поштомат обрано" : "Відділення обрано"}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setForm((f) => ({
                                ...f,
                                deliveryBranch: "",
                                branchRef: "",
                                branchNumber: "",
                                warehouseAddress: "",
                                warehouseType: "",
                              }));
                            }}
                            className="text-xs text-amber-900 hover:text-amber-700 font-semibold underline underline-offset-2"
                          >
                            Змінити
                          </button>
                        </div>
                        <div className="text-sm font-bold text-ink">
                          {form.deliveryBranch}
                        </div>
                        {form.warehouseAddress && form.warehouseAddress !== form.deliveryBranch && (
                          <div className="text-xs text-ink/75 flex items-center gap-1">
                            <span>📍</span>
                            <span>{form.warehouseAddress}</span>
                          </div>
                        )}
                      </div>
                    ) : branchOptions.length > 0 ? (
                      /* Branch Picker with Filter */
                      <div className="space-y-2">
                        {branchOptions.length > 4 && (
                          <input
                            type="text"
                            value={branchFilter}
                            onChange={(e) => setBranchFilter(e.target.value)}
                            placeholder="🔍 Пошук за номером (напр. 1) або адресою..."
                            className="input text-xs py-2"
                          />
                        )}
                        <div className="max-h-56 overflow-y-auto space-y-1.5 rounded-2xl border border-ink/10 p-2 bg-[#FAF6EE]/50 divide-y divide-ink/5">
                          {branchOptions
                            .filter((b) => {
                              if (!branchFilter.trim()) return true;
                              const term = branchFilter.toLowerCase().trim();
                              return (
                                (b.name && b.name.toLowerCase().includes(term)) ||
                                (b.number && String(b.number).includes(term)) ||
                                (b.shortAddress && b.shortAddress.toLowerCase().includes(term)) ||
                                (b.address && b.address.toLowerCase().includes(term))
                              );
                            })
                            .map((b) => {
                              const isPostomat = b.category === "Postomat" || b.name?.toLowerCase()?.includes("поштомат");
                              return (
                                <button
                                  key={b.ref || b.id}
                                  type="button"
                                  onClick={() => selectBranch(b)}
                                  className="w-full text-left p-2.5 rounded-xl transition-colors hover:bg-white text-ink/80 flex items-start justify-between gap-2.5"
                                >
                                  <div className="space-y-0.5">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-xs font-bold text-ink">
                                        {b.number ? `№${b.number}` : ""} {b.name}
                                      </span>
                                      <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${
                                        isPostomat ? "bg-blue-100 text-blue-800" : "bg-amber-100 text-amber-800"
                                      }`}>
                                        {isPostomat ? "Поштомат" : "Відділення"}
                                      </span>
                                    </div>
                                    {(b.address || b.shortAddress) && (
                                      <div className="text-[11px] text-ink/60">
                                        📍 {b.address || b.shortAddress}
                                      </div>
                                    )}
                                  </div>
                                  <span className="text-xs text-honey font-semibold shrink-0 mt-0.5">
                                    Обрати →
                                  </span>
                                </button>
                              );
                            })}
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-ink/50 italic p-3 bg-ink/5 rounded-xl border border-ink/5">
                        У цьому населеному пункті не знайдено відділень. Будь ласка, оберіть інший населений пункт.
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* UKRPOSHTA FLOW (UNMODIFIED) */
                <div className="space-y-4">
                  {/* 1. Місто / населений пункт * */}
                  <div className="relative">
                    <div className="flex items-center justify-between mb-1">
                      <label className="label mb-0" htmlFor="deliveryCity">Місто / населений пункт *</label>
                      {cityLoading && (
                        <span className="text-xs text-ink/50 flex items-center gap-1">
                          <span className="w-3 h-3 border-2 border-honey border-t-transparent rounded-full animate-spin" />
                          Пошук міст...
                        </span>
                      )}
                    </div>
                    <input
                      id="deliveryCity"
                      name="deliveryCity"
                      className="input"
                      value={form.deliveryCity}
                      onChange={(e) => {
                        set("deliveryCity")(e);
                        setShowCityDropdown(true);
                      }}
                      onFocus={() => {
                        if (citySuggestions.length > 0) setShowCityDropdown(true);
                      }}
                      placeholder="Введіть перші літери (напр. Київ, Львів, Коломия)"
                      autoFocus
                      autoComplete="off"
                    />

                    {/* City Suggestions Dropdown */}
                    {showCityDropdown && citySuggestions.length > 0 && (
                      <div className="absolute z-20 left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-white rounded-2xl shadow-xl border border-ink/10 py-1.5 divide-y divide-ink/5">
                        {citySuggestions.map((c, idx) => (
                          <button
                            key={c.id || c.ref || idx}
                            type="button"
                            onClick={() => selectCity(c)}
                            className="w-full text-left px-4 py-2.5 text-xs sm:text-sm hover:bg-honey/15 transition-colors flex items-center justify-between"
                          >
                            <div>
                              <div className="font-semibold text-ink">{c.name || c.description}</div>
                              {(c.region || c.area) && (
                                <div className="text-[11px] text-ink/50">{c.region || c.area}</div>
                              )}
                            </div>
                            <span className="text-xs text-ink/40">Обрати →</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 2. Область * */}
                  <div>
                    <label className="label" htmlFor="deliveryRegion">Область *</label>
                    <input
                      id="deliveryRegion"
                      name="deliveryRegion"
                      className="input"
                      value={form.deliveryRegion}
                      onChange={set("deliveryRegion")}
                      placeholder="напр. Івано-Франківська"
                    />
                  </div>

                  {/* 3. Відділення * */}
                  <div>
                    <label className="label" htmlFor="deliveryBranch">Відділення / індекс Укрпошти *</label>
                    <input
                      id="deliveryBranch"
                      name="deliveryBranch"
                      className="input"
                      value={form.deliveryBranch}
                      onChange={set("deliveryBranch")}
                      placeholder="напр. Відділення 76018 (вул. Січових Стрільців, 15)"
                    />
                  </div>
                </div>
              )}

              {/* 4. Коментар до замовлення */}
              <div>
                <label className="label" htmlFor="comment">Коментар до замовлення (необов'язково)</label>
                <textarea
                  id="comment"
                  name="comment"
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
                      : "border-ink/10 bg-white/70 text-ink/75 hover:border-honey/40"
                  }`}
                >
                  <div className="mb-2 text-honey"><IconCash className="w-6 h-6" /></div>
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
                      : "border-ink/10 bg-white/70 text-ink/75 hover:border-honey/40"
                  }`}
                >
                  <div className="mb-2 text-honey"><IconCreditCard className="w-6 h-6" /></div>
                  <div className="text-sm font-bold text-ink">Оплатити зараз</div>
                  <div className="text-xs text-ink/55 mt-1 font-normal leading-relaxed">
                    Переказ на картку або IBAN за реквізитами
                  </div>
                </button>
              </div>

              {/* 1. Оплата при отриманні — пояснення (Чек не потрібен) */}
              {form.paymentMethod === "cod" && (
                <div className="p-4 rounded-2xl bg-white/80 border border-amber-900/10 text-ink/80 text-sm flex items-start gap-3 animate-fadeIn">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-honey shrink-0">
                    <IconBox className="w-4 h-4" />
                  </div>
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
                <div className="p-5 rounded-2xl bg-white/90 backdrop-blur-md border border-amber-900/15 space-y-4 shadow-sm animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-ink/5 pb-2.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-honey flex items-center gap-1.5">
                      <IconCreditCard className="w-4 h-4" /> Реквізити для оплати
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
                            className="px-2.5 py-1 rounded-lg border border-honey/60 text-[11px] font-bold hover:bg-cream text-ink transition-colors flex items-center gap-1.5 shrink-0"
                            title="Скопіювати реквізити"
                          >
                            <IconCopy className="w-3.5 h-3.5" />
                            <span>{copied ? "Скопійовано" : "Скопіювати"}</span>
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
                      {settings.payment.instruction}
                    </p>
                  )}

                  {/* Receipt Upload Block */}
                  <div className="pt-2 border-t border-ink/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
                        <IconReceipt className="w-4 h-4 text-honey" />
                        <span>Завантажте чек про оплату *</span>
                      </label>
                      <span className="text-[11px] text-ink/50">JPG, JPEG, PNG, WEBP, PDF</span>
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
                              <IconReceipt className="w-6 h-6 text-red-500" />
                              <span>PDF</span>
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="text-xs sm:text-sm font-bold text-ink truncate">
                              {form.receiptName || "Чек про оплату"}
                            </div>
                            <div className="text-xs text-leaf font-medium flex items-center gap-1 mt-0.5">
                              <IconCheckCircle className="w-3.5 h-3.5 text-leaf" />
                              <span>Чек успішно прикріплено</span>
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
                            accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
                            onChange={onReceipt}
                            id="receipt-input-change"
                            className="hidden"
                          />
                          <button
                            type="button"
                            onClick={removeReceipt}
                            className="text-xs text-red-500 hover:text-red-700 font-bold p-1 hover:bg-red-50 rounded-lg transition-colors"
                            title="Видалити чек"
                            aria-label="Видалити чек"
                          >
                            <IconClose className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Upload Button / Dropzone */
                      <div className="border-2 border-dashed border-amber-500/40 rounded-2xl p-5 text-center bg-white/70 hover:bg-cream/40 transition-colors">
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
                          onChange={onReceipt}
                          id="receipt-input"
                          className="hidden"
                        />
                        <label htmlFor="receipt-input" className="cursor-pointer block space-y-2">
                          {uploadingReceipt ? (
                            <div className="text-xs text-honey font-semibold animate-pulse py-2 flex items-center justify-center gap-2">
                              <span className="w-4 h-4 border-2 border-honey border-t-transparent rounded-full animate-spin" />
                              <span>Завантаження чека на сервер...</span>
                            </div>
                          ) : (
                            <>
                              <div className="w-10 h-10 rounded-full bg-honey/15 text-honey flex items-center justify-center mx-auto">
                                <IconReceipt className="w-5 h-5" />
                              </div>
                              <div className="text-xs sm:text-sm font-bold text-ink">
                                Натисніть, щоб завантажити чек
                              </div>
                              <div className="text-[11px] text-ink/50">
                                Дозволені формати: JPG, JPEG, PNG, PDF (до 10 МБ)
                              </div>
                              <div className="pt-1">
                                <span className="inline-flex btn-primary text-xs py-2 px-5 pointer-events-none">
                                  Завантажити чек
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
                <div className="text-xs text-amber-900 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-center font-medium flex items-center justify-center gap-2 animate-fadeIn">
                  <IconClock className="w-4 h-4 text-amber-800 shrink-0" />
                  <span>Для остаточного підтвердження замовлення завантажте чек про оплату.</span>
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
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Обробка замовлення...</span>
                    </>
                  ) : (
                    <span>Підтвердити замовлення ({subtotal} грн)</span>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-4 sticky top-24">
          <div className="glass-card p-6 rounded-3xl shadow-sm">
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
            <div className="mt-5 p-3 rounded-xl bg-white/70 border border-amber-900/10 text-[11px] text-ink/75 space-y-1.5">
              <div className="flex items-center gap-1.5">
                <IconMapPin className="w-3.5 h-3.5 text-honey shrink-0" />
                <span><b>Отримувач:</b> {form.firstName} {form.lastName || "—"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <IconTruck className="w-3.5 h-3.5 text-honey shrink-0" />
                <span>
                  <b>Доставка:</b> {form.providerKey === "up" ? "Укрпошта" : "Нова Пошта"}
                  {form.deliveryCity ? ` (${form.deliveryCity}${form.deliveryBranch ? `, ${form.deliveryBranch}` : ""})` : ""}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <IconCreditCard className="w-3.5 h-3.5 text-honey shrink-0" />
                <span><b>Оплата:</b> {form.paymentMethod === "card" ? "Оплатити зараз" : "Оплата при отриманні"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
