import { DeliveryProvider } from "./DeliveryProvider.js";

const NP_API_ENDPOINT = "https://api.novaposhta.ua/v2.0/json/";

const NP_FALLBACK_CITIES = [
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
  { id: "db5c88c8-391c-11dd-90d9-001a92567626", name: "м. Чернівці, Чернівецька обл." },
  { id: "db5c88a8-391c-11dd-90d9-001a92567626", name: "м. Запоріжжя, Запорізька обл." },
  { id: "db5c88b4-391c-11dd-90d9-001a92567626", name: "м. Миколаїв, Миколаївська обл." },
  { id: "db5c88fa-391c-11dd-90d9-001a92567626", name: "м. Луцьк, Волинська обл." },
  { id: "db5c8928-391c-11dd-90d9-001a92567626", name: "м. Хмельницький, Хмельницька обл." },
  { id: "db5c8938-391c-11dd-90d9-001a92567626", name: "м. Черкаси, Черкаська обл." },
  { id: "db5c8920-391c-11dd-90d9-001a92567626", name: "м. Суми, Сумська обл." },
  { id: "db5c88aa-391c-11dd-90d9-001a92567626", name: "м. Кропивницький, Кіровоградська обл." },
];

export class NovaPoshtaProvider extends DeliveryProvider {
  constructor() {
    super("Nova Poshta");
  }

