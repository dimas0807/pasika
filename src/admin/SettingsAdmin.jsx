import { useEffect, useState } from "react";
import { Auth, Settings, Telegram } from "../data/db";

const TABS = [
  { id: "store", label: "Магазин", icon: "🏪" },
  { id: "payment", label: "Оплата", icon: "💳" },
  { id: "delivery", label: "Доставка", icon: "🚚" },
  { id: "telegram", label: "Telegram", icon: "💬" },
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
      const chatId = settings?.telegram?.chatId;
      const res = await Telegram.testConnection(token, chatId);
      setTgTestResult({
        success: res.success,
        message: res.message || "Тест підключення успішний!",
        botName: res.botName || res.bot?.first_name,
        botUsername: res.botUsername || res.bot?.username,
      });
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

      {/* Tabs navigation */}
      <div className="flex flex-wrap gap-1.5 p-1.5 bg-cream/50 rounded-2xl border border-ink/5">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs md:text-sm font-medium transition-all ${
              activeTab === tab.id
                ? "bg-white text-ink shadow-xs font-semibold"
                : "text-ink/65 hover:text-ink hover:bg-white/50"
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Status banners */}
      {saved && (
        <div className="p-3 rounded-xl bg-leaf/10 border border-leaf/20 text-leaf text-sm font-medium flex items-center gap-2 animate-fade-in">
          <span>✓</span> Зміни успішно збережено на сервері!
        </div>
      )}
      {errorMsg && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-medium flex items-center gap-2 animate-fade-in">
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
            <section className="card p-6 space-y-5 animate-fade-in">
              <div className="flex items-center gap-2 pb-3 border-b border-ink/5">
                <span className="text-2xl">🏪</span>
                <div>
                  <h2 className="font-serif text-lg font-bold text-ink">Дані магазину</h2>
                  <p className="text-xs text-ink/50">
                    Основна інформація про пасіку, слоган та позиціонування сайту
                  </p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <Field
                  label="Назва магазину"
                  value={settings?.store?.name ?? settings?.name ?? "Родинна пасіка мед"}
                  onChange={setPath("store.name")}
                  placeholder="Родинна пасіка мед"
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
                  value={settings?.store?.tagline ?? "Натуральний карпатський мед прямо з нашої пасіки"}
                  onChange={setPath("store.tagline")}
                  placeholder="Короткий слоган магазину..."
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <Field
                  label="Графік роботи"
                  value={settings?.store?.workingHours ?? "Пн–Сб: 09:00 – 19:00, Нд: вихідний"}
                  onChange={setPath("store.workingHours")}
                  placeholder="Пн–Сб: 09:00 – 19:00"
                />
                <Field
                  label="Розташування пасіки"
                  value={settings?.store?.location ?? "Івано-Франківська обл., с. Яблуниця"}
                  onChange={setPath("store.location")}
                  placeholder="Карпати, Україна"
                />
              </div>
            </section>
          )}

          {/* TAB 2: PAYMENT */}
          {activeTab === "payment" && (
            <section className="card p-6 space-y-5 animate-fade-in">
              <div className="flex items-center gap-2 pb-3 border-b border-ink/5">
                <span className="text-2xl">💳</span>
                <div>
                  <h2 className="font-serif text-lg font-bold text-ink">Реквізити для оплати</h2>
                  <p className="text-xs text-ink/50">
                    Ці реквізити показуються покупцю на кроці «Оплата» при виборі «Оплатити зараз»
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed">
                ℹ️ <strong>Єдине джерело правди:</strong> дані з цих полів автоматично підтягуються в клієнтський checkout при виборі передоплати, забезпечуючи відсутність розбіжностей.
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <Field
                  label="Отримувач платежу (ПІБ або ФОП) *"
                  value={settings?.payment?.holder || ""}
                  onChange={setPath("payment.holder")}
                  placeholder="ФОП Мельник Іван Васильович"
                  required
                />
                <Field
                  label="Номер картки або IBAN *"
                  value={settings?.payment?.card || ""}
                  onChange={setPath("payment.card")}
                  placeholder="UA... або 4441 1144 ..."
                  required
                />
                <Field
                  label="Банк отримувача"
                  value={settings?.payment?.bank || ""}
                  onChange={setPath("payment.bank")}
                  placeholder="АТ «Універсал Банк» (monobank)"
                />
                <Field
                  label="Призначення платежу"
                  value={settings?.payment?.purpose || ""}
                  onChange={setPath("payment.purpose")}
                  placeholder="Оплата замовлення мед"
                />
              </div>

              <div>
                <label className="label">Додаткова інструкція покупцю</label>
                <textarea
                  rows={3}
                  value={settings?.payment?.instruction || ""}
                  onChange={setPath("payment.instruction")}
                  placeholder="Після оплати, будь ласка, прикріпіть скріншот або фото квитанції у формі нижче для швидкого підтвердження замовлення."
                  className="input text-sm"
                />
              </div>
            </section>
          )}

          {/* TAB 3: DELIVERY */}
          {activeTab === "delivery" && (
            <section className="card p-6 space-y-5 animate-fade-in">
              <div className="flex items-center gap-2 pb-3 border-b border-ink/5">
                <span className="text-2xl">🚚</span>
                <div>
                  <h2 className="font-serif text-lg font-bold text-ink">Доставка</h2>
                  <p className="text-xs text-ink/50">
                    Умови та налаштування доставки через Нову пошту та Укрпошту
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-leaf/10 border border-leaf/20 text-xs text-ink/80 leading-relaxed">
                ✓ <strong>Ручна доставка активована:</strong> клієнт вказує службу, місто та відділення у зручній формі. Жодні блокуючі API-ключі перевізників не вимагаються для роботи оформлення замовлення.
              </div>

              <div className="space-y-4">
                <Field
                  label="Термін відправлення"
                  value={settings?.delivery?.dispatchTime || "Відправка в день замовлення або наступного дня"}
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
                  <label className="label">Інформаційний текст для сторінки доставки</label>
                  <textarea
                    rows={4}
                    value={settings?.delivery?.notes || ""}
                    onChange={setPath("delivery.notes")}
                    placeholder="Надійно упаковуємо скляні банки у захисний повітряний матеріал та картонні бокси..."
                    className="input text-sm"
                  />
                </div>
              </div>
            </section>
          )}

          {/* TAB 4: TELEGRAM */}
          {activeTab === "telegram" && (
            <section className="card p-6 space-y-5 animate-fade-in">
              <div className="flex items-center gap-2 pb-3 border-b border-ink/5">
                <span className="text-2xl">💬</span>
                <div>
                  <h2 className="font-serif text-lg font-bold text-ink">Telegram сповіщення</h2>
                  <p className="text-xs text-ink/50">
                    Миттєве надсилання інформації про кожне нове замовлення у ваш Telegram-чат
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 leading-relaxed space-y-1">
                <p className="font-semibold">💡 Безпечне зберігання токена:</p>
                <p>
                  Токен бота зберігається тільки на сервері і ніколи не передається у браузер у відкритому вигляді. Якщо токен уже збережено, він відображається як <code className="bg-blue-100 px-1 py-0.5 rounded font-mono">••••••••••••••••</code>.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="tg_enabled"
                    checked={settings?.telegram?.enabled ?? true}
                    onChange={setPath("telegram.enabled")}
                    className="w-4 h-4 text-honey rounded cursor-pointer"
                  />
                  <label htmlFor="tg_enabled" className="text-sm font-medium text-ink cursor-pointer">
                    Увімкнути відправку сповіщень у Telegram при нових замовленнях
                  </label>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">
                      Telegram Bot Token
                    </label>
                    <input
                      type="password"
                      value={settings?.telegram?.botToken || ""}
                      onChange={setPath("telegram.botToken")}
                      placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ..."
                      className="input font-mono text-xs"
                    />
                    <p className="text-[11px] text-ink/40 mt-1">
                      Отримайте у бота <a href="https://t.me/BotFather" target="_blank" rel="noreferrer" className="text-honey hover:underline">@BotFather</a>
                    </p>
                  </div>

                  <div>
                    <label className="label">
                      Telegram Chat ID
                    </label>
                    <input
                      type="text"
                      value={settings?.telegram?.chatId || ""}
                      onChange={setPath("telegram.chatId")}
                      placeholder="-100... або 12345678"
                      className="input font-mono text-xs"
                    />
                    <p className="text-[11px] text-ink/40 mt-1">
                      ID групи чи вашого чату (дізнайтесь через <a href="https://t.me/userinfobot" target="_blank" rel="noreferrer" className="text-honey hover:underline">@userinfobot</a>)
                    </p>
                  </div>
                </div>

                {/* Connection test block */}
                <div className="p-4 bg-cream/40 rounded-xl border border-ink/10 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="font-semibold text-sm text-ink">Перевірка зв'язку з ботом</h4>
                      <p className="text-xs text-ink/60">
                        Надішле тестове повідомлення у ваш чат для перевірки налаштувань
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={runTelegramTest}
                      disabled={testingTg}
                      className="btn-primary text-xs py-2 px-4 shadow-2xs self-start sm:self-auto disabled:opacity-50"
                    >
                      {testingTg ? "Перевірка..." : "🧪 Перевірити підключення"}
                    </button>
                  </div>

                  {tgTestResult && (
                    <div
                      className={`p-3 rounded-xl text-xs font-medium border ${
                        tgTestResult.success
                          ? "bg-leaf/10 border-leaf/20 text-leaf"
                          : "bg-red-50 border-red-200 text-red-600"
                      }`}
                    >
                      {tgTestResult.success ? (
                        <div>
                          <strong>✓ Успіх!</strong> {tgTestResult.message}
                          {tgTestResult.botName && (
                            <div className="mt-1 text-ink/70">
                              Бот: <strong>{tgTestResult.botName}</strong> (@{tgTestResult.botUsername})
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
            </section>
          )}

          {/* TAB 5: ABOUT */}
          {activeTab === "about" && (
            <section className="card p-6 space-y-5 animate-fade-in">
              <div className="flex items-center gap-2 pb-3 border-b border-ink/5">
                <span className="text-2xl">🌿</span>
                <div>
                  <h2 className="font-serif text-lg font-bold text-ink">Про нашу пасіку</h2>
                  <p className="text-xs text-ink/50">
                    Тексти та історія, що відображаються на сторінці «Про нас» та головній
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <Field
                  label="Головний заголовок блоку"
                  value={settings?.about?.title ?? "Родинна пасіка в серці Карпат"}
                  onChange={setPath("about.title")}
                  placeholder="Родинна пасіка в серці Карпат"
                />

                <div>
                  <label className="label">Вступний текст / слоган</label>
                  <textarea
                    rows={2}
                    value={settings?.about?.lead ?? "Ми займаємося бджільництвом понад три покоління, зберігаючи природну чистоту кожного сорту меду."}
                    onChange={setPath("about.lead")}
                    placeholder="Короткий вступний абзац..."
                    className="input text-sm"
                  />
                </div>

                <div>
                  <label className="label">Повна історія пасіки</label>
                  <textarea
                    rows={6}
                    value={settings?.about?.story ?? "Наша пасіка розташована в екологічно чистій гірській місцевості Карпат, далеко від автодоріг та промислових об'єктів. Бджоли збирають нектар з дикорослих медоносів — білої акації, гірського різнотрав'я, лісових квітів та липи.\n\nМи не нагріваємо мед і не додаємо жодних цукрових сиропів. Весь мед фасується вручну холодним способом, що дозволяє зберегти максимум природних ферментів, вітамінів та цілющих властивостей."}
                    onChange={setPath("about.story")}
                    placeholder="Детальний опис створення пасіки, традицій та цінностей..."
                    className="input text-sm"
                  />
                </div>

                <div className="grid sm:grid-cols-3 gap-4 pt-2">
                  <Field
                    label="Кількість вуликів"
                    value={settings?.about?.stats?.hives ?? "120+"}
                    onChange={setPath("about.stats.hives")}
                    placeholder="120+"
                  />
                  <Field
                    label="Років досвіду"
                    value={settings?.about?.stats?.years ?? "35"}
                    onChange={setPath("about.stats.years")}
                    placeholder="35"
                  />
                  <Field
                    label="Тонн меду на рік"
                    value={settings?.about?.stats?.honeyPerYear ?? "5+"}
                    onChange={setPath("about.stats.honeyPerYear")}
                    placeholder="5+"
                  />
                </div>
              </div>
            </section>
          )}

          {/* TAB 6: CONTACTS */}
          {activeTab === "contacts" && (
            <section className="card p-6 space-y-5 animate-fade-in">
              <div className="flex items-center gap-2 pb-3 border-b border-ink/5">
                <span className="text-2xl">📞</span>
                <div>
                  <h2 className="font-serif text-lg font-bold text-ink">Контакти</h2>
                  <p className="text-xs text-ink/50">
                    Контактні канали зв'язку для покупців (шапка, футер, сторінка контактів)
                  </p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <Field
                  label="Номер телефону"
                  value={settings?.contacts?.phone || ""}
                  onChange={setPath("contacts.phone")}
                  placeholder="+380 67 123 4567"
                />
                <Field
                  label="Електронна пошта (Email)"
                  value={settings?.contacts?.email || ""}
                  onChange={setPath("contacts.email")}
                  placeholder="pasika.honey@gmail.com"
                />
                <Field
                  label="Telegram канал / контакт"
                  value={settings?.contacts?.telegram || ""}
                  onChange={setPath("contacts.telegram")}
                  placeholder="@pasika_honey або https://t.me/..."
                />
                <Field
                  label="TikTok профіль"
                  value={settings?.contacts?.tiktok || ""}
                  onChange={setPath("contacts.tiktok")}
                  placeholder="@pasika.ua або https://tiktok.com/..."
                />
                <Field
                  label="Instagram (необов'язково)"
                  value={settings?.contacts?.instagram || ""}
                  onChange={setPath("contacts.instagram")}
                  placeholder="@pasika_honey"
                />
                <Field
                  label="Поштова адреса / Самовивіз"
                  value={settings?.contacts?.address || ""}
                  onChange={setPath("contacts.address")}
                  placeholder="с. Яблуниця, вул. Центральна, 12"
                />
              </div>
            </section>
          )}

          {/* TAB 7: SECURITY */}
          {activeTab === "security" && (
            <SecuritySection />
          )}

          {/* Save button bar (for all tabs except security which has its own form) */}
          {activeTab !== "security" && (
            <div className="flex items-center justify-between pt-4 border-t border-ink/10">
              <div className="text-xs text-ink/50">
                Зміни набувають чинності відразу після збереження.
              </div>
              <button
                type="submit"
                disabled={saving}
                className="btn-primary text-sm py-2.5 px-6 shadow-sm disabled:opacity-50 flex items-center gap-2"
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
    </div>
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

function Field({ label, value, onChange, placeholder, required }) {
  return (
    <div>
      <label className="label">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        className="input text-sm"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
      />
    </div>
  );
}
