/*
 * 思い出の称号（画面に依存しない処理）
 *  state.memories = { 称号ID: 手に入れた日時 }
 */
(function (PS) {
  'use strict';

  function context(state) {
    const ps = state.potions;
    const L = PS.core.lookup;
    const effects = new Set(ps.flatMap(p => [p.generated.effect, ...(p.generated.subEffects || [])]));
    const cats = new Set([...effects].map(id => L.effect[id] && L.effect[id].cat).filter(Boolean));
    return {
      kinds: new Set(ps.map(p => p.generated.signature)).size,
      effects: effects.size,
      cats: cats.size,
      has: r => ps.some(p => p.generated.rarity === r),
      bottle: id => ps.some(p => p.generated.bottle === id),
      cat: c => ps.some(p => L.effect[p.generated.effect] && L.effect[p.generated.effect].cat === c),
    };
  }

  /** まだ手に入れていない称号を調べ、条件を満たしたものを記録する。新しく手に入れた称号を返す */
  function evaluate(state, now) {
    const got = state.memories;
    const rest = PS.data.memories.list.filter(m => !got[m.id]);
    if (!rest.length) return [];
    let ctx = null;
    const earned = [];
    for (const m of rest) {
      let ok = false;
      try { ok = !!m.check(state, ctx || (ctx = context(state))); } catch (e) { ok = false; }
      if (ok) { got[m.id] = now; earned.push(m); }
    }
    return earned;
  }

  PS.core.memories = { evaluate, context };
})(window.PS);
