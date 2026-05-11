// ═══════════════════════════════════════════════════════
// simulation.js — しきい値達成率シミュレーション
// ═══════════════════════════════════════════════════════

function updateSimUI(pctVal) {
  if (currentTabData) updateSim(pctVal, currentTabData);
}

function updateSim(pctVal, d) {
  const n = pctVal / 100;
  const c = d.curr;

  // スライダー & ラベル更新
  const simSlider = document.getElementById('sim-slider');
  const simPct    = document.getElementById('sim-pct');
  const simNote   = document.getElementById('sim-note');
  if (simSlider) simSlider.value = pctVal;
  if (simPct)    simPct.textContent = pctVal + '%';

  const tankRemain = (1 - n * c.threshRate) * 100;
  if (simNote) simNote.textContent = `= タンク残量 ${tankRemain.toFixed(1)}% 以下で給油`;

  // 試算
  const demoInterval  = c.slope > 0 ? n / c.slope : 0;
  const demoDelivery  = demoInterval > 0 ? c.customers * c.days / demoInterval : 0;
  const demoVol       = c.deliveries > 0 && c.medianAch > 0
    ? c.totalVol / (c.deliveries * c.medianAch / n) : 0;

  const deltaDelivery = c.deliveries - demoDelivery;
  const deltaVol      = demoVol - c.avgVol;
  const deltaInterval = demoInterval - c.interval;

  _setSimKpi(
    'sim-delivery', 'sim-delivery-sub',
    deltaDelivery >= 0,
    `${deltaDelivery >= 0 ? '▼' : '▲'} ${Math.abs(deltaDelivery).toFixed(0)}<span class="ku">回${deltaDelivery >= 0 ? '減' : '増'}</span>`,
    `${c.deliveries}回 → ${demoDelivery.toFixed(0)}回`
  );
  _setSimKpi(
    'sim-vol', 'sim-vol-sub',
    deltaVol >= 0,
    `${deltaVol >= 0 ? '+' : ''}${deltaVol.toFixed(1)}<span class="ku">L/回</span>`,
    `${c.avgVol.toFixed(1)}L → ${demoVol.toFixed(1)}L`
  );
  _setSimKpi(
    'sim-interval', 'sim-interval-sub',
    deltaInterval >= 0,
    `${deltaInterval >= 0 ? '+' : ''}${deltaInterval.toFixed(1)}<span class="ku">日</span>`,
    `${c.interval.toFixed(1)}日 → ${demoInterval.toFixed(1)}日`
  );

  // チャートを再描画
  if (charts.demo && currentTabData) {
    charts.demo.data = buildDemoData(currentTabData, demoCurMonth);
    charts.demo.update('none');
  }
}

function _setSimKpi(valId, subId, isGood, valHTML, subText) {
  const vEl = document.getElementById(valId);
  const sEl = document.getElementById(subId);
  if (vEl) { vEl.className = 'kv ' + (isGood ? 'up' : 'down'); vEl.innerHTML = valHTML; }
  if (sEl) sEl.textContent = subText;
}
