import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Auth } from "../data/db";

export default function AdminLogin() {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const ok = await Auth.login(login, password);
      if (ok) {
        navigate("/admin");
      } else {
        setError("Невірний логін або пароль");
      }
    } catch (err) {
      setError(err.message || "Невірний логін або пароль");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-cream/40 px-4">
      <form onSubmit={submit} className="card p-6 sm:p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="text-3xl">🐝</div>
          <h1 className="font-serif text-2xl font-bold text-ink mt-2">Адмін-панель</h1>
          <p className="text-xs text-ink/50 mt-1">Honey Pasika</p>
        </div>
        <label className="label">Логін</label>
        <input
          className="input mb-4 min-h-[44px]"
          value={login}
          onChange={(e) => setLogin(e.target.value)}
          autoFocus
          required
        />
        <label className="label">Пароль</label>
        <input
          className="input mb-2 min-h-[44px]"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="text-xs text-red-500 mt-2 text-center">{error}</p>}
        <button className="btn-primary w-full mt-5 disabled:opacity-50 min-h-[44px]" disabled={loading}>
          {loading ? "Перевірка..." : "Увійти"}
        </button>
      </form>
    </div>
  );
}
