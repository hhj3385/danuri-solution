/**
 * Crypto Utilities - RSA encryption for secure user data transmission
 */

export const CryptoUtils = {
  /**
   * Encrypt data with RSA public key
   * @param {string} publicKeyPem - PEM formatted public key
   * @param {Object} data - Data to encrypt
   * @returns {Promise<string>} Base64 encoded encrypted data
   */
  async encrypt(publicKeyPem, data) {
    // Add timestamp to prevent replay attacks
    const payload = {
      ...data,
      timestamp: Date.now()
    };

    // Convert PEM to ArrayBuffer
    const publicKey = await this._importPublicKey(publicKeyPem);

    // Encrypt
    const encoded = new TextEncoder().encode(JSON.stringify(payload));
    const encrypted = await crypto.subtle.encrypt(
      { name: 'RSA-OAEP' },
      publicKey,
      encoded
    );

    // Convert to Base64
    return this._arrayBufferToBase64(encrypted);
  },

  /**
   * Import PEM public key
   * @private
   */
  async _importPublicKey(pem) {
    // Remove PEM headers and newlines
    const pemContents = pem
      .replace(/-----BEGIN PUBLIC KEY-----/, '')
      .replace(/-----END PUBLIC KEY-----/, '')
      .replace(/\s/g, '');

    // Convert to ArrayBuffer
    const binaryString = atob(pemContents);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Import key
    return crypto.subtle.importKey(
      'spki',
      bytes.buffer,
      {
        name: 'RSA-OAEP',
        hash: 'SHA-256'
      },
      false,
      ['encrypt']
    );
  },

  /**
   * Convert ArrayBuffer to Base64
   * @private
   */
  _arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  },

  /**
   * Helper: Encrypt user info for widget initialization
   * @param {string} publicKey - PEM public key
   * @param {Object} userInfo - User information { email, name, ... }
   * @returns {Promise<Object>} Encrypted payload for DanuriWidget.init()
   */
  async encryptUserInfo(publicKey, userInfo) {
    const encryptedPayload = await this.encrypt(publicKey, userInfo);
    return {
      encryptedPayload
    };
  }
};
