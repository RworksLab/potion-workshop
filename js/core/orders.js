/*
 * お客さんの注文（画面に依存しない処理）
 *  state.orders = { list: [{ id, customer, kind, value, text, createdAt, expiresAt }], nextAt }
 */
(function (PS) {
  'use strict';
  const O = () => PS.data.orders;
  const L = () => PS.core.lookup;
  const effectsOf = g => [g.effect, ...(g.subEffects || [])];
  const HOUR = 3600 * 1000;

  /** 条件の値と、注文の文に入れる言葉を選ぶ */
  function pickCondition(kind, rng) {
    const d = PS.data;
    switch (kind) {
      case 'cat': { const c = rng.pick(d.effectCategories); return { value: c.id, word: O().catWords[c.id] || c.name }; }
      case 'taste': { const x = rng.weighted(d.tastes, t => t.baseWeight || 1); return { value: x.id, word: x.name }; }
      case 'aroma': { const x = rng.weighted(d.aromas, t => t.baseWeight || 1); return { value: x.id, word: x.name }; }
      case 'texture': { const x = rng.weighted(d.textures.filter(t => !t.minRarity), t => t.baseWeight || 1); return { value: x.id, word: x.name }; }
      case 'bottle': { const x = rng.weighted(d.bottles, t => t.baseWeight || 1); return { value: x.id, word: x.name }; }
      default: { const x = rng.weighted(O().rarities, t => t.weight); return { value: x.id, word: x.word }; }
    }
  }

  function create(state, rng, at) {
    const kinds = Object.entries(O().kinds);
    for (let tries = 0; tries < 10; tries++) {
      const [kind, def] = rng.weighted(kinds, k => k[1].weight);
      const c = pickCondition(kind, rng);
      if (state.orders.list.some(o => o.kind === kind && o.value === c.value)) continue;   // 同じ注文が2つ並ばないように
      return {
        id: 'o_' + at.toString(36) + '_' + Math.floor(rng.next() * 1e6).toString(36),
        customer: rng.pick(PS.data.reviews.customers.filter(c => !state.orders.list.some(o => o.customer === c))),   // 同じお客さんが2人並ばないように
        kind, value: c.value,
        text: rng.pick(def.text).replace('{v}', c.word),
        createdAt: at,
        expiresAt: at + O().lifeHours * HOUR,
      };
    }
    return null;
  }

  const nextGap = rng => { const [a, b] = O().intervalHours; return (a + rng.next() * (b - a)) * HOUR; };

  /**
   * 時間を進める：帰ったお客さんを外し、空いた枠に次のお客さんを入れる（アプリを閉じていた間の分もまとめて）
   * @returns {boolean} 変わったかどうか
   */
  function refresh(state, now, rng) {
    const o = state.orders;
    let changed = false;
    const before = o.list.length;
    o.list = o.list.filter(x => x.expiresAt > now);
    if (o.list.length !== before) changed = true;
    for (let i = 0; i < 20 && o.list.length < O().slots && o.nextAt <= now; i++) {
      const at = Math.max(o.nextAt, now - O().lifeHours * HOUR);
      const ord = create(state, rng, at);
      if (ord && ord.expiresAt > now) { o.list.push(ord); changed = true; }
      o.nextAt = at + nextGap(rng);
    }
    if (o.list.length >= O().slots && o.nextAt < now) o.nextAt = now;   // 満員の間は待つ
    return changed;
  }

  /** 注文の入れ替えが必要か（毎秒呼んでも軽いように、変化があるときだけ true） */
  function due(state, now) {
    const o = state.orders;
    return o.list.some(x => x.expiresAt <= now) || (o.list.length < O().slots && o.nextAt <= now);
  }

  /** このポーションが注文に合うか（在庫があるもののみ） */
  function matches(p, order) {
    if (!p || p.stock <= 0) return false;
    const g = p.generated;
    switch (order.kind) {
      case 'cat': return effectsOf(g).some(id => L().effect[id] && L().effect[id].cat === order.value);
      case 'taste': return g.taste === order.value;
      case 'aroma': return g.aroma === order.value;
      case 'texture': return g.texture === order.value;
      case 'bottle': return g.bottle === order.value;
      case 'rarity': return L().rarityOrder(g.rarity) >= L().rarityOrder(order.value);
      default: return false;
    }
  }

  const candidates = (state, order) => state.potions.filter(p => matches(p, order));
  const reward = (p, order) => Math.max(1, Math.round(p.price * ((O().kinds[order.kind] || {}).reward || 2)));

  /** 注文にポーションを1本わたす。お礼のコインと特別なレビューを返す */
  function deliver(state, orderId, potionId, rng, now) {
    const order = state.orders.list.find(o => o.id === orderId);
    if (!order) throw new Error('この注文はもうありません');
    const p = state.potions.find(x => x.id === potionId);
    if (!matches(p, order)) throw new Error('注文に合わないポーションです');
    const coins = reward(p, order);
    p.stock -= 1;
    p.sold = (p.sold || 0) + 1;
    state.coins += coins;
    state.stats.earned += coins;
    state.stats.sold += 1;
    state.stats.ordersDone = (state.stats.ordersDone || 0) + 1;
    PS.core.sales.ensureShelves(state);   // 在庫がなくなったら棚からも下げる
    const res = { items: [{ potionId: p.id, name: p.name, qty: 1, coins, shelf: -1, soldOut: p.stock <= 0, order: true }], total: coins, qty: 1 };
    PS.core.sales.addLog(state, res, now);
    PS.core.sales.recordDaily(state, res, now);
    // 注文したお客さんからの特別なレビュー（いちばん良い評価）
    const recent = state.reviews.slice(0, 20).map(r => r.key);
    const r = PS.core.reviews.create(p, rng, now, recent);
    r.customer = order.customer;
    r.mood = 'great'; r.stars = 5;
    r.text = rng.pick(O().thanks) + r.text;
    r.order = true;
    state.reviews.unshift(r);
    state.reviews.length = Math.min(state.reviews.length, PS.data.balance.reviews.max);
    state.orders.list = state.orders.list.filter(o => o.id !== orderId);
    state.orders.nextAt = Math.max(state.orders.nextAt, now + nextGap(rng));
    return { coins, review: r, potion: p };
  }

  PS.core.orders = { refresh, due, matches, candidates, reward, deliver, create };
})(window.PS);
