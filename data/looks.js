/*
 * 見た目（色・質感・瓶）
 *
 * ■ 色
 *  hex    … 代表色（色見本・調合の演出などに使う）
 *  liquid … 液体の塗り方。省略すると hex の単色
 *           { type: 'layer', colors: [上の色, 下の色] }          … 2色の二層
 *           { type: 'gradient', colors: [上, …, 下] }            … 上から下へのグラデーション
 *           { type: 'gradient', dir: 'diagonal', colors: [...] } … ななめのグラデーション（虹色など）
 *           sparkle: true で液体の中に小さな星が光る
 *  色を増やすときは配列に1件足すだけでよい（描画は assets/art.js が自動で行う）。
 */
PS.data.colors = [
  // ── 単色 ──
  { id: 'red',     name: '赤',       hex: '#ef6f6c', baseWeight: 6, tagAffinity: { fire: 2, heal: 1 } },
  { id: 'blue',    name: '青',       hex: '#5b9bea', baseWeight: 6, tagAffinity: { magic: 2, cool: 1 } },
  { id: 'green',   name: '緑',       hex: '#6cc47a', baseWeight: 6, tagAffinity: { heal: 2, earthy: 1 } },
  { id: 'purple',  name: '紫',       hex: '#a678d6', baseWeight: 5, tagAffinity: { poison: 2, sleep: 1, dark: 1 } },
  { id: 'yellow',  name: '黄色',     hex: '#f3d35b', baseWeight: 5, tagAffinity: { luck: 2, light: 1 } },
  { id: 'pink',    name: 'ピンク',   hex: '#f59bc0', baseWeight: 5, tagAffinity: { floral: 2, sweet: 1 } },
  { id: 'orange',  name: 'オレンジ', hex: '#f5a25a', baseWeight: 5, tagAffinity: { fruity: 2, fire: 1 } },
  { id: 'sky',     name: '水色',     hex: '#8fd6ee', baseWeight: 5, tagAffinity: { cool: 2, speed: 1 } },
  { id: 'milky',   name: '乳白色',   hex: '#f4efe3', baseWeight: 3, tagAffinity: { sleep: 1, heal: 1 } },
  { id: 'black',   name: '漆黒',     hex: '#4a4358', baseWeight: 3, tagAffinity: { dark: 3 } },
  { id: 'amber',   name: '琥珀色',   hex: '#c98b48', baseWeight: 3, tagAffinity: { earthy: 2, bitter: 1 } },
  { id: 'teal',    name: '青緑',     hex: '#4fbcaf', baseWeight: 4, tagAffinity: { cool: 1, heal: 1, magic: 1 } },
  { id: 'clear',   name: '透明',     hex: '#e6f4f8', baseWeight: 2, tagAffinity: { special: 1, light: 1 } },
  { id: 'mint',    name: 'ミント',   hex: '#9fe3c9', baseWeight: 4, tagAffinity: { cool: 2, heal: 1 } },
  { id: 'lavender',name: 'ラベンダー', hex: '#c7b2ef', baseWeight: 4, tagAffinity: { sleep: 2, floral: 1 } },
  { id: 'sakura',  name: '桜色',     hex: '#f9c5d5', baseWeight: 4, tagAffinity: { floral: 2, sweet: 1 } },
  { id: 'lemon',   name: 'レモン色', hex: '#fbe96a', baseWeight: 4, tagAffinity: { sour: 2, fruity: 1 } },
  { id: 'coral',   name: '珊瑚色',   hex: '#ff9c8a', baseWeight: 3, tagAffinity: { fruity: 1, fire: 1, sweet: 1 } },
  { id: 'peach',   name: '桃色',     hex: '#ffbfa6', baseWeight: 3, tagAffinity: { fruity: 2, sweet: 1 } },
  { id: 'leaf',    name: '若草色',   hex: '#a9d86c', baseWeight: 4, tagAffinity: { earthy: 1, heal: 1, speed: 1 } },
  { id: 'navy',    name: '群青',     hex: '#3f5fb0', baseWeight: 3, tagAffinity: { magic: 2, dark: 1 } },
  { id: 'indigo',  name: '藍色',     hex: '#4b4a9e', baseWeight: 3, tagAffinity: { magic: 1, sleep: 1, dark: 1 } },
  { id: 'wine',    name: 'ワイン色', hex: '#9b3a5a', baseWeight: 3, tagAffinity: { poison: 1, dark: 1, sweet: 1 } },
  { id: 'cocoa',   name: 'ココア色', hex: '#8b5e48', baseWeight: 3, tagAffinity: { sweet: 1, earthy: 1, sleep: 1 } },
  { id: 'ice',     name: '氷色',     hex: '#d8f3fb', baseWeight: 3, tagAffinity: { cool: 3 } },
  { id: 'jade',    name: '翡翠色',   hex: '#3faa8a', baseWeight: 2, tagAffinity: { heal: 1, magic: 1, luck: 1 }, minRarity: 'R' },
  { id: 'crimson', name: '真紅',     hex: '#d6304a', baseWeight: 2, tagAffinity: { fire: 2, poison: 1 }, minRarity: 'R' },
  { id: 'gold',    name: '金色',     hex: '#e8c24a', baseWeight: 1.5, tagAffinity: { luck: 2, light: 1 }, minRarity: 'SR' },
  { id: 'silver',  name: '銀色',     hex: '#c9d2dc', baseWeight: 1.5, tagAffinity: { magic: 1, light: 1, cool: 1 }, minRarity: 'SR' },

  // ── 2色の二層（上の色, 下の色） ──
  { id: 'strawberry_milk', name: 'いちごミルク',   hex: '#f59bc0', liquid: { type: 'layer', colors: ['#ffd6e2', '#f283b1'] }, baseWeight: 4, tagAffinity: { sweet: 2, fruity: 1 } },
  { id: 'melon_soda',      name: 'メロンソーダ',   hex: '#6cc47a', liquid: { type: 'layer', colors: ['#fff0bf', '#5fbf6e'] }, baseWeight: 4, tagAffinity: { cool: 1, fun: 1, sweet: 1 } },
  { id: 'soda_float',      name: 'ソーダフロート', hex: '#8fd6ee', liquid: { type: 'layer', colors: ['#fff0bf', '#6fc3e6'] }, baseWeight: 4, tagAffinity: { cool: 2, fun: 1 } },
  { id: 'cafe_au_lait',    name: 'カフェオレ',     hex: '#8b5e48', liquid: { type: 'layer', colors: ['#ecd0ad', '#85573f'] }, baseWeight: 4, tagAffinity: { bitter: 1, sleep: 1 } },
  { id: 'mint_choco',      name: 'ミントチョコ',   hex: '#9fe3c9', liquid: { type: 'layer', colors: ['#9fe3c9', '#6b4a3a'] }, baseWeight: 3.2, tagAffinity: { cool: 1, sweet: 1, dark: 1 } },
  { id: 'honey_lemon',     name: 'はちみつレモン', hex: '#f0c04a', liquid: { type: 'layer', colors: ['#fbe96a', '#e8a93a'] }, baseWeight: 4, tagAffinity: { sour: 1, sweet: 1 } },
  { id: 'grape_lemon',     name: 'ぶどうとレモン', hex: '#a678d6', liquid: { type: 'layer', colors: ['#fbe96a', '#a678d6'] }, baseWeight: 3.2, tagAffinity: { fruity: 2 } },
  { id: 'poison_layer',    name: '毒々二層',       hex: '#a678d6', liquid: { type: 'layer', colors: ['#a678d6', '#7cc44a'] }, baseWeight: 3.2, tagAffinity: { poison: 3 } },
  { id: 'sea_sky',         name: '海と空',         hex: '#5b9bea', liquid: { type: 'layer', colors: ['#bfe8f8', '#3f72c0'] }, baseWeight: 3.2, tagAffinity: { cool: 1, magic: 1 }, minRarity: 'R' },
  { id: 'sakura_leaf',     name: '桜と若葉',       hex: '#f9c5d5', liquid: { type: 'layer', colors: ['#f9c5d5', '#a9d86c'] }, baseWeight: 3.2, tagAffinity: { floral: 2, earthy: 1 }, minRarity: 'R' },
  { id: 'fire_ice',        name: '炎と氷',         hex: '#ef6f6c', liquid: { type: 'layer', colors: ['#d8f3fb', '#ef6f6c'] }, baseWeight: 2, tagAffinity: { fire: 1, cool: 1, special: 1 }, minRarity: 'SR' },
  { id: 'day_night',       name: '昼と夜',         hex: '#3a3f8f', liquid: { type: 'layer', colors: ['#ffe07a', '#3a3f8f'] }, baseWeight: 2, tagAffinity: { light: 1, dark: 1, special: 1 }, minRarity: 'SR' },

  // ── グラデーション ──
  { id: 'sunset',  name: '夕焼け',   hex: '#ff9a7a', liquid: { type: 'gradient', colors: ['#ffd27a', '#ff9a7a', '#b07ad6'] }, baseWeight: 1.8, tagAffinity: { fire: 1, floral: 1, sleep: 1 }, minRarity: 'R' },
  { id: 'dawn',    name: '夜明け',   hex: '#9fb8e8', liquid: { type: 'gradient', colors: ['#ffd9b0', '#9fb8e8', '#4a4a9e'] }, baseWeight: 1.8, tagAffinity: { light: 1, magic: 1 }, minRarity: 'R' },
  { id: 'ocean',   name: '深海',     hex: '#1f4f8a', liquid: { type: 'gradient', colors: ['#7fd0e8', '#1f4f8a'] }, baseWeight: 1.8, tagAffinity: { cool: 1, dark: 1, magic: 1 }, minRarity: 'R' },
  { id: 'aurora',  name: 'オーロラ', hex: '#7fc8ff', liquid: { type: 'gradient', colors: ['#8de0c4', '#7fc8ff', '#c9a0f0'] }, baseWeight: 1.2, tagAffinity: { magic: 2, light: 1, special: 1 }, minRarity: 'SR' },
  { id: 'galaxy',  name: '星空',     hex: '#4a3f9a', liquid: { type: 'gradient', colors: ['#7a6ad0', '#2e2a6a'], sparkle: true }, baseWeight: 1.2, tagAffinity: { magic: 1, dark: 1, luck: 1 }, minRarity: 'SR' },
  { id: 'pearl',   name: '真珠色',   hex: '#f3e9f5', liquid: { type: 'gradient', colors: ['#f6e9fb', '#e4d3f1', '#cde0f3'] }, baseWeight: 1.2, tagAffinity: { light: 1, special: 1 }, minRarity: 'SR' },
  { id: 'rainbow', name: '虹色',     hex: '#ffc06b', liquid: { type: 'gradient', dir: 'diagonal', colors: ['#ff8a8a', '#ffc06b', '#fff07a', '#8de08a', '#7fc8ff', '#b48be8'] }, baseWeight: 1, tagAffinity: { special: 2, light: 1 }, minRarity: 'SSR' },
];

