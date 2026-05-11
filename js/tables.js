// ═══════════════════════════════════════════════════════
// tables.js — テーブル描画
// ═══════════════════════════════════════════════════════

// ─── 前年比セル ──────────────────────────────────────
// invertDown=true のとき「減少」が良いとみなす（配送回数など）
function rc(c, p, invertDown = false) {
  if (!p || p === 0) return '<span style="color:var(--tx3)">—</span>';
  const r = c / p;
  const increased = r >= 1;
  const isGood = invertDown ? !increased : increased;
  return `<span class="${isGood ? 'up' : 'down'}">${increased ? '▲' : '▼'} ${(r * 100).toFixed(1)}%</span>`;
}

// ─── 年間サマリーテーブル ────────────────────────────
function renderAnnualTable(d) {
  const el = document.getElementById('tbody-annual');
  if (!el) return;

  const rows = [
    { label: 'センサー有', dot: 'var(--curr)', curr: d.currOn,  prev: d.prevOn  },
    { label: 'センサー無', dot: 'var(--prev)', curr: d.currOff, prev: d.prevOff },
    { label: 'ALL',       dot: '#6b7280',     curr: d.curr,    prev: d.prev    },
  ];

  el.innerHTML = rows.map(r => {
    const c = r.curr, p = r.prev;
    const fw = r.label === 'ALL' ? 'font-weight:500' : '';
    return `<tr style="${fw}">
      <td><span class="dot" style="background:${r.dot}"></span>${r.label}</td>
      <td>${c.deliveries.toLocaleString()}</td>
      <td>${p.deliveries.toLocaleString()}</td>
      <td>${rc(c.deliveries, p.deliveries, true)}</td>
      <td>${Math.round(c.totalVol).toLocaleString()}</td>
      <td>${Math.round(p.totalVol).toLocaleString()}</td>
      <td>${rc(c.totalVol, p.totalVol)}</td>
      <td>${c.avgVol.toFixed(1)}</td>
      <td>${p.avgVol.toFixed(1)}</td>
      <td>${rc(c.avgVol, p.avgVol)}</td>
      <td>${(c.avgInv * 100).toFixed(1)}%</td>
      <td>${(p.avgInv * 100).toFixed(1)}%</td>
      <td>${rc(c.avgInv, p.avgInv, true)}</td>
      <td>${(c.medianAch * 100).toFixed(1)}%</td>
      <td>${(p.medianAch * 100).toFixed(1)}%</td>
      <td>${rc(c.medianAch, p.medianAch)}</td>
    </tr>`;
  }).join('');
}

// ─── 月別実績テーブル ────────────────────────────────
const MONTH_ORDER = ['10', '11', '12', '01', '02', 'all'];

function renderMonthActualTable(d) {
  const el = document.getElementById('tbody-month-actual');
  if (!el) return;

  el.innerHTML = MONTH_ORDER.map(k => {
    const m = d.monthData[k];
    if (!m) return '';
    const c = m.curr, p = m.prev;
    const fw = k === 'all' ? 'font-weight:500' : '';
    return `<tr style="${fw}">
      <td>${m.label}</td>
      <td>${c.deliveries.toLocaleString()}</td>
      <td>${p.deliveries.toLocaleString()}</td>
      <td>${rc(c.deliveries, p.deliveries, true)}</td>
      <td>${Math.round(c.totalVol).toLocaleString()}</td>
      <td>${Math.round(p.totalVol).toLocaleString()}</td>
      <td>${rc(c.totalVol, p.totalVol)}</td>
      <td>${c.avgVol.toFixed(1)}</td>
      <td>${p.avgVol.toFixed(1)}</td>
      <td>${rc(c.avgVol, p.avgVol)}</td>
      <td>${(c.avgInv * 100).toFixed(1)}%</td>
      <td>${(p.avgInv * 100).toFixed(1)}%</td>
      <td>${rc(c.avgInv, p.avgInv, true)}</td>
    </tr>`;
  }).join('');
}

// ─── 月別デモグラフテーブル ──────────────────────────
function renderMonthTable(d) {
  const el = document.getElementById('tbody-month-demo');
  if (!el) return;

  el.innerHTML = MONTH_ORDER.map(k => {
    const m = d.monthData[k];
    if (!m) return '';
    const c = m.curr, p = m.prev;
    const r = (c.slope && p.slope) ? c.slope / p.slope : 1;
    const isGood = r < 1;
    return `<tr>
      <td>
        <span class="dot" style="background:${k === 'all' ? '#6b7280' : 'var(--curr)'}"></span>
        ${m.label}
      </td>
      <td>${c.deliveries.toLocaleString()}</td>
      <td>${p.deliveries.toLocaleString()}</td>
      <td>${c.interval.toFixed(1)}日</td>
      <td>${c.avgVol.toFixed(1)}L</td>
      <td>${(c.medianAch * 100).toFixed(1)}%</td>
      <td>${(c.slope * 100).toFixed(3)}%/日</td>
      <td>${(p.slope * 100).toFixed(3)}%/日</td>
      <td class="${isGood ? 'up' : 'down'}">${r >= 1 ? '▲' : '▼'} ${((r - 1) * 100).toFixed(1)}%</td>
    </tr>`;
  }).join('');
}

// ─── 月別タブ切り替え ────────────────────────────────
function switchMonthTab(tab, btn) {
  document.querySelectorAll('#mtab-actual,#mtab-demo').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
  document.getElementById('month-actual-body').style.display = tab === 'actual' ? '' : 'none';
  document.getElementById('month-demo-body').style.display   = tab === 'demo'   ? '' : 'none';
}
