/*
 * 能力値
 * ゲーム中の「強化で変わる数値」はすべて PS.core.stats.get(state, 名前) で取得する。
 * 値 = 基本値（data/balance.js）に、強化（data/upgrades.js）の効果を順に適用したもの。
 * 新しい強化を足しても、呼び出し側のコードは変えなくてよい。
 */
(function (PS) {
  'use strict';

  /** 能力値の基本値 */
  function base(name) {
    const b = PS.data.balance;
    const table = {
      fieldLevel: b.garden.fieldLevel,
      regrowMultiplier: b.garden.regrowMultiplier,
      yieldBonus: b.garden.yieldBonus,
      rareBonus: b.garden.rareBonus,
      harvestArea: b.garden.harvestArea,
      autoGatherSec: b.garden.autoGatherSec,
      cauldronCap: b.brew.cauldronCap,
      shelfSlots: b.shop.shelfSlots,
      sellSpeed: b.shop.sellSpeed,
    };
    if (!(name in table)) throw new Error('未定義の能力値: ' + name);
    return table[name];
  }

  function levelOf(state, upgradeId) {
    return (state && state.upgrades && state.upgrades[upgradeId]) || 0;
  }

  /** 1つの強化を適用した値 */
  function applyEffect(value, eff, lv) {
    if (eff.offAtZero && lv <= 0) return 0;
    const n = eff.offAtZero ? lv - 1 : lv; // offAtZero はレベル1が基本値
    return eff.mode === 'mul' ? value * Math.pow(eff.per, n) : value + eff.per * n;
  }

  /** 能力値（レベルを指定すると、その強化だけ仮のレベルで計算＝次のレベルの見込み表示用） */
  function get(state, name, override) {
    let v = base(name);
    for (const u of PS.data.upgrades) {
      if (u.effect.stat !== name) continue;
      const lv = override && override.id === u.id ? override.level : levelOf(state, u.id);
      v = applyEffect(v, u.effect, lv);
    }
    return v;
  }

  PS.core.stats = { get, base, levelOf };
})(window.PS);
