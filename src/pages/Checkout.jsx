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
    setUploadingReceipt(true);
    try {
      const uploaded = await Storage.uploadReceipt(file, checkoutToken);
      setForm((f) => ({
        ...f,
        receiptFile: file,
        receiptUrl: uploaded.fileUrl,
        receiptName: uploaded.name,
      }));
    } catch (err) {
      setErrorMsg(err.message || "Помилка при завантаженні чека");
    } finally {
      setUploadingReceipt(false);
    }
  };

  const step1Valid = form.firstName.trim() && form.lastName.trim() && form.phone.trim();
  const step2Valid = form.city && form.branch;

  const submitOrder = async () => {
    setErrorMsg("");
    setSubmitting(true);

    try {
      const idempotencyKey = `pasika_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

      const orderPayload = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        providerKey: form.providerKey,
        city: form.city, // { id, name }
        branch: form.branch, // { id, name }
        paymentMethod: form.paymentMethod,
        comment: form.comment.trim() || undefined,
        receiptUrl: form.receiptUrl,
        receiptName: form.receiptName,
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
      <div className="container-p py-24 text-center">
        <p className="text-ink/60">Кошик порожній — немає що оформлювати.</p>
        <Link to="/catalog" className="btn-primary mt-4 inline-flex">До каталогу</Link>
      </div>
    );
  }

  return (
    <div className="container-p py-10 pb-10">
      <h1 className="font-serif text-3xl font-bold text-ink mb-6">Оформлення замовлення</h1>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center justify-between">
          <span>⚠️ {errorMsg}</span>
          <button onClick={() => setErrorMsg("")} className="text-red-500 font-bold ml-2">✕</button>
        </div>
      )}

      <div className="flex items-center gap-2 mb-8 text-sm font-medium">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${step === i + 1 ? "bg-honey text-white" : step > i + 1 ? "bg-leaf text-white" : "bg-ink/10 text-ink/50"}`}>
              {step > i + 1 ? "✓" : i + 1}
            </span>
            <span className={step === i + 1 ? "text-ink" : "text-ink/40"}>{s}</span>
            {i < STEPS.length - 1 && <span className="w-8 h-px bg-ink/10 mx-1" />}
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 card p-6 md:p-8">
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Ім'я</label>
                  <input className="input" value={form.firstName} onChange={set("firstName")} placeholder="Олена" />
                </div>
                <div>
                  <label className="label">Прізвище</label>
                  <input className="input" value={form.lastName} onChange={set("lastName")} placeholder="Петрова" />
                </div>
              </div>
              <div>
                <label className="label">Телефон</label>
                <input className="input" value={form.phone} onChange={set("phone")} placeholder="+380 67 123 45 67" />
              </div>
              <div>
                <label className="label">Email (необов'язково)</label>
                <input className="input" type="email" value={form.email} onChange={set("email")} placeholder="mail@example.com" />
              </div>
              <button disabled={!step1Valid} onClick={() => setStep(2)} className="btn-primary mt-2 disabled:opacity-40">
                Далі до доставки
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex gap-3">
                {Object.values(DELIVERY_PROVIDERS).map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => onProviderChange(p.key)}
                    className={`flex-1 border rounded-xl py-3 text-sm font-medium transition ${form.providerKey === p.key ? "border-honey bg-honey/10 text-ink" : "border-ink/15 text-ink/60"}`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>

              <div className="relative">
                <label className="label">Місто</label>
                <input
                  className="input"
                  value={cityQuery}
                  onChange={(e) => {
                    setCityQuery(e.target.value);
                    setForm((f) => ({ ...f, city: null, branch: null }));
                  }}
                  placeholder="Почніть вводити назву міста"
                />
                {cityOptions.length > 0 && (
                  <div className="absolute z-10 bg-white border border-ink/10 rounded-xl mt-1 w-full shadow-soft max-h-48 overflow-auto">
                    {cityOptions.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => pickCity(c)}
                        className="block w-full text-left px-4 py-2 text-sm hover:bg-cream"
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {form.city && (
                <div>
                  <label className="label">Відділення / поштомат</label>
                  {loadingBranches ? (
                    <div className="text-sm text-ink/50 py-2">Завантаження відділень...</div>
                  ) : (
                    <select
                      className="input"
                      value={form.branch?.id || ""}
                      onChange={(e) => pickBranch(e.target.value)}
                    >
                      <option value="">Оберіть відділення</option>
                      {branchOptions.map((b) => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              <div>
                <label className="label">Коментар до замовлення (необов'язково)</label>
                <textarea className="input" rows={3} value={form.comment} onChange={set("comment")} placeholder="Потрібно до п'ятниці" />
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(1)} className="btn-secondary">Назад</button>
                <button type="button" disabled={!step2Valid} onClick={() => setStep(3)} className="btn-primary disabled:opacity-40">Далі до оплати</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, paymentMethod: "cod" }))}
                  className={`border rounded-xl p-4 text-left transition ${form.paymentMethod === "cod" ? "border-honey bg-honey/10" : "border-ink/15"}`}
                >
                  <div className="font-medium text-ink">💵 При отриманні</div>
                  <div className="text-xs text-ink/50 mt-1">Накладений платіж</div>
                </button>
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, paymentMethod: "card" }))}
                  className={`border rounded-xl p-4 text-left transition ${form.paymentMethod === "card" ? "border-honey bg-honey/10" : "border-ink/15"}`}
                >
                  <div className="font-medium text-ink">💳 Оплата на картку</div>
                  <div className="text-xs text-ink/50 mt-1">Після підтвердження замовлення</div>
                </button>
              </div>

              {form.paymentMethod === "card" && (
                <div className="card p-5 bg-cream/60">
                  <div className="text-sm text-ink/60 mb-1">{settings?.payment?.bank}</div>
                  <div className="flex items-center gap-3">
                    <span className="font-serif font-bold text-lg tracking-wider">{settings?.payment?.card}</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (settings?.payment?.card) {
                          navigator.clipboard?.writeText(settings.payment.card);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 1500);
                        }
                      }}
                      className="text-xs px-3 py-1.5 rounded-full bg-white border border-ink/15 hover:border-honey"
                    >
                      {copied ? "Скопійовано ✓" : "Copy"}
                    </button>
                  </div>
                  <div className="text-sm text-ink/60 mt-1">{settings?.payment?.holder}</div>
                  <p className="text-xs text-ink/50 mt-3">{settings?.payment?.instruction}</p>

                  <div className="mt-4">
                    <label className="label">Завантажте фото чека</label>
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp,.pdf"
                      onChange={onReceipt}
                      className="text-sm"
                      disabled={uploadingReceipt}
                    />
                    {uploadingReceipt && <div className="text-xs text-honey mt-2">Завантаження чека на сервер...</div>}
                    {form.receiptUrl && !uploadingReceipt && (
                      <div className="text-xs text-leaf mt-2">✓ Чек {form.receiptName} успішно завантажено</div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(2)} className="btn-secondary">Назад</button>
                <button
                  type="button"
                  onClick={submitOrder}
                  disabled={submitting || uploadingReceipt || (form.paymentMethod === "card" && !form.receiptUrl)}
                  className="btn-primary flex-1 disabled:opacity-40"
                >
                  {submitting ? "Оформлюємо..." : "Підтвердити замовлення"}
                </button>
              </div>
              {form.paymentMethod === "card" && !form.receiptUrl && (
                <p className="text-xs text-ink/40">Завантажте фото чека, щоб підтвердити оплату карткою — або оберіть оплату при отриманні.</p>
              )}
            </div>
          )}
        </div>

        <div className="card p-6 h-fit sticky top-24">
          <h3 className="font-semibold text-ink mb-4">Ваше замовлення</h3>
          <div className="space-y-2 text-sm">
            {items.map((i) => (
              <div key={i.id} className="flex justify-between text-ink/70">
                <span className="line-clamp-1">{i.name} × {i.qty}</span>
                <span>{i.price * i.qty} грн</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between font-serif text-xl font-bold text-ink border-t border-ink/10 pt-3 mt-3">
            <span>Разом:</span><span>{subtotal} грн</span>
          </div>
        </div>
      </div>
    </div>
  );
}
