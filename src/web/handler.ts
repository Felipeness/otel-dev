import type { ServerResponse } from 'node:http'

function getHtmlContent(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>otel-dev</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', monospace; background: #0d1117; color: #c9d1d9; height: 100vh; display: flex; flex-direction: column; overflow: hidden; }
  header { display: flex; align-items: center; justify-content: space-between; padding: 12px 20px; border-bottom: 1px solid #21262d; gap: 12px; }
  header h1 { font-size: 16px; font-weight: 600; flex-shrink: 0; }
  header h1 span { color: #3fb950; }
  .hdr-right { display: flex; align-items: center; gap: 12px; }
  .stats { font-size: 12px; color: #8b949e; white-space: nowrap; }
  .btn-clear { background: none; border: 1px solid #30363d; color: #8b949e; font-size: 12px; padding: 4px 10px; border-radius: 4px; cursor: pointer; transition: all 0.15s; }
  .btn-clear:hover { color: #f85149; border-color: #f85149; }
  .status { font-size: 12px; display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
  .status .dot { width: 8px; height: 8px; border-radius: 50%; background: #f85149; }
  .status.connected .dot { background: #3fb950; }
  .container { display: flex; flex: 1; overflow: hidden; }
  .trace-list { width: 40%; border-right: 1px solid #21262d; display: flex; flex-direction: column; }
  .search-box { padding: 10px 12px; border-bottom: 1px solid #21262d; display: flex; align-items: center; gap: 8px; }
  .search-box input { flex: 1; background: #0d1117; border: 1px solid #30363d; color: #c9d1d9; font-size: 13px; padding: 6px 10px; border-radius: 4px; outline: none; font-family: inherit; }
  .search-box input:focus { border-color: #58a6ff; }
  .search-box .search-count { font-size: 11px; color: #8b949e; white-space: nowrap; }
  .trace-items { flex: 1; overflow-y: auto; }
  .detail-panel { width: 60%; display: flex; flex-direction: column; overflow: hidden; }
  .waterfall { flex: 1; overflow-y: auto; padding: 16px; }
  .trace-item { padding: 10px 16px; border-bottom: 1px solid #21262d; cursor: pointer; transition: background 0.1s; }
  .trace-item:hover { background: #161b22; }
  .trace-item.selected { background: #1c2333; border-left: 3px solid #3fb950; }
  .trace-item .service { color: #79c0ff; font-size: 13px; font-weight: 600; }
  .trace-item .operation { color: #c9d1d9; font-size: 12px; margin-top: 2px; }
  .trace-item .meta { display: flex; gap: 10px; margin-top: 4px; font-size: 11px; color: #8b949e; }
  .trace-item .error-badge { background: #f8514926; color: #f85149; padding: 1px 6px; border-radius: 3px; font-size: 10px; font-weight: 600; }
  .empty { display: flex; align-items: center; justify-content: center; height: 100%; color: #484f58; font-size: 14px; }
  .span-row { display: flex; align-items: center; padding: 6px 0; font-size: 12px; border-bottom: 1px solid #21262d10; cursor: pointer; transition: background 0.1s; }
  .span-row:hover { background: #161b22; }
  .span-row.selected { background: #1c2333; }
  .span-indent { flex-shrink: 0; }
  .span-name { color: #c9d1d9; min-width: 180px; flex-shrink: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .span-bar-container { flex: 1; height: 16px; position: relative; margin: 0 12px; }
  .span-bar { position: absolute; height: 100%; border-radius: 2px; min-width: 2px; background: #1f6feb; }
  .span-bar.error { background: #f85149; }
  .span-duration { color: #8b949e; font-size: 11px; min-width: 70px; text-align: right; flex-shrink: 0; }
  .detail-header { font-size: 14px; font-weight: 600; margin-bottom: 12px; color: #e6edf3; }
  .span-kind { color: #8b949e; font-size: 10px; margin-left: 6px; padding: 1px 4px; border: 1px solid #30363d; border-radius: 3px; }
  .span-detail { background: #161b22; border-top: 1px solid #21262d; padding: 16px; overflow-y: auto; max-height: 40%; }
  .span-detail h3 { font-size: 13px; color: #e6edf3; margin-bottom: 8px; }
  .span-detail .sd-meta { display: flex; gap: 16px; font-size: 12px; color: #8b949e; margin-bottom: 12px; flex-wrap: wrap; }
  .span-detail .sd-meta b { color: #c9d1d9; font-weight: 500; }
  .attr-table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 12px; }
  .attr-table th { text-align: left; color: #8b949e; padding: 4px 8px; border-bottom: 1px solid #21262d; font-weight: 500; }
  .attr-table td { padding: 4px 8px; border-bottom: 1px solid #21262d10; }
  .attr-table tr:nth-child(even) td { background: #0d1117; }
  .attr-table .attr-key { color: #79c0ff; }
  .attr-table .attr-val { color: #c9d1d9; font-family: monospace; word-break: break-all; }
  .evt-item { font-size: 12px; padding: 6px 0; border-bottom: 1px solid #21262d10; }
  .evt-item .evt-name { color: #d2a8ff; font-weight: 500; }
  .evt-item .evt-time { color: #8b949e; font-size: 11px; margin-left: 8px; }
  .section-title { font-size: 12px; color: #8b949e; text-transform: uppercase; letter-spacing: 0.5px; margin: 8px 0 4px; }
</style>
</head>
<body>
<header>
  <h1><span>otel</span>-dev</h1>
  <div class="hdr-right">
    <span class="stats" id="stats"></span>
    <button class="btn-clear" id="btnClear" title="Clear traces (c)">Clear</button>
    <div class="status" id="status"><div class="dot"></div><span>Disconnected</span></div>
  </div>
</header>
<div class="container">
  <div class="trace-list">
    <div class="search-box">
      <input type="text" id="searchInput" placeholder="Search traces... ( / )" />
      <span class="search-count" id="searchCount"></span>
    </div>
    <div class="trace-items" id="traceItems">
      <div class="empty">Waiting for traces...</div>
    </div>
  </div>
  <div class="detail-panel" id="detailPanel">
    <div class="waterfall" id="waterfall">
      <div class="empty">Select a trace to view spans</div>
    </div>
  </div>
</div>
<script>
(function() {
  var KINDS = ['UNSPECIFIED','INTERNAL','SERVER','CLIENT','PRODUCER','CONSUMER'];
  var STATUS = ['UNSET','OK','ERROR'];
  var traces = [], selectedTraceId = null, selectedSpanId = null, sse = null, searchTimer = null, searchQuery = '';

  function esc(s) { var d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; }
  function fmtDur(ms) { return ms < 1 ? '<1ms' : ms < 1000 ? Math.round(ms) + 'ms' : (ms / 1000).toFixed(2) + 's'; }
  function relTime(ms) { var d = Date.now() - ms; return d < 1000 ? 'just now' : d < 60000 ? Math.floor(d/1000) + 's ago' : d < 3600000 ? Math.floor(d/60000) + 'm ago' : Math.floor(d/3600000) + 'h ago'; }

  function connectSSE() {
    if (sse) sse.close();
    var url = searchQuery ? '/sse?q=' + encodeURIComponent(searchQuery) : '/sse';
    sse = new EventSource(url);
    sse.onopen = function() {
      document.getElementById('status').className = 'status connected';
      document.getElementById('status').querySelector('span').textContent = 'Connected';
    };
    sse.onmessage = function(e) {
      try { traces = JSON.parse(e.data); renderAll(); } catch {}
    };
    sse.onerror = function() {
      document.getElementById('status').className = 'status';
      document.getElementById('status').querySelector('span').textContent = 'Disconnected';
      sse.close();
      setTimeout(connectSSE, 2000);
    };
  }

  function renderAll() {
    updateStats();
    renderTraceList();
    if (selectedTraceId) renderWaterfall(selectedTraceId);
  }

  function updateStats() {
    var spans = traces.reduce(function(a, t) { return a + t.spanCount; }, 0);
    document.getElementById('stats').textContent = traces.length + ' trace' + (traces.length !== 1 ? 's' : '') + ' \\u00b7 ' + spans + ' span' + (spans !== 1 ? 's' : '');
    document.getElementById('searchCount').textContent = traces.length + ' trace' + (traces.length !== 1 ? 's' : '');
  }

  function renderTraceList() {
    var el = document.getElementById('traceItems');
    if (!traces.length) { el.innerHTML = '<div class="empty">' + (searchQuery ? 'No matching traces' : 'Waiting for traces...') + '</div>'; return; }
    var h = '';
    for (var i = 0; i < traces.length; i++) {
      var t = traces[i], sel = t.traceId === selectedTraceId;
      h += '<div class="trace-item' + (sel ? ' selected' : '') + '" data-id="' + t.traceId + '">';
      h += '<div class="service">' + esc(t.serviceName) + '</div>';
      h += '<div class="operation">' + esc(t.rootSpan.name) + '</div>';
      h += '<div class="meta"><span>' + fmtDur(t.durationMs) + '</span><span>' + t.spanCount + ' span' + (t.spanCount !== 1 ? 's' : '') + '</span><span>' + relTime(t.rootSpan.startTimeMs) + '</span>';
      if (t.hasError) h += '<span class="error-badge">ERROR</span>';
      h += '</div></div>';
    }
    el.innerHTML = h;
    el.querySelectorAll('.trace-item').forEach(function(item) {
      item.addEventListener('click', function() {
        selectedTraceId = this.dataset.id;
        selectedSpanId = null;
        renderTraceList();
        renderWaterfall(selectedTraceId);
      });
    });
  }

  function buildTree(spans) {
    var byId = {}, roots = [];
    spans.forEach(function(s) { byId[s.spanId] = { span: s, children: [] }; });
    spans.forEach(function(s) {
      if (s.parentSpanId && byId[s.parentSpanId]) byId[s.parentSpanId].children.push(byId[s.spanId]);
      else roots.push(byId[s.spanId]);
    });
    return roots;
  }

  function flatten(nodes, depth) {
    var r = [];
    nodes.forEach(function(n) { r.push({ span: n.span, depth: depth }); r = r.concat(flatten(n.children, depth + 1)); });
    return r;
  }

  function renderWaterfall(traceId) {
    var wf = document.getElementById('waterfall');
    var trace = traces.find(function(t) { return t.traceId === traceId; });
    if (!trace) { wf.innerHTML = '<div class="empty">Trace not found</div>'; hideSpanDetail(); return; }
    var flat = flatten(buildTree(trace.spans), 0);
    var tStart = trace.rootSpan.startTimeMs, tDur = trace.durationMs || 1;
    var h = '<div class="detail-header">' + esc(trace.rootSpan.name) + ' &mdash; ' + fmtDur(trace.durationMs) + '</div>';
    for (var i = 0; i < flat.length; i++) {
      var f = flat[i], s = f.span;
      var off = ((s.startTimeMs - tStart) / tDur) * 100, w = Math.max((s.durationMs / tDur) * 100, 0.5);
      var isErr = s.status && s.status.code === 2, isSel = s.spanId === selectedSpanId;
      h += '<div class="span-row' + (isSel ? ' selected' : '') + '" data-sid="' + s.spanId + '">';
      h += '<div class="span-indent" style="width:' + (f.depth * 20) + 'px"></div>';
      h += '<div class="span-name">' + esc(s.name) + '<span class="span-kind">' + KINDS[s.kind || 0] + '</span></div>';
      h += '<div class="span-bar-container"><div class="span-bar' + (isErr ? ' error' : '') + '" style="left:' + off + '%;width:' + w + '%"></div></div>';
      h += '<div class="span-duration">' + fmtDur(s.durationMs) + '</div></div>';
    }
    wf.innerHTML = h;
    wf.querySelectorAll('.span-row').forEach(function(row) {
      row.addEventListener('click', function() {
        var sid = this.dataset.sid;
        selectedSpanId = selectedSpanId === sid ? null : sid;
        renderWaterfall(traceId);
        if (selectedSpanId) renderSpanDetail(trace, selectedSpanId); else hideSpanDetail();
      });
    });
    if (selectedSpanId) renderSpanDetail(trace, selectedSpanId); else hideSpanDetail();
  }

  function renderSpanDetail(trace, spanId) {
    var span = trace.spans.find(function(s) { return s.spanId === spanId; });
    if (!span) { hideSpanDetail(); return; }
    var existing = document.getElementById('spanDetail');
    if (!existing) {
      existing = document.createElement('div');
      existing.id = 'spanDetail';
      existing.className = 'span-detail';
      document.getElementById('detailPanel').appendChild(existing);
    }
    var h = '<h3>' + esc(span.name) + '</h3>';
    h += '<div class="sd-meta">';
    h += '<span>Kind: <b>' + KINDS[span.kind || 0] + '</b></span>';
    h += '<span>Duration: <b>' + fmtDur(span.durationMs) + '</b></span>';
    h += '<span>Status: <b>' + STATUS[span.status ? span.status.code : 0] + '</b></span>';
    if (span.status && span.status.message) h += '<span>Message: <b>' + esc(span.status.message) + '</b></span>';
    h += '</div>';
    var attrs = span.attributes || {};
    var keys = Object.keys(attrs);
    if (keys.length) {
      h += '<div class="section-title">Attributes</div>';
      h += '<table class="attr-table"><tr><th>Key</th><th>Value</th></tr>';
      for (var i = 0; i < keys.length; i++) {
        var v = typeof attrs[keys[i]] === 'object' ? JSON.stringify(attrs[keys[i]]) : String(attrs[keys[i]]);
        h += '<tr><td class="attr-key">' + esc(keys[i]) + '</td><td class="attr-val">' + esc(v) + '</td></tr>';
      }
      h += '</table>';
    }
    var events = span.events || [];
    if (events.length) {
      h += '<div class="section-title">Events</div>';
      for (var j = 0; j < events.length; j++) {
        var ev = events[j];
        h += '<div class="evt-item"><span class="evt-name">' + esc(ev.name) + '</span><span class="evt-time">' + new Date(ev.timeUnixNano ? ev.timeUnixNano / 1e6 : 0).toISOString() + '</span>';
        var ea = ev.attributes || {};
        var ek = Object.keys(ea);
        if (ek.length) {
          h += '<table class="attr-table" style="margin-top:4px"><tr><th>Key</th><th>Value</th></tr>';
          for (var k = 0; k < ek.length; k++) {
            var ev2 = typeof ea[ek[k]] === 'object' ? JSON.stringify(ea[ek[k]]) : String(ea[ek[k]]);
            h += '<tr><td class="attr-key">' + esc(ek[k]) + '</td><td class="attr-val">' + esc(ev2) + '</td></tr>';
          }
          h += '</table>';
        }
        h += '</div>';
      }
    }
    if (!keys.length && !events.length) h += '<div style="color:#484f58;font-size:12px;margin-top:8px;">No attributes or events</div>';
    existing.innerHTML = h;
    existing.style.display = 'block';
  }

  function hideSpanDetail() {
    var el = document.getElementById('spanDetail');
    if (el) el.style.display = 'none';
  }

  function clearTraces() {
    fetch('/v1/traces', { method: 'DELETE' }).catch(function() {});
    traces = [];
    selectedTraceId = null;
    selectedSpanId = null;
    renderAll();
    document.getElementById('waterfall').innerHTML = '<div class="empty">Select a trace to view spans</div>';
    hideSpanDetail();
  }

  var searchInput = document.getElementById('searchInput');
  searchInput.addEventListener('input', function() {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(function() {
      searchQuery = searchInput.value.trim();
      connectSSE();
    }, 300);
  });

  document.getElementById('btnClear').addEventListener('click', clearTraces);

  document.addEventListener('keydown', function(e) {
    var active = document.activeElement;
    var inInput = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA');
    if (e.key === '/' && !inInput) { e.preventDefault(); searchInput.focus(); return; }
    if (e.key === 'Escape') {
      if (inInput) { searchInput.value = ''; searchInput.blur(); searchQuery = ''; connectSSE(); return; }
      if (selectedSpanId) { selectedSpanId = null; if (selectedTraceId) renderWaterfall(selectedTraceId); hideSpanDetail(); return; }
      if (selectedTraceId) { selectedTraceId = null; renderTraceList(); document.getElementById('waterfall').innerHTML = '<div class="empty">Select a trace to view spans</div>'; hideSpanDetail(); return; }
    }
    if (e.key === 'c' && !inInput) { clearTraces(); }
  });

  connectSSE();
})();
</script>
</body>
</html>`
}

export function serveHtml(res: ServerResponse): void {
  const html = getHtmlContent()
  res.writeHead(200, {
    'Content-Type': 'text/html; charset=utf-8',
    'Content-Length': Buffer.byteLength(html),
  })
  res.end(html)
}
