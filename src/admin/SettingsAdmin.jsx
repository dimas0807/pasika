import { useEffect, useState } from "react";
import { Auth, Settings } from "../data/db";

export default function SettingsAdmin() {
  const [settings, setSettings] = useState(() => Settings.get());
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Settings.fetch().then((s) => {
      if (s) setSettings(s);
    });
  }, []);

  const setPath = (path) => (e) => {
    const value = e.target.value;
    setSettings((s) => {
      const next = structuredClone(s);
      const keys = path.split(".");
      let ref = next;
      for (let i = 0; i < keys.length - 1; i++) ref = ref[keys[i]];
      ref[keys[keys.length - 1]] = value;
      return next;
    });
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await Settings.save(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      alert("Не вдалося зберегти налаштування: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-10">
      <div>
        <h1 className="font-serif text-2xl md:text-3xl font-bold text-ink mb-6">Налаштування</h1>
        <form onSubmit={save} className="space-y-5">
          <section className="card p-6">
            <h3 className="font-semibold text-ink mb-4">Контакти</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Телефон" value={settings?.contacts?.phone || ""} onChange={setPath("contacts.phone")} />
              <Field label="Email" value={settings?.contacts?.email || ""} onChange={setPath("contacts.email")} />
              <Field label="TikTok" value={settings?.contacts?.tiktok || ""} onChange={setPath("contacts.tiktok")} />
              <Field label="Telegram" value={settings?.contacts?.telegram || ""} onChange={setPath("contacts.telegram")} />
            </div>
          </section>

          <section className="card p-6">
            <h3 className="font-semibold text-ink mb-1">Реквізити для оплати</h3>
            <p className="text-xs text-ink/55 mb-4">
              Ці реквізити відображаються покупцю під час оформлення замовлення («Оплатити зараз»)
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Отримувач" value={settings?.payment?.holder || ""} onChange={setPath("payment.holder")} placeholder="ПІБ отримувача або ФОП" />
              <Field label="Номер картки / IBAN" value={settings?.payment?.card || ""} onChange={setPath("payment.card")} placeholder="UA... або 4441..." />
              <Field label="Банк" value={settings?.payment?.bank || ""} onChange={setPath("payment.bank")} placeholder="monobank, ПриватБанк тощо" />
              <Field label="Призначення платежу" value={settings?.payment?.purpose || ""} onChange={setPath("payment.purpose")} placeholder="Оплата замовлення" />
            </div>
            <div className="mt-4">
              <label className="label">Додаткова інструкція (необов'язково)</label>
              <textarea
                className="input"
                rows={2}
                value={settings?.payment?.instruction || ""}
                onChange={setPath("payment.instruction")}
                placeholder="Після оплати завантажте фото або скріншот чека..."
              />
            </div>
          </section>

          <section className="card p-6">
            <h3 className="font-semibold text-ink mb-2">Доставка</h3>
            <p className="text-sm text-ink/60">
              Нова пошта та Укрпошта працюють через серверний API. За наявності ключів у <code className="bg-cream px-1.5 py-0.5 rounded">.env</code> (<code className="bg-cream px-1.5 py-0.5 rounded">NOVA_POSHTA_API_KEY</code> / <code className="bg-cream px-1.5 py-0.5 rounded">UKRPOSHTA_API_KEY</code>) підключаються реальні запити, інакше працює demo fallback з реальними ID.
            </p>
          </section>

          <section className="card p-6">
            <h3 className="font-semibold text-ink mb-2">Telegram сповіщення</h3>
            <p className="text-sm text-ink/60">
              Повідомлення надсилаються сервером при оформленні замовлення. Для реального відправлення вкажіть <code className="bg-cream px-1.5 py-0.5 rounded">TELEGRAM_BOT_TOKEN</code> і <code className="bg-cream px-1.5 py-0.5 rounded">TELEGRAM_CHAT_ID</code> у серверному файлі <code className="bg-cream px-1.5 py-0.5 rounded">.env</code>.
            </p>
          </section>

          <div className="flex items-center gap-3">
            <button className="btn-primary disabled:opacity-50" disabled={saving}>
              {saving ? "Збереження..." : "Зберегти налаштування"}
            </button>
            {saved && <span className="text-leaf text-sm font-medium">✓ Збережено на сервері</span>}
          </div>
        </form>
      </div>

      {/* Security & Account Settings */}
      <SecuritySection />
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
        setStatusMsg("Пароль та налаштування безпеки успішно оновлено.");
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
    <section className="card p-6 border-t-4 border-honey/60">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-serif text-xl font-bold text-ink">Безпека та зміна пароля</h2>
          <p className="text-xs text-ink/60 mt-0.5">
            Зміна логіна адміністратора та пароля доступу до адмін-панелі
          </p>
        </div>
        <span className="text-2xl">🔒</span>
      </div>

      {statusMsg && (
        <div className="p-3 mb-4 rounded-xl bg-leaf/10 border border-leaf/20 text-leaf text-sm font-medium">
          ✓ {statusMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-3 mb-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-medium">
          ⚠️ {errorMsg}
        </div>
      )}

      <form onSubmit={handleSecuritySubmit} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Поточний логін</label>
            <input
              className="input bg-cream/30 text-ink/70 cursor-not-allowed"
              value={currentUsername}
              disabled
              readOnly
            />
          </div>
          <div>
            <label className="label">Новий логін (за бажанням)</label>
            <input
              className="input"
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
            className="input"
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
              className="input"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Мінімум 6 символів..."
            />
          </div>
          <div>
            <label className="label">Підтвердження нового пароля</label>
            <input
              className="input"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Повторіть новий пароль..."
            />
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            className="btn-primary disabled:opacity-50"
            disabled={saving || !currentPassword}
          >
            {saving ? "Збереження змін..." : "Зберегти зміни безпеки"}
          </button>
        </div>
      </form>
    </section>
  );
}

function Field({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="label">{label}</label>
      <input className="input" value={value} onChange={onChange} placeholder={placeholder} />
    </div>
  );
}
