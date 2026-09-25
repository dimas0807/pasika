import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Auth, subscribe } from "../data/db";

export default function RequireAuth({ children }) {
  const [authed, setAuthed] = useState(() => Auth.isAuthed());
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;
    Auth.checkSession()
      .then((isAuth) => {
        if (active) {
          setAuthed(isAuth);
          setChecking(false);
        }
      })
      .catch(() => {
        if (active) {
          setAuthed(false);
          setChecking(false);
        }
      });

    const unsub = subscribe(() => {
      if (active) setAuthed(Auth.isAuthed());
    });

    return () => {
      active = false;
      unsub();
    };
  }, []);

  if (checking) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-ink/40 text-sm">
        Перевірка авторизації...
      </div>
    );
  }

  if (!authed) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}
