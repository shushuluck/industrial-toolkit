/**
 * 使用次数统计模块
 * 显示本工具使用次数 + 全站总访问量
 * 支持响应式布局
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
      container = document.createElement('div');
      container.id = 'visitStats';

      // 插入到 tool-header 后面
      const toolHeader = document.querySelector('.tool-header');
      if (toolHeader) {
        toolHeader.parentNode.insertBefore(container, toolHeader.nextSibling);
      } else {
        // fallback: 插入到 container 开头
        const mainContainer = document.querySelector('.container');
        if (mainContainer) {
          mainContainer.insertBefore(container, mainContainer.firstChild);
        }
      }
    }

    container.innerHTML = `
      <style>
        #visitStats {
          display: flex;
          justify-content: flex-start;
          gap: 20px;
          padding: 12px 0;
          margin-bottom: 16px;
          font-size: 13px;
          color: var(--text-dim);
          border-bottom: 1px solid var(--border);
        }
        #visitStats .stat-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        #visitStats .stat-icon {
          font-size: 16px;
        }
        #visitStats .stat-value {
          color: var(--primary);
          font-weight: 600;
          font-family: var(--mono);
        }
        /* 手机版：改为纵向排列，更紧凑 */
        @media (max-width: 600px) {
          #visitStats {
            flex-direction: column;
            gap: 8px;
            padding: 8px 12px;
            margin: 0 -24px 16px -24px;
            padding: 10px 24px;
            background: var(--card);
            border: 1px solid var(--border);
            border-radius: var(--radius);
            font-size: 12px;
          }
          #visitStats .stat-item {
            justify-content: center;
          }
        }
      </style>
      <div class="stat-item">
        <span class="stat-icon">👁️</span>
        <span>本工具 <span class="stat-value">${formatNumber(toolCount)}</span> 次</span>
      </div>
      <div class="stat-item">
        <span class="stat-icon">🌐</span>
        <span>全站 <span class="stat-value">${formatNumber(totalCount)}</span> 次</span>
      </div>
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
