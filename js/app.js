// ═══════════════════════════════════════════════════════
// app.js — ダッシュボード全体制御
// ※ このファイルはすべての他jsが読み込まれた後に実行される
// ═══════════════════════════════════════════════════════

let APP = {};
let activeTab = '全社';

// ─── ダッシュボード描画 ──────────────────────────────
function renderDashboard() {
  document.getElementById('upload-screen').style.display = 'none';
  document.getElementById('page-tabs').style.display = 'flex';
  document.getElementById('dashboard').style.display = 'block';
  document.getElementById('header-period').textContent =
    `前年: ${APP.prevSeason}　/　当年: ${APP.currSeason}`;

  const tabsEl = document.getElementById('page-tabs');
  tabsEl.innerHTML = APP.allTabs.map(t =>
    `<button class="page-tab${t.id === activeTab ? ' active' : ''}"
       onclick="switchTab('${t.id}',this)">${t.label}</button>`
  ).join('');

  renderTab(activeTab);
}

// ─── タブ切り替え ────────────────────────────────────
function switchTab(id, btn) {
  activeTab = id;
  document.querySelectorAll('.page-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderTab(id);
}

function renderTab(tabId) {
  const d = APP.tabData[tabId];
  if (!d) return;

  destroyAllCharts();
  currentTabData = d;

  document.getElementById('dash-content').innerHTML = buildTabHTML(tabId, d);

  initBarChart(d);
  initHistChart(d, 'all');
  initDemograph(d);
  updateSim(130, d);

  renderAnnualTable(d);
  renderMonthTable(d);
  renderMonthActualTable(d);
}

// ─── タブHTML組み立て ────────────────────────────────
function buildTabHTML(tabId, d) {
  const c = d.curr, p = d.prev;

  const diffPt    = ((c.medianAch - p.medianAch) * 100).toFixed(1);
  const diffDel   = p.deliveries - c.deliveries;
  const diffVol   = c.avgVol - p.avgVol;
  const diffInt   = c.interval - p.interval;

  const arrow = (val, invertDown = false) => {
    const up = invertDown ? val <= 0 : val >= 0;
    return `<span class="${up ? 'up' : 'down'}">${up ? '▲' : '▼'} ${Math.abs(+val).toFixed(typeof val === 'string' ? 1 : 0)}${typeof val === 'string' ? 'pt' : ''}</span>`;
  };

  return `
<div class="summary-block">
  <div class="sb-header">
    <span class="sb-tag tag-actual">当年実績</span>
    <span class="sb-title">${APP.currSeason} 実績サマリー</span>
  </div>
  <div class="sb-body">
    <div class="sb-kpi">
      <div class="kl">しきい値配送達成率 中央値</div>
      <div class="kv">${(c.medianAch * 100).toFixed(1)}<span class="ku">%</span></div>
      <div class="kd ${c.medianAch >= p.medianAch ? 'up' : 'down'}">前シーズン比 ${c.medianAch >= p.medianAch ? '▲' : '▼'} ${Math.abs(diffPt)}pt</div>
    </div>
    <div class="sb-kpi">
      <div class="kl">配送回数</div>
      <div class="kv">${c.deliveries.toLocaleString()}<span class="ku">回</span></div>
      <div class="kd ${c.deliveries <= p.deliveries ? 'up' : 'down'}">前シーズン比 ${c.deliveries <= p.deliveries ? '▼' : '▲'} ${Math.abs(diffDel)}回</div>
    </div>
    <div class="sb-kpi">
      <div class="kl">平均給油量</div>
      <div class="kv">${c.avgVol.toFixed(1)}<span class="ku">L/回</span></div>
      <div class="kd ${c.avgVol >= p.avgVol ? 'up' : 'down'}">前シーズン比 ${c.avgVol >= p.avgVol ? '▲' : '▼'} ${Math.abs(diffVol).toFixed(1)}L</div>
    </div>
    <div class="sb-kpi">
      <div class="kl">平均配送間隔</div>
      <div class="kv">${c.interval.toFixed(1)}<span class="ku">日</span></div>
      <div class="kd ${c.interval >= p.interval ? 'up' : 'down'}">前シーズン比 ${c.interval >= p.interval ? '▲' : '▼'} ${Math.abs(diffInt).toFixed(1)}日</div>
    </div>
  </div>
  <div class="sb-note">
    ※ 容量以上の追加配送・マイナス給油除く　／　平均しきい値率 ${(c.threshRate * 100).toFixed(1)}%　／　グラフ傾き ${(c.slope * 100).toFixed(3)}%/日
  </div>
</div>

<div class="chart-grid">
  <div class="card" style="margin-bottom:0">
    <div class="ch">
      <div><div class="ct">センサー別 実績比較</div><div class="cs">センサー有/無/ALL × 当年/前年</div></div>
      <div style="display:flex;gap:3px">
        <button class="btn on" onclick="setBarMetric('cd',this)">配送回数</button>
        <button class="btn"    onclick="setBarMetric('av',this)">平均給油量</button>
        <button class="btn"    onclick="setBarMetric('ir',this)">給油時在庫率</button>
        <button class="btn"    onclick="setBarMetric('md',this)">達成率中央値</button>
      </div>
    </div>
    <div class="chart-wrap"><canvas id="bar-chart"></canvas></div>
  </div>
  <div class="card" style="margin-bottom:0">
    <div class="ch">
      <div><div class="ct">配送効率の達成状況</div><div class="cs">しきい値配送達成率の分布（100%超＝高効率配送）</div></div>
      <div style="display:flex;gap:3px">
        <button class="btn on" id="hist-btn-all" onclick="setHistSensor('all',this)">ALL</button>
        <button class="btn"    id="hist-btn-on"  onclick="setHistSensor('on',this)">センサー有</button>
        <button class="btn"    id="hist-btn-off" onclick="setHistSensor('off',this)">センサー無</button>
      </div>
    </div>
    <div class="chart-wrap"><canvas id="hist-chart"></canvas></div>
  </div>
</div>

<div class="tbl-wrap">
  <div class="tbl-hd">年間サマリー — センサー有無別</div>
  <div style="overflow-x:auto"><table>
    <thead>
      <tr>
        <th rowspan="2" style="vertical-align:middle">センサー</th>
        <th colspan="3" style="text-align:center;border-bottom:1px solid var(--bd)">配送回数</th>
        <th colspan="3" style="text-align:center;border-bottom:1px solid var(--bd)">総給油量 (L)</th>
        <th colspan="3" style="text-align:center;border-bottom:1px solid var(--bd)">平均給油量 (L)</th>
        <th colspan="3" style="text-align:center;border-bottom:1px solid var(--bd)">給油時在庫率</th>
        <th colspan="3" style="text-align:center;border-bottom:1px solid var(--bd)">達成率 中央値</th>
      </tr>
      <tr>
        <th>当年</th><th>前年</th><th>前年比</th>
        <th>当年</th><th>前年</th><th>前年比</th>
        <th>当年</th><th>前年</th><th>前年比</th>
        <th>当年</th><th>前年</th><th>前年比</th>
        <th>当年</th><th>前年</th><th>前年比</th>
      </tr>
    </thead>
    <tbody id="tbody-annual"></tbody>
  </table></div>
</div>

<div class="tbl-wrap">
  <div class="tbl-hd">
    月別データサマリー
    <div style="display:flex;gap:3px">
      <button class="btn on" id="mtab-actual" onclick="switchMonthTab('actual',this)">実績比較</button>
      <button class="btn"    id="mtab-demo"   onclick="switchMonthTab('demo',this)">デモグラフ指標</button>
    </div>
  </div>
  <div id="month-actual-body" style="overflow-x:auto"><table>
    <thead><tr>
      <th rowspan="2" style="vertical-align:middle">月</th>
      <th colspan="3" style="text-align:center;border-bottom:1px solid var(--bd)">配送回数</th>
      <th colspan="3" style="text-align:center;border-bottom:1px solid var(--bd)">総給油量 (L)</th>
      <th colspan="3" style="text-align:center;border-bottom:1px solid var(--bd)">平均給油量 (L)</th>
      <th colspan="3" style="text-align:center;border-bottom:1px solid var(--bd)">給油時在庫率</th>
    </tr><tr>
      <th>当年</th><th>前年</th><th>前年比</th>
      <th>当年</th><th>前年</th><th>前年比</th>
      <th>当年</th><th>前年</th><th>前年比</th>
      <th>当年</th><th>前年</th><th>前年比</th>
    </tr></thead>
    <tbody id="tbody-month-actual"></tbody>
  </table></div>
  <div id="month-demo-body" style="overflow-x:auto;display:none"><table>
    <thead><tr>
      <th>月</th><th>配送回数（当年）</th><th>配送回数（前年）</th>
      <th>平均配送間隔</th><th>平均給油量</th><th>給油率中央値</th>
      <th>傾き（当年）</th><th>傾き（前年）</th><th>傾き前年比</th>
    </tr></thead>
    <tbody id="tbody-month-demo"></tbody>
  </table></div>
</div>

<div class="summary-block" style="margin-top:20px">
  <div class="sb-header">
    <span class="sb-tag tag-sim">シミュレーション</span>
    <span class="sb-title">しきい値達成率を変えた場合の期待効果</span>
  </div>
  <div class="sb-body">
    <div class="sb-kpi" style="display:flex;flex-direction:column;justify-content:center;">
      <div class="kl">想定達成率（デモ値の前提）</div>
      <div style="display:flex;align-items:center;gap:8px;margin:5px 0 3px">
        <input type="range" id="sim-slider" min="100" max="200" step="5" value="130"
          style="flex:1;accent-color:var(--cdemo)" oninput="updateSimUI(this.value)">
        <span id="sim-pct" style="font-family:'DM Mono',monospace;font-size:19px;font-weight:500;color:var(--cdemo);min-width:48px">130%</span>
      </div>
      <div class="kd" id="sim-note">= タンク残量 — 以下で給油</div>
    </div>
    <div class="sb-kpi"><div class="kl">配送回数 削減効果</div><div class="kv" id="sim-delivery">—</div><div class="kd" id="sim-delivery-sub">—</div></div>
    <div class="sb-kpi"><div class="kl">平均給油量 改善効果</div><div class="kv" id="sim-vol">—</div><div class="kd" id="sim-vol-sub">—</div></div>
    <div class="sb-kpi"><div class="kl">平均配送間隔 改善効果</div><div class="kv" id="sim-interval">—</div><div class="kd" id="sim-interval-sub">—</div></div>
  </div>
  <div class="sb-note">
    ※ 想定達成率 n% = タンク容量 × (1 − n% × 平均しきい値率${(c.threshRate * 100).toFixed(1)}%) の残量以下で給油した場合の試算
  </div>
</div>

<div class="controls" style="margin-top:20px">
  <span class="cl">系列</span>
  <div class="cg">
    <button class="btn on" id="btn-ca" onclick="toggleDemo('ca',this)">当年（全体）</button>
    <button class="btn on" id="btn-cd" onclick="toggleDemo('cd',this)">今年デモ値</button>
    <button class="btn on" id="btn-pa" onclick="toggleDemo('pa',this)">前年（全体）</button>
    <button class="btn on" id="btn-pd" onclick="toggleDemo('pd',this)">前年デモ値</button>
  </div>
  <div class="sep"></div>
  <span class="cl">月別</span>
  <div class="cg" id="month-btns">
    <button class="btn on" onclick="setMonth('all',this)">全体</button>
    <button class="btn"    onclick="setMonth('oct',this)">10月</button>
    <button class="btn"    onclick="setMonth('nov',this)">11月</button>
    <button class="btn"    onclick="setMonth('dec',this)">12月</button>
    <button class="btn"    onclick="setMonth('jan',this)">1月</button>
    <button class="btn"    onclick="setMonth('feb',this)">2月</button>
  </div>
</div>
<div class="card">
  <div class="ch">
    <div><div class="ct">給油消費シミュレーション</div><div class="cs">縦軸：消費率の絶対値 / 破線：しきい値ライン</div></div>
    <div class="legend">
      <div class="li"><div class="ll" style="background:var(--curr)"></div><span style="color:var(--curr)">当年</span></div>
      <div class="li"><div class="ll dash" style="border-color:var(--cdemo)"></div><span style="color:var(--cdemo)">今年デモ値</span></div>
      <div class="li"><div class="ll" style="background:var(--prev)"></div><span style="color:var(--prev)">前年</span></div>
      <div class="li"><div class="ll dash" style="border-color:var(--pdemo)"></div><span style="color:var(--pdemo)">前年デモ値</span></div>
    </div>
  </div>
  <div class="chart-wrap-lg"><canvas id="demo-chart"></canvas></div>
</div>`;
}
