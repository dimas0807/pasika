import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[React ErrorBoundary caught error]:", error, errorInfo);
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const isDev = Boolean(import.meta.env?.DEV);
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-clean text-ink text-center">
          <div className="text-5xl mb-4">🍯</div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold mb-2">Щось пішло не так</h1>
          <p className="text-ink/60 max-w-md mb-6 text-sm">
            Виникла тимчасова помилка інтерфейсу. Ви можете перезавантажити сторінку або повернутися на головну.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => {
                this.reset();
                window.location.reload();
              }}
              className="btn-primary"
            >
              Оновити сторінку
            </button>
            <button
              onClick={() => {
                this.reset();
                if (window.location.pathname.startsWith("/admin")) {
                  window.location.href = "/admin";
                } else {
                  window.location.href = "/";
                }
              }}
              className="btn-secondary"
            >
              Спробувати знову
            </button>
            <a
              href="/"
              className="w-full text-xs text-ink/50 hover:text-ink underline mt-3 block"
            >
              ← Повернутися до магазину
            </a>
          </div>

          {(isDev || window.location.hostname === "localhost") && this.state.error && (
            <div className="mt-6 p-4 max-w-xl text-left bg-red-50 text-red-800 text-xs rounded-xl border border-red-200 overflow-auto max-h-48">
              <div className="font-bold mb-1">Помилка: {this.state.error.message || String(this.state.error)}</div>
              {this.state.error.stack && (
                <pre className="text-[10px] text-red-700 whitespace-pre-wrap font-mono mt-1">
                  {this.state.error.stack}
                </pre>
              )}
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
