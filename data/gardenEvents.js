/*
 * 薬草園でたまに起きる出来事
 * 出来事を増やすときは list に1件追加する。
 *
 *  kind    … visitor（タップできるお客さん。しばらくすると帰る）/ plot（畑の1マスが特別になる）/ auto（すぐに起きる）
 *  weight  … 起きやすさ（相対値）
 *  reward  … visitor・auto のごほうび：bloom（育ち途中の草花がいっせいに育つ）/ gift（素材をいくつかもらえる）
 *  special … plot の種類：lucky（摘むと珍しい素材）
 *  art     … 絵のキー（assets/manifest.js）
 *  appear  … 起きたときのお知らせ / done … タップしたときのお知らせ
 */
PS.data.gardenEvents = {
  meanIntervalSec: 300,   // 平均してこの秒数に1回くらい起きる（アプリを開いている間）
  minIntervalSec: 90,     // 前の出来事から最低これだけは空ける
  visitorStaySec: 45,     // 蝶々などが畑にいる時間
  giftRange: [2, 4],      // てんとう虫が置いていく素材の数
  list: [
    { id: 'butterfly', kind: 'visitor', weight: 3, reward: 'bloom', art: 'visitor_butterfly',
      appear: '🦋 蝶々が遊びに来た！タップしてみよう', done: '蝶々が花粉を運んで、草花がいっせいに育った！' },
    { id: 'ladybug', kind: 'visitor', weight: 3, reward: 'gift', art: 'visitor_ladybug',
      appear: '🐞 てんとう虫がとまっている…タップしてみよう', done: 'てんとう虫がお礼に素材を置いていった！' },
    { id: 'lucky', kind: 'plot', weight: 2, special: 'lucky',
      appear: '✨ 光る芽が生えた！摘むと珍しい素材が手に入る' },
    { id: 'rain', kind: 'auto', weight: 1.5, reward: 'bloom',
      appear: '🌧 にわか雨！草花がぐんと育った' },
  ],
};
