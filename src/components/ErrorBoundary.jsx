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

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-clean text-ink text-center">
          <div className="text-5xl mb-4">🍯</div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold mb-2">Щось пішло не так</h1>
          <p className="text-ink/60 max-w-md mb-6">
            Виникла тимчасова помилка інтерфейсу. Спробуйте оновити сторінку.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            Оновити сторінку
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
