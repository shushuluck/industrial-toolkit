export default {
  async fetch(request, env) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    // Strip /api prefix if present (for custom domain routing)
    let path = url.pathname;
    if (path.startsWith('/api')) {
      path = path.substring(4) || '/';
    }

    try {
      // POST /submit - 提交新数据
      if (request.method === 'POST' && (path === '/submit' || path === '/')) {
        const body = await request.json();
        const id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
        const submission = {
          id,
          ...body,
          created_at: new Date().toISOString(),
          status: 'pending'
        };
        await env.DATA_KV.put(`sub:${id}`, JSON.stringify(submission));
        // 索引
        const indexRaw = await env.DATA_KV.get('submissions_index');
        const index = indexRaw ? JSON.parse(indexRaw) : [];
        index.push(id);
        await env.DATA_KV.put('submissions_index', JSON.stringify(index));
        return new Response(JSON.stringify({ success: true, id }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // GET /submissions - 获取所有提交
      if (request.method === 'GET' && (path === '/submissions' || path === '/')) {
        const indexRaw = await env.DATA_KV.get('submissions_index');
        const index = indexRaw ? JSON.parse(indexRaw) : [];
        const items = [];
        for (const id of index.slice(-100)) {
          const item = await env.DATA_KV.get(`sub:${id}`, 'json');
          if (item) items.push(item);
        }
        return new Response(JSON.stringify({ success: true, count: items.length, items }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // DELETE /submission/:id - 删除提交
      if (request.method === 'DELETE' && path.startsWith('/submission/')) {
        const id = path.split('/')[2];
        await env.DATA_KV.delete(`sub:${id}`);
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // POST /visit - 记录访问次数
      if (request.method === 'POST' && path === '/visit') {
        const body = await request.json();
        const toolId = body.tool_id;
        if (!toolId) {
          return new Response(JSON.stringify({ error: 'Missing tool_id' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // 增加工具访问计数
        const toolKey = `stats:${toolId}`;
        const toolCountRaw = await env.DATA_KV.get(toolKey);
        const toolCount = (toolCountRaw ? parseInt(toolCountRaw) : 0) + 1;
        await env.DATA_KV.put(toolKey, toolCount.toString());

        // 增加全站总访问计数
        const totalKey = 'stats:total';
        const totalCountRaw = await env.DATA_KV.get(totalKey);
        const totalCount = (totalCountRaw ? parseInt(totalCountRaw) : 0) + 1;
        await env.DATA_KV.put(totalKey, totalCount.toString());

        return new Response(JSON.stringify({ success: true, tool_count: toolCount, total_count: totalCount }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // GET /stats - 获取统计数据
      if (request.method === 'GET' && path === '/stats') {
        const toolId = url.searchParams.get('tool_id');
        const totalKey = 'stats:total';
        const totalCountRaw = await env.DATA_KV.get(totalKey);
        const totalCount = totalCountRaw ? parseInt(totalCountRaw) : 0;

        if (toolId) {
          const toolKey = `stats:${toolId}`;
          const toolCountRaw = await env.DATA_KV.get(toolKey);
          const toolCount = toolCountRaw ? parseInt(toolCountRaw) : 0;
          return new Response(JSON.stringify({ success: true, tool_count: toolCount, total_count: totalCount }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // 如果没有 tool_id，返回所有工具的统计
        const stats = { total: totalCount, tools: {} };
        const list = await env.DATA_KV.list({ prefix: 'stats:' });
        for (const key of list.keys) {
          if (key.name !== 'stats:total') {
            const toolName = key.name.replace('stats:', '');
            const count = await env.DATA_KV.get(key.name);
            stats.tools[toolName] = count ? parseInt(count) : 0;
          }
        }

        return new Response(JSON.stringify({ success: true, stats }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ error: 'Not Found', path }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};
