/*
 * 味・香り
 *  tagAffinity … 材料・効果のタグとの相性
 *  minRarity   … このレアリティ以上でのみ出現
 *  lines       … 説明文で使う一文（複数あるとランダムに選ばれる）
 */
PS.data.tastes = [
  { id: 'sweet',    name: '甘い',         baseWeight: 6, tagAffinity: { sweet: 3, fruity: 1 }, lines: ['口に広がるやさしい甘さ。', 'デザート感覚で飲める甘さ。'] },
  { id: 'bitter',   name: '苦い',         baseWeight: 6, tagAffinity: { bitter: 3, earthy: 1 }, lines: ['良薬は口に苦し、を体現した味。', '思わず顔をしかめる苦さ。'] },
  { id: 'sour',     name: '酸っぱい',     baseWeight: 5, tagAffinity: { sour: 3, fruity: 1 }, lines: ['口がきゅっとすぼまる酸っぱさ。'] },
  { id: 'spicy',    name: '激辛',         baseWeight: 4, tagAffinity: { fire: 3 }, lines: ['ひと口で汗が噴き出す辛さ。', '辛さで舌が踊りだす。'] },
  { id: 'fruity',   name: 'フルーティー', baseWeight: 5, tagAffinity: { fruity: 3, sweet: 1 }, lines: ['もぎたての果実のようなみずみずしさ。'] },
  { id: 'mint',     name: 'ミント味',     baseWeight: 5, tagAffinity: { cool: 3 }, lines: ['鼻に抜けるすーっとした清涼感。'] },
  { id: 'honey',    name: 'はちみつ味',   baseWeight: 4, tagAffinity: { sweet: 2, floral: 1 }, lines: ['とろりとした、はちみつの味わい。'] },
  { id: 'salty',    name: 'しょっぱい',   baseWeight: 3, tagAffinity: { earthy: 1, poison: 1 }, lines: ['なぜか少ししょっぱい。'] },
  { id: 'umami',    name: 'お出汁の味',   baseWeight: 3, tagAffinity: { earthy: 2, heal: 1 }, lines: ['ほっとするお出汁の味がする。'] },
  { id: 'soda',     name: 'ソーダ味',     baseWeight: 4, tagAffinity: { cool: 1, speed: 1, fun: 1 }, lines: ['口の中でぱちぱち弾けるソーダ味。'] },
  { id: 'milk',     name: 'ミルク味',     baseWeight: 3, tagAffinity: { heal: 1, sweet: 1, sleep: 1 }, lines: ['ホットミルクのようなまろやかさ。'] },
  { id: 'choco',    name: 'チョコ味',     baseWeight: 3, tagAffinity: { sweet: 2, dark: 1 }, lines: ['濃厚なチョコレートの味わい。'] },
  { id: 'tea',      name: '紅茶味',       baseWeight: 3, tagAffinity: { floral: 1, bitter: 1, sleep: 1 }, lines: ['午後のお茶会のような上品な味。'] },
  { id: 'candy',    name: 'わたあめ味',   baseWeight: 3, tagAffinity: { sweet: 2, fun: 1 }, lines: ['お祭りのわたあめを思い出す味。'] },
  { id: 'nothing',  name: '無味',         baseWeight: 1.5, tagAffinity: { special: 1 }, lines: ['驚くほど何の味もしない。'] },
  { id: 'mystery',  name: '謎の味',       baseWeight: 1.5, tagAffinity: { special: 2, fun: 1 }, minRarity: 'R', lines: ['言葉にできない、不思議な味。'] },
  { id: 'stardust', name: '星屑の味',     baseWeight: 1, tagAffinity: { light: 2, luck: 1, special: 1 }, minRarity: 'SR', lines: ['舌の上で星がしゃらしゃら溶ける。'] },
];

PS.data.aromas = [
  { id: 'floral',   name: '花の香り',     baseWeight: 6, tagAffinity: { floral: 3 }, lines: ['花畑にいるような香り。'] },
  { id: 'mint',     name: 'ミント',       baseWeight: 5, tagAffinity: { cool: 3 }, lines: ['すっきり爽やかなミントの香り。'] },
  { id: 'citrus',   name: '柑橘系',       baseWeight: 5, tagAffinity: { sour: 2, fruity: 2 }, lines: ['しぼりたての柑橘の香り。'] },
  { id: 'burnt',    name: '焦げ臭い',     baseWeight: 3, tagAffinity: { fire: 2, fun: 1 }, lines: ['ほんのり焦げ臭い。煮すぎたかもしれない。'] },
  { id: 'none',     name: '無臭',         baseWeight: 3, tagAffinity: {}, lines: ['においはまったくしない。'] },
  { id: 'forest',   name: '森の香り',     baseWeight: 4, tagAffinity: { earthy: 2, heal: 1 }, lines: ['深い森の空気のような香り。'] },
  { id: 'rain',     name: '雨上がりの香り', baseWeight: 3, tagAffinity: { cool: 1, earthy: 1 }, lines: ['雨上がりの土の香りがする。'] },
  { id: 'vanilla',  name: 'バニラ',       baseWeight: 4, tagAffinity: { sweet: 2 }, lines: ['甘いバニラの香り。'] },
  { id: 'herb',     name: 'ハーブ',       baseWeight: 5, tagAffinity: { heal: 2, bitter: 1 }, lines: ['薬草らしい青々とした香り。'] },
  { id: 'sunny',    name: 'お日さまの香り', baseWeight: 3, tagAffinity: { fire: 1, sleep: 1, heal: 1 }, lines: ['干したてのお布団のような香り。'] },
  { id: 'rose',     name: 'バラ',         baseWeight: 3, tagAffinity: { floral: 2, sweet: 1 }, lines: ['気品あるバラの香り。'] },
  { id: 'mushroom', name: 'キノコ',       baseWeight: 3, tagAffinity: { poison: 1, earthy: 2 }, lines: ['しっとりしたキノコの香り。'] },
  { id: 'smoke',    name: '怪しい煙',     baseWeight: 3, tagAffinity: { dark: 2, poison: 1 }, lines: ['紫色の煙がもくもく立ちのぼる。'] },
  { id: 'fruit',    name: '果実',         baseWeight: 4, tagAffinity: { fruity: 3 }, lines: ['熟した果実の甘い香り。'] },
  { id: 'moon',     name: '月夜の香り',   baseWeight: 2, tagAffinity: { magic: 2, dark: 1 }, minRarity: 'R', lines: ['静かな月夜を思わせる香り。'] },
  { id: 'starlight',name: '星の香り',     baseWeight: 1.5, tagAffinity: { light: 2, luck: 1 }, minRarity: 'SR', lines: ['きらきらと星がまたたくような香り。'] },
  { id: 'fairy',    name: '妖精の吐息',   baseWeight: 1, tagAffinity: { special: 3 }, minRarity: 'SSR', lines: ['かすかに妖精の笑い声が聞こえる香り。'] },
];
