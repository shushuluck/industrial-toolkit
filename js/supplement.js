/**
 * 用户补充功能模块
 * 支持：本地存储 + 在线提交到 Cloudflare Worker
 */
const SupplementModule = (() => {
  const API_BASE = 'https://plc.14616679.xyz/api';

  // 获取页面类型标识
  function getPageType() {
    const path = window.location.pathname;
    if (path.includes('fault-codes')) return 'fault_codes';
    if (path.includes('plc-instructions')) return 'plc_instructions';
    if (path.includes('electrical-symbols')) return 'electrical_symbols';
    if (path.includes('plc-snippets')) return 'plc_snippets';
    if (path.includes('modbus-lookup')) return 'modbus_lookup';
    return 'other';
  }

  // LocalStorage key
  function storageKey() {
    return `plc_supplement_${getPageType()}`;
  }

  // 读取本地数据
  function getLocal() {
    try {
      return JSON.parse(localStorage.getItem(storageKey()) || '[]');
    } catch { return []; }
  }

  // 保存本地数据
  function saveLocal(items) {
    localStorage.setItem(storageKey(), JSON.stringify(items));
  }

  // 添加到本地
  function addToLocal(data) {
    const items = getLocal();
    data.id = 'local_' + Date.now().toString(36);
    data.source = 'local';
    items.push(data);
    saveLocal(items);
    return data;
  }

  // 删除本地条目
  function deleteLocal(id) {
    const items = getLocal().filter(i => i.id !== id);
    saveLocal(items);
  }

  // 在线提交
  async function submitOnline(data) {
    const resp = await fetch(`${API_BASE}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: getPageType(),
        ...data
      })
    });
    return resp.json();
  }

  // 导出 JSON
  function exportJSON() {
    const data = getLocal();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `plc-supplement-${getPageType()}-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
  }

  // 导入 JSON
  function importJSON(callback) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const text = await file.text();
      try {
        const data = JSON.parse(text);
        if (!Array.isArray(data)) throw new Error('格式错误');
        const existing = getLocal();
        const merged = [...existing, ...data.map(d => ({ ...d, id: 'import_' + Date.now().toString(36) + Math.random().toString(36).substr(2,3), source: 'local' }))];
        saveLocal(merged);
        callback && callback(merged);
        showToast(`导入成功，共 ${merged.length} 条`);
      } catch (err) {
        showToast('导入失败：' + err.message, 'error');
      }
    };
    input.click();
  }

  // Toast 提示
  function showToast(msg, type = 'success') {
    const toast = document.createElement('div');
    toast.style.cssText = `position:fixed;top:20px;right:20px;padding:12px 20px;border-radius:8px;color:#fff;z-index:10000;font-size:14px;animation:fadeIn 0.3s;box-shadow:0 4px 12px rgba(0,0,0,0.3);`;
    toast.style.background = type === 'error' ? '#e74c3c' : '#27ae60';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity 0.3s'; setTimeout(() => toast.remove(), 300); }, 2500);
  }

  // 创建补充面板 UI
  function createPanel(fields, renderFn) {
    const pageType = getPageType();
    const panel = document.createElement('div');
    panel.className = 'supplement-panel';
    panel.innerHTML = `
      <style>
        .supplement-panel { margin: 20px 0; }
        .supplement-toggle { background: linear-gradient(135deg, #3498db, #2980b9); color: #fff; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 15px; display: flex; align-items: center; gap: 8px; transition: all 0.2s; }
        .supplement-toggle:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(52,152,219,0.4); }
        .supplement-content { display: none; margin-top: 16px; background: #1e1e2e; border: 1px solid #3a3a5c; border-radius: 12px; padding: 20px; }
        .supplement-content.open { display: block; }
        .supplement-actions { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 16px; }
        .supplement-actions button { background: #2d2d44; border: 1px solid #3a3a5c; color: #ccc; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 13px; transition: all 0.2s; }
        .supplement-actions button:hover { background: #3a3a5c; color: #fff; }
        .supplement-form { display: none; margin: 16px 0; background: #16162a; border: 1px solid #3a3a5c; border-radius: 8px; padding: 16px; }
        .supplement-form.open { display: block; }
        .supplement-form label { display: block; margin-bottom: 12px; }
        .supplement-form label span { display: block; color: #888; font-size: 12px; margin-bottom: 4px; }
        .supplement-form input, .supplement-form textarea, .supplement-form select { width: 100%; padding: 8px 12px; background: #0d0d1a; border: 1px solid #3a3a5c; border-radius: 6px; color: #eee; font-size: 14px; box-sizing: border-box; }
        .supplement-form textarea { min-height: 60px; resize: vertical; }
        .submit-row { display: flex; gap: 10px; margin-top: 16px; }
        .btn-submit { background: #27ae60; color: #fff; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-size: 14px; }
        .btn-submit:hover { background: #2ecc71; }
        .btn-cancel { background: #555; color: #fff; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-size: 14px; }
        .btn-online { background: #8e44ad; color: #fff; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-size: 14px; }
        .btn-online:hover { background: #9b59b6; }
        .supplement-items { margin-top: 16px; }
        .supplement-item { background: #16162a; border-left: 3px solid #3498db; border-radius: 6px; padding: 12px 16px; margin-bottom: 10px; position: relative; }
        .supplement-item .badge { position: absolute; top: 8px; right: 8px; background: #3498db; color: #fff; font-size: 10px; padding: 2px 8px; border-radius: 10px; }
        .supplement-item .badge.online { background: #8e44ad; }
        .supplement-item .delete-btn { position: absolute; bottom: 8px; right: 8px; background: #e74c3c; color: #fff; border: none; padding: 4px 10px; border-radius: 4px; cursor: pointer; font-size: 11px; }
      </style>
      <button class="supplement-toggle" onclick="this.nextElementSibling.classList.toggle('open')">
        📝 我的补充 <span style="font-size:12px;opacity:0.7">(${getLocal().length} 条)</span>
      </button>
      <div class="supplement-content">
        <div class="supplement-actions">
          <button onclick="SupplementModule.showForm()">➕ 添加数据</button>
          <button onclick="SupplementModule.exportJSON()">📥 导出JSON</button>
          <button onclick="SupplementModule.importJSON(()=>SupplementModule.refreshItems())">📤 导入JSON</button>
          <button onclick="SupplementModule.viewOnline()" class="btn-online">🌐 查看在线提交</button>
        </div>
        <div class="supplement-form" id="suppForm">
          <div id="formFields"></div>
          <div class="submit-row">
            <button class="btn-submit" onclick="SupplementModule.submitLocal()">💾 保存到本地</button>
            <button class="btn-online" onclick="SupplementModule.submitToServer()">🌐 提交到服务器</button>
            <button class="btn-cancel" onclick="SupplementModule.hideForm()">取消</button>
          </div>
        </div>
        <div class="supplement-items" id="suppItems"></div>
      </div>
    `;

    // Store config
    panel._fields = fields;
    panel._renderFn = renderFn;

    return panel;
  }

  // 当前面板配置
  let _currentFields = [];
  let _currentRenderFn = null;
  let _panelEl = null;

  function init(fields, renderFn, container) {
    _currentFields = fields;
    _currentRenderFn = renderFn;
    const panel = createPanel(fields, renderFn);
    _panelEl = panel;
    container.appendChild(panel);
    refreshItems();
  }

  function showForm() {
    const form = document.getElementById('suppForm');
    const fieldsDiv = document.getElementById('formFields');
    fieldsDiv.innerHTML = _currentFields.map(f => {
      if (f.type === 'select') {
        return `<label><span>${f.label}</span><select id="sf_${f.name}">${f.options.map(o => `<option value="${o}">${o}</option>`).join('')}</select></label>`;
      }
      if (f.type === 'textarea') {
        return `<label><span>${f.label}</span><textarea id="sf_${f.name}" placeholder="${f.placeholder||''}"></textarea></label>`;
      }
      return `<label><span>${f.label}</span><input type="text" id="sf_${f.name}" placeholder="${f.placeholder||''}"></label>`;
    }).join('');
    form.classList.add('open');
  }

  function hideForm() {
    document.getElementById('suppForm').classList.remove('open');
  }

  function getFormData() {
    const data = {};
    _currentFields.forEach(f => {
      const el = document.getElementById(`sf_${f.name}`);
      if (el) data[f.name] = el.value;
    });
    return data;
  }

  function submitLocal() {
    const data = getFormData();
    if (!validateForm(data)) return;
    addToLocal(data);
    hideForm();
    refreshItems();
    showToast('已保存到本地');
    updateToggleCount();
  }

  async function submitToServer() {
    const data = getFormData();
    if (!validateForm(data)) return;
    try {
      const result = await submitOnline(data);
      if (result.success) {
        hideForm();
        showToast('✅ 已提交到服务器，审核后显示');
      } else {
        showToast('提交失败：' + (result.error || '未知错误'), 'error');
      }
    } catch (e) {
      showToast('网络错误：' + e.message, 'error');
    }
  }

  function validateForm(data) {
    for (const f of _currentFields) {
      if (f.required && !data[f.name]) {
        showToast(`请填写 ${f.label}`, 'error');
        return false;
      }
    }
    return true;
  }

  function refreshItems() {
    const container = document.getElementById('suppItems');
    if (!container) return;
    const items = getLocal();
    if (items.length === 0) {
      container.innerHTML = '<p style="color:#666;text-align:center;padding:20px;">暂无补充数据</p>';
      return;
    }
    container.innerHTML = items.map(item => {
      const rendered = _currentRenderFn ? _currentRenderFn(item) : JSON.stringify(item);
      return `<div class="supplement-item">
        <span class="badge">用户补充</span>
        ${rendered}
        <button class="delete-btn" onclick="SupplementModule.deleteItem('${item.id}')">删除</button>
      </div>`;
    }).join('');
  }

  function deleteItem(id) {
    deleteLocal(id);
    refreshItems();
    updateToggleCount();
    showToast('已删除');
  }

  function updateToggleCount() {
    if (_panelEl) {
      const countSpan = _panelEl.querySelector('.supplement-toggle span');
      if (countSpan) countSpan.textContent = `(${getLocal().length} 条)`;
    }
  }

  async function viewOnline() {
    try {
      const resp = await fetch(`${API_BASE}/submissions`);
      const data = await resp.json();
      if (data.success && data.items.length > 0) {
        const typeItems = data.items.filter(i => i.type === getPageType());
        if (typeItems.length === 0) {
          showToast('暂无在线提交记录');
        } else {
          showToast(`在线提交：${typeItems.length} 条待审核`);
        }
      } else {
        showToast('暂无在线提交记录');
      }
    } catch (e) {
      showToast('查询失败：' + e.message, 'error');
    }
  }

  return {
    init, showForm, hideForm, submitLocal, submitToServer,
    refreshItems, deleteItem, exportJSON, importJSON, viewOnline
  };
})();
