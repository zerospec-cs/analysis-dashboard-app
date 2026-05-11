// ═══════════════════════════════════════════════════════
// fileLoader.js — ファイル読み込み処理
// ═══════════════════════════════════════════════════════

let masterWB = null;
let deliveryRows = null;
let _pendingDeliveryMeta = null; // { data, st, fileName }

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
  if (!data.length) throw new Error('データが空です');

  const headers = Object.keys(data[0]);
  _pendingDeliveryMeta = { data, st, fileName: file.name };

  // DELIVERY_COLS の各キーに対してデフォルト候補名で自動マッチ
  const matched = {};
  for (const [key, cfg] of Object.entries(DELIVERY_COLS)) {
    matched[key] = cfg.defaults.find(d => headers.includes(d.trim())) || '';
  }

  _showColModal(headers, matched);
}

function _showColModal(headers, matched) {
  const body = document.getElementById('col-modal-body');
  body.innerHTML = '';

  for (const [key, cfg] of Object.entries(DELIVERY_COLS)) {
    const row = document.createElement('div');
    row.className = 'col-modal-row';

    const label = document.createElement('span');
    label.className = 'col-modal-label';
    label.textContent = cfg.label;

    const select = document.createElement('select');
    select.id = 'col-sel-' + key;
    select.className = 'col-modal-select';
    select.addEventListener('change', _updateConfirmBtn);

    const emptyOpt = document.createElement('option');
    emptyOpt.value = '';
    emptyOpt.textContent = '── 選択してください ──';
    select.appendChild(emptyOpt);

    headers.forEach(h => {
      const opt = document.createElement('option');
      opt.value = h;
      opt.textContent = h;
      if (h === matched[key]) opt.selected = true;
      select.appendChild(opt);
    });

    row.appendChild(label);
    row.appendChild(select);
    body.appendChild(row);
  }

  _updateConfirmBtn();
  document.getElementById('col-modal').style.display = 'flex';
}

function _updateConfirmBtn() {
  const allSelected = Object.keys(DELIVERY_COLS).every(key => {
    const sel = document.getElementById('col-sel-' + key);
    return sel && sel.value !== '';
  });
  document.getElementById('col-modal-confirm').disabled = !allSelected;
}

function _confirmColSelection() {
  const mapping = {};
  for (const key of Object.keys(DELIVERY_COLS)) {
    mapping[key] = document.getElementById('col-sel-' + key).value;
  }

  const { data, st, fileName } = _pendingDeliveryMeta;

  // 選択されたカラム名を正規キー名にリネームして格納
  deliveryRows = data.map(r => {
    const row = {};
    for (const [key, colName] of Object.entries(mapping)) {
      row[key] = r[colName];
    }
    return row;
  });

  document.getElementById('col-modal').style.display = 'none';
  document.getElementById('card1').classList.add('loaded');
  st.textContent = `✓ ${fileName}（${deliveryRows.length}行）`;
  st.className = 'uc-status uc-ok';

  _pendingDeliveryMeta = null;
  document.getElementById('btn-run').disabled = !(deliveryRows && masterWB);
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
  document.getElementById('btn-run').disabled = !(deliveryRows && masterWB);
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
