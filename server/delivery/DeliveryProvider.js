/**
 * Base abstract class for Delivery Providers
 */
export class DeliveryProvider {
  constructor(name) {
    this.name = name;
  }

  /**
   * Real check if API key is valid
   * @param {string} apiKey
   * @returns {Promise<{ ok: boolean, status: string, message?: string, error?: string }>}
   */
  async checkApi(_apiKey) {
    throw new Error("Method checkApi() must be implemented");
  }

  /**
   * Search settlements / cities
   * @param {string} query
   * @param {string} apiKey
   * @returns {Promise<Array<{ id: string, name: string, region?: string }>>}
   */
  async searchCities(_query, _apiKey) {
    throw new Error("Method searchCities() must be implemented");
  }

  /**
   * Get warehouses / post offices in city
   * @param {string} cityId
   * @param {string} apiKey
   * @returns {Promise<Array<{ id: string, name: string, number?: string }>>}
   */
  async getWarehouses(_cityId, _apiKey) {
    throw new Error("Method getWarehouses() must be implemented");
  }

  /**
   * Fetch live tracking status
   * @param {string} trackingNumber
   * @param {string} apiKey
   * @param {object} options
   * @returns {Promise<{ ok: boolean, trackingNumber: string, statusText: string, statusCode?: string, details?: any }>}
   */
  async getTracking(_trackingNumber, _apiKey, _options) {
    throw new Error("Method getTracking() must be implemented");
  }

  /**
   * Create shipment / express waybill (ТТН)
   * @param {object} params
   * @returns {Promise<{ ok: boolean, trackingNumber: string, ref?: string, cost?: number, estimatedDelivery?: string }>}
   */
  async createShipment(_params) {
    throw new Error("Method createShipment() must be implemented");
  }

  /**
   * Cancel shipment
   * @param {string} ref
   * @param {string} apiKey
   * @returns {Promise<{ ok: boolean, message?: string }>}
   */
  async cancelShipment(_ref, _apiKey) {
    throw new Error("Method cancelShipment() must be implemented");
  }
}
