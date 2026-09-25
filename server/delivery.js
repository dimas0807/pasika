// Server-side delivery services for Nova Poshta & Ukrposhta.
// Supports both real production APIs (when keys are set) and robust demo fallback with real-style IDs.

const NP_DEMO_CITIES = [
  { id: "8d5a980d-391c-11dd-90d9-001a92567626", name: "м. Київ, Київська обл." },
  { id: "db5c8892-391c-11dd-90d9-001a92567626", name: "м. Житомир, Житомирська обл." },
  { id: "db5c88f5-391c-11dd-90d9-001a92567626", name: "м. Львів, Львівська обл." },
  { id: "db5c88d0-391c-11dd-90d9-001a92567626", name: "м. Одеса, Одеська обл." },
  { id: "db5c88e0-391c-11dd-90d9-001a92567626", name: "м. Харків, Харківська обл." },
  { id: "db5c888c-391c-11dd-90d9-001a92567626", name: "м. Дніпро, Дніпропетровська обл." },
  { id: "db5c88de-391c-11dd-90d9-001a92567626", name: "м. Вінниця, Вінницька обл." },
  { id: "db5c88c4-391c-11dd-90d9-001a92567626", name: "м. Івано-Франківськ, Івано-Франківська обл." },
  { id: "db5c891b-391c-11dd-90d9-001a92567626", name: "м. Тернопіль, Тернопільська обл." },
  { id: "db5c893b-391c-11dd-90d9-001a92567626", name: "м. Чернігів, Чернігівська обл." },
  { id: "db5c8907-391c-11dd-90d9-001a92567626", name: "м. Рівне, Рівненська обл." },
  { id: "db5c88c6-391c-11dd-90d9-001a92567626", name: "м. Полтава, Полтавська обл." },
  { id: "db5c8931-391c-11dd-90d9-001a92567626", name: "м. Ужгород, Закарпатська обл." },
];

const UP_DEMO_CITIES = [
  { id: "up_city_01001", name: "м. Київ" },
  { id: "up_city_10001", name: "м. Житомир" },
  { id: "up_city_11500", name: "м. Коростень" },
  { id: "up_city_79000", name: "м. Львів" },
  { id: "up_city_65000", name: "м. Одеса" },
  { id: "up_city_61000", name: "м. Харків" },
  { id: "up_city_49000", name: "м. Дніпро" },
  { id: "up_city_21000", name: "м. Вінниця" },
];

function getDemoBranchesNP(cityId, _cityName = "") {
  return [
    { id: `np_wh_${cityId}_1`, name: `Відділення №1: вул. Центральна, 1`, number: "1" },
    { id: `np_wh_${cityId}_5`, name: `Відділення №5: просп. Миру, 12`, number: "5" },
    { id: `np_wh_${cityId}_15`, name: `Відділення №15: вул. Київська, 12`, number: "15" },
    { id: `np_wh_${cityId}_pm2201`, name: `Поштомат №2201 (ТРЦ, 1-й поверх)`, number: "2201" },
  ];
}

function getDemoBranchesUP(cityId, _cityName = "") {
  return [
    { id: `up_wh_${cityId}_1`, name: `Відділення УП №1 (вул. Поштова, 3)`, number: "1" },
    { id: `up_wh_${cityId}_7`, name: `Відділення УП №7 (вул. Шевченка, 25)`, number: "7" },
  ];
}

// ---------------- Nova Poshta Service ----------------
export async function searchCitiesNovaPoshta(query) {
  const apiKey = process.env.NOVA_POSHTA_API_KEY?.trim();
  const cleanQuery = (query || "").trim().toLowerCase();
  if (!cleanQuery) return [];

  if (apiKey) {
    try {
      const res = await fetch("https://api.novaposhta.ua/v2.0/json/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey,
          modelName: "Address",
          calledMethod: "searchSettlements",
          methodProperties: {
            CityName: cleanQuery,
            Limit: "10",
            Page: "1",
          },
        }),
      });

      const data = await res.json();
      if (data.success && data.data?.[0]?.Addresses) {
        return data.data[0].Addresses.map((a) => ({
          id: a.DeliveryCity || a.Ref,
          name: a.Present,
        }));
      }
    } catch (err) {
      console.warn("[Nova Poshta API Error, falling back to demo]:", err.message);
    }
  }

  // Demo fallback
  return NP_DEMO_CITIES.filter((c) => c.name.toLowerCase().includes(cleanQuery)).slice(0, 8);
}

export async function getBranchesNovaPoshta(cityId) {
  const apiKey = process.env.NOVA_POSHTA_API_KEY?.trim();
  if (!cityId) return [];

  if (apiKey) {
    try {
      const res = await fetch("https://api.novaposhta.ua/v2.0/json/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey,
          modelName: "Address",
          calledMethod: "getWarehouses",
          methodProperties: {
            CityRef: cityId,
            Limit: "50",
            Page: "1",
          },
        }),
      });

      const data = await res.json();
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        return data.data.map((w) => ({
          id: w.Ref,
          name: w.Description,
          number: w.Number,
        }));
      }
    } catch (err) {
      console.warn("[Nova Poshta Warehouses Error, falling back to demo]:", err.message);
    }
  }

  // Demo fallback
  const city = NP_DEMO_CITIES.find((c) => c.id === cityId);
  return getDemoBranchesNP(cityId, city?.name);
}

// ---------------- Ukrposhta Service ----------------
export async function searchCitiesUkrposhta(query) {
  const apiKey = process.env.UKRPOSHTA_API_KEY?.trim();
  const cleanQuery = (query || "").trim().toLowerCase();
  if (!cleanQuery) return [];

  if (apiKey) {
    try {
      const url = `https://openapi.ukrposhta.ua/address-classifier-ws/cities?cityName=${encodeURIComponent(cleanQuery)}`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: "application/json",
        },
      });

      if (res.ok) {
        const data = await res.json();
        const entries = data.Entries?.Entry || [];
        const list = Array.isArray(entries) ? entries : [entries];
        if (list.length > 0) {
          return list.slice(0, 8).map((c) => ({
            id: String(c.CITY_ID),
            name: `${c.CITY_UA} (${c.REGION_UA || ""})`.trim(),
          }));
        }
      }
    } catch (err) {
      console.warn("[Ukrposhta API Error, falling back to demo]:", err.message);
    }
  }

  // Demo fallback
  return UP_DEMO_CITIES.filter((c) => c.name.toLowerCase().includes(cleanQuery)).slice(0, 8);
}

export async function getBranchesUkrposhta(cityId) {
  const apiKey = process.env.UKRPOSHTA_API_KEY?.trim();
  if (!cityId) return [];

  if (apiKey) {
    try {
      const url = `https://openapi.ukrposhta.ua/address-classifier-ws/postoffices?city_id=${encodeURIComponent(cityId)}`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: "application/json",
        },
      });

      if (res.ok) {
        const data = await res.json();
        const entries = data.Entries?.Entry || [];
        const list = Array.isArray(entries) ? entries : [entries];
        if (list.length > 0) {
          return list.slice(0, 50).map((b) => ({
            id: String(b.POSTOFFICE_ID || b.POSTINDEX),
            name: `Відділення №${b.POSTINDEX} (${b.STREET_UA || ""})`.trim(),
            number: String(b.POSTINDEX),
          }));
        }
      }
    } catch (err) {
      console.warn("[Ukrposhta Warehouses Error, falling back to demo]:", err.message);
    }
  }

  // Demo fallback
  const city = UP_DEMO_CITIES.find((c) => c.id === cityId);
  return getDemoBranchesUP(cityId, city?.name);
}