/* 質感：adj は説明文で使う（例「とろとろの赤い液体」） */
PS.data.textures = [
  { id: 'smooth',  name: 'さらさら',     adj: 'さらさらの',     baseWeight: 6, tagAffinity: { cool: 1 }, fx: 'none' },
  { id: 'thick',   name: 'とろとろ',     adj: 'とろとろの',     baseWeight: 5, tagAffinity: { sweet: 1, heal: 1 }, fx: 'none' },
  { id: 'fizzy',   name: 'しゅわしゅわ', adj: 'しゅわしゅわ弾ける', baseWeight: 5, tagAffinity: { speed: 1, fun: 1, cool: 1 }, fx: 'bubbles' },
  { id: 'jelly',   name: 'ぷるぷる',     adj: 'ぷるぷるの',     baseWeight: 4, tagAffinity: { fun: 1, size: 1 }, fx: 'none' },
  { id: 'sparkle', name: 'きらきら粒入り', adj: 'きらきらした粒が舞う', baseWeight: 3, tagAffinity: { light: 2, luck: 1 }, fx: 'sparkles' },
  { id: 'foam',    name: 'もこもこ泡',   adj: 'もこもこ泡立つ',  baseWeight: 4, tagAffinity: { fun: 1, poison: 1 }, fx: 'foam' },
  { id: 'layered', name: '二層',         adj: '二層に分かれた',  baseWeight: 3, tagAffinity: { magic: 1, special: 1 }, fx: 'layers' },
  { id: 'mist',    name: 'ひんやり霧',   adj: '冷たい霧をまとう', baseWeight: 3, tagAffinity: { cool: 2 }, fx: 'mist' },
  { id: 'steam',   name: 'ほかほか湯気', adj: 'ほかほか湯気の立つ', baseWeight: 3, tagAffinity: { fire: 2 }, fx: 'steam' },
  { id: 'sticky',  name: 'ねばねば',     adj: 'ねばねばした',    baseWeight: 3, tagAffinity: { earthy: 1, poison: 1 }, fx: 'none' },
  { id: 'swirl',   name: 'うずまき',     adj: 'ゆっくり渦を巻く', baseWeight: 3, tagAffinity: { magic: 2 }, fx: 'swirl' },
  { id: 'glowing', name: 'ぼんやり発光', adj: 'ぼんやり光る',    baseWeight: 2, tagAffinity: { light: 2, magic: 1 }, minRarity: 'R', fx: 'glow' },
];

