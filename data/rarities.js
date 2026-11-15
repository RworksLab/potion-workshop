/*
 * レアリティ
 *  order      … 並び順（0が最低）
 *  baseWeight … 素材の影響がないときの出現しやすさ
 *  price      … 販売価格の範囲 [最小, 最大]（G）
 *  color      … 表示色
 */
PS.data.rarities = [
  { id: 'N',   order: 0, baseWeight: 60, price: [10, 49],   color: '#9aa7a0', label: 'ノーマル' },
  { id: 'R',   order: 1, baseWeight: 25, price: [50, 97],   color: '#6fb7e0', label: 'レア' },
  { id: 'SR',  order: 2, baseWeight: 10, price: [98, 133],  color: '#b48be8', label: 'スーパーレア' },
  { id: 'SSR', order: 3, baseWeight: 4,  price: [134, 249], color: '#f0b54a', label: 'ダブルスーパーレア' },
  { id: 'UR',  order: 4, baseWeight: 1,  price: [250, 500], color: '#ff7fb0', label: 'ウルトラレア' },
];

/*
 * 効き目の強さ
 *  adv … 説明文で使う副詞
 */
PS.data.potency = [
  { id: 'p1', order: 0, name: '微弱',   stars: 1, adv: 'ほんの少しだけ' },
  { id: 'p2', order: 1, name: '控えめ', stars: 2, adv: 'ほどよく' },
  { id: 'p3', order: 2, name: 'ふつう', stars: 3, adv: 'しっかりと' },
  { id: 'p4', order: 3, name: '強力',   stars: 4, adv: 'ぐんぐん' },
  { id: 'p5', order: 4, name: '超強力', stars: 5, adv: 'とてつもなく' },
  { id: 'p6', order: 5, name: '伝説級', stars: 6, adv: '伝説に語られるほど' },
];
