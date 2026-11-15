/*
 * ゲームバランス設定
 * 数値はここを書き換えるだけで調整できる（コード側に数値を直接書かない）。
 */
PS.data.balance = {
  garden: {
    // 畑の広さ [横, 縦]。「畑の拡張」のレベルごとに1段階ずつ広がる（0番目が初期状態）
    fieldSizes: [[3, 3], [4, 3], [4, 4], [5, 4], [5, 5], [6, 5], [6, 6]],
    fieldLevel: 0,       // 畑の拡張レベルの基本値
    // ↓ 能力値の基本値（強化レベル0のとき）。強化の効果は data/upgrades.js
    regrowMultiplier: 1, // 再生時間の倍率（小さいほど早く育つ）
    yieldBonus: 0,       // 採取量の加算
    rareBonus: 0,        // 希少素材の出現率ボーナス
    harvestArea: 0,      // 1タップで追加で摘めるマス数
    autoGatherSec: 20,   // 自動採取の間隔（秒）。強化レベル1で有効になる
    autoGatherMaxPerStep: 5000, // 一度の計算で自動採取する上限（安全装置）
  },

  brew: {
    minTotal: 1,         // 調合に必要な最低投入数
    cauldronCap: 5,      // 調合釜に入れられる最大数（能力値の基本値。調合釜の強化で増える）
    yieldBase: 1,        // 1回の調合でできる本数の基本値
    yieldPerQty: 4,      // 投入数がこの数ごとに +1本
    yieldMax: 4,         // 1回の最大本数
  },

  generator: {
    tagInfluence: 0.5,        // 材料の傾向が抽選に与える影響の強さ（大きいほど材料どおりの結果に）
    effectCarry: 0.5,         // 決まった効果の性質が味・香り・色へ与える影響
    surpriseRate: 0.12,       // 各項目で「傾向を無視した意外な結果」になる確率
    subEffectRate: 0.6,       // 副効果（1つ目）が付く確率
    secondSubRate: 0.25,      // 副効果（2つ目）が付く確率（1つ目が付いたとき）
    secondSubPerRarity: 0.05, // レアリティ1段階ごとに2つ目の副効果が付きやすくなる量
    contrastBoost: 1.5,       // メインが良い効果のとき、困った効果が副効果に付きやすくなる倍率（逆も同じ）
    rarityShiftPerPower: 0.3, // 希少素材がレアリティを押し上げる強さ
    rarityQtyBonus: 0.08,     // 投入量が多いほどレアリティが上がる強さ
    rareEffectBoost: 1.35,    // 高レアリティ時に珍しい効果が出やすくなる倍率
    potencyNoise: [-1, 1.5],  // 効き目の強さのランダム幅
    descriptionJokeRate: 0.4, // 説明文にユーモラスな一文が付く確率
  },

  shop: {
    shelfSlots: 3,            // 商品棚の数（能力値の基本値）
    sellSpeed: 1,             // 売れる速さの倍率（能力値の基本値。店舗拡張で上がる）
    baseSellIntervalSec: 45,  // 目安価格のとき、1本売れるまでの基本秒数
    rarityInterval: { N: 1, R: 1.3, SR: 1.6, SSR: 2.0, UR: 2.6 }, // 高レアほどじっくり売れる
    priceElasticity: 1.6,     // 値上げしたときの売れにくさ（大きいほど価格に敏感）
    minIntervalSec: 3,        // どんなに安くしてもこれより速くは売れない
    minPrice: 1,              // 最低価格
    maxPriceRate: 3,          // 目安価格の何倍まで値上げできるか
    offlineCapHours: 8,       // アプリを閉じている間に販売・自動採取が進む上限時間
    welcomeBackSec: 60,       // これ以上離れていたら「お留守番中の売上」を表示
    logMax: 30,               // 販売履歴を残す件数
  },

  reviews: {
    chance: 0.35,            // ポーションが売れたとき、レビューが届く確率
    maxPerStep: 5,           // 一度に届くレビューの上限（お留守番中にたくさん売れた時など）
    max: 100,                // 保存しておくレビューの件数（古いものから消える）
    avoidRecent: 20,         // 直近この件数のレビューと同じ文章は避ける
    extraChance: 0.55,       // 本文に「ひと言」が付く確率
    subReactChance: 0.8,     // 副効果があるとき、その体験も一緒に書いてくれる確率
    // 評価の出やすさ（基本値）。高レアほど高評価、値段が高すぎると辛口になる
    moodWeights: { great: 2, good: 3, meh: 2.5, confused: 2, bad: 1.2 },
    rarityBonus: { great: 0.9, good: 0.4 },  // レアリティ1段階ごとの加算
    expensiveRate: 1.5,      // 目安価格のこの倍率以上だと「高い」と感じる
    cheapRate: 0.7,          // 目安価格のこの倍率以下だと「安い」と感じる
  },

  save: {
    autosaveSec: 15,     // 定期自動保存の間隔（秒）
    debounceMs: 1200,    // 操作後、まとめて保存するまでの待ち時間
  },
};
