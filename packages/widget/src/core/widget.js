/**
 * Widget Core - Main widget controller
 */

export class Widget {
  constructor({ config, api, realtime, chat }) {
    this.config = config;
    this.api = api;
    this.realtime = realtime;
    this.chat = chat;

    this.isOpen = false;
    this.isAuthenticated = false;
    this.user = null;
    this.token = null;

    this.container = null;
    this.button = null;
  }

  /**
   * Mount the widget to DOM
   */
  async mount() {
    // Create container
    this.container = document.createElement('div');
    this.container.id = 'danuri-widget-container';
    this.container.className = `danuri-widget danuri-${this.config.position} danuri-${this.config.theme}`;

    // Create chat window (hidden initially)
    this.chat.render(this.container);

    // Create toggle button
    this.button = this._createButton();
    this.container.appendChild(this.button);

    // Inject styles
    this._injectStyles();

    // Append to body
    document.body.appendChild(this.container);

    // Authenticate if user info provided
    if (this.config.user && this.config.user.encryptedPayload) {
      await this._authenticate();
    }

    // Set up event listeners
    this._setupEventListeners();
  }

  /**
   * Unmount the widget from DOM
   */
  unmount() {
    if (this.container) {
      this.container.remove();
    }
    this.realtime.disconnect();
  }

  /**
   * Open chat window
   */
  open() {
    this.isOpen = true;
    this.chat.show();
    this.button.classList.add('danuri-button-hidden');
  }

  /**
   * Close chat window
   */
  close() {
    this.isOpen = false;
    this.chat.hide();
    this.button.classList.remove('danuri-button-hidden');
  }

  /**
   * Send a message
   */
  async sendMessage(message) {
    if (!this.isAuthenticated) {
      console.error('DanuriWidget: Not authenticated');
      return;
    }

    try {
      const response = await this.api.post('/api/chat', {
        message,
        sessionId: this.sessionId
      }, this.token);

      this.chat.addMessage('bot', response);
    } catch (error) {
      console.error('DanuriWidget: Failed to send message', error);
      this.chat.addMessage('bot', {
        type: 'error',
        content: '메시지 전송에 실패했습니다. 다시 시도해주세요.'
      });
    }
  }

  /**
   * Authenticate with the server
   */
  async _authenticate() {
    try {
      const result = await this.api.post('/api/auth/handshake', {
        siteKey: this.config.siteKey,
        encryptedPayload: this.config.user.encryptedPayload
      });

      this.token = result.token;
      this.user = result.user;
      this.isAuthenticated = true;
      this.sessionId = result.sessionId || crypto.randomUUID();

      // Connect to realtime
      await this.realtime.connect(result.wsToken);

      // Listen for ticket updates
      this.realtime.on('ticket:created', (data) => {
        this.chat.showNotification(`SR ${data.ticketNo} 접수 완료`);
      });

      this.realtime.on('ticket:updated', (data) => {
        this.chat.showNotification(`SR ${data.ticketNo} 상태: ${data.status}`);
      });

    } catch (error) {
      console.error('DanuriWidget: Authentication failed', error);
    }
  }

  /**
   * Create toggle button
   */
  _createButton() {
    const button = document.createElement('button');
    button.className = 'danuri-button';
    button.innerHTML = `
      <svg viewBox="0 0 24 24" width="24" height="24">
        <path fill="currentColor" d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
      </svg>
    `;
    button.setAttribute('aria-label', 'DANURI 챗봇 열기');

    button.addEventListener('click', () => {
      if (this.isOpen) {
        this.close();
      } else {
        this.open();
      }
    });

    return button;
  }

  /**
   * Set up event listeners
   */
  _setupEventListeners() {
    // Chat events
    this.chat.on('send', (message) => {
      this.sendMessage(message);
    });

    this.chat.on('close', () => {
      this.close();
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });
  }

  /**
   * Inject widget styles
   */
  _injectStyles() {
    if (document.getElementById('danuri-widget-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'danuri-widget-styles';
    style.textContent = `
      .danuri-widget {
        position: fixed;
        z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      .danuri-bottom-right {
        bottom: 20px;
        right: 20px;
      }

      .danuri-bottom-left {
        bottom: 20px;
        left: 20px;
      }

      .danuri-button {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        border: none;
        background: #0066cc;
        color: white;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        transition: transform 0.2s, box-shadow 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .danuri-button:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
      }

      .danuri-button-hidden {
        display: none;
      }

      .danuri-chat {
        position: absolute;
        bottom: 80px;
        right: 0;
        width: 380px;
        height: 520px;
        background: white;
        border-radius: 16px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
        display: none;
        flex-direction: column;
        overflow: hidden;
      }

      .danuri-chat.open {
        display: flex;
      }

      .danuri-dark .danuri-chat {
        background: #1a1a1a;
        color: #fff;
      }
    `;

    document.head.appendChild(style);
  }
}
