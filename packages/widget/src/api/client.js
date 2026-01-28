/**
 * API Client - HTTP communication with DANURI API server
 */

export class ApiClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  /**
   * Make a GET request
   * @param {string} path - API path
   * @param {string} token - JWT token
   * @returns {Promise<Object>} Response data
   */
  async get(path, token = null) {
    return this._request('GET', path, null, token);
  }

  /**
   * Make a POST request
   * @param {string} path - API path
   * @param {Object} data - Request body
   * @param {string} token - JWT token
   * @returns {Promise<Object>} Response data
   */
  async post(path, data, token = null) {
    return this._request('POST', path, data, token);
  }

  /**
   * Make a PATCH request
   * @param {string} path - API path
   * @param {Object} data - Request body
   * @param {string} token - JWT token
   * @returns {Promise<Object>} Response data
   */
  async patch(path, data, token = null) {
    return this._request('PATCH', path, data, token);
  }

  /**
   * Make a DELETE request
   * @param {string} path - API path
   * @param {string} token - JWT token
   * @returns {Promise<Object>} Response data
   */
  async delete(path, token = null) {
    return this._request('DELETE', path, null, token);
  }

  /**
   * Internal request method
   * @private
   */
  async _request(method, path, data = null, token = null) {
    const url = `${this.baseUrl}${path}`;
    const headers = {
      'Content-Type': 'application/json'
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const options = {
      method,
      headers,
      credentials: 'include'
    };

    if (data && (method === 'POST' || method === 'PATCH' || method === 'PUT')) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new ApiError(
          error.message || `HTTP ${response.status}`,
          response.status,
          error
        );
      }

      return response.json();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Network error', 0, { originalError: error.message });
    }
  }
}

/**
 * API Error class
 */
export class ApiError extends Error {
  constructor(message, status, data = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}
