'use strict';

const crypto = require('crypto');

/**
 * RSA Decrypt Middleware
 * Decrypts user payload sent from external sites
 */
module.exports = function(app) {
  return async function(req, res, next) {
    try {
      const { siteKey, encryptedPayload } = req.body;

      if (!siteKey || !encryptedPayload) {
        return next();
      }

      // Get private key from database
      const apiKeyService = app.service('api/api-keys');
      const result = await apiKeyService.find({
        query: {
          key_id: siteKey,
          status: 'active',
          $limit: 1
        }
      });

      if (!result.data || result.data.length === 0) {
        return res.status(401).json({
          error: 'Invalid site key'
        });
      }

      const apiKey = result.data[0];

      // Decrypt the payload
      const privateKey = apiKey.private_key;
      const buffer = Buffer.from(encryptedPayload, 'base64');

      const decrypted = crypto.privateDecrypt(
        {
          key: privateKey,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: 'sha256'
        },
        buffer
      );

      const payload = JSON.parse(decrypted.toString());

      // Validate timestamp (5 minutes window)
      const now = Date.now();
      if (now - payload.timestamp > 5 * 60 * 1000) {
        return res.status(401).json({
          error: 'Payload expired'
        });
      }

      // Attach decrypted data to request
      req.decryptedPayload = payload;
      req.siteId = apiKey.site_id;

      next();
    } catch (error) {
      console.error('Decrypt middleware error:', error);
      return res.status(401).json({
        error: 'Failed to decrypt payload'
      });
    }
  };
};
