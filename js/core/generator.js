/*
 * ポーション生成
 *  1. 材料のタグを数量で重み付けして「傾向」を作る
 *  2. レアリティを抽選（希少素材・投入量で高レア寄りに）
 *  3. 効果 → 副効果 → 強さ → 味・香り・色・質感・瓶 の順に抽選
 *     （決まった効果の性質も後の抽選に影響させ、組み合わせに一貫性と面白さを出す）
 *  4. 各項目で一定確率「意外な結果」（傾向を無視した抽選）にする
 * 数値はすべて data/balance.js、候補はすべて data/ から読む。
 */
(function (PS) {
  'use strict';

  const G = () => PS.data.balance.generator;
  const L = () => PS.core.lookup;

  /** 材料 → 傾向ベクトル・合計数・平均レア力 */
  function analyze(ingredients) {
    const tags = {};
    let total = 0, power = 0;
    for (const { materialId, qty } of ingredients) {
      const m = L().material[materialId];
      if (!m || qty <= 0) continue;
      total += qty;
      power += (m.rarityPower || 0) * qty;
      for (const [t, v] of Object.entries(m.tags || {})) tags[t] = (tags[t] || 0) + v * qty;
    }
    if (total > 0) for (const t of Object.keys(tags)) tags[t] /= total;
    return { tags, total, avgPower: total ? power / total : 0 };
  }

  /** 候補の重み：基本値 ×（1 + 傾向との相性）^2 */
  function affinityWeight(item, tags) {
    let s = 0;
    for (const [t, a] of Object.entries(item.tagAffinity || {})) s += (tags[t] || 0) * a;
    const k = 1 + s * G().tagInfluence;
    return (item.baseWeight || 1) * k * k;
  }

  function allowed(list, rarityOrder) {
    return list.filter(x => L().rarityOrder(x.minRarity) <= rarityOrder);
  }

  /** 傾向に沿って抽選。一定確率で傾向を無視（意外性） */
  function pickTrait(rng, list, tags, rarityOrder, extraWeight) {
    const cands = allowed(list, rarityOrder);
    if (rng.chance(G().surpriseRate)) return { item: rng.pick(cands), surprise: true };
    const item = rng.weighted(cands, x => affinityWeight(x, tags) * (extraWeight ? extraWeight(x) : 1));
    return { item, surprise: false };
  }

  function pickRarity(rng, a, opts) {
    const g = G();
    const shift = a.avgPower * g.rarityShiftPerPower
      + Math.log(1 + a.total) * g.rarityQtyBonus
      + ((opts && opts.rarityBonus) || 0);
    return rng.weighted(L().raritiesSorted, r => r.baseWeight * Math.exp(shift * r.order));
  }

  function pickPotency(rng, a, rarityOrder) {
    const [lo, hi] = G().potencyNoise;
    const v = Math.log2(1 + a.total) * 0.9 + rarityOrder * 0.7 + (lo + rng.next() * (hi - lo));
    const list = PS.data.potency;
    const i = Math.max(0, Math.min(list.length - 1, Math.floor(v)));
    return list[i];
  }

  /** 効果の性質を傾向に足し込む */
  function carry(tags, effect, factor) {
    const out = Object.assign({}, tags);
    for (const [t, v] of Object.entries(effect.tagAffinity || {})) out[t] = (out[t] || 0) + v * factor;
    return out;
  }

  /** 内容の署名（同じ内容かどうかの判定に使う。価格と説明文は含めない） */
  function signatureOf(g) {
    const subs = g.subEffects || (g.subEffect ? [g.subEffect] : []);
    return [g.rarity, g.effect, subs.length ? subs.join('+') : '-', g.potency, g.taste, g.aroma, g.color, g.texture, g.bottle].join('|');
  }

  /**
   * ポーションを生成する
   * @param {{materialId, qty}[]} ingredients
   * @param {object} rng PS.core.rng のインスタンス
   * @param {object} [opts] { rarityBonus }
   */
  function generate(ingredients, rng, opts) {
    const d = PS.data;
    const a = analyze(ingredients);
    const rarity = pickRarity(rng, a, opts);
    const ro = rarity.order;
    const boost = G().rareEffectBoost;
    const rareW = x => Math.pow(boost, L().rarityOrder(x.minRarity));

    const effectPick = pickTrait(rng, d.effects, a.tags, ro, rareW);
    const effect = effectPick.item;

    // 副効果（最大2つ）。メインと良し悪しが違う効果が付きやすい＝良い効果と困った効果が混ざる
    const subEffects = [];
    const contrast = x => {
      if (x.polarity === effect.polarity) return 1;
      if (effect.polarity === 'odd' || x.polarity === 'odd') return 1.15;
      return G().contrastBoost;
    };
    const addSub = () => {
      const used = new Set([effect.id, ...subEffects.map(s => s.id)]);
      const others = d.effects.filter(e => !used.has(e.id));
      subEffects.push(pickTrait(rng, others, a.tags, ro, contrast).item);
    };
    if (rng.chance(G().subEffectRate)) {
      addSub();
      if (rng.chance(G().secondSubRate + G().secondSubPerRarity * ro)) addSub();
    }

    const potency = pickPotency(rng, a, ro);
    const t2 = carry(a.tags, effect, G().effectCarry);
    const taste = pickTrait(rng, d.tastes, t2, ro).item;
    const aroma = pickTrait(rng, d.aromas, t2, ro).item;
    const color = pickTrait(rng, d.colors, t2, ro).item;
    const texture = pickTrait(rng, d.textures, t2, ro).item;
    const bottle = pickTrait(rng, d.bottles, t2, ro).item;

    const g = {
      rarity: rarity.id,
      effect: effect.id,
      subEffect: subEffects[0] ? subEffects[0].id : null, // 1つ目（古い形式との互換用）
      subEffects: subEffects.map(e => e.id),
      potency: potency.id,
      taste: taste.id,
      aroma: aroma.id,
      color: color.id,
      texture: texture.id,
      bottle: bottle.id,
      surprise: effectPick.surprise,
    };
    g.basePrice = rng.int(rarity.price[0], rarity.price[1]);
    g.description = PS.core.describe.build(g, rng);
    g.signature = signatureOf(g);
    return g;
  }

  /** 理論上の組み合わせ総数（表示・確認用） */
  function countCombinations() {
    const d = PS.data;
    let total = 0;
    for (const r of d.rarities) {
      const n = list => allowed(list, r.order).length;
      const eff = n(d.effects);
      const subs = 1 + (eff - 1) + (eff - 1) * (eff - 2) / 2; // 副効果なし・1つ・2つ
      total += eff * subs * d.potency.length
        * n(d.tastes) * n(d.aromas) * n(d.colors) * n(d.textures) * n(d.bottles);
    }
    return total;
  }

  PS.core.generator = { generate, analyze, signatureOf, countCombinations };
})(window.PS);
