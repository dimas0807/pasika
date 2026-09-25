import { useEffect, useState } from "react";
import { Settings, subscribe } from "../data/db";

export default function Contacts() {
  const [s, setS] = useState(() => Settings.get());

  useEffect(() => {
    Settings.fetch().then((data) => data && setS(data));
    return subscribe(() => setS(Settings.get()));
  }, []);

  return (
    <div className="container-p py-14 max-w-2xl">
      <h1 className="font-serif text-4xl font-bold text-ink">Контакти</h1>
      <div className="mt-8 card p-8 space-y-4">
        <Row label="Телефон" value={s?.contacts?.phone} />
        <Row label="Email" value={s?.contacts?.email} />
        <Row label="TikTok" value={s?.contacts?.tiktok} />
        <Row label="Telegram" value={s?.contacts?.telegram} />
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-ink/5 pb-3 last:border-0 last:pb-0">
      <span className="text-ink/50 text-sm">{label}</span>
      <span className="font-medium text-ink">{value || "—"}</span>
    </div>
  );
}