/* 瓶：shape は assets/art.js の瓶の描画に対応 */
PS.data.bottles = [
  { id: 'round',     name: '丸フラスコ',   shape: 'round',    baseWeight: 6, tagAffinity: { heal: 1 } },
  { id: 'tube',      name: '試験管',       shape: 'tube',     baseWeight: 5, tagAffinity: { magic: 1 } },
  { id: 'cone',      name: '三角フラスコ', shape: 'cone',     baseWeight: 5, tagAffinity: { poison: 1 } },
  { id: 'pot',       name: 'ずんぐり壺',   shape: 'pot',      baseWeight: 4, tagAffinity: { earthy: 1 } },
  { id: 'drop',      name: 'しずく瓶',     shape: 'drop',     baseWeight: 4, tagAffinity: { cool: 1 } },
  { id: 'gourd',     name: 'ひょうたん瓶', shape: 'gourd',    baseWeight: 3, tagAffinity: { fun: 1 } },
  { id: 'heart',     name: 'ハート瓶',     shape: 'heart',    baseWeight: 2, tagAffinity: { floral: 1, sweet: 1 }, minRarity: 'R' },
  { id: 'star',      name: '星形瓶',       shape: 'star',     baseWeight: 1.5, tagAffinity: { luck: 1, light: 1 }, minRarity: 'SR' },
];
