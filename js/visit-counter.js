/**
 * 使用次数统计模块
 * 显示本工具使用次数 + 全站总访问量
 */
const VisitCounter = (() => {
  const API_BASE = 'https://plc.14616679.xyz/api';

  // 从页面路径提取工具 ID
  function getToolId() {
    const path = window.location.pathname;
    if (path.includes('fault-codes')) return 'fault-codes';
    if (path.includes('plc-instructions')) return 'plc-instructions';
    if (path.includes('electrical-symbols')) return 'electrical-symbols';
    if (path.includes('plc-snippets')) return 'plc-snippets';
    if (path.includes('converter')) return 'converter';
    if (path.includes('crc')) return 'crc';
    if (path.includes('pid')) return 'pid';
    if (path.includes('modbus-lookup')) return 'modbus-lookup';
    if (path.includes('modbus-sim')) return 'modbus-sim';
    if (path.includes('manuals')) return 'manuals';
    if (path.includes('analog-converter')) return 'analog-converter';
    if (path.includes('cable-sizing')) return 'cable-sizing';
    if (path.includes('motor-start')) return 'motor-start';
    if (path.includes('timer-converter')) return 'timer-converter';
    if (path.includes('ip-calculator')) return 'ip-calculator';
    if (path.includes('safety-check')) return 'safety-check';
    if (path.includes('plc-variables')) return 'plc-variables';
    if (path.includes('wiring')) return 'wiring';
    if (path.includes('vfd')) return 'vfd';
    return 'other';
  }

  // 记录访问并获取统计
  async function trackVisit() {
    const toolId = getToolId();

    try {
      // 记录本次访问
      const resp = await fetch(`${API_BASE}/visit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool_id: toolId })
      });
      const data = await resp.json();

      if (data.success) {
        renderStats(data.tool_count, data.total_count);
        return data;
      }
    } catch (e) {
      console.warn('统计加载失败:', e);
      // 静默失败，不影响页面
    }

    return null;
  }

  // 渲染统计显示
  function renderStats(toolCount, totalCount) {
    // 查找或创建统计容器
    let container = document.getElementById('visitStats');
    if (!container) {
      // 在页面顶部创建
      container = document.createElement('div');
      container.id = 'visitStats';
      container.style.cssText = 'display:flex;justify-content:flex-end;gap:16px;padding:8px 20px;font-size:12px;color:var(--text-dim);opacity:0.7;';

      // 插入到 container 开头
      const mainContainer = document.querySelector('.container');
      if (mainContainer) {
        mainContainer.insertBefore(container, mainContainer.firstChild);
      }
    }

    container.innerHTML = `
      <span style="display:flex;align-items:center;gap:4px;">
        <span style="font-size:14px;">👁️</span>
        <span>本工具 <strong style="color:var(--primary);">${formatNumber(toolCount)}</strong> 次</span>
      </span>
      <span style="display:flex;align-items:center;gap:4px;">
        <span style="font-size:14px;">🌐</span>
        <span>全站 <strong style="color:var(--primary);">${formatNumber(totalCount)}</strong> 次</span>
      </span>
    `;
  }

  // 格式化数字（超过 1000 显示为 1.2k）
  function formatNumber(num) {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  }

  // 初始化（页面加载时自动调用）
  function init() {
    // DOM 加载完成后执行
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', trackVisit);
    } else {
      trackVisit();
    }
  }

  return { init, trackVisit, getToolId };
})();

// 自动初始化
VisitCounter.init();
