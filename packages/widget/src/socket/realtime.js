/**
 * Realtime Client - Socket.io connection for real-time updates
 */

import { io } from 'socket.io-client';

export class RealtimeClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.socket = null;
    this.listeners = {};
    this.connected = false;
  }

  /**
   * Connect to Socket.io server
   * @param {string} wsToken - WebSocket authentication token
   * @returns {Promise<void>}
   */
  connect(wsToken) {
    return new Promise((resolve, reject) => {
      this.socket = io(this.baseUrl, {
        transports: ['websocket', 'polling'],
        auth: {
          token: wsToken
        },
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });

      this.socket.on('connect', () => {
        this.connected = true;
        console.log('DanuriWidget: Connected to realtime server');
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('DanuriWidget: Connection error', error);
        reject(error);
      });

      this.socket.on('disconnect', (reason) => {
        this.connected = false;
        console.log('DanuriWidget: Disconnected', reason);
      });

      // Set up event forwarding
      this._setupEventForwarding();
    });
  }

  /**
   * Disconnect from server
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  /**
   * Add event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  /**
   * Remove event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }

  /**
   * Emit event to server
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  emit(event, data) {
    if (this.socket && this.connected) {
      this.socket.emit(event, data);
    }
  }

  /**
   * Forward socket events to listeners
   * @private
   */
  _setupEventForwarding() {
    const events = [
      'ticket:created',
      'ticket:updated',
      'ticket:assigned',
      'message:new'
    ];

    events.forEach(event => {
      this.socket.on(event, (data) => {
        this._emit(event, data);
      });
    });
  }

  /**
   * Emit to local listeners
   * @private
   */
  _emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => {
        try {
          cb(data);
        } catch (error) {
          console.error(`DanuriWidget: Error in ${event} listener`, error);
        }
      });
    }
  }
}
