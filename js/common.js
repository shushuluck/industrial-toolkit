// Industrial Toolkit - Shared Utilities

// Copy to clipboard
function copyText(text, btn) {
  navigator.clipboard.writeText(text).then(() => {
    const orig = btn.textContent;
    btn.textContent = '✓ 已复制';
    btn.style.color = 'var(--success)';
    setTimeout(() => { btn.textContent = orig; btn.style.color = ''; }, 1500);
  });
}

// Format hex display
function toHex(n, pad = 2) {
  return '0x' + (n >>> 0).toString(16).toUpperCase().padStart(pad, '0');
}

// Parse input as different bases
function parseNumber(str) {
  str = str.trim();
  if (str.startsWith('0x') || str.startsWith('0X')) return parseInt(str, 16);
  if (str.startsWith('0b') || str.startsWith('0B')) return parseInt(str.slice(2), 2);
  if (str.startsWith('0o') || str.startsWith('0O')) return parseInt(str.slice(2), 8);
  return parseInt(str, 10);
}

// Validate number
function isValidNumber(str) {
  return !isNaN(parseNumber(str)) && str.trim() !== '';
}

// Show toast notification
function showToast(msg, type = 'info') {
  const toast = document.createElement('div');
  toast.textContent = msg;
  toast.style.cssText = `
    position: fixed; bottom: 24px; right: 24px; z-index: 9999;
    padding: 10px 20px; border-radius: 6px; font-size: 14px;
    color: #fff; animation: fadeIn 0.3s;
    background: ${type === 'error' ? 'var(--danger)' : type === 'success' ? 'var(--success)' : 'var(--primary)'};
    color: ${type === 'success' ? '#000' : type === 'info' ? '#000' : '#fff'};
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2000);
}

// Generate header HTML
function renderHeader(title, icon) {
  return `
    <div class="header">
      <a class="header-title" href="../index.html">
        <span class="icon">🏭</span>
        <div>
          <h1>工控工具箱</h1>
          <div class="subtitle">Industrial Toolkit</div>
        </div>
      </a>
      <div class="nav-links">
        <a href="../index.html">🏠 主页</a>
      </div>
    </div>
  `;
}

// Generate footer HTML
function renderFooter() {
  return `
    <div class="footer">
      工控工具箱 — 开源免费 | GitHub Pages 部署 | Built with ❤️
    </div>
  `;
}
