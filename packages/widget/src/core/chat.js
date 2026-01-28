/**
 * Chat UI - Renders and manages the chat interface
 */

export class ChatUI {
  constructor(config) {
    this.config = config;
    this.container = null;
    this.messagesContainer = null;
    this.inputContainer = null;
    this.listeners = {};
  }

  /**
   * Render chat UI
   */
  render(parent) {
    this.container = document.createElement('div');
    this.container.className = 'danuri-chat';

    // Header
    const header = document.createElement('div');
    header.className = 'danuri-chat-header';
    header.innerHTML = `
      <div class="danuri-chat-title">
        <span>DANURI 챗봇</span>
      </div>
      <button class="danuri-chat-close" aria-label="닫기">
        <svg viewBox="0 0 24 24" width="20" height="20">
          <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </svg>
      </button>
    `;

    // Messages area
    this.messagesContainer = document.createElement('div');
    this.messagesContainer.className = 'danuri-chat-messages';

    // Welcome message
    this._addWelcomeMessage();

    // Input area
    this.inputContainer = document.createElement('div');
    this.inputContainer.className = 'danuri-chat-input';
    this.inputContainer.innerHTML = `
      <input type="text" placeholder="메시지를 입력하세요..." class="danuri-input">
      <button class="danuri-send-button" aria-label="전송">
        <svg viewBox="0 0 24 24" width="20" height="20">
          <path fill="currentColor" d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
        </svg>
      </button>
    `;

    // Assemble
    this.container.appendChild(header);
    this.container.appendChild(this.messagesContainer);
    this.container.appendChild(this.inputContainer);
    parent.appendChild(this.container);

    // Inject chat styles
    this._injectStyles();

    // Event listeners
    this._setupListeners();
  }

  /**
   * Show chat window
   */
  show() {
    this.container.classList.add('open');
    const input = this.inputContainer.querySelector('.danuri-input');
    setTimeout(() => input.focus(), 100);
  }

  /**
   * Hide chat window
   */
  hide() {
    this.container.classList.remove('open');
  }

  /**
   * Add a message to the chat
   */
  addMessage(sender, data) {
    const msg = document.createElement('div');
    msg.className = `danuri-message danuri-message-${sender}`;

    if (data.type === 'answer') {
      msg.innerHTML = `
        <div class="danuri-message-content">${data.content}</div>
        <div class="danuri-message-actions">
          <button class="danuri-action-btn" data-action="resolved">해결됨</button>
          <button class="danuri-action-btn" data-action="more_help">추가 도움 필요</button>
        </div>
      `;
    } else if (data.type === 'sr_form') {
      msg.innerHTML = `
        <div class="danuri-message-content">${data.message || '문의 내용을 등록해 드릴까요?'}</div>
        <form class="danuri-sr-form">
          <input type="text" name="title" placeholder="제목" required class="danuri-form-input">
          <textarea name="content" placeholder="내용" required class="danuri-form-textarea">${data.prefill?.content || ''}</textarea>
          <select name="category" class="danuri-form-select">
            <option value="">카테고리 선택</option>
            <option value="account">계정</option>
            <option value="technical">기술 지원</option>
            <option value="other">기타</option>
          </select>
          <button type="submit" class="danuri-form-submit">SR 등록</button>
        </form>
      `;
    } else if (data.type === 'error') {
      msg.innerHTML = `<div class="danuri-message-content danuri-error">${data.content}</div>`;
    } else {
      msg.innerHTML = `<div class="danuri-message-content">${data.content || data}</div>`;
    }

    this.messagesContainer.appendChild(msg);
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }

  /**
   * Show notification
   */
  showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'danuri-notification';
    notification.textContent = message;
    this.container.appendChild(notification);

