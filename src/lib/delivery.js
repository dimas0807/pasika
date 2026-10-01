// Delivery Service — connected to server-side Nova Poshta and Ukrposhta APIs.
// The backend handles real API queries (or demo fallback if keys aren't set)
// and returns normalized objects with real IDs: { id, name }.
import { request } from "../data/db";

export const novaPoshtaAdapter = {
  name: "Нова пошта",
  key: "np",
  async searchCities(query) {
    if (!query || query.trim().length === 0) return [];
    try {
      const data = await request(`/api/delivery/cities?provider=np&query=${encodeURIComponent(query.trim())}`);
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },
  async getBranches(cityId, cityName = "", search = "") {
    if (!cityId && !cityName) return [];
    try {
      let url = `/api/delivery/branches?provider=np`;
      if (cityId) url += `&cityId=${encodeURIComponent(cityId)}`;
      if (cityName) url += `&cityName=${encodeURIComponent(cityName)}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      const data = await request(url);
      return Array.isArray(data) ? data : [];
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
      const data = await request(`/api/delivery/cities?provider=up&query=${encodeURIComponent(query.trim())}`);
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },
  async getBranches(cityId) {
    if (!cityId) return [];
    try {
      const data = await request(`/api/delivery/branches?provider=up&cityId=${encodeURIComponent(cityId)}`);
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },
};

export const DELIVERY_PROVIDERS = {
  np: novaPoshtaAdapter,
  up: ukrposhtaAdapter,
};
