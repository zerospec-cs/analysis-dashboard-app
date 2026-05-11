// ═══════════════════════════════════════════════════════
// charts.js — Chart.js グラフ描画
// ═══════════════════════════════════════════════════════

let charts = {};
let barMetric = 'cd';
let histSensorKey = 'all';
let demoVis = { ca: true, cd: true, pa: true, pd: true };
let demoCurMonth = 'all';
let currentTabData = null;

// ─── 共通オプション ──────────────────────────────────
const CHART_OPTS_BASE = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: { color: '#8892a4', font: { family: 'Noto Sans JP', size: 11 }, boxWidth: 12 },
    },
    tooltip: { backgroundColor: '#1e2330', borderColor: '#2a3045', borderWidth: 1 },
  },
  scales: {
    x: { ticks: { color: '#8892a4', font: { size: 11 } }, grid: { color: '#2a3045' } },
    y: { ticks: { color: '#8892a4', font: { size: 11 } }, grid: { color: '#2a3045' } },
  },
};

// ─── 棒グラフ（センサー別比較） ──────────────────────
function initBarChart(d) {
  currentTabData = d;
  barMetric = 'cd';
  const ctx = document.getElementById('bar-chart');
  if (!ctx) return;
  destroyChart('bar');
  charts.bar = new Chart(ctx.getContext('2d'), {
    type: 'bar',
    data: buildBarData(d, 'cd'),
    options: _barOpts('cd'),
  });
}

function buildBarData(d, metric) {
  const labels = ['センサー有', 'センサー無', 'ALL'];
  const getVal = (agg, m) => ({
    cd: agg.deliveries,
    av: agg.avgVol,
    ir: agg.avgInv * 100,
    md: agg.medianAch * 100,
  }[m] || 0);

  return {
    labels,
    datasets: [
      {
        label: '当年', data: [getVal(d.currOn, metric), getVal(d.currOff, metric), getVal(d.curr, metric)],
        backgroundColor: 'rgba(232,64,64,0.75)', borderColor: '#e84040', borderWidth: 1, borderRadius: 3,
      },
      {
        label: '前年', data: [getVal(d.prevOn, metric), getVal(d.prevOff, metric), getVal(d.prev, metric)],
        backgroundColor: 'rgba(79,156,249,0.75)', borderColor: '#4f9cf9', borderWidth: 1, borderRadius: 3,
      },
    ],
  };
}

function setBarMetric(metric, btn) {
  barMetric = metric;
  document.querySelectorAll('#dash-content .card:first-of-type .ch .btn')
    .forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
  if (charts.bar && currentTabData) {
    charts.bar.data = buildBarData(currentTabData, metric);
    charts.bar.options = _barOpts(metric);
    charts.bar.update();
  }
}

function _barOpts(metric) {
  const units = { cd: '回', av: 'L', ir: '%', md: '%' };
  const dec   = { cd: 0,  av: 1,  ir: 1,  md: 1  };
  return {
    ...CHART_OPTS_BASE,
    plugins: {
      ...CHART_OPTS_BASE.plugins,
      tooltip: {
        ...CHART_OPTS_BASE.plugins.tooltip,
        callbacks: {
          label: c => ` ${c.dataset.label}: ${c.parsed.y.toFixed(dec[metric])}${units[metric]}`,
        },
      },
    },
    scales: {
      ...CHART_OPTS_BASE.scales,
      y: {
        ...CHART_OPTS_BASE.scales.y,
        ticks: {
          ...CHART_OPTS_BASE.scales.y.ticks,
          callback: v => v.toFixed(dec[metric]) + units[metric],
        },
      },
    },
  };
}

// ─── ヒストグラム（達成率分布） ────────────────────────
const HIST_BINS_LABELS = [
  '~19%','~39%','~59%','~79%','~99%',
  '~119%','~139%','~159%','~179%','180%~',
];

function initHistChart(d, sensor) {
  histSensorKey = sensor;
  const ctx = document.getElementById('hist-chart');
  if (!ctx) return;
  destroyChart('hist');
  charts.hist = new Chart(ctx.getContext('2d'), {
    type: 'bar',
    data: buildHistData(d, sensor),
    options: _histOpts(),
  });
}