    setTimeout(() => notification.remove(), 5000);
  }

  /**
   * Add event listener
   */
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  /**
   * Emit event
   */
  _emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => cb(data));
    }
  }

  /**
   * Set up event listeners
   */
  _setupListeners() {
    // Close button
    const closeBtn = this.container.querySelector('.danuri-chat-close');
    closeBtn.addEventListener('click', () => this._emit('close'));

    // Send message
    const input = this.inputContainer.querySelector('.danuri-input');
    const sendBtn = this.inputContainer.querySelector('.danuri-send-button');

    const sendMessage = () => {
      const message = input.value.trim();
      if (message) {
        this.addMessage('user', { content: message });
        this._emit('send', message);
        input.value = '';
      }
    };

    sendBtn.addEventListener('click', sendMessage);
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        sendMessage();
      }
    });

    // Action buttons (delegation)
    this.messagesContainer.addEventListener('click', (e) => {
      if (e.target.matches('.danuri-action-btn')) {
        const action = e.target.dataset.action;
        this._emit('action', action);
      }
    });

    // SR form submission
    this.messagesContainer.addEventListener('submit', (e) => {
      if (e.target.matches('.danuri-sr-form')) {
        e.preventDefault();
        const formData = new FormData(e.target);
        this._emit('sr-submit', Object.fromEntries(formData));
      }
    });
  }

  /**
   * Add welcome message
   */
  _addWelcomeMessage() {
    this.addMessage('bot', {
      content: '안녕하세요! DANURI 챗봇입니다. 무엇을 도와드릴까요?'
    });
  }

  /**
   * Inject chat-specific styles
   */
  _injectStyles() {
    if (document.getElementById('danuri-chat-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'danuri-chat-styles';
    style.textContent = `
      .danuri-chat-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px;
        background: #0066cc;
        color: white;
      }

      .danuri-chat-title {
        font-weight: 600;
        font-size: 16px;
      }

      .danuri-chat-close {
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        padding: 4px;
      }

      .danuri-chat-messages {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
      }

      .danuri-message {
        margin-bottom: 12px;
        max-width: 85%;
      }

      .danuri-message-user {
        margin-left: auto;
      }

      .danuri-message-bot {
        margin-right: auto;
      }

      .danuri-message-content {
        padding: 10px 14px;
        border-radius: 12px;
        line-height: 1.4;
      }

      .danuri-message-user .danuri-message-content {
        background: #0066cc;
        color: white;
        border-bottom-right-radius: 4px;
      }

      .danuri-message-bot .danuri-message-content {
        background: #f0f0f0;
        color: #333;
        border-bottom-left-radius: 4px;
      }

      .danuri-chat-input {
        display: flex;
        padding: 12px;
        border-top: 1px solid #eee;
        gap: 8px;
      }

      .danuri-input {
        flex: 1;
        padding: 10px 14px;
        border: 1px solid #ddd;
        border-radius: 20px;
        outline: none;
        font-size: 14px;
      }

      .danuri-input:focus {
        border-color: #0066cc;
      }

      .danuri-send-button {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        border: none;
        background: #0066cc;
        color: white;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .danuri-message-actions {
        display: flex;
        gap: 8px;
        margin-top: 8px;
      }

      .danuri-action-btn {
        padding: 6px 12px;
        border: 1px solid #ddd;
        border-radius: 16px;
        background: white;
        cursor: pointer;
        font-size: 12px;
      }

      .danuri-action-btn:hover {
        background: #f0f0f0;
      }

      .danuri-sr-form {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-top: 8px;
      }

      .danuri-form-input,
      .danuri-form-textarea,
      .danuri-form-select {
        padding: 8px 12px;
        border: 1px solid #ddd;
        border-radius: 8px;
        font-size: 14px;
      }

      .danuri-form-textarea {
        min-height: 80px;
        resize: vertical;
      }

      .danuri-form-submit {
        padding: 10px;
        background: #0066cc;
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 500;
      }

      .danuri-notification {
        position: absolute;
        top: 70px;
        left: 50%;
        transform: translateX(-50%);
        background: #333;
        color: white;
        padding: 10px 20px;
        border-radius: 20px;
        font-size: 14px;
        animation: fadeInOut 5s ease-in-out;
      }

      @keyframes fadeInOut {
        0%, 100% { opacity: 0; }
        10%, 90% { opacity: 1; }
      }

      .danuri-error {
        background: #fee !important;
        color: #c00 !important;
      }
    `;

    document.head.appendChild(style);
  }
}
