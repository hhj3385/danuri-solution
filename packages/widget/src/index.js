/**
 * DANURI Widget SDK
 * Embeddable chatbot widget for external websites
 */

import { Widget } from './core/widget';
import { ChatUI } from './core/chat';
import { CryptoUtils } from './core/crypto';
import { ApiClient } from './api/client';
import { RealtimeClient } from './socket/realtime';

const DanuriWidget = {
  _instance: null,
  _config: null,

  /**
   * Initialize the widget
   * @param {Object} config - Configuration options
   * @param {string} config.siteKey - Site API key
   * @param {Object} config.user - User information (encrypted)
   * @param {string} config.position - Widget position (bottom-right, bottom-left)
   * @param {string} config.theme - Theme (light, dark)
   * @param {string} config.apiUrl - API server URL
   */
  init(config) {
    if (this._instance) {
      console.warn('DanuriWidget already initialized');
      return this._instance;
    }

    this._config = {
      position: 'bottom-right',
      theme: 'light',
      apiUrl: 'https://api.danuri.go.kr',
      ...config
    };

    if (!this._config.siteKey) {
      throw new Error('DanuriWidget: siteKey is required');
    }

    // Initialize components
    const api = new ApiClient(this._config.apiUrl);
    const realtime = new RealtimeClient(this._config.apiUrl);
    const chat = new ChatUI(this._config);

    this._instance = new Widget({
      config: this._config,
      api,
      realtime,
      chat
    });

    this._instance.mount();

    return this._instance;
  },

  /**
   * Destroy the widget
   */
  destroy() {
    if (this._instance) {
      this._instance.unmount();
      this._instance = null;
    }
  },

  /**
   * Open the chat window
   */
  open() {
    if (this._instance) {
      this._instance.open();
    }
  },

  /**
   * Close the chat window
   */
  close() {
    if (this._instance) {
      this._instance.close();
    }
  },

  /**
   * Send a message programmatically
   * @param {string} message - Message to send
   */
  sendMessage(message) {
    if (this._instance) {
      this._instance.sendMessage(message);
    }
  },

  /**
   * Get crypto utilities for encryption
   */
  crypto: CryptoUtils
};

// Expose to global scope
if (typeof window !== 'undefined') {
  window.DanuriWidget = DanuriWidget;
}

export default DanuriWidget;