function buildHistData(d, sensor) {
  const curr = sensor === 'on' ? d.histCurrOn : sensor === 'off' ? d.histCurrOff : d.histCurr;
  const prev = sensor === 'on' ? d.histPrevOn : sensor === 'off' ? d.histPrevOff : d.histPrev;

  const mkColor = (data, h, s, alpha) => {
    const mx = Math.max(...data);
    return data.map((v, i) => {
      if (v === mx && v > 0) return `hsla(${h},${s + 15}%,52%,${alpha + 0.2})`;
      if (i < 5) return `hsla(${h},${s - 25}%,55%,${alpha - 0.3})`;
      return `hsla(${h},${s}%,50%,${alpha})`;
    });
  };

  return {
    labels: HIST_BINS_LABELS,
    datasets: [
      {
        label: '当年', data: curr,
        backgroundColor: mkColor(curr, 4, 75, 0.75),
        borderColor: mkColor(curr, 4, 75, 0.9),
        borderWidth: 1, borderRadius: 2,
      },
      {
        label: '前年', data: prev,
        backgroundColor: mkColor(prev, 214, 75, 0.75),
        borderColor: mkColor(prev, 214, 75, 0.9),
        borderWidth: 1, borderRadius: 2,
      },
    ],
  };
}

function setHistSensor(sensor, btn) {
  histSensorKey = sensor;
  ['all', 'on', 'off'].forEach(s =>
    document.getElementById('hist-btn-' + s)?.classList.remove('on')
  );
  btn.classList.add('on');
  if (charts.hist && currentTabData) {
    charts.hist.data = buildHistData(currentTabData, sensor);
    charts.hist.update();
  }
}

function _histOpts() {
  return {
    ...CHART_OPTS_BASE,
    plugins: {
      ...CHART_OPTS_BASE.plugins,
      tooltip: {
        ...CHART_OPTS_BASE.plugins.tooltip,
        callbacks: { label: c => ` ${c.dataset.label}: ${c.parsed.y}件` },
      },
      annotation: {
        annotations: {
          thr: {
            type: 'line', xMin: 4.5, xMax: 4.5,
            borderColor: 'rgba(232,64,64,0.6)', borderWidth: 1.5, borderDash: [5, 4],
            label: {
              display: true, content: '100%以上: 高効率配送', position: 'start',
              color: 'rgba(232,64,64,0.8)', font: { size: 11 },
              backgroundColor: 'rgba(13,15,20,0.7)', padding: { x: 6, y: 3 },
            },
          },
        },
      },
    },
    scales: {
      ...CHART_OPTS_BASE.scales,
      y: {
        ...CHART_OPTS_BASE.scales.y,
        title: { display: true, text: '件数', color: '#4a5568', font: { size: 11 } },
      },
    },
  };
}

// ─── デモグラフチャート（消費シミュレーション） ─────────
function initDemograph(d) {
  const ctx = document.getElementById('demo-chart');
  if (!ctx) return;
  demoVis = { ca: true, cd: true, pa: true, pd: true };
  demoCurMonth = 'all';
  destroyChart('demo');
  charts.demo = new Chart(ctx.getContext('2d'), {
    type: 'line',
    data: buildDemoData(d, 'all'),
    options: _demoOpts(d),
  });
}

