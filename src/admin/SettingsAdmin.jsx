import { useEffect, useState } from "react";
import { Auth, Settings, Telegram, Backups } from "../data/db";

const TABS = [
  { id: "store", label: "Магазин", icon: "🏪" },
  { id: "payment", label: "Оплата", icon: "💳" },
  { id: "delivery", label: "Доставка", icon: "🚚" },
  { id: "telegram", label: "Telegram", icon: "💬" },
  { id: "backup", label: "Резервні копії", icon: "💾" },
  { id: "about", label: "Про нас", icon: "🌿" },
  { id: "contacts", label: "Контакти", icon: "📞" },
  { id: "security", label: "Безпека", icon: "🔒" },
];

export default function SettingsAdmin() {
  const [activeTab, setActiveTab] = useState("store");
  const [settings, setSettings] = useState(() => Settings.get());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Telegram test state
  const [testingTg, setTestingTg] = useState(false);
  const [tgTestResult, setTgTestResult] = useState(null);

  // Telegram recipients & start flow state
  const [recipients, setRecipients] = useState([]);
  const [recipientsLoading, setRecipientsLoading] = useState(false);
  const [recentChats, setRecentChats] = useState([]);
  const [recipientModalOpen, setRecipientModalOpen] = useState(false);
  const [editingRecipient, setEditingRecipient] = useState(null);
  const [recipientForm, setRecipientForm] = useState({
    name: "",
    username: "",
    chat_id: "",
    role: "manager",
    is_active: true,
  });
  const [recipientActionLoading, setRecipientActionLoading] = useState("");
  const [recipientToast, setRecipientToast] = useState(null);

  const loadRecipientsData = () => {
    setRecipientsLoading(true);
    Promise.allSettled([
      Telegram.getRecipients(),
      Telegram.getRecentChats(10),
    ])
      .then(([recs, chats]) => {
        if (recs.status === "fulfilled" && Array.isArray(recs.value)) {
          setRecipients(recs.value);
        }
        if (chats.status === "fulfilled" && Array.isArray(chats.value)) {
          setRecentChats(chats.value);
        }
      })
      .catch((err) => console.error("Error loading recipients:", err))
      .finally(() => setRecipientsLoading(false));
  };

  useEffect(() => {
    if (activeTab === "telegram") {
      loadRecipientsData();
    }
  }, [activeTab]);

  const showRecipientToast = (message, isError = false) => {
    setRecipientToast({ message, isError });
    setTimeout(() => setRecipientToast(null), 4000);
  };

  const handleOpenAddRecipient = (prefill = null) => {
    setEditingRecipient(null);
    setRecipientForm({
      name: prefill?.displayName || prefill?.first_name || "",
      username: prefill?.username || "",
      chat_id: prefill?.chat_id || "",
      role: "manager",
      is_active: true,
    });
    setRecipientModalOpen(true);
  };

  const handleOpenEditRecipient = (r) => {
    setEditingRecipient(r);
    setRecipientForm({
      name: r.name,
      username: r.username || "",
      chat_id: r.chat_id,
      role: r.role || "manager",
      is_active: r.is_active,
    });
    setRecipientModalOpen(true);
  };

  const handleSaveRecipientModal = async (e) => {
    if (e) e.preventDefault();
    if (!recipientForm.name.trim()) {
      showRecipientToast("Вкажіть ім'я отримувача", true);
      return;
    }
    if (!recipientForm.chat_id.trim()) {
      showRecipientToast("Вкажіть Telegram Chat ID", true);
      return;
    }

    setRecipientActionLoading("saving_modal");
    try {
      if (editingRecipient) {
        await Telegram.updateRecipient(editingRecipient.id, recipientForm);
        showRecipientToast("Отримувача успішно оновлено!");
      } else {
        await Telegram.createRecipient(recipientForm);
        showRecipientToast("Отримувача успішно додано!");
      }
      setRecipientModalOpen(false);
      loadRecipientsData();
    } catch (err) {
      showRecipientToast(err.message || "Помилка збереження", true);
    } finally {
      setRecipientActionLoading("");
    }
  };

  const handleToggleRecipient = async (r) => {
    setRecipientActionLoading(`toggle_${r.id}`);
    try {
      await Telegram.toggleRecipient(r.id);
      showRecipientToast(`Отримувача «${r.name}» ${r.is_active ? "деактивовано" : "активовано"}!`);
      loadRecipientsData();
    } catch (err) {
      showRecipientToast(err.message || "Помилка зміни статусу", true);
    } finally {
      setRecipientActionLoading("");
    }
  };

  const handleDeleteRecipient = async (r) => {
    if (!window.confirm(`Видалити отримувача «${r.name}» (${r.chat_id})?`)) return;
    setRecipientActionLoading(`delete_${r.id}`);
    try {
      await Telegram.deleteRecipient(r.id);
      showRecipientToast(`Отримувача «${r.name}» видалено!`);
      loadRecipientsData();
    } catch (err) {
      showRecipientToast(err.message || "Помилка видалення", true);
    } finally {
      setRecipientActionLoading("");
    }
  };

  const handleTestRecipient = async (r) => {
    setRecipientActionLoading(`test_${r.id}`);
    try {
      const res = await Telegram.testRecipient(r.id);
      showRecipientToast(res.message || `Тестове сповіщення для ${r.name} надіслано!`);
    } catch (err) {
      showRecipientToast(err.message || "Помилка надсилання тестового сповіщення", true);
    } finally {
      setRecipientActionLoading("");
    }
  };

  const loadSettings = () => {
    setLoading(true);
    Settings.fetchAdmin()
      .then((s) => {
        if (s) setSettings(s);
      })
      .catch((err) => {
        console.error("Error fetching admin settings:", err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const setPath = (path) => (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setSettings((s) => {
      const next = structuredClone(s || {});
      const keys = path.split(".");
      let ref = next;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!ref[keys[i]]) ref[keys[i]] = {};
        ref = ref[keys[i]];
      }
      ref[keys[keys.length - 1]] = value;
      return next;
    });
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    try {
      await Settings.save(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setErrorMsg("Не вдалося зберегти налаштування: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const runTelegramTest = async () => {
    setTestingTg(true);
    setTgTestResult(null);
    try {
      const token = settings?.telegram?.botToken;
      const res = await Telegram.testConnection({ botToken: token });
      setTgTestResult({
        success: Boolean(res.ok),
        message: res.message || (res.ok ? "Тест підключення успішний!" : (res.error || "Помилка підключення")),
        botName: res.botName,
        botUsername: res.botUsername,
      });
      if (res.ok) {
        setSettings((s) => ({
          ...s,
          telegram: {
            ...(s?.telegram || {}),
            status: "connected",
            botUsername: res.botUsername,
          },
        }));
      }
    } catch (err) {
      setTgTestResult({
        success: false,
        message: err.message || "Помилка тестування підключення до Telegram",
      });
    } finally {
      setTestingTg(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl md:text-3xl font-bold text-ink">
          Налаштування системи
        </h1>
        <p className="text-xs text-ink/50 mt-1">
          Керування параметрами магазину, реквізитами, сповіщеннями та безпекою
        </p>
      </div>

      {/* Tabs navigation - horizontally scrollable for mobile */}
      <div className="flex gap-1.5 p-1.5 bg-cream/50 rounded-2xl border border-ink/5 overflow-x-auto no-scrollbar scroll-smooth">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs md:text-sm font-medium whitespace-nowrap shrink-0 min-h-[44px] transition-all ${
              activeTab === tab.id
                ? "bg-white text-ink shadow-xs font-semibold"
                : "text-ink/65 hover:text-ink hover:bg-white/50"
            }`}
          >
            <span className="text-base">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Status banners */}
      {saved && (
        <div className="p-3.5 rounded-xl bg-leaf/10 border border-leaf/20 text-leaf text-sm font-medium flex items-center gap-2 animate-fade-in">
          <span>✓</span> Зміни успішно збережено на сервері!
        </div>
      )}
      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-medium flex items-center gap-2 animate-fade-in">
          <span>⚠️</span> {errorMsg}
        </div>
      )}

      {loading && !settings ? (
        <div className="py-12 text-center text-ink/40">
          <div className="inline-block animate-spin mr-2">⏳</div> Завантаження налаштувань...
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          {/* TAB 1: STORE */}
          {activeTab === "store" && (
            <section className="card p-5 sm:p-6 space-y-5 animate-fade-in">
              <div className="flex items-center gap-2 pb-3 border-b border-ink/5">
                <span className="text-2xl">🏪</span>
                <div>
                  <h2 className="font-serif text-lg font-bold text-ink">Дані магазину</h2>
                  <p className="text-xs text-ink/50">
                    Основна інформація про магазин, слоган, контакти та позиціонування
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field
                  label="Назва магазину"
                  value={settings?.store?.name ?? "Honey Pasika"}
                  onChange={setPath("store.name")}
                  placeholder="Honey Pasika"
                  required
                />
                <Field
                  label="Бейдж / статус"
                  value={settings?.store?.badge ?? "100% натуральний продукт"}
                  onChange={setPath("store.badge")}
                  placeholder="100% натуральний продукт"
                />
              </div>

              <div>
                <Field
                  label="Слоган / короткий опис"
                  value={settings?.store?.description ?? settings?.store?.tagline ?? "Натуральний мед та продукти бджільництва з родинної пасіки на Прикарпатті."}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSettings((s) => {
                      const next = structuredClone(s || {});
                      if (!next.store) next.store = {};
                      next.store.description = val;
                      next.store.tagline = val;
                      return next;
                    });
                  }}
                  placeholder="Короткий слоган магазину..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field
                  label="Основний телефон магазину"
                  value={settings?.store?.phone ?? settings?.contacts?.phone ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSettings((s) => {
                      const next = structuredClone(s || {});
                      if (!next.store) next.store = {};
                      if (!next.contacts) next.contacts = {};
                      next.store.phone = val;
                      next.contacts.phone = val;
                      return next;
                    });
                  }}
                  placeholder="+380 67 835 23 11"
                />
                <Field
                  label="Email магазину"
                  value={settings?.store?.email ?? settings?.contacts?.email ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSettings((s) => {
                      const next = structuredClone(s || {});
                      if (!next.store) next.store = {};
                      if (!next.contacts) next.contacts = {};
                      next.store.email = val;
                      next.contacts.email = val;
                      return next;
                    });
                  }}
                  placeholder="hello@pasika-honey.ua"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field
                  label="Графік роботи"
                  value={settings?.store?.workingHours ?? "Пн-Нд 09:00 - 20:00"}
                  onChange={setPath("store.workingHours")}
                  placeholder="Пн-Нд 09:00 - 20:00"
                />
                <Field
                  label="Розташування пасіки"
                  value={settings?.store?.location ?? "Прикарпаття, с. Новоселиця, Снятинський район"}
                  onChange={setPath("store.location")}
                  placeholder="Прикарпаття, с. Новоселиця"
                />
              </div>
            </section>
          )}

          {/* TAB 2: PAYMENT */}
          {activeTab === "payment" && (
            <section className="card p-5 sm:p-6 space-y-5 animate-fade-in">
              <div className="flex items-center gap-2 pb-3 border-b border-ink/5">
                <span className="text-2xl">💳</span>
                <div>
                  <h2 className="font-serif text-lg font-bold text-ink">Реквізити для оплати</h2>
                  <p className="text-xs text-ink/50">
                    Єдине джерело банківських реквізитів для оформлення замовлення (Checkout)
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed">
                ℹ️ <strong>Єдине джерело даних:</strong> клієнт бачить саме ці реквізити при виборі оплати зараз на картку або IBAN. Не залишайте тестових даних.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field
                  label="Отримувач платежу (ПІБ або ФОП) *"
                  value={settings?.payment?.holder || ""}
                  onChange={setPath("payment.holder")}
                  placeholder="Олена Петріна"
                  required
                />
                <Field
                  label="Номер картки або IBAN *"
                  value={settings?.payment?.card || ""}
                  onChange={setPath("payment.card")}
                  placeholder="4441 1111 2222 3333 або UA..."
                  required
                />
                <Field
                  label="Банк отримувача"
                  value={settings?.payment?.bank || ""}
                  onChange={setPath("payment.bank")}
                  placeholder="monobank"
                />
                <Field
                  label="Призначення платежу"
                  value={settings?.payment?.purpose || ""}
                  onChange={setPath("payment.purpose")}
                  placeholder="Оплата замовлення"
                />
              </div>

              <div>
                <label className="label text-xs sm:text-sm font-semibold">Додаткова інструкція покупцю</label>
                <textarea
                  rows={3}
                  value={settings?.payment?.instruction || ""}
                  onChange={setPath("payment.instruction")}
                  placeholder="Після оплати завантажте фото або файл чека — ми підтвердимо замовлення."
                  className="input text-base sm:text-sm min-h-[44px]"
                />
              </div>
            </section>
          )}

          {/* TAB 3: DELIVERY */}
          {activeTab === "delivery" && (
            <section className="card p-5 sm:p-6 space-y-5 animate-fade-in">
              <div className="flex items-center gap-2 pb-3 border-b border-ink/5">
                <span className="text-2xl">🚚</span>
                <div>
                  <h2 className="font-serif text-lg font-bold text-ink">Доставка</h2>
                  <p className="text-xs text-ink/50">
                    Умови та налаштування доставки через Нову пошту, Укрпошту та Самовивіз
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-leaf/10 border border-leaf/20 text-xs text-ink/80 leading-relaxed">
                ✓ <strong>Зручна доставка:</strong> покупець обирає перевізника, вводить місто та відділення без жодних блокуючих API-перевірок.
              </div>

              <div className="space-y-4">
                <Field
                  label="Термін відправлення"
                  value={settings?.delivery?.dispatchTime || "Відправка щодня з понеділка по суботу"}
                  onChange={setPath("delivery.dispatchTime")}
                  placeholder="Відправка протягом 24 годин"
                />
                <Field
                  label="Умови безкоштовної доставки (за бажанням)"
                  value={settings?.delivery?.freeShippingNote || "Безкоштовна доставка для замовлень від 1500 грн"}
                  onChange={setPath("delivery.freeShippingNote")}
                  placeholder="Безкоштовна доставка від..."
                />
                <div>
                  <label className="label text-xs sm:text-sm font-semibold">Інформаційний текст для сторінки доставки</label>
                  <textarea
                    rows={4}
                    value={settings?.delivery?.notes || ""}
                    onChange={setPath("delivery.notes")}
                    placeholder="Надійно упаковуємо скляні банки у захисний повітряний матеріал та картонні бокси..."
                    className="input text-base sm:text-sm min-h-[44px]"
                  />
                </div>
              </div>
            </section>
          )}

          {/* TAB 4: TELEGRAM */}
          {activeTab === "telegram" && (
            <section className="card p-5 sm:p-6 space-y-6 animate-fade-in">
              {/* Header with Title and Connection Status Badge */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-ink/5">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">💬</span>
                  <div>
                    <h2 className="font-serif text-lg font-bold text-ink">Telegram сповіщення</h2>
                    <p className="text-xs text-ink/50">
                      Автоматичне надсилання інформації про кожне нове замовлення через Telegram-бота
                    </p>
                  </div>
                </div>

                {/* Connection Status Badge */}
                <div className="self-start sm:self-auto shrink-0">
                  {settings?.telegram?.status === "connected" || tgTestResult?.success ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-leaf/15 text-leaf border border-leaf/30">
                      <span className="w-2 h-2 rounded-full bg-leaf animate-pulse" />
                      Telegram: 🟢 Підключено {settings?.telegram?.botUsername ? `(${settings.telegram.botUsername})` : ""}
                    </span>
                  ) : settings?.telegram?.status === "error" || (tgTestResult && !tgTestResult.success) ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                      Telegram: 🔴 Помилка підключення
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-ink/5 text-ink/60 border border-ink/10">
                      <span className="w-2 h-2 rounded-full bg-ink/30" />
                      Telegram: ⚪ Не налаштовано
                    </span>
                  )}
                </div>
              </div>

              {/* Bot Token & Master Toggle Card */}
              <div className="p-4 sm:p-5 bg-white rounded-2xl border border-ink/10 space-y-4 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-ink/5">
                  <div>
                    <h3 className="font-semibold text-sm text-ink">Статус Telegram інтеграції</h3>
                    <p className="text-xs text-ink/60">
                      Увімкніть, щоб система автоматично розсилала повідомлення активним отримувачам
                    </p>
                  </div>
                  <label className="inline-flex items-center gap-3 cursor-pointer min-h-[44px]">
                    <input
                      type="checkbox"
                      checked={settings?.telegram?.enabled ?? true}
                      onChange={setPath("telegram.enabled")}
                      className="sr-only peer"
                    />
                    <div className="relative w-12 h-6 bg-ink/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-ink/20 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-leaf"></div>
                    <span className="text-xs font-bold text-ink">
                      {settings?.telegram?.enabled ? "Увімкнено" : "Вимкнено"}
                    </span>
                  </label>
                </div>

                {/* Token input & Check Connection */}
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <label className="label text-xs sm:text-sm font-semibold">
                        Telegram Bot Token
                      </label>
                      <input
                        type="password"
                        value={settings?.telegram?.botToken || ""}
                        onChange={setPath("telegram.botToken")}
                        placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ..."
                        className="input font-mono text-base sm:text-xs min-h-[44px]"
                      />
                      <p className="text-[11px] text-ink/50 mt-1">
                        🔒 Токен надійно зберігається на сервері. Отримайте його в боті{" "}
                        <a
                          href="https://t.me/BotFather"
                          target="_blank"
                          rel="noreferrer"
                          className="text-honey font-semibold hover:underline"
                        >
                          @BotFather ↗
                        </a>
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={runTelegramTest}
                      disabled={testingTg}
                      className="btn-secondary text-xs py-2.5 px-4 min-h-[44px] shrink-0 font-bold inline-flex items-center gap-1.5"
                    >
                      {testingTg ? "⏳ Перевірка..." : "🔌 Перевірити підключення"}
                    </button>
                  </div>

                  {tgTestResult && (
                    <div
                      className={`mt-3 p-3.5 rounded-xl text-xs font-medium border ${
                        tgTestResult.success
                          ? "bg-leaf/10 border-leaf/20 text-leaf"
                          : "bg-red-50 border-red-200 text-red-600"
                      }`}
                    >
                      {tgTestResult.success ? (
                        <div>
                          <strong>✓ Успіх!</strong> {tgTestResult.message}
                          {tgTestResult.botName && (
                            <div className="mt-0.5 text-ink/70">
                              Бот: <strong>{tgTestResult.botName}</strong> ({tgTestResult.botUsername})
                            </div>
                          )}
                        </div>
                      ) : (
                        <div>
                          <strong>⚠️ Помилка:</strong> {tgTestResult.message}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Start Flow & Help Banner */}
              <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/60 border border-amber-200/70 text-xs text-amber-950 space-y-2.5">
                <div className="flex items-center gap-2 font-bold text-sm text-amber-900">
                  <span>🤖</span>
                  <span>Як підключити нового отримувача сповіщень:</span>
                </div>
                <ol className="list-decimal list-inside space-y-1.5 leading-relaxed text-amber-900/90 pl-1">
                  <li>
                    Відкрийте вашого бота в додатку Telegram:{" "}
                    {settings?.telegram?.botUsername ? (
                      <a
                        href={`https://t.me/${settings.telegram.botUsername.replace(/^@/, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-bold underline text-amber-950"
                      >
                        {settings.telegram.botUsername} ↗
                      </a>
                    ) : (
                      <span className="font-semibold">(потрібно спершу зберегти токен бота)</span>
                    )}
                  </li>
                  <li>Натисніть кнопку <strong>«Start»</strong> (<code className="bg-amber-100/80 px-1 py-0.5 rounded font-mono">/start</code>).</li>
                  <li>Бот надішле у відповідь ваш унікальний числовий <strong>Chat ID</strong>.</li>
                  <li>Натисніть кнопку <strong>«+ Додати отримувача»</strong> нижче та вставте скопійований Chat ID (або скористайтесь списком звернень).</li>
                </ol>

                {/* Recent /start Interactions Panel (if any captured) */}
                {recentChats.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-amber-200/80">
                    <div className="font-bold text-[11px] uppercase tracking-wider text-amber-900 mb-2">
                      🕒 Останні звернення до бота через /start:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {recentChats.map((chat) => (
                        <div
                          key={chat.chat_id}
                          className="flex items-center gap-2 p-2 rounded-xl bg-white border border-amber-300/80 text-xs shadow-2xs"
                        >
                          <div>
                            <div className="font-bold text-ink">
                              {chat.displayName}
                            </div>
                            <div className="text-[11px] font-mono text-ink/50">
                              ID: {chat.chat_id} {chat.username ? `(${chat.username})` : ""}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleOpenAddRecipient(chat)}
                            className="btn-primary text-[11px] py-1.5 px-2.5 min-h-[36px] font-bold"
                          >
                            + Додати
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* RECIPIENTS SECTION */}
              <div className="space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif font-bold text-base sm:text-lg text-ink">
                      Отримувачі сповіщень
                    </h3>
                    <span className="badge bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold">
                      {recipients.filter((r) => r.is_active).length} активних
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenAddRecipient()}
                    className="btn-primary text-xs py-2.5 px-4 min-h-[44px] font-bold inline-flex items-center justify-center gap-1.5 shadow-2xs self-start sm:self-auto"
                  >
                    <span>➕</span> Додати отримувача
                  </button>
                </div>

                {recipientsLoading && recipients.length === 0 ? (
                  <div className="p-8 text-center text-xs text-ink/50">
                    Завантаження списку отримувачів...
                  </div>
                ) : recipients.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl bg-cream/40 border border-dashed border-ink/15 text-xs text-ink/60 space-y-2">
                    <div className="text-3xl">📭</div>
                    <div className="font-bold text-sm text-ink">Отримувачів ще не налаштовано</div>
                    <p className="max-w-md mx-auto">
                      Додайте власницю або менеджерів пасіки, щоб вони автоматично отримували деталі нових замовлень.
                    </p>
                    <button
                      type="button"
                      onClick={() => handleOpenAddRecipient()}
                      className="btn-secondary text-xs py-2 px-3.5 min-h-[44px] font-semibold mt-1"
                    >
                      + Додати першого отримувача
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Desktop Table (hidden md:block) */}
                    <div className="hidden md:block overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-2xs">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#FAF6EE] text-ink/70 font-semibold border-b border-ink/10">
                          <tr>
                            <th className="py-3 px-4">Ім'я</th>
                            <th className="py-3 px-3">Username</th>
                            <th className="py-3 px-3">Chat ID</th>
                            <th className="py-3 px-3">Роль</th>
                            <th className="py-3 px-3 text-center">Статус</th>
                            <th className="py-3 px-4 text-right">Дії</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-ink/5">
                          {recipients.map((r) => {
                            const isActionRunning = recipientActionLoading.includes(r.id);
                            return (
                              <tr key={r.id} className="hover:bg-cream/20 transition-colors">
                                <td className="py-3.5 px-4 font-bold text-ink">
                                  {r.name}
                                </td>
                                <td className="py-3.5 px-3 font-mono text-ink/65">
                                  {r.username ? (
                                    <a
                                      href={`https://t.me/${r.username.replace(/^@/, "")}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-honey hover:underline font-semibold"
                                    >
                                      {r.username}
                                    </a>
                                  ) : (
                                    "—"
                                  )}
                                </td>
                                <td className="py-3.5 px-3">
                                  <code className="bg-cream/80 px-2 py-1 rounded font-mono text-[11px] border border-ink/10 text-ink">
                                    {r.chat_id}
                                  </code>
                                </td>
                                <td className="py-3.5 px-3">
                                  {r.role === "owner" && (
                                    <span className="badge bg-amber-100 text-amber-900 border border-amber-300 font-bold text-[11px]">
                                      👑 Власник
                                    </span>
                                  )}
                                  {r.role === "admin" && (
                                    <span className="badge bg-blue-100 text-blue-900 border border-blue-300 font-semibold text-[11px]">
                                      🛡️ Адмін
                                    </span>
                                  )}
                                  {r.role === "manager" && (
                                    <span className="badge bg-cream text-ink/80 border border-ink/10 font-medium text-[11px]">
                                      👤 Менеджер
                                    </span>
                                  )}
                                </td>
                                <td className="py-3.5 px-3 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleToggleRecipient(r)}
                                    disabled={isActionRunning}
                                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all ${
                                      r.is_active
                                        ? "bg-leaf/10 text-leaf border-leaf/30 hover:bg-leaf/20"
                                        : "bg-ink/5 text-ink/40 border-ink/10 hover:bg-ink/10"
                                    }`}
                                  >
                                    {r.is_active ? "🟢 Активний" : "⚪ Вимкнено"}
                                  </button>
                                </td>
                                <td className="py-3.5 px-4 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => handleTestRecipient(r)}
                                      disabled={isActionRunning}
                                      title="Надіслати тестове повідомлення"
                                      className="p-1.5 rounded-lg bg-cream hover:bg-amber-100 text-ink/80 hover:text-amber-900 border border-ink/10 transition-colors disabled:opacity-50"
                                    >
                                      ✉️ Тест
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEditRecipient(r)}
                                      disabled={isActionRunning}
                                      title="Редагувати"
                                      className="p-1.5 rounded-lg bg-cream hover:bg-amber-100 text-ink/80 hover:text-amber-900 border border-ink/10 transition-colors disabled:opacity-50"
                                    >
                                      ✏️
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteRecipient(r)}
                                      disabled={isActionRunning}
                                      title="Видалити"
                                      className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition-colors disabled:opacity-50"
                                    >
                                      🗑️
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile Cards (md:hidden) */}
                    <div className="md:hidden space-y-3">
                      {recipients.map((r) => {
                        const isActionRunning = recipientActionLoading.includes(r.id);
                        return (
                          <div
                            key={r.id}
                            className="card p-4 bg-white border border-ink/10 shadow-2xs space-y-3"
                          >
                            <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-ink/5">
                              <div>
                                <h4 className="font-bold text-sm text-ink">{r.name}</h4>
                                <div className="text-xs font-mono text-ink/50 mt-0.5">
                                  ID: {r.chat_id}
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                {r.role === "owner" && (
                                  <span className="badge bg-amber-100 text-amber-900 border border-amber-300 font-bold text-[10px]">
                                    👑 Власник
                                  </span>
                                )}
                                {r.role === "admin" && (
                                  <span className="badge bg-blue-100 text-blue-900 border border-blue-300 font-semibold text-[10px]">
                                    🛡️ Адмін
                                  </span>
                                )}
                                {r.role === "manager" && (
                                  <span className="badge bg-cream text-ink/80 border border-ink/10 font-medium text-[10px]">
                                    👤 Менеджер
                                  </span>
                                )}
                                <span
                                  className={`text-[10px] font-bold ${
                                    r.is_active ? "text-leaf" : "text-ink/40"
                                  }`}
                                >
                                  {r.is_active ? "🟢 Активний" : "⚪ Вимкнено"}
                                </span>
                              </div>
                            </div>

                            {r.username && (
                              <div className="text-xs text-ink/70">
                                Username:{" "}
                                <a
                                  href={`https://t.me/${r.username.replace(/^@/, "")}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-honey font-bold hover:underline"
                                >
                                  {r.username}
                                </a>
                              </div>
                            )}

                            {/* Mobile Touch Action Buttons (>= 44px) */}
                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-ink/5">
                              <button
                                type="button"
                                onClick={() => handleTestRecipient(r)}
                                disabled={isActionRunning}
                                className="btn-secondary text-xs py-2 px-3 min-h-[44px] font-semibold flex items-center justify-center gap-1 disabled:opacity-50"
                              >
                                <span>✉️</span> Тест
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenEditRecipient(r)}
                                disabled={isActionRunning}
                                className="btn-secondary text-xs py-2 px-3 min-h-[44px] font-semibold flex items-center justify-center gap-1 disabled:opacity-50"
                              >
                                <span>✏️</span> Редагувати
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleRecipient(r)}
                                disabled={isActionRunning}
                                className={`text-xs py-2 px-3 min-h-[44px] font-semibold rounded-xl border flex items-center justify-center gap-1 transition-colors ${
                                  r.is_active
                                    ? "bg-cream text-ink/70 border-ink/10 hover:bg-cream/80"
                                    : "bg-leaf/10 text-leaf border-leaf/30 hover:bg-leaf/20"
                                }`}
                              >
                                <span>🔘</span> {r.is_active ? "Вимкнути" : "Увімкнути"}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteRecipient(r)}
                                disabled={isActionRunning}
                                className="text-xs py-2 px-3 min-h-[44px] font-semibold rounded-xl bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 flex items-center justify-center gap-1 transition-colors disabled:opacity-50"
                              >
                                <span>🗑️</span> Видалити
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </section>
          )}

          {/* TAB 5: ABOUT */}
          {activeTab === "about" && (
            <section className="card p-5 sm:p-6 space-y-5 animate-fade-in">
              <div className="flex items-center gap-2 pb-3 border-b border-ink/5">
                <span className="text-2xl">🌿</span>
                <div>
                  <h2 className="font-serif text-lg font-bold text-ink">Про нашу пасіку</h2>
                  <p className="text-xs text-ink/50">
                    Тексти та історія, що реально використовуються на сторінці «Про нас» та головній
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <Field
                  label="Головний заголовок блоку"
                  value={settings?.about?.title ?? "Родинна пасіка в серці Прикарпаття"}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSettings((s) => {
                      const next = structuredClone(s || {});
                      if (!next.about) next.about = {};
                      next.about.title = val;
                      return next;
                    });
                  }}
                  placeholder="Родинна пасіка в серці Прикарпаття"
                />

                <div>
                  <label className="label text-xs sm:text-sm font-semibold">Основний текст / вступний слоган</label>
                  <textarea
                    rows={2}
                    value={settings?.about?.shortText ?? settings?.about?.lead ?? "Ми пасічники і дуже любимо родинну справу. Знаходимось на Прикарпатті, в селі Новоселиця Снятинського району."}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSettings((s) => {
                        const next = structuredClone(s || {});
                        if (!next.about) next.about = {};
                        next.about.shortText = val;
                        next.about.lead = val;
                        return next;
                      });
                    }}
                    placeholder="Короткий вступний абзац..."
                    className="input text-base sm:text-sm min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="label text-xs sm:text-sm font-semibold">Опис пасіки / повна історія</label>
                  <textarea
                    rows={6}
                    value={settings?.about?.fullDescription ?? settings?.about?.story ?? "Перший наш вулик з'явився 10 років назад, а сьогодні на нашій пасіці налічується понад 100 вуликів. З того часу любов до бджільництва виросла у власне сімейне виробництво натурального меду найвищої якості."}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSettings((s) => {
                        const next = structuredClone(s || {});
                        if (!next.about) next.about = {};
                        next.about.fullDescription = val;
                        next.about.story = val;
                        return next;
                      });
                    }}
                    placeholder="Детальний опис пасіки, традицій та цінностей..."
                    className="input text-base sm:text-sm min-h-[44px]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <Field
                    label="Кількість вуликів"
                    value={settings?.about?.hivesCount ?? settings?.about?.stats?.hives ?? "100+"}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSettings((s) => {
                        const next = structuredClone(s || {});
                        if (!next.about) next.about = {};
                        next.about.hivesCount = val;
                        if (!next.about.stats) next.about.stats = {};
                        next.about.stats.hives = val;
                        return next;
                      });
                    }}
                    placeholder="100+"
                  />
                  <Field
                    label="Роки / історія (років досвіду)"
                    value={settings?.about?.foundationYear ?? settings?.about?.stats?.years ?? "10"}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSettings((s) => {
                        const next = structuredClone(s || {});
                        if (!next.about) next.about = {};
                        next.about.foundationYear = val;
                        if (!next.about.stats) next.about.stats = {};
                        next.about.stats.years = val;
                        return next;
                      });
                    }}
                    placeholder="10"
                  />
                  <Field
                    label="Локація пасіки"
                    value={settings?.about?.location ?? "с. Новоселиця, Івано-Франківська обл."}
                    onChange={setPath("about.location")}
                    placeholder="с. Новоселиця, Івано-Франківська обл."
                  />
                </div>
              </div>
            </section>
          )}

          {/* TAB 6: CONTACTS & PICKUP */}
          {activeTab === "contacts" && (
            <section className="card p-5 sm:p-6 space-y-6 animate-fade-in">
              <div className="flex items-center gap-2 pb-3 border-b border-ink/5">
                <span className="text-2xl">📞</span>
                <div>
                  <h2 className="font-serif text-lg font-bold text-ink">Контакти та Самовивіз</h2>
                  <p className="text-xs text-ink/50">
                    Канали зв'язку, соціальні мережі та точка самовивозу з координатами карти
                  </p>
                </div>
              </div>

              {/* SECTION A: COMMUNICATIONS */}
              <div className="space-y-3">
                <h3 className="text-xs uppercase font-bold tracking-wider text-honey">
                  Контактні канали (Header, Footer, Contacts)
                </h3>
                <p className="text-xs text-ink/60">
                  Якщо поле порожнє — відповідний елемент на сайті не показуватиметься.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field
                    label="Телефон"
                    value={settings?.contacts?.phone || ""}
                    onChange={setPath("contacts.phone")}
                    placeholder="+380 67 835 23 11"
                  />
                  <Field
                    label="Email"
                    value={settings?.contacts?.email || ""}
                    onChange={setPath("contacts.email")}
                    placeholder="hello@pasika-honey.ua"
                  />
                  <Field
                    label="Telegram (@username або посилання)"
                    value={settings?.contacts?.telegram || ""}
                    onChange={setPath("contacts.telegram")}
                    placeholder="@pasika_honey"
                  />
                  <Field
                    label="Viber (номер або чат)"
                    value={settings?.contacts?.viber || ""}
                    onChange={setPath("contacts.viber")}
                    placeholder="+380 67 835 23 11"
                  />
                  <Field
                    label="Instagram (@профіль або посилання)"
                    value={settings?.contacts?.instagram || ""}
                    onChange={setPath("contacts.instagram")}
                    placeholder="@honey_pasika"
                  />
                  <Field
                    label="Facebook (профіль або сторінка)"
                    value={settings?.contacts?.facebook || ""}
                    onChange={setPath("contacts.facebook")}
                    placeholder="https://facebook.com/..."
                  />
                  <Field
                    label="TikTok (@профіль або посилання)"
                    value={settings?.contacts?.tiktok || ""}
                    onChange={setPath("contacts.tiktok")}
                    placeholder="@honey.dsv"
                  />
                </div>
              </div>

              {/* SECTION B: PICKUP ADDRESS & COORDINATES */}
              <div className="pt-4 border-t border-ink/10 space-y-4">
                <div>
                  <h3 className="text-xs uppercase font-bold tracking-wider text-honey flex items-center gap-1.5">
                    <span>📍</span> Самовивіз та геолокація
                  </h3>
                  <p className="text-xs text-ink/60 mt-0.5">
                    Якщо вказана адреса — на сайті з'являється блок самовивозу. Кнопка «Відкрити на карті» з'явиться лише при наявності координат.
                  </p>
                </div>

                <div>
                  <Field
                    label="Адреса самовивозу"
                    value={settings?.contacts?.pickupAddress || ""}
                    onChange={setPath("contacts.pickupAddress")}
                    placeholder="Прикарпаття, с. Новоселиця, Снятинський район"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field
                    label="Широта (Latitude, напр. 48.4523)"
                    value={settings?.contacts?.pickupLat || ""}
                    onChange={setPath("contacts.pickupLat")}
                    placeholder="48.4523"
                  />
                  <Field
                    label="Довгота (Longitude, напр. 25.5684)"
                    value={settings?.contacts?.pickupLng || ""}
                    onChange={setPath("contacts.pickupLng")}
                    placeholder="25.5684"
                  />
                </div>

                {/* Helper buttons to set coordinates conveniently */}
                <div className="p-3.5 rounded-2xl bg-cream/40 border border-ink/10 flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-semibold text-ink/70">Швидкі дії:</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (!navigator.geolocation) {
                        alert("Геолокація не підтримується браузером");
                        return;
                      }
                      navigator.geolocation.getCurrentPosition(
                        (pos) => {
                          const lat = pos.coords.latitude.toFixed(6);
                          const lng = pos.coords.longitude.toFixed(6);
                          setSettings((s) => {
                            const next = structuredClone(s || {});
                            if (!next.contacts) next.contacts = {};
                            next.contacts.pickupLat = lat;
                            next.contacts.pickupLng = lng;
                            return next;
                          });
                        },
                        (err) => alert("Помилка отримання геолокації: " + err.message),
                        { timeout: 10000, enableHighAccuracy: true }
                      );
                    }}
                    className="btn-secondary text-xs py-2.5 px-3 min-h-[44px] font-semibold inline-flex items-center gap-1"
                  >
                    📍 Моя поточна точка
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSettings((s) => {
                        const next = structuredClone(s || {});
                        if (!next.contacts) next.contacts = {};
                        next.contacts.pickupAddress = "Прикарпаття, с. Новоселиця, Снятинський район";
                        next.contacts.pickupLat = "48.4523";
                        next.contacts.pickupLng = "25.5684";
                        return next;
                      });
                    }}
                    className="btn-secondary text-xs py-2.5 px-3 min-h-[44px] font-semibold inline-flex items-center gap-1"
                  >
                    🏡 с. Новоселиця (48.4523, 25.5684)
                  </button>

                  {settings?.contacts?.pickupLat && settings?.contacts?.pickupLng && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${settings.contacts.pickupLat},${settings.contacts.pickupLng}`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-primary text-xs py-2.5 px-3 min-h-[44px] font-semibold inline-flex items-center gap-1 shadow-2xs"
                    >
                      🗺️ Перевірити на карті ↗
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setSettings((s) => {
                        const next = structuredClone(s || {});
                        if (!next.contacts) next.contacts = {};
                        next.contacts.pickupLat = "";
                        next.contacts.pickupLng = "";
                        return next;
                      });
                    }}
                    className="text-xs text-red-500 hover:text-red-700 py-2 px-2 hover:bg-red-50 rounded-lg transition-colors ml-auto font-medium"
                  >
                    Очистити координати
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* TAB: BACKUP */}
          {activeTab === "backup" && (
            <BackupSection />
          )}

          {/* TAB 7: SECURITY */}
          {activeTab === "security" && (
            <SecuritySection />
          )}

          {/* Save button bar (for all tabs except security and backup which have their own forms/actions) */}
          {activeTab !== "security" && activeTab !== "backup" && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-ink/10">
              <div className="text-xs text-ink/50 text-center sm:text-left">
                Зміни набувають чинності відразу після збереження та оновлюють публічний сайт.
              </div>
              <button
                type="submit"
                disabled={saving}
                className="btn-primary text-sm py-3 px-7 shadow-sm min-h-[48px] w-full sm:w-auto flex items-center justify-center gap-2 font-bold disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <span className="inline-block animate-spin">⏳</span> Збереження...
                  </>
                ) : (
                  <>
                    <span>💾</span> Зберегти налаштування
                  </>
                )}
              </button>
            </div>
          )}
        </form>
      )}

      {/* ADD / EDIT RECIPIENT MODAL */}
      {recipientModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-xs animate-fade-in">
          <div className="card max-w-md w-full p-5 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto bg-white border border-ink/15 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-ink/10">
              <h3 className="font-serif font-bold text-lg text-ink">
                {editingRecipient ? "Редагувати отримувача" : "Додати отримувача сповіщень"}
              </h3>
              <button
                type="button"
                onClick={() => setRecipientModalOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-cream text-ink/50 hover:text-ink flex items-center justify-center text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveRecipientModal} className="space-y-4">
              <div>
                <label className="label text-xs sm:text-sm font-semibold">
                  Ім'я отримувача <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={recipientForm.name}
                  onChange={(e) => setRecipientForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Олена (Власниця) або Дмитро (Менеджер)"
                  className="input text-base sm:text-sm min-h-[44px]"
                />
              </div>

              <div>
                <label className="label text-xs sm:text-sm font-semibold">
                  Telegram Username (опціонально)
                </label>
                <input
                  type="text"
                  value={recipientForm.username}
                  onChange={(e) => setRecipientForm((f) => ({ ...f, username: e.target.value }))}
                  placeholder="@pasika_honey"
                  className="input font-mono text-base sm:text-xs min-h-[44px]"
                />
              </div>

              <div>
                <label className="label text-xs sm:text-sm font-semibold">
                  Telegram Chat ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={recipientForm.chat_id}
                  onChange={(e) => setRecipientForm((f) => ({ ...f, chat_id: e.target.value }))}
                  placeholder="123456789 або -100..."
                  className="input font-mono text-base sm:text-xs min-h-[44px]"
                />
                <p className="text-[11px] text-ink/40 mt-1">
                  Дізнайтесь свій ID, відкривши бота та натиснувши /start
                </p>
              </div>

              <div>
                <label className="label text-xs sm:text-sm font-semibold">
                  Роль
                </label>
                <select
                  value={recipientForm.role}
                  onChange={(e) => setRecipientForm((f) => ({ ...f, role: e.target.value }))}
                  className="input text-base sm:text-xs min-h-[44px]"
                >
                  <option value="owner">👑 Власниця / Власник (owner)</option>
                  <option value="manager">👤 Менеджер замовлень (manager)</option>
                  <option value="admin">🛡️ Адміністратор системи (admin)</option>
                </select>
              </div>

              <div className="flex items-center gap-3 min-h-[44px] pt-1">
                <input
                  type="checkbox"
                  id="recipient_active_checkbox"
                  checked={recipientForm.is_active}
                  onChange={(e) => setRecipientForm((f) => ({ ...f, is_active: e.target.checked }))}
                  className="w-5 h-5 text-honey rounded cursor-pointer"
                />
                <label htmlFor="recipient_active_checkbox" className="text-xs sm:text-sm font-medium text-ink cursor-pointer">
                  Активний (отримувати миттєві сповіщення про нові замовлення)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-ink/10">
                <button
                  type="button"
                  onClick={() => setRecipientModalOpen(false)}
                  className="btn-secondary text-xs py-2.5 px-4 min-h-[44px] font-semibold"
                >
                  Скасувати
                </button>
                <button
                  type="submit"
                  disabled={recipientActionLoading === "saving_modal"}
                  className="btn-primary text-xs py-2.5 px-5 min-h-[44px] font-bold shadow-2xs disabled:opacity-50"
                >
                  {recipientActionLoading === "saving_modal" ? "Збереження..." : "Зберегти"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECIPIENT TOAST FEEDBACK */}
      {recipientToast && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-xl text-xs sm:text-sm font-semibold transition-all border animate-fade-in ${
            recipientToast.isError
              ? "bg-red-600 text-white border-red-700"
              : "bg-ink text-white border-amber-500/40"
          }`}
        >
          {recipientToast.isError ? "⚠️ " : "🐝 "}
          {recipientToast.message}
        </div>
      )}
    </div>
  );
}

function BackupSection() {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const loadBackups = async () => {
    setLoading(true);
    try {
      const data = await Backups.list();
      setBackups(data?.backups || []);
    } catch (err) {
      console.error("Error loading backups:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBackups();
  }, []);

  const showNotification = (text, isError = false) => {
    setFeedback({ text, isError });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleCreate = async () => {
    setCreating(true);
    try {
      const res = await Backups.create();
      showNotification(`Резервну копію «${res.filename}» (${res.sizeFormatted || ""}) успішно створено!`);
      loadBackups();
    } catch (err) {
      showNotification("Помилка створення бекапу: " + err.message, true);
    } finally {
      setCreating(false);
    }
  };

  return (
    <section className="card p-5 sm:p-6 space-y-6 animate-fade-in border-t-4 border-honey/60">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-ink/5">
        <div className="flex items-center gap-3">
          <span className="text-3xl">💾</span>
          <div>
            <h2 className="font-serif text-lg font-bold text-ink">
              Резервні копії бази даних SQLite (pasika.db)
            </h2>
            <p className="text-xs text-ink/50">
              Постійне збереження всіх замовлень, клієнтів, товарів, статусів та налаштувань
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <a
            href={Backups.downloadUrl}
            download
            className="btn-secondary text-xs py-2 px-3.5 rounded-xl min-h-[44px] inline-flex items-center gap-1.5 font-semibold"
            title="Завантажити зліпок поточної бази даних прямо зараз"
          >
            📥 Завантажити Live .db
          </a>
          <button
            type="button"
            disabled={creating}
            onClick={handleCreate}
            className="btn-primary text-xs py-2 px-4 rounded-xl min-h-[44px] shadow-xs flex items-center gap-1.5 font-bold"
          >
            {creating ? "⏳ Створення..." : "⚡ Створити резервну копію"}
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs sm:text-sm font-semibold border flex items-center gap-2 ${
            feedback.isError
              ? "bg-red-50 text-red-700 border-red-200"
              : "bg-leaf/10 text-leaf border-leaf/30"
          }`}
        >
          <span>{feedback.isError ? "⚠️" : "✓"}</span>
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Safety & Persistence Info Box */}
      <div className="p-4 bg-cream/40 rounded-2xl border border-ink/5 space-y-2 text-xs text-ink/75 leading-relaxed">
        <div className="font-bold text-ink flex items-center gap-1.5">
          <span>🛡️</span>
          <span>Захист від втрати даних при перезапусках та деплоях:</span>
        </div>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>SQLite WAL Mode:</strong> База даних працює в режимі Write-Ahead Logging (WAL) для забезпечення транзакційної надійності (ACID).
          </li>
          <li>
            <strong>Безпечні міграції:</strong> Сервер ніколи не виконує <code>DROP TABLE</code> або деструктивне перезаписування таблиць при запуску.
          </li>
          <li>
            <strong>Постійний носій (Volume):</strong> База зберігається на диску сервера. Резервні копії створюються без блокування користувачів (online backup).
          </li>
        </ul>
      </div>

      {/* Snapshots Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm text-ink">
            Збережені файли резервних копій ({backups.length})
          </h3>
          <button
            type="button"
            onClick={loadBackups}
            className="text-xs text-ink/60 hover:text-ink underline"
          >
            Оновити список
          </button>
        </div>

        {loading ? (
          <div className="p-6 text-center text-ink/40 text-xs">
            <span className="inline-block animate-spin mr-2">⏳</span> Завантаження списку копій...
          </div>
        ) : backups.length === 0 ? (
          <div className="p-6 text-center text-ink/40 text-xs card bg-cream/20 border border-ink/5">
            Збережених резервних копій поки немає. Натисніть «Створити резервну копію», щоб створити першу точку відновлення.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[500px]">
              <thead>
                <tr className="text-left text-ink/50 border-b border-ink/5 pb-2">
                  <th className="py-2">Файл копії</th>
                  <th className="py-2">Розмір</th>
                  <th className="py-2">Дата створення</th>
                  <th className="py-2 text-right">Дія</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                {backups.map((b) => (
                  <tr key={b.filename} className="hover:bg-cream/30 transition-colors">
                    <td className="py-2.5 font-mono text-ink font-semibold">
                      {b.filename}
                    </td>
                    <td className="py-2.5 text-ink/70">
                      {b.sizeFormatted || `${Math.round(b.size / 1024)} KB`}
                    </td>
                    <td className="py-2.5 text-ink/60">
                      {new Date(b.createdAt).toLocaleString("uk-UA")}
                    </td>
                    <td className="py-2.5 text-right">
                      <a
                        href={Backups.downloadSpecificUrl(b.filename)}
                        download={b.filename}
                        className="btn-secondary text-[11px] py-1 px-3 rounded-lg inline-flex items-center gap-1 font-semibold"
                      >
                        📥 Завантажити (.db)
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

function SecuritySection() {
  const [currentUsername, setCurrentUsername] = useState(() => Auth.getUsername());
  const [newLogin, setNewLogin] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    Auth.checkSession().then(() => {
      setCurrentUsername(Auth.getUsername());
    });
  }, []);

  const handleSecuritySubmit = async (e) => {
    e.preventDefault();
    setStatusMsg("");
    setErrorMsg("");

    if (!currentPassword) {
      setErrorMsg("Введіть поточний пароль для підтвердження змін");
      return;
    }

    if (newPassword) {
      if (newPassword.length < 6) {
        setErrorMsg("Новий пароль має містити щонайменше 6 символів");
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMsg("Новий пароль та підтвердження не співпадають");
        return;
      }
    }

    setSaving(true);
    try {
      const res = await Auth.updateSecurity({
        currentPassword,
        newLogin: newLogin.trim() || undefined,
        newPassword: newPassword || undefined,
        confirmPassword: confirmPassword || undefined,
      });

      if (res?.success) {
        setStatusMsg("Логін / пароль успішно оновлено!");
        if (res.username) {
          setCurrentUsername(res.username);
        }
        setNewLogin("");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => setStatusMsg(""), 5000);
      }
    } catch (err) {
      setErrorMsg(err.message || "Помилка оновлення безпеки");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="card p-6 border-t-4 border-honey/60 space-y-5 animate-fade-in">
      <div className="flex items-center justify-between pb-3 border-b border-ink/5">
        <div>
          <h2 className="font-serif text-lg font-bold text-ink">Безпека та зміна пароля</h2>
          <p className="text-xs text-ink/50">
            Оновлення логіна адміністратора та пароля доступу до панелі керування
          </p>
        </div>
        <span className="text-2xl">🔒</span>
      </div>

      {statusMsg && (
        <div className="p-3 rounded-xl bg-leaf/10 border border-leaf/20 text-leaf text-sm font-medium">
          ✓ {statusMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-medium">
          ⚠️ {errorMsg}
        </div>
      )}

      <form onSubmit={handleSecuritySubmit} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Поточний логін</label>
            <input
              className="input bg-cream/30 text-ink/70 cursor-not-allowed text-sm"
              value={currentUsername}
              disabled
              readOnly
            />
          </div>
          <div>
            <label className="label">Новий логін (за бажанням)</label>
            <input
              className="input text-sm"
              value={newLogin}
              onChange={(e) => setNewLogin(e.target.value)}
              placeholder="Введіть новий логін..."
            />
          </div>
        </div>

        <div className="pt-2 border-t border-ink/5">
          <label className="label">
            Поточний пароль <span className="text-red-500">*</span>
          </label>
          <input
            className="input text-sm"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Введіть поточний пароль для підтвердження..."
            required
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Новий пароль</label>
            <input
              className="input text-sm"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Мінімум 6 символів..."
            />
          </div>
          <div>
            <label className="label">Підтвердження нового пароля</label>
            <input
              className="input text-sm"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Повторіть новий пароль..."
            />
          </div>
        </div>

        <div className="pt-3">
          <button
            type="submit"
            className="btn-primary text-sm py-2.5 px-6 shadow-sm disabled:opacity-50"
            disabled={saving || !currentPassword}
          >
            {saving ? "Збереження..." : "Зберегти зміни безпеки"}
          </button>
        </div>
      </form>
    </section>
  );
}

function Field({ label, value, onChange, placeholder, required, type = "text" }) {
  return (
    <div>
      <label className="label text-xs sm:text-sm font-semibold">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        className="input text-base sm:text-sm min-h-[44px]"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
      />
    </div>
  );
}
