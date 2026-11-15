/* 説明文と商品名の提案を組み立てる */
(function (PS) {
  'use strict';

  const L = () => PS.core.lookup;
  const recent = [];          // 最近使った文（同じ文が続かないように）
  const RECENT_MAX = 12;

  function fill(tpl, v) {
    return tpl.replace(/\{(\w+)\}/g, (_, k) => (v[k] != null ? v[k] : ''));
  }

  /** 最近使った文を避けて選ぶ */
  function pickFresh(rng, list) {
    const item = rng.weighted(list, x => (recent.includes(x) ? 0.12 : 1));
    recent.push(item);
    if (recent.length > RECENT_MAX) recent.shift();
    return item;
  }

  function vars(g, rng) {
    const l = L();
    const subs = (g.subEffects || (g.subEffect ? [g.subEffect] : [])).map(id => l.effect[id]).filter(Boolean);
    const eff = l.effect[g.effect], sub = subs[0] || null, sub2 = subs[1] || null;
    const taste = l.taste[g.taste], aroma = l.aroma[g.aroma];
    const tex = l.texture[g.texture];
    return {
      color: l.color[g.color].name,
      texAdj: tex.adj,
      texName: tex.name,
      bottle: l.bottle[g.bottle].name,
      effect: eff.name,
      effText: eff.text,
      subText: sub ? sub.text : '',
      sub2Text: sub2 ? sub2.text : '',
      subName: sub ? sub.name : '',
      sub2Name: sub2 ? sub2.name : '',
      adv: l.potency[g.potency].adv,
      potency: l.potency[g.potency].name,
      taste: taste.name,
      aroma: aroma.name,
      tasteLine: rng.pick(taste.lines || [taste.name + '味。']),
      aromaLine: rng.pick(aroma.lines || [aroma.name + 'がする。']),
    };
  }

  /** 組み合わせ専用の一文の条件。effects: [...] はメイン・副効果のどれかに全部含まれていればよい */
  function matchCombo(g, cond) {
    const all = [g.effect, ...(g.subEffects || [])];
    return Object.entries(cond).every(([k, v]) => (k === 'effects' ? v.every(id => all.includes(id)) : g[k] === v));
  }

  function build(g, rng) {
    const D = PS.data.descriptions;
    const v = vars(g, rng);
    const parts = [];
    parts.push(fill(pickFresh(rng, D.openers), v));
    parts.push(fill(pickFresh(rng, D.effectLines), v));
    const subIds = g.subEffects || (g.subEffect ? [g.subEffect] : []);
    const pol = id => (L().effect[id] && L().effect[id].polarity) || 'odd';
    if (subIds[0]) parts.push(fill(pickFresh(rng, D.subLines[pol(subIds[0])]), v));
    if (subIds[1]) parts.push(fill(pickFresh(rng, D.sub2Lines[pol(subIds[1])]), v));
    if (rng.chance(0.8)) parts.push(fill(pickFresh(rng, D.senseLines), v));

    // 追加の一文（最大1つ）：組み合わせ > レアリティ > ジョーク の優先度
    const matched = D.combos.filter(c => matchCombo(g, c.if));
    const pairs = matched.filter(c => c.if.effects);
    const combos = pairs.length ? pairs : matched;
    const rlines = D.rarityLines[g.rarity];
    if (combos.length && rng.chance(0.9)) parts.push(rng.pick(combos).text);
    else if (rlines && rng.chance(0.7)) parts.push(rng.pick(rlines));
    else if (rng.chance(PS.data.balance.generator.descriptionJokeRate)) parts.push(pickFresh(rng, D.jokes));

    return parts.join('');
  }

  /** 「おまかせ」用の商品名候補 */
  function suggestName(g, rng) {
    const D = PS.data.descriptions;
    const v = vars(g, rng);
    return fill(rng.pick(D.nameTemplates), v).slice(0, 20);
  }

  PS.core.describe = { build, suggestName };
})(window.PS);
