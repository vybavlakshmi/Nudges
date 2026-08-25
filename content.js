let overlay = null;

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'show-nudge') {
    showNudge(msg.title, msg.message, msg.isBlocked);
    sendResponse({ ok: true });
  }
  if (msg.type === 'hide-nudge') {
    hideNudge();
    sendResponse({ ok: true });
  }
});

function showNudge(title, message, isBlocked) {
  hideNudge();

  overlay = document.createElement('div');
  overlay.id = 'maya-nudge-overlay';
  overlay.innerHTML = `
    <div id="maya-nudge-card">
      <div id="maya-nudge-bar" style="background:${isBlocked ? '#c0392b' : '#2d6a4f'}"></div>
      <div id="maya-nudge-content">
        <div id="maya-nudge-title">${escapeHtml(title)}</div>
        <div id="maya-nudge-msg">${escapeHtml(message)}</div>
        <div id="maya-nudge-actions">
          <button id="maya-nudge-back" class="maya-btn maya-btn-primary">Back on track</button>
          <button id="maya-nudge-related" class="maya-btn maya-btn-secondary">It's related</button>
        </div>
      </div>
    </div>
  `;

  const style = document.createElement('style');
  style.id = 'maya-nudge-style';
  style.textContent = `
    #maya-nudge-overlay {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 2147483647;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      animation: maya-slide-in 0.3s ease-out;
    }
    @keyframes maya-slide-in {
      from { transform: translateX(120%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes maya-slide-out {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(120%); opacity: 0; }
    }
    #maya-nudge-card {
      width: 340px;
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08);
      overflow: hidden;
    }
    #maya-nudge-bar {
      height: 4px;
      width: 100%;
    }
    #maya-nudge-content {
      padding: 16px;
    }
    #maya-nudge-title {
      font-size: 14px;
      font-weight: 700;
      color: #1a1a1a;
      margin-bottom: 6px;
    }
    #maya-nudge-msg {
      font-size: 13px;
      color: #444;
      line-height: 1.4;
      margin-bottom: 14px;
    }
    #maya-nudge-actions {
      display: flex;
      gap: 8px;
    }
    .maya-btn {
      flex: 1;
      padding: 8px 12px;
      border: none;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.15s;
    }
    .maya-btn:hover { opacity: 0.85; }
    .maya-btn-primary {
      background: #2d6a4f;
      color: #fff;
    }
    .maya-btn-secondary {
      background: #e8e8e8;
      color: #333;
    }
  `;

  document.documentElement.appendChild(style);
  document.documentElement.appendChild(overlay);

  document.getElementById('maya-nudge-back').addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'nudge-response', action: 'back' });
    dismissWithAnimation();
  });

  document.getElementById('maya-nudge-related').addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'nudge-response', action: 'related' });
    dismissWithAnimation();
  });
}

function dismissWithAnimation() {
  const card = document.getElementById('maya-nudge-overlay');
  if (card) {
    card.style.animation = 'maya-slide-out 0.2s ease-in forwards';
    setTimeout(hideNudge, 200);
  }
}

function hideNudge() {
  const el = document.getElementById('maya-nudge-overlay');
  if (el) el.remove();
  const st = document.getElementById('maya-nudge-style');
  if (st) st.remove();
  overlay = null;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
