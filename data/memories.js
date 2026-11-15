/*
 * 思い出の称号
 *  ・条件を満たした日に手に入り、図鑑の「思い出」に日付と一緒に飾られる
 *  ・まだ手に入れていない称号は「？？？」と、ヒント（hint）だけを表示する（数字の進み具合は見せない）
 *  ・増やすときは list に1件追加する。check(state, ctx) が true になったら手に入る
 *  ・badge … メダルの絵柄（assets/art.js の memoryBadge の G のキー）/ color … メダルの地の色
 *    ctx … { kinds: 作った内容の種類数, effects: 見つけた効果の数, cats: 見つけた効果の種類（カテゴリ）数, has(レア度), bottle(瓶ID), cat(カテゴリID：メイン効果) }
 */
PS.data.memories = {
  list: [
    { id: 'first_brew', badge: 'cauldron', color: '#e8dcfb', hint: '調合室で、はじめてのポーションを作ってみよう', name: 'はじめての調合',     desc: 'はじめてポーションを作った',             check: s => s.potions.length >= 1 },
    { id: 'first_sale', badge: 'coin', color: '#fff3d6', hint: 'お店の棚にポーションを並べてみよう', name: 'はじめてのお客さん', desc: 'お店ではじめてポーションが売れた',       check: s => s.stats.sold >= 1 },
    { id: 'first_review', badge: 'bubble', color: '#fde2ea', hint: 'ポーションが売れると、だれかが感想をくれるかも', name: 'はじめての感想',     desc: 'お客さんからはじめてレビューが届いた',   check: s => s.reviews.length >= 1 },
    { id: 'first_order', badge: 'scroll', color: '#fff3d6', hint: 'お客さんの注文にこたえてみよう', name: 'ご注文ありがとう',   desc: 'はじめてお客さんの注文にこたえた',       check: s => (s.stats.ordersDone || 0) >= 1 },
    { id: 'rare_SR', badge: 'gemSR', color: '#efe6ff', hint: 'ちょっと珍しいポーションを作ってみよう', name: 'きらりと光る一本',   desc: 'はじめてSRのポーションができた',         check: (s, c) => c.has('SR') },
    { id: 'rare_SSR', badge: 'gemSSR', color: '#fff0d6', hint: 'もっと珍しい、まばゆいポーションを作ってみよう', name: 'まばゆい一本',       desc: 'はじめてSSRのポーションができた',        check: (s, c) => c.has('SSR') },
    { id: 'rare_UR', badge: 'gemUR', color: '#ffe8f2', hint: '伝説に語られるほどのポーションを生み出そう', name: '伝説の一本',         desc: 'はじめてURのポーションができた',         check: (s, c) => c.has('UR') },
    { id: 'bottle_heart', badge: 'heart', color: '#fde2ea', hint: 'かわいい形の瓶に入ったポーションを見つけよう', name: 'ハートをこめて',     desc: 'ハート瓶のポーションができた',           check: (s, c) => c.bottle('heart') },
    { id: 'bottle_star', badge: 'star', color: '#fff6cf', hint: '夜空のような、変わった瓶のポーションを見つけよう', name: '星をつかまえた',     desc: '星形瓶のポーションができた',             check: (s, c) => c.bottle('star') },
    { id: 'joke', badge: 'laugh', color: '#fff3d6', hint: '思わず笑っちゃう効果のポーションを作ってみよう', name: '笑いの調合師',       desc: 'おふざけな効果のポーションができた',     check: (s, c) => c.cat('joke') },
    { id: 'trouble', badge: 'dizzy', color: '#e2f4dc', hint: 'ちょっと困った効果のポーションも、たまには大事', name: 'へんてこ発明家',     desc: 'ちょっと困った効果のポーションができた', check: (s, c) => c.cat('trouble') },
    { id: 'brew_10', badge: 'flask1', color: '#dcf2e6', hint: 'いろいろ調合してみよう', name: '見習い調合師',       desc: 'ポーションを10回作った',                 check: s => s.stats.brewed >= 10 },
    { id: 'brew_50', badge: 'flask2', color: '#dcf2e6', hint: 'とにかくたくさん調合しよう', name: '一人前の調合師',     desc: 'ポーションを50回作った',                 check: s => s.stats.brewed >= 50 },
    { id: 'brew_200', badge: 'flask3', color: '#dcf2e6', hint: 'もっともっと、調合を続けよう', name: '調合の達人',         desc: 'ポーションを200回作った',                check: s => s.stats.brewed >= 200 },
    { id: 'kinds_30', badge: 'book', color: '#fde2ea', hint: 'いろんな種類のポーションを集めよう', name: 'ポーション蒐集家',   desc: '30種類のポーションを作った',             check: (s, c) => c.kinds >= 30 },
    { id: 'cats_all', badge: 'palette', color: '#e8f4fb', hint: 'いろいろな効果の種類を見つけよう', name: 'なんでも作れます',   desc: 'すべての種類の効果を見つけた',           check: (s, c) => c.cats >= PS.data.effectCategories.length },
    { id: 'effects_50', badge: 'glass1', color: '#e8f4fb', hint: 'まだ見たことのない効果を探してみよう', name: 'ふしぎ探検家',       desc: '効果を50個見つけた',                     check: (s, c) => c.effects >= 50 },
    { id: 'effects_100', badge: 'glass2', color: '#e8f4fb', hint: 'ふしぎな効果を、もっともっと探そう', name: 'ふしぎ博士',         desc: '効果を100個見つけた',                    check: (s, c) => c.effects >= 100 },
    { id: 'reviews_50', badge: 'bubbles', color: '#fff0f5', hint: 'お客さんの声をたくさん集めよう', name: 'うわさのお店',       desc: 'レビューがたくさん届くようになった',     check: s => s.reviews.length >= 50 },
    { id: 'orders_10', badge: 'scrollHeart', color: '#fff3d6', hint: 'お客さんの注文に、何度もこたえよう', name: '常連さんの信頼',     desc: 'お客さんの注文に10回こたえた',           check: s => (s.stats.ordersDone || 0) >= 10 },
    { id: 'earned_10k', badge: 'coins', color: '#fff6cf', hint: 'お店でたくさん売り上げよう', name: '繁盛店',             desc: '売上が10,000Gをこえた',                  check: s => s.stats.earned >= 10000 },
    { id: 'earned_100k', badge: 'treasure', color: '#fff0c4', hint: 'お店をもっともっと繁盛させよう', name: '大商人',             desc: '売上が100,000Gをこえた',                 check: s => s.stats.earned >= 100000 },
    { id: 'field_max', badge: 'field', color: '#dcf2dc', hint: '薬草園をうんと広げよう', name: '見わたす限りの薬草園', desc: '畑をいちばん広くした',                 check: s => PS.core.upgrades.cost(s, 'field_expand') === null },
    { id: 'shop_max', badge: 'shop', color: '#fde2ea', hint: 'お店をうんと大きくしよう', name: '伝説の魔法薬店',     desc: 'お店をいちばん大きくした',               check: s => PS.core.upgrades.cost(s, 'shop_expand') === null },
    { id: 'night_owl', badge: 'moon', color: '#d9d6f2', hint: 'みんなが寝しずまったころに、何かが起きるかも', name: '夜ふかし調合師',     desc: '真夜中にポーションを作った',             check: s => s.potions.some(p => { const h = new Date(p.createdAt).getHours(); return h >= 0 && h < 4; }) },
  ],
};
