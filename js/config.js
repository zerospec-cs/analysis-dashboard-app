// ═══════════════════════════════════════════════════════
// config.js — アプリ全体の設定
// ここを変更するだけで認証ドメインなどを切り替えられます
// ═══════════════════════════════════════════════════════

const CONFIG = {
  clientId: '858573162226-4dou32bf97vp16qk7ietlikivgjhh7qu.apps.googleusercontent.com',
  domain:   'zero-spec.com',
};

// Excelシート名（変更が必要な場合はここだけ直す）
const SHEET_NAMES = {
  customer: '顧客登録',
  tankType: 'タンクタイプリスト',
};

// 給油ファイルのカラム定義（ラベル・デフォルト候補名）
// 分析項目を増やす場合はここにエントリを追加する
const DELIVERY_COLS = {
  custId: { label: '顧客番号', defaults: ['顧客番号'] },
  date:   { label: '配送日',   defaults: ['配送日'] },
  qty:    { label: '配送量',   defaults: ['配送量'] },
};
