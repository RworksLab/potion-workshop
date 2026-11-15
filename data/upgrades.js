/*
 * 設備強化
 * 項目を増やすときは配列に1件追加する。effect.stat に書いた「能力値」が強化される。
 * 並び順がそのまま強化画面の表示順になる。
 *
 *  category … 表示グループ（garden 薬草園 / lab 調合室 / shop お店）
 *  maxLevel … 最大レベル
 *  cost     … 必要コイン。steps: [Lv1にする費用, Lv2にする費用, …] とレベルごとに直接指定する
 *              （実際のプレイ進行に合わせて決めるため。base × growth^レベル の倍率指定も使える）
 *  effect   … { stat: 能力値名, mode: 'add' 足し算 | 'mul' 掛け算, per: 1レベルごとの量,
 *               offAtZero: true ならレベル0では無効（自動採取など） }
 *  fmt      … 効果の表示形式（js/ui/upgrade.js の FORMATS を参照）
 *
 * 能力値の基本値（レベル0のとき）は data/balance.js にある。
 */
/*
 * 価格の考え方：このゲームの主役は「ポーションのランダムを楽しむこと」。
 * たくさん調合して、いろいろな結果に出会えるようになる強化（畑・調合釜・採取量・レア素材）は手が届きやすく、
 * 放置向けの強化（自動採取・店舗拡張）は中盤以降の目標になるように価格を決めている。
 * 価格は倍率ではなく、実際のプレイ進行（収入の伸び）に合わせてレベルごとに設定する。
 */
PS.data.upgrades = [
  // ── 薬草園 ──
  { id: 'field_expand', category: 'garden', icon: '🟫', name: '畑の拡張',
    desc: '畑が広がり、植えられるマスが増える',
    maxLevel: 6, cost: { steps: [300, 700, 1500, 3000, 6000, 12000] },
    effect: { stat: 'fieldLevel', mode: 'add', per: 1 }, fmt: 'field' },

  { id: 'gather_speed', category: 'garden', icon: '⏱️', name: '採取速度',
    desc: '草花が育つまでの時間が短くなる',
    maxLevel: 10, cost: { steps: [500, 900, 1400, 2100, 3000, 4200, 5800, 7800, 10000, 13000] },
    effect: { stat: 'regrowMultiplier', mode: 'mul', per: 0.88 }, fmt: 'growSpeed' },

  { id: 'gather_amount', category: 'garden', icon: '🧺', name: '採取量',
    desc: '1回で摘める素材の数が増える',
    maxLevel: 5, cost: { steps: [400, 1000, 2000, 3800, 6500] },
    effect: { stat: 'yieldBonus', mode: 'add', per: 1 }, fmt: 'plusItems' },

  { id: 'auto_gather', category: 'garden', icon: '🧚', name: '自動採取',
    desc: 'お手伝い妖精が、育った草花を自動で摘んでくれる（アプリを閉じていても）',
    maxLevel: 8, cost: { steps: [900, 1800, 3000, 4800, 7000, 10000, 14000, 19000] },
    effect: { stat: 'autoGatherSec', mode: 'mul', per: 0.8, offAtZero: true }, fmt: 'autoSec' },

  { id: 'rare_rate', category: 'garden', icon: '✨', name: 'レア素材出現率',
    desc: '星屑の花や妖精の花など、希少な素材が生えやすくなる',
    maxLevel: 8, cost: { steps: [400, 800, 1300, 2000, 3000, 4300, 6000, 8000] },
    effect: { stat: 'rareBonus', mode: 'add', per: 0.25 }, fmt: 'rare' },

  { id: 'gather_area', category: 'garden', icon: '🌾', name: '採取範囲',
    desc: '1回タップすると、となりの育った草花もまとめて摘める',
    maxLevel: 4, cost: { steps: [800, 1800, 3800, 7000] },
    effect: { stat: 'harvestArea', mode: 'add', per: 1 }, fmt: 'area' },

  // ── 調合室 ──
  { id: 'cauldron', category: 'lab', icon: '⚗️', name: '調合釜',
    desc: '一度に入れられる材料の数が増える。たくさん入れるほど、できる本数（最大5本）が増え、珍しいポーションもできやすくなる',
    maxLevel: 10, cost: { steps: [200, 400, 700, 1100, 1600, 2300, 3200, 4400, 6000, 8000] },
    effect: { stat: 'cauldronCap', mode: 'add', per: 5 }, fmt: 'cap' },

  // ── お店 ──
  { id: 'shelf', category: 'shop', icon: '🗄️', name: '商品棚',
    desc: '同時に並べられるポーションの数が増える',
    maxLevel: 6, cost: { steps: [500, 1200, 2400, 4200, 7000, 11000] },   // 3段 → 最大9段
    effect: { stat: 'shelfSlots', mode: 'add', per: 1 }, fmt: 'shelves' },

  { id: 'shop_expand', category: 'shop', icon: '🏠', name: '店舗拡張',
    desc: 'お店が評判になって、お客さんが増える（売れる速さアップ）',
    maxLevel: 9, cost: { steps: [800, 1500, 2500, 3800, 5500, 7800, 10500, 14000, 18500] },
    effect: { stat: 'sellSpeed', mode: 'add', per: 0.12 }, fmt: 'sellSpeed' },
];

/* 店舗拡張のレベルで変わるお店の呼び名（level 以上でその呼び名になる） */
PS.data.shopTiers = [
  { level: 0, name: '道ばたの屋台' },
  { level: 1, name: 'にぎやかな屋台' },
  { level: 2, name: '森の魔法小屋' },
  { level: 3, name: '煙突の魔法小屋' },
  { level: 4, name: 'ランタンの魔法小屋' },
  { level: 5, name: '町のポーション屋' },
  { level: 6, name: '塔のあるポーション屋' },
  { level: 7, name: '光る蔦のポーション屋' },
  { level: 8, name: '星見の塔のお店' },
  { level: 9, name: '伝説の魔法薬店' },
];

PS.data.upgradeCategories = [
  { id: 'garden', name: '薬草園' },
  { id: 'lab',    name: '調合室' },
  { id: 'shop',   name: 'お店' },
];