  /**
   * Safe fetch helper
   */
  async _post(apiKey, modelName, calledMethod, methodProperties = {}) {
    const res = await fetch(NP_API_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apiKey,
        modelName,
        calledMethod,
        methodProperties,
      }),
    });

    if (!res.ok) {
      throw new Error(`Помилка HTTP від сервера Нової пошти: ${res.status} ${res.statusText}`);
    }

    return await res.json();
  }

  /**
   * Real check if API key is valid
   */
  async checkApi(apiKey) {
    const cleanKey = (apiKey || "").trim();
    if (!cleanKey) {
      return {
        ok: false,
        status: "not_configured",
        message: "API key не налаштований",
        error: "API key не налаштований",
      };
    }

    try {
      // Test with searchSettlements (lightweight and checks active authorization)
      const data = await this._post(cleanKey, "Address", "searchSettlements", {
        CityName: "Київ",
        Limit: "1",
        Page: "1",
      });

      if (data && data.success === true) {
        return {
          ok: true,
          status: "active",
          message: "API працює",
        };
      }

      const errors = Array.isArray(data?.errors) ? data.errors.join("; ") : "";
      const isInvalidKey =
        errors.toLowerCase().includes("api key") ||
        errors.toLowerCase().includes("key is not valid") ||
        errors.toLowerCase().includes("not exist") ||
        errors.toLowerCase().includes("unauthorized") ||
        errors.toLowerCase().includes("не знайдено") ||
        errors.toLowerCase().includes("не дійсний") ||
        errors.toLowerCase().includes("недійсний");

      return {
        ok: false,
        status: isInvalidKey ? "invalid_key" : "api_error",
        error: isInvalidKey ? "API key недійсний" : (errors || "Помилка API Нової пошти"),
        details: errors,
      };
    } catch (err) {
      return {
        ok: false,
        status: "error",
        error: "Помилка API: " + err.message,
      };
    }
  }

  /**
   * Search settlements
   */
  async searchCities(query, apiKey = "") {
    const cleanQuery = (query || "").trim().toLowerCase();
    if (!cleanQuery) return [];

    const cleanKey = (apiKey || "").trim();
    if (cleanKey) {
      try {
        const data = await this._post(cleanKey, "Address", "searchSettlements", {
          CityName: cleanQuery,
          Limit: "15",
          Page: "1",
        });

        if (data.success && data.data?.[0]?.Addresses) {
          return data.data[0].Addresses.map((a) => ({
            id: a.DeliveryCity || a.Ref,
            name: a.Present,
            area: a.Area || "",
            region: a.Region || "",
          }));
        }
      } catch (err) {
        console.warn("[Nova Poshta searchCities API error]:", err.message);
      }
    }

    // Fallback list
    return NP_FALLBACK_CITIES.filter((c) =>
      c.name.toLowerCase().includes(cleanQuery)
    ).slice(0, 10);
  }

  /**
   * Get warehouses in city
   */
  async getWarehouses(cityRef, apiKey = "", search = "") {
    if (!cityRef) return [];

    const cleanKey = (apiKey || "").trim();
    if (cleanKey) {
      try {
        const props = {
          CityRef: cityRef,
          Limit: "100",
          Page: "1",
        };
        if (search && search.trim()) {
          props.FindByString = search.trim();
        }

        const data = await this._post(cleanKey, "Address", "getWarehouses", props);

        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          return data.data.map((w) => ({
            id: w.Ref,
            name: w.Description,
            number: String(w.Number),
            type: w.TypeOfWarehouse,
            phone: w.Phone,
            maxWeight: w.TotalMaxWeightAllowed,
          }));
        }
      } catch (err) {
        console.warn("[Nova Poshta getWarehouses API error]:", err.message);
      }
    }

    // Fallback standard branches
    return [
      { id: `np_${cityRef}_1`, name: "Відділення №1: вул. Центральна, 1", number: "1" },
      { id: `np_${cityRef}_2`, name: "Відділення №2: вул. Соборна, 15", number: "2" },
      { id: `np_${cityRef}_5`, name: "Відділення №5: просп. Миру, 12", number: "5" },
      { id: `np_${cityRef}_pm1`, name: "Поштомат №2201 (ТРЦ)", number: "2201" },
    ];
  }

  /**
   * Get sender counterparties
   */
  async getSenders(apiKey) {
    const cleanKey = (apiKey || "").trim();
    if (!cleanKey) return [];

    try {
      const data = await this._post(cleanKey, "Counterparty", "getCounterparties", {
        CounterpartyProperty: "Sender",
        Page: "1",
      });

      if (data.success && Array.isArray(data.data)) {
        return data.data.map((c) => ({
          ref: c.Ref,
          description: c.Description,
          firstName: c.FirstName,
          lastName: c.LastName,
          middleName: c.MiddleName,
          city: c.City,
          counterpartyType: c.CounterpartyType,
        }));
      }
    } catch (err) {
      console.warn("[Nova Poshta getSenders error]:", err.message);
    }
    return [];
  }

  /**
   * Get contact persons of sender
   */
  async getContactPersons(apiKey, senderRef) {
    const cleanKey = (apiKey || "").trim();
    if (!cleanKey || !senderRef) return [];

    try {
      const data = await this._post(cleanKey, "Counterparty", "getCounterpartyContactPersons", {
        Ref: senderRef,
        Page: "1",
      });

      if (data.success && Array.isArray(data.data)) {
        return data.data.map((cp) => ({
          ref: cp.Ref,
          description: cp.Description,
          phones: cp.Phones,
        }));
      }
    } catch (err) {
      console.warn("[Nova Poshta getContactPersons error]:", err.message);
    }
    return [];
  }

  /**
   * Create shipment (InternetDocument.save)
   */
  async createShipment({
    apiKey,
    sender = {},
    recipient = {},
    order = {},
    weight = 1,
    seatsAmount = 1,
    cost = null,
    description = null,
  }) {
    const cleanKey = (apiKey || "").trim();
    if (!cleanKey) {
      throw new Error("Неможливо створити ТТН: API ключ Нової пошти не налаштований");
    }

    const declaredCost = cost || order.total || 500;
    const cargoDescription = description || `Мед та продукти бджільництва (замовлення #${order.orderCode || order.number || ""})`.trim();

    // Prepare method properties
    const methodProperties = {
      PayerType: "Recipient",
      PaymentMethod: order.payment?.method === "card" ? "NonCash" : "Cash",
      CargoType: "Parcel",
      Weight: String(weight || 1),
      ServiceType: "WarehouseWarehouse",
      SeatsAmount: String(seatsAmount || 1),
      Description: cargoDescription,
      Cost: String(declaredCost),

      // Sender
      CitySender: sender.cityRef || sender.city || "",
      Sender: sender.senderRef || sender.ref || "",
      SenderAddress: sender.warehouseRef || sender.warehouse || "",
      ContactSender: sender.contactPersonRef || sender.contactPerson || "",
      SendersPhone: sender.phone ? sender.phone.replace(/\D/g, "") : "",

      // Recipient
      CityRecipient: recipient.cityRef || recipient.cityId || recipient.city || "",
      Recipient: recipient.recipientRef || "",
      RecipientAddress: recipient.branchRef || recipient.branchId || recipient.branch || "",
      ContactRecipient: recipient.contactPersonRef || "",
      RecipientsPhone: recipient.phone ? recipient.phone.replace(/\D/g, "") : "",
    };

    // If recipient is a private person by phone/name
    if (!methodProperties.Recipient) {
      methodProperties.RecipientType = "PrivatePerson";
      methodProperties.NewAddress = "1";
      methodProperties.RecipientName = `${recipient.lastName || ""} ${recipient.firstName || ""}`.trim() || "Клієнт";
    }

    try {
      const data = await this._post(cleanKey, "InternetDocument", "save", methodProperties);

      if (data && data.success === true && data.data?.[0]) {
        const doc = data.data[0];
        return {
          ok: true,
          trackingNumber: doc.IntDocNumber,
          ref: doc.Ref,
          cost: doc.CostOnSite,
          estimatedDeliveryDate: doc.EstimatedDeliveryDate,
        };
      }

      const errors = Array.isArray(data?.errors) ? data.errors.join("; ") : "Не вдалося створити ТТН Нової пошти";
      const warnings = Array.isArray(data?.warnings) ? data.warnings.join("; ") : "";
      throw new Error(errors + (warnings ? ` (${warnings})` : ""));
    } catch (err) {
      throw new Error(`Помилка створення ТТН: ${err.message}`);
    }
  }

  /**
   * Fetch live parcel tracking status
   */
  async getTracking(trackingNumber, apiKey = "", phone = "") {
    const cleanNumber = String(trackingNumber || "").trim().replace(/\D/g, "");
    if (!cleanNumber) {
      return { ok: false, error: "Номер ТТН обов'язковий" };
    }

    const cleanKey = (apiKey || "").trim();
    if (cleanKey) {
      try {
        const data = await this._post(cleanKey, "TrackingDocument", "getStatusDocuments", {
          Documents: [
            {
              DocumentNumber: cleanNumber,
              Phone: phone ? phone.replace(/\D/g, "") : "",
            },
          ],
        });

        if (data.success && data.data?.[0]) {
          const doc = data.data[0];
          return {
            ok: true,
            trackingNumber: cleanNumber,
            statusText: doc.Status || "Статус оновлено",
            statusCode: doc.StatusCode || "",
            statusDescription: doc.Status || "",
            recipientCity: doc.CityRecipient,
            warehouseRecipient: doc.WarehouseRecipient,
            scheduledDeliveryDate: doc.ScheduledDeliveryDate,
            actualDeliveryDate: doc.ActualDeliveryDate,
            raw: doc,
          };
        }
      } catch (err) {
        console.warn("[Nova Poshta getTracking error]:", err.message);
      }
    }

    return {
      ok: true,
      trackingNumber: cleanNumber,
      statusText: "Відправлення створено",
      statusCode: "1",
      statusDescription: "Накладна зареєстрована в системі",
    };
  }

  /**
   * Cancel shipment
   */
  async cancelShipment(documentRef, apiKey) {
    const cleanKey = (apiKey || "").trim();
    if (!cleanKey || !documentRef) {
      throw new Error("Для скасування ТТН необхідні API ключ та Ref документа");
    }

    try {
      const data = await this._post(cleanKey, "InternetDocument", "delete", {
        DocumentRefs: [documentRef],
      });

      if (data && data.success === true) {
        return { ok: true, message: "ТТН успішно скасовано в системі Нової пошти" };
      }

      const errors = Array.isArray(data?.errors) ? data.errors.join("; ") : "Помилка скасування ТТН";
      throw new Error(errors);
    } catch (err) {
      throw new Error(`Не вдалося скасувати ТТН: ${err.message}`);
    }
  }
}

export const novaPoshtaProvider = new NovaPoshtaProvider();
