/*
 * 素材データ
 * 新しい素材は配列に1件追加するだけでゲームに登場する。
 *
 *  id          … 内部ID（セーブデータで使うので、公開後は変更しない）
 *  name        … 表示名
 *  rarity      … 素材の希少度 1〜4（★の数）
 *  spawnWeight … 薬草園での出現しやすさ（相対値）
 *  yield       … 1回の採取量 [最小, 最大]
 *  regrowSec   … 採取後、次が育つまでの秒数
 *  tags        … ポーションの傾向（下記タグ一覧）。値が大きいほど影響大
 *  rarityPower … ポーションのレアリティを押し上げる力
 *  art         … 絵のキー（assets/art.js の manifest を参照）
 *
 * タグ一覧: heal 回復 / magic 魔力 / sleep 眠り / poison 毒 / luck 幸運 / speed 速さ /
 *          size 大きさ / special 特殊 / fire 熱 / cool 冷 / light 光 / dark 闇 /
 *          sweet 甘 / sour 酸 / bitter 苦 / floral 花 / fruity 果実 / earthy 大地 / fun おもしろ
 */
PS.data.materials = [
  { id: 'green_herb', name: '緑の薬草', rarity: 1, spawnWeight: 40, yield: [1, 2], regrowSec: 4,
    tags: { heal: 3, earthy: 1, bitter: 1 }, rarityPower: 0, art: 'mat_green_herb',
    desc: 'どこにでも生えている、いちばん身近な薬草。' },
  { id: 'red_flower', name: '赤い花', rarity: 1, spawnWeight: 34, yield: [1, 2], regrowSec: 4,
    tags: { heal: 1, fire: 1, floral: 2, sweet: 1 }, rarityPower: 0, art: 'mat_red_flower',
    desc: 'ほんのり甘い蜜をもつ、元気な赤い花。' },
  { id: 'mint_leaf', name: 'ミントの葉', rarity: 1, spawnWeight: 26, yield: [1, 3], regrowSec: 5,
    tags: { cool: 3, speed: 1, sour: 1 }, rarityPower: 0, art: 'mat_mint_leaf',
    desc: 'すーっとする香りの葉っぱ。' },
  { id: 'sun_berry', name: '太陽の実', rarity: 2, spawnWeight: 16, yield: [1, 2], regrowSec: 7,
    tags: { fire: 2, fruity: 2, sweet: 1, speed: 1 }, rarityPower: 1, art: 'mat_sun_berry',
    desc: 'お日さまの熱をたくわえた、ぽかぽかの木の実。' },
  { id: 'puff_bean', name: 'ふくらみ豆', rarity: 2, spawnWeight: 14, yield: [1, 2], regrowSec: 7,
    tags: { size: 3, fun: 2 }, rarityPower: 1, art: 'mat_puff_bean',
    desc: '水をかけると膨らんだりしぼんだりする不思議な豆。' },
  { id: 'moonlight_grass', name: '月光草', rarity: 2, spawnWeight: 13, yield: [1, 2], regrowSec: 8,
    tags: { magic: 3, sleep: 2, dark: 1 }, rarityPower: 1, art: 'mat_moonlight_grass',
    desc: '月の光を浴びて青白く光る、少し珍しい草。' },
  { id: 'poison_mushroom', name: '毒キノコ', rarity: 2, spawnWeight: 13, yield: [1, 2], regrowSec: 8,
    tags: { poison: 4, dark: 1, earthy: 1, bitter: 1 }, rarityPower: 1, art: 'mat_poison_mushroom',
    desc: '見るからにあやしい水玉模様のキノコ。' },
  { id: 'stardust_flower', name: '星屑の花', rarity: 3, spawnWeight: 5, yield: [1, 1], regrowSec: 12,
    tags: { luck: 3, light: 2, magic: 1 }, rarityPower: 3, art: 'mat_stardust_flower',
    desc: '夜空のかけらが落ちて咲いたという希少な花。' },
  { id: 'fairy_flower', name: '妖精の花', rarity: 4, spawnWeight: 1.6, yield: [1, 1], regrowSec: 16,
    tags: { special: 4, light: 1, luck: 1, floral: 1 }, rarityPower: 5, art: 'mat_fairy_flower',
    desc: '妖精が住むといわれる、とても希少な花。' },
];
