import { useEffect, useState } from "react";
import { Settings } from "../data/db";

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
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      alert("Не вдалося зберегти налаштування: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl">
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
          <h3 className="font-semibold text-ink mb-4">Оплата</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Банк" value={settings?.payment?.bank || ""} onChange={setPath("payment.bank")} />
            <Field label="Картка / реквізити" value={settings?.payment?.card || ""} onChange={setPath("payment.card")} />
            <Field label="Отримувач" value={settings?.payment?.holder || ""} onChange={setPath("payment.holder")} />
          </div>
          <div className="mt-4">
            <label className="label">Текст інструкції</label>
            <textarea
              className="input"
              rows={2}
              value={settings?.payment?.instruction || ""}
              onChange={setPath("payment.instruction")}
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
            {saving ? "Збереження..." : "Зберегти"}
          </button>
          {saved && <span className="text-leaf text-sm font-medium">✓ Збережено на сервері</span>}
        </div>
      </form>
    </div>
  );
}

function Field({ label, value, onChange }) {
  return (
    <div>
      <label className="label">{label}</label>
      <input className="input" value={value} onChange={onChange} />
    </div>
  );
}
