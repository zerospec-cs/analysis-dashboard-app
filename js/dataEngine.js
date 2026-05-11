// ═══════════════════════════════════════════════════════
// dataEngine.js — データ集計・変換ロジック
// ※ DOM・Chart.jsに依存しない純粋な計算のみ
// ═══════════════════════════════════════════════════════

function buildAppData(delRows, custRows, tankRows) {
  const tankMap = _buildTankMap(tankRows);
  const custMap = _buildCustMap(custRows, tankMap);
  const processed = _processDeliveries(delRows, custMap);

  const seasons = [...new Set(processed.map(r => r.season))].sort();
  const currSeason = seasons[seasons.length - 1];
  const prevSeason = seasons[seasons.length - 2] || seasons[0];

  const allTabs = _buildTabs(processed);
  const tabData = _buildTabData(allTabs, processed, currSeason, prevSeason);

  return { processed, currSeason, prevSeason, allTabs, tabData, seasons };
}

// ─── タンクマップ構築 ──────────────────────────────────
function _buildTankMap(tankRows) {
  const map = {};
  tankRows.forEach(r => {
    const vals = Object.values(r);
    if (vals[1] && vals[3]) map[String(vals[1]).trim()] = Number(vals[3]) || 0;
  });
  return map;
}

// ─── 顧客マップ構築 ──────────────────────────────────
function _buildCustMap(custRows, tankMap) {
  const map = {};
  custRows.forEach(r => {
    const v = Object.values(r);
    const id = String(v[0]).trim();
    if (!id || id === '顧客番号') return;

    const tankType = String(v[10] || '').trim();
    const hosei = Number(v[24]) || tankMap[tankType] || 0;

    if (!map[id]) {
      map[id] = {
        group:  String(v[4]  || '未登録').trim(),
        area:   String(v[5]  || '未登録').trim(),
        tank:   tankType,
        thresh: Number(v[12]) || 0,
        hosei,
        sensor: (String(v[16] || '').includes('センサー') || String(v[17] || '') !== '')
          ? 'あり' : 'なし',
      };
    } else {
      map[id].hosei  += hosei;
      map[id].thresh += Number(v[12]) || 0;
    }
  });
  return map;
}

// ─── 配送データ処理 ──────────────────────────────────
function _processDeliveries(delRows, custMap) {
  const processed = [];
  const seen = {};

  delRows.forEach(r => {
    const v = Object.values(r);
    const custId  = String(v[0]).trim();
    const dateVal = v[1];
    const delivQty = Number(v[2]) || 0;
    if (!custId || !dateVal) return;

    const dateKey = `${custId}_${String(dateVal).slice(0, 10)}`;
    const isDup = !!seen[dateKey];
    seen[dateKey] = (seen[dateKey] || 0) + 1;

    const cust = custMap[custId] || {
      group: '未登録', area: '未登録', tank: '', thresh: 0, hosei: 0, sensor: 'なし',
    };
    const { hosei, thresh } = cust;
    const ideal = hosei - thresh;
    const qty = isDup ? 0 : delivQty;
    const invRate = (hosei > 0 && !isDup && delivQty >= 0) ? 1 - qty / hosei : null;
    const achRate = (ideal > 0 && !isDup) ? qty / ideal : null;

    processed.push({
      custId,
      date: new Date(dateVal),
      qty,
      delivCount: isDup ? 0 : 1,
      season: _getSeason(dateVal),
      group: cust.group,
      area:  cust.area,
      sensor: cust.sensor,
      hosei, thresh, ideal,
      invRate, achRate,
      isDup,
      isNeg: delivQty < 0,
    });
  });

  return processed;
}

// ─── タブ定義 ──────────────────────────────────────────
function _buildTabs(processed) {
  const groups = [...new Set(processed.map(r => r.group))];
  const areas  = [...new Set(processed.map(r => r.area))];

  const groupTabs = [
    { id: '全社', label: '全社', filterFn: () => true },
    ...groups.map(g => ({ id: g, label: g, filterFn: r => r.group === g })),
  ];
  const areaTabs = areas.map(a => ({
    id: 'area_' + a,
    label: a,
    filterFn: r => r.area === a,
  }));

  return [...groupTabs, ...areaTabs];
}

