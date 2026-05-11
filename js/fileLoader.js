// ═══════════════════════════════════════════════════════
// fileLoader.js — ファイル読み込み処理
// ═══════════════════════════════════════════════════════

let masterWB = null;
let deliveryRows = null;

function loadFile(n, input) {
  if (!input.files[0]) return;
  const file = input.files[0];
  const st = document.getElementById('st' + n);
  st.textContent = '読み込み中...';
  st.className = 'uc-status';

  const reader = new FileReader();
  reader.onload = e => {
    try {
      if (n === 1) {
        _loadDeliveryFile(file, e.target.result, st);
      } else {
        _loadMasterFile(file, e.target.result, st);
      }
      document.getElementById('btn-run').disabled = !(deliveryRows && masterWB);
    } catch (err) {
      st.textContent = `エラー: ${err.message}`;
      st.className = 'uc-status uc-err';
    }
  };
  reader.readAsArrayBuffer(file);
}

function _loadDeliveryFile(file, buffer, st) {
  let data;
  if (file.name.endsWith('.csv')) {
    const wb = XLSX.read(new TextDecoder().decode(buffer), { type: 'string' });
    data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' });
  } else {
    const wb = XLSX.read(new Uint8Array(buffer), { type: 'array', cellDates: true });
    data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' });
  }
  deliveryRows = data;
  document.getElementById('card1').classList.add('loaded');
  st.textContent = `✓ ${file.name}（${data.length}行）`;
  st.className = 'uc-status uc-ok';
}

function _loadMasterFile(file, buffer, st) {
  const wb = XLSX.read(new Uint8Array(buffer), { type: 'array', cellDates: true });
  if (!wb.Sheets[SHEET_NAMES.customer] || !wb.Sheets[SHEET_NAMES.tankType]) {
    throw new Error(
      `シート「${SHEET_NAMES.customer}」または「${SHEET_NAMES.tankType}」が見つかりません`
    );
  }
  masterWB = wb;
  document.getElementById('card2').classList.add('loaded');
  st.textContent = `✓ ${file.name}`;
  st.className = 'uc-status uc-ok';
}

function runAnalysis() {
  const custRows = XLSX.utils.sheet_to_json(
    masterWB.Sheets[SHEET_NAMES.customer], { defval: '' }
  );
  const tankRows = XLSX.utils.sheet_to_json(
    masterWB.Sheets[SHEET_NAMES.tankType], { defval: '' }
  );
  APP = buildAppData(deliveryRows, custRows, tankRows);
  renderDashboard();
}
