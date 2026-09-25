// Delivery Service — connected to server-side Nova Poshta and Ukrposhta APIs.
// The backend handles real API queries (or demo fallback if keys aren't set)
// and returns normalized objects with real IDs: { id, name }.

export const novaPoshtaAdapter = {
  name: "Нова пошта",
  key: "np",
  async searchCities(query) {
    if (!query || query.trim().length === 0) return [];
    try {
      const res = await fetch(`/api/delivery/cities?provider=np&query=${encodeURIComponent(query.trim())}`);
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  },
  async getBranches(cityId) {
    if (!cityId) return [];
    try {
      const res = await fetch(`/api/delivery/branches?provider=np&cityId=${encodeURIComponent(cityId)}`);
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  },
};

export const ukrposhtaAdapter = {
  name: "Укрпошта",
  key: "up",
  async searchCities(query) {
    if (!query || query.trim().length === 0) return [];
    try {
      const res = await fetch(`/api/delivery/cities?provider=up&query=${encodeURIComponent(query.trim())}`);
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  },
  async getBranches(cityId) {
    if (!cityId) return [];
    try {
      const res = await fetch(`/api/delivery/branches?provider=up&cityId=${encodeURIComponent(cityId)}`);
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  },
};

export const DELIVERY_PROVIDERS = {
  np: novaPoshtaAdapter,
  up: ukrposhtaAdapter,
};