// ─── タブデータ構築 ──────────────────────────────────
function _buildTabData(allTabs, processed, currSeason, prevSeason) {
  const tabData = {};
  allTabs.forEach(tab => {
    const curr    = processed.filter(r => r.season === currSeason && tab.filterFn(r));
    const prev    = processed.filter(r => r.season === prevSeason && tab.filterFn(r));
    const currOn  = curr.filter(r => r.sensor === 'あり');
    const currOff = curr.filter(r => r.sensor === 'なし');
    const prevOn  = prev.filter(r => r.sensor === 'あり');
    const prevOff = prev.filter(r => r.sensor === 'なし');

    tabData[tab.id] = {
      curr:     aggregate(curr),
      prev:     aggregate(prev),
      currOn:   aggregate(currOn),
      prevOn:   aggregate(prevOn),
      currOff:  aggregate(currOff),
      prevOff:  aggregate(prevOff),
      histCurr:    histBins(curr),
      histPrev:    histBins(prev),
      histCurrOn:  histBins(currOn),
      histPrevOn:  histBins(prevOn),
      histCurrOff: histBins(currOff),
      histPrevOff: histBins(prevOff),
      monthData: _buildMonthData(curr, prev),
    };
  });
  return tabData;
}

// ─── 月別データ ──────────────────────────────────────
const MONTH_KEYS   = ['10', '11', '12', '01', '02'];
const MONTH_LABELS = { '10': '10月', '11': '11月', '12': '12月', '01': '1月', '02': '2月' };

function _buildMonthData(curr, prev) {
  const result = {};
  MONTH_KEYS.forEach(mk => {
    const mo = parseInt(mk, 10);
    const cm = curr.filter(r => r.date.getMonth() + 1 === mo);
    const pm = prev.filter(r => r.date.getMonth() + 1 === mo);
    result[mk] = { label: MONTH_LABELS[mk], curr: aggregate(cm), prev: aggregate(pm) };
  });
  result['all'] = { label: '全体', curr: aggregate(curr), prev: aggregate(prev) };
  return result;
}

// ─── 集計 ────────────────────────────────────────────
function aggregate(rows) {
  const valid = rows.filter(
    r => !r.isDup && !r.isNeg && r.invRate !== null && r.invRate >= 0
  );
  const deliveries = valid.reduce((s, r) => s + r.delivCount, 0);
  const totalVol   = valid.reduce((s, r) => s + r.qty, 0);
  const avgVol     = deliveries > 0 ? totalVol / deliveries : 0;
  const invRates   = valid.map(r => r.invRate).filter(v => v !== null);
  const achRates   = valid.map(r => r.achRate).filter(v => v !== null && isFinite(v));
  const avgInv     = invRates.length > 0
    ? invRates.reduce((s, v) => s + v, 0) / invRates.length : 0;
  const medianAch  = _median(achRates);
  const customers  = new Set(valid.map(r => r.custId)).size;
  const thresh     = valid.length > 0
    ? valid.reduce((s, r) => s + r.thresh, 0) / valid.length : 0;
  const hosei      = valid.length > 0
    ? valid.reduce((s, r) => s + r.hosei, 0)  / valid.length : 0;
  const threshRate = hosei > 0 ? thresh / hosei : 0;
  const days       = _estimateDays(valid);
  const interval   = customers > 0 && deliveries > 0
    ? customers * days / deliveries : 0;
  const slope      = interval > 0 ? medianAch * threshRate / interval : 0;

  return {
    deliveries, totalVol, avgVol, avgInv, medianAch,
    customers, threshRate, interval, slope, days,
  };
}

// ─── ヒストグラム ────────────────────────────────────
const HIST_EDGES = [0, 0.2, 0.4, 0.6, 0.8, 1.0, 1.2, 1.4, 1.6, 1.8, 99];

function histBins(rows) {
  const valid = rows.filter(
    r => !r.isDup && !r.isNeg && r.invRate >= 0 && r.achRate !== null && isFinite(r.achRate)
  );
  const counts = new Array(10).fill(0);
  valid.forEach(r => {
    const idx = HIST_EDGES.findIndex((e, i) => r.achRate < HIST_EDGES[i + 1]);
    if (idx >= 0 && idx < 10) counts[idx]++;
  });
  return counts;
}

// ─── ユーティリティ ──────────────────────────────────
function _getSeason(dateVal) {
  const d = dateVal instanceof Date ? dateVal : new Date(dateVal);
  const m = d.getMonth() + 1, y = d.getFullYear();
  if (m >= 10) return `${y}.10-${String(y + 1).slice(-2)}.03期`;
  if (m <= 3)  return `${y - 1}.10-${String(y).slice(-2)}.03期`;
  return `${y}.04-${String(y).slice(-2)}.09期`;
}

function _estimateDays(rows) {
  if (!rows.length) return 151;
  const dates = rows.map(r => r.date.getTime());
  return Math.round((Math.max(...dates) - Math.min(...dates)) / 86400000) + 1;
}

function _median(arr) {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