function buildDemoData(d, month) {
  const mData = d.monthData?.[month];
  const c      = mData?.curr || d.curr;
  const p      = mData?.prev || d.prev;
  const cSlope = c.slope    || d.curr.slope;
  const pSlope = p.slope    || d.prev.slope;
  const cMed   = c.medianAch || d.curr.medianAch;
  const pMed   = p.medianAch || d.prev.medianAch;
  const simVal = parseFloat(document.getElementById('sim-slider')?.value || 130) / 100;
  const dates  = _makeDates('2024-12-01', 62);

  return {
    datasets: [
      { label: '当年',     data: _genSeries(dates, cSlope, cMed),  borderColor: '#e84040', borderWidth: 2.5, pointRadius: 0, tension: 0, spanGaps: true, hidden: !demoVis.ca },
      { label: '今年デモ', data: _genSeries(dates, cSlope, simVal), borderColor: '#f5b942', borderWidth: 1.5, borderDash: [5, 4], pointRadius: 0, tension: 0, spanGaps: true, hidden: !demoVis.cd },
      { label: '前年',     data: _genSeries(dates, pSlope, pMed),  borderColor: '#4f9cf9', borderWidth: 2.5, pointRadius: 0, tension: 0, spanGaps: true, hidden: !demoVis.pa },
      { label: '前年デモ', data: _genSeries(dates, pSlope, simVal), borderColor: '#a3c4f0', borderWidth: 1.5, borderDash: [5, 4], pointRadius: 0, tension: 0, spanGaps: true, hidden: !demoVis.pd },
    ],
  };
}

function toggleDemo(key, btn) {
  demoVis[key] = !demoVis[key];
  btn.className = 'btn' + (demoVis[key] ? ' on' : '');
  if (charts.demo && currentTabData) {
    charts.demo.data = buildDemoData(currentTabData, demoCurMonth);
    charts.demo.update();
  }
}

function setMonth(m, btn) {
  demoCurMonth = m;
  document.querySelectorAll('#month-btns .btn').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
  if (charts.demo && currentTabData) {
    charts.demo.data = buildDemoData(currentTabData, m);
    charts.demo.update();
  }
}

function _demoOpts(d) {
  const thresh = d.curr.threshRate || 0.514;
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1e2330', borderColor: '#2a3045', borderWidth: 1,
        titleColor: '#8892a4', bodyColor: '#e8eaf0', padding: 10,
        callbacks: {
          label: c => c.parsed.y === null
            ? null
            : ` ${c.dataset.label}: ${(c.parsed.y * 100).toFixed(1)}%`,
        },
      },
      annotation: {
        annotations: {
          thr: {
            type: 'line', yMin: 1, yMax: 1,
            borderColor: 'rgba(232,64,64,0.55)', borderWidth: 1.5, borderDash: [6, 4],
            label: {
              display: true,
              content: `しきい値ライン（100% / 容量比: ${(thresh * 100).toFixed(1)}%）`,
              position: 'start', color: 'rgba(232,64,64,0.75)', font: { size: 11 },
              backgroundColor: 'rgba(13,15,20,0.7)', padding: { x: 6, y: 3 },
            },
          },
        },
      },
    },
    scales: {
      x: {
        type: 'time', time: { unit: 'day', displayFormats: { day: 'd' } },
        ticks: { color: '#4a5568', font: { size: 11 }, maxTicksLimit: 16 },
        grid: { color: '#1e2330' },
        title: { display: true, text: '日', color: '#4a5568', font: { size: 11 } },
      },
      y: {
        reverse: true, min: 0, max: 2,
        ticks: { color: '#8892a4', font: { size: 11 }, callback: v => (v * 100).toFixed(0) + '%', stepSize: 0.25 },
        grid: { color: '#2a3045' },
        title: { display: true, text: '消費率（0%=給油直後）', color: '#4a5568', font: { size: 11 } },
      },
    },
  };
}

// ─── ユーティリティ ──────────────────────────────────
function destroyChart(key) {
  if (charts[key]) { try { charts[key].destroy(); } catch (e) {} }
}

function destroyAllCharts() {
  Object.keys(charts).forEach(destroyChart);
  charts = {};
}

function _genSeries(dates, slope, median) {
  const pts = [];
  let val = 0;
  dates.forEach(x => {
    val += slope;
    if (val >= median) {
      pts.push({ x, y: val });
      pts.push({ x, y: 0 });
      val = 0;
    } else {
      pts.push({ x, y: val });
    }
  });
  return pts;
}

function _makeDates(start, days) {
  const d = new Date(start);
  return Array.from({ length: days }, (_, i) => {
    const t = new Date(d);
    t.setDate(d.getDate() + i);
    return t.toISOString().slice(0, 10);
  });
}
