// ═══════════════════════════════════════════════════════
// demo.js — デモデータ生成
// ═══════════════════════════════════════════════════════

function loadDemo() {
  APP = buildDemoAppData();
  renderDashboard();
}

function buildDemoAppData() {
  const mkAgg = d => ({
    deliveries: d.cd, totalVol: d.tv, avgVol: d.av, avgInv: d.ir,
    medianAch: d.md,  customers: d.cu, threshRate: d.tr,
    interval: d.iv,   slope: d.sl,    days: 151,
  });

  const allTabs = [
    { id: '全社',           label: '全社'          },
    { id: '株式会社SHIMARS', label: 'SHIMARS'       },
    { id: '未登録',          label: '未登録'        },
    { id: 'area_新型センサー', label: '新型センサー'  },
    { id: 'area_配送エリア',  label: '配送エリア'    },
    { id: 'area_未登録',     label: '未登録(エリア)' },
  ];

  // 月別データ生成ヘルパー
  const mkMonth = (cd,pd,tv,pv,av,pa,ir,pi,md,pm,sl,ps,iv,pi2) => ({
    curr: { deliveries:cd, totalVol:tv, avgVol:av, avgInv:ir, medianAch:md, customers:Math.round(cd*0.85), threshRate:0.514, interval:iv,  slope:sl, days:31 },
    prev: { deliveries:pd, totalVol:pv, avgVol:pa, avgInv:pi, medianAch:pm, customers:Math.round(pd*0.85), threshRate:0.514, interval:pi2, slope:ps, days:31 },
  });

  // ベースヒストグラム（全社共有）
  const BASE_HIST = {
    histCurr:    [10,37,62,78,99,163,226,129,79,78],
    histPrev:    [9,31,57,77,97,158,206,178,129,100],
    histCurrOn:  [5,2,8,14,12,86,139,64,26,23],
    histPrevOn:  [4,8,15,18,20,60,108,73,41,22],
    histCurrOff: [5,35,54,64,87,77,87,65,53,55],
    histPrevOff: [5,23,42,59,77,98,98,105,88,78],
  };

  const months_all = {
    '10': mkMonth(120,107,10914,8292, 90.9,77.5, 0.512,0.530, 1.0606,0.852, 0.02566,0.01961, 41.3,43.5),
    '11': mkMonth(191,160,18538,15352,97.1,95.9, 0.465,0.459, 1.1475,1.136, 0.03163,0.02914, 36.3,39.0),
    '12': mkMonth(319,284,35074,33382,109.9,117.5,0.421,0.374,1.2333,1.295, 0.04230,0.04022, 29.2,32.2),
    '01': mkMonth(286,272,34291,34052,119.9,125.2,0.369,0.352,1.3068,1.346, 0.04368,0.04325, 29.9,31.1),
    '02': mkMonth(91, 250,12655,32387,139.1,129.5,0.432,0.349,1.2821,1.346, 0.05708,0.04292, 22.5,31.4),
    'all':mkMonth(1007,1073,111472,123465,110.7,115.1,0.427,0.391,1.2258,1.289,0.02397,0.02687,51.1,47.9),
  };

  // 集計値定義
  const C_ALL = { cd:1007, tv:111472, av:110.7, ir:0.427, md:1.2258, cu:233, tr:0.514, iv:51.1, sl:0.02397 };
  const P_ALL = { cd:1073, tv:123465, av:115.1, ir:0.391, md:1.2894, cu:233, tr:0.514, iv:47.9, sl:0.02687 };
  const C_ON  = { cd:396,  tv:54683,  av:138.1, ir:0.417, md:1.2933, cu:105, tr:0.549, iv:54.2, sl:0.02397 };
  const P_ON  = { cd:374,  tv:54211,  av:144.9, ir:0.419, md:1.3063, cu:108, tr:0.543, iv:47.9, sl:0.02566 };
  const C_OFF = { cd:611,  tv:56789,  av:92.9,  ir:0.433, md:1.1317, cu:128, tr:0.495, iv:44.5, sl:0.02687 };
  const P_OFF = { cd:699,  tv:69254,  av:99.1,  ir:0.375, md:1.2889, cu:125, tr:0.495, iv:47.9, sl:0.02914 };
  const ZERO  = { cd:0, tv:0, av:0, ir:0, md:0, cu:0, tr:0.5, iv:0, sl:0 };

  const buildTab = (curr, prev, currOn, prevOn, currOff, prevOff, months) => ({
    curr:  mkAgg(curr),  prev:  mkAgg(prev),
    currOn: mkAgg(currOn), prevOn: mkAgg(prevOn),
    currOff: mkAgg(currOff), prevOff: mkAgg(prevOff),
    ...BASE_HIST,
    monthData: months,
  });

  const tabData = {
    '全社': buildTab(C_ALL, P_ALL, C_ON, P_ON, C_OFF, P_OFF, months_all),

    '株式会社SHIMARS': buildTab(
      { cd:442, tv:59024, av:133.5, ir:0.422, md:1.2933, cu:118, tr:0.514, iv:53.8, sl:0.024 },
      { cd:418, tv:58036, av:138.8, ir:0.421, md:1.3063, cu:115, tr:0.514, iv:47.9, sl:0.027 },
      C_ON, P_ON,
      { cd:46, tv:4341, av:94.4, ir:0.488, md:0.964, cu:13, tr:0.436, iv:46.2, sl:0.021 },
      { cd:44, tv:3825, av:86.9, ir:0.446, md:1.020, cu:13, tr:0.435, iv:44.2, sl:0.023 },
      months_all
    ),

    '未登録': buildTab(
      { cd:565, tv:52448, av:92.8, ir:0.429, md:1.15,   cu:124, tr:0.500, iv:44.7, sl:0.026 },
      { cd:655, tv:65429, av:99.9, ir:0.372, md:1.289,  cu:120, tr:0.500, iv:44.7, sl:0.027 },
      ZERO, ZERO, 
      { cd:565, tv:52448, av:92.8, ir:0.429, md:1.15,   cu:124, tr:0.500, iv:44.7, sl:0.026 },
      { cd:655, tv:65429, av:99.9, ir:0.372, md:1.289,  cu:120, tr:0.500, iv:44.7, sl:0.027 },
      months_all
    ),

    'area_新型センサー': buildTab(C_ON, P_ON, C_ON, P_ON, ZERO, ZERO, months_all),

    'area_配送エリア': buildTab(
      { cd:46, tv:6253, av:135.9, ir:0.422, md:1.352, cu:13, tr:0.546, iv:53.4, sl:0.025 },
      { cd:42, tv:5877, av:139.9, ir:0.380, md:1.306, cu:12, tr:0.544, iv:53.4, sl:0.025 },
      { cd:46, tv:6253, av:135.9, ir:0.422, md:1.352, cu:13, tr:0.546, iv:53.4, sl:0.025 },
      { cd:42, tv:5877, av:139.9, ir:0.380, md:1.306, cu:12, tr:0.544, iv:53.4, sl:0.025 },
      ZERO, ZERO,
      months_all
    ),

    'area_未登録': buildTab(C_OFF, P_OFF, ZERO, ZERO, C_OFF, P_OFF, months_all),
  };

  return {
    currSeason: '2025.10-26.03期',
    prevSeason: '2024.10-25.03期',
    allTabs,
    tabData,
    seasons: ['2024.10-25.03期', '2025.10-26.03期'],
  };
}
