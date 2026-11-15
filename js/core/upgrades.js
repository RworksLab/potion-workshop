/* 設備強化の購入 */
(function (PS) {
  'use strict';

  const byId = id => PS.data.upgrades.find(u => u.id === id);

  function level(state, id) { return PS.core.stats.levelOf(state, id); }

  /** 次のレベルに上げる費用（最大なら null） */
  function cost(state, id) {
    const u = byId(id);
    const lv = level(state, id);
    if (!u || lv >= u.maxLevel) return null;
    if (u.cost.steps) return u.cost.steps[Math.min(lv, u.cost.steps.length - 1)];
    return Math.round(u.cost.base * Math.pow(u.cost.growth, lv));
  }

  function canBuy(state, id) {
    const c = cost(state, id);
    return c !== null && state.coins >= c;
  }

  /** 購入する。成功したら新しいレベルを返す */
  function buy(state, id) {
    const u = byId(id);
    if (!u) throw new Error('不明な強化です');
    const c = cost(state, id);
    if (c === null) throw new Error('これ以上強化できません');
    if (state.coins < c) throw new Error('コインが足りません');
    state.coins -= c;
    state.upgrades[id] = level(state, id) + 1;
    state.stats.spent = (state.stats.spent || 0) + c;
    // 棚の数・畑の広さなどの変化を反映
    PS.core.sales.ensureShelves(state);
    PS.core.gather.ensureGarden(state, PS.core.rng.fresh(), Date.now());
    return state.upgrades[id];
  }

  /** 現在の店構え */
  function shopTier(state) {
    const lv = level(state, 'shop_expand');
    let t = PS.data.shopTiers[0];
    for (const x of PS.data.shopTiers) if (lv >= x.level) t = x;
    return t;
  }

  PS.core.upgrades = { byId, level, cost, canBuy, buy, shopTier };
})(window.PS);
