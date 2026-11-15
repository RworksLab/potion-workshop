/*
 * お客さんのレビュー生成
 * 売れたポーションの内容（効果・味・香り・色・質感・副効果・値段）から、短いエピソードを組み立てる。
 * 文章はすべて data/reviews.js にあり、ここは「選び方」と「組み立て方」だけを持つ。
 */
(function (PS) {
  'use strict';

  const D = () => PS.data.reviews;
  const B = () => PS.data.balance.reviews;
  const L = () => PS.core.lookup;

  function fill(tpl, v) { return tpl.replace(/\{(\w+)\}/g, (_, k) => (v[k] != null ? v[k] : '')); }

  /** 香りの名前を「〜の香り」の形にそろえる */
  function aromaPhrase(name) {
    if (/(香り|吐息)$/.test(name)) return name;
    if (/臭い$/.test(name)) return name + 'におい';
    if (name === '無臭') return '無の香り';
    return name + 'の香り';
  }

  /** ポーションに付いている効果（メイン → 副効果の順） */
  function effectsOf(g) {
    const l = L();
    const ids = [g.effect, ...(g.subEffects || (g.subEffect ? [g.subEffect] : []))];
    return ids.map(id => l.effect[id]).filter(Boolean);
  }

  function vars(p, rng) {
    const g = p.generated, l = L();
    const effs = effectsOf(g);
    const others = PS.data.effects.filter(e => !effs.includes(e));
    return {
      name: p.name,
      effect: effs[0].name,
      effText: effs[0].text,
      main: effs[0].name,
      mainText: effs[0].text,
      sub: effs[1] ? effs[1].name : '',
      subText: effs[1] ? effs[1].text : '',
      sub2: effs[2] ? effs[2].name : '',
      sub2Text: effs[2] ? effs[2].text : '',
      taste: l.taste[g.taste].name,
      aroma: l.aroma[g.aroma].name,
      aromaP: aromaPhrase(l.aroma[g.aroma].name),
      color: l.color[g.color].name,
      texName: l.texture[g.texture].name,
      wrong: rng.pick(others).name,
      price: p.price,
    };
  }

  function priceFeel(p) {
    const r = p.price / (p.generated.basePrice || p.price || 1);
    if (r >= B().expensiveRate) return 'high';
    if (r <= B().cheapRate) return 'low';
    return 'normal';
  }

  /** 評価：レアリティ・値段・効果の良し悪しで決まる（困った効果が多いほど辛口） */
  function pickMood(p, rng) {
    const b = B();
    const w = Object.assign({}, b.moodWeights);
    const ro = L().rarityOrder(p.generated.rarity);
    for (const [k, v] of Object.entries(b.rarityBonus)) w[k] += v * ro;
    w.bad *= Math.max(0.3, 1 - ro * 0.2);
    const feel = priceFeel(p);
    if (feel === 'high') { w.bad += 1.5; w.meh += 1; }
    if (feel === 'low') { w.good += 1; w.great += 0.5; }
    effectsOf(p.generated).forEach((e, i) => {
      const k = i === 0 ? 1.5 : 1; // メインの効果ほど印象に残る
      if (e.polarity === 'good') { w.great += 0.7 * k; w.good += 0.6 * k; }
      if (e.polarity === 'bad') { w.bad += 0.9 * k; w.meh += 0.5 * k; }
      if (e.polarity === 'odd') { w.confused += 0.7 * k; w.good += 0.2 * k; }
    });
    return rng.weighted(Object.keys(w), k => w[k]);
  }

  /** 効果の良し悪しと評価が合っているか（体験談を選ぶときの目安） */
  function fits(polarity, mood) {
    if (polarity === 'good') return mood === 'great' || mood === 'good';
    if (polarity === 'bad') return mood === 'bad' || mood === 'meh' || mood === 'confused';
    return true;
  }

  /** メインと副効果の良し悪しの組み合わせに合う評価 */
  function pairMoods(a, b) {
    const pa = a.polarity, pb = b.polarity;
    if (pa === 'odd' || pb === 'odd') return pa === pb ? ['confused'] : ['confused', 'meh', 'good'];
    if (pa === 'good' && pb === 'good') return ['great', 'good'];
    if (pa === 'bad' && pb === 'bad') return ['bad'];
    return pa === 'good' ? ['meh', 'bad'] : ['meh'];   // 良い＋困った / 困った＋良い
  }

  /** 評価に合う本文の候補（キー付き） */
  function bodyCandidates(g, mood) {
    const d = D(), out = [];
    const effs = effectsOf(g), main = effs[0];
    const add = (list, prefix, weight) => (list || []).forEach((text, i) => out.push({ key: `${prefix}:${i}`, text, weight }));
    // メイン効果の体験談（data/effects.js の story）
    add(main.story, `s:${main.id}`, fits(main.polarity, mood) ? 4 : 1.6);
    // 効果ごとの専用エピソード（data/reviews.js の byEffect）
    const be = d.byEffect[main.id] || {};
    add(be[mood], `e:${main.id}:${mood}`, 3);
    // 複数の効果を組み合わせた感想（メインと副効果の良し悪しに合う評価のときだけ）
    if (effs.length >= 3) add(d.multi.triple, 'mt', 2.5);
    if (effs.length >= 2 && pairMoods(main, effs[1]).includes(mood)) add(d.multi[mood], `m2:${mood}`, 3.5);
    add(d.generic[mood], `g:${mood}`, 0.25);
    if (mood === 'confused' || mood === 'good') add(d.misunderstand, 'm', mood === 'confused' ? 1 : 0.4);
    if (mood === 'good' || mood === 'great' || mood === 'meh') add(d.unexpectedUse, 'u', 0.25);
    return out;
  }

  /** 副効果へのひと言（副効果の良し悪しで反応が変わる） */
  function subReaction(g, text, v, rng) {
    const effs = effectsOf(g);
    const r = D().subReact;
    let add = '';
    if (effs[1] && !text.includes(v.subText)) add += fill(rng.pick(r[effs[1].polarity]), v);
    if (effs[2] && !text.includes(v.sub2Text) && rng.chance(0.6)) add += fill(rng.pick(r.second[effs[2].polarity]), v);
    return add;
  }

  /** ひと言の候補 */
  function extraCandidates(p, drank) {
    const g = p.generated, x = D().extras, out = [];
    const spec = (map, id, w, wGeneric) => {
      if (map[id]) map[id].forEach(t => out.push({ text: t, weight: w }));
      else if (map._ && wGeneric) map._.forEach(t => out.push({ text: t, weight: wGeneric }));
    };
    if (drank) spec(x.taste, g.taste, 2, 0.6);
    const n0 = out.length;
    spec(x.aroma, g.aroma, 1.5, 0.5);
    for (let i = n0; i < out.length; i++) out[i].aroma = true;
    spec(x.color, g.color, 1.5, 0);
    if (drank) spec(x.texture, g.texture, 1.5, 0);
    const feel = priceFeel(p);
    if (feel === 'high') x.priceHigh.forEach(t => out.push({ text: t, weight: 2.5 }));
    if (feel === 'low') x.priceLow.forEach(t => out.push({ text: t, weight: 2.5 }));
    return out;
  }

  /**
   * 1件のレビューを作る（実際に付いた効果をもとにした体験談）
   * @param {object} p ポーション
   * @param {string[]} recentKeys 最近使った本文のキー（同じ文章が続かないように）
   */
  function create(p, rng, now, recentKeys) {
    const g = p.generated;
    const mood = pickMood(p, rng);
    // 最近使った本文を避ける（候補が尽きたら避ける範囲を狭める）
    const all = bodyCandidates(g, mood);
    let cands = all.filter(c => !recentKeys.includes(c.key));
    if (!cands.length) cands = all.filter(c => !recentKeys.slice(0, 3).includes(c.key));
    if (!cands.length) cands = all;
    const body = rng.weighted(cands, c => c.weight);
    const v = vars(p, rng);
    let text = fill(body.text, v);
    const isMulti = /^m(t|2)/.test(body.key);
    const drank = !body.key.startsWith('u:');
    // 副効果があれば、その体験も添える（組み合わせの感想を本文にした場合は不要）
    if (!isMulti && drank && effectsOf(g).length > 1 && rng.chance(B().subReactChance)) text += subReaction(g, text, v, rng);
    if (text.length < 60 && rng.chance(B().extraChance)) {
      const usedAroma = text.includes(v.aromaP) || text.includes(v.aroma);
      const ex = extraCandidates(p, drank).filter(e => !text.includes(fill(e.text, v)) && !(usedAroma && e.aroma));
      if (ex.length) text += fill(rng.weighted(ex, e => e.weight).text, v);
    }
    const [s0, s1] = D().moods[mood].stars;
    return {
      id: 'r_' + now.toString(36) + '_' + Math.floor(rng.next() * 1e9).toString(36),
      t: now,
      potionId: p.id,
      potionName: p.name,
      customer: rng.pick(D().customers),
      mood,
      stars: rng.int(s0, s1),
      text,
      key: body.key,
      read: false,
    };
  }

  function recentKeys(state) {
    return state.reviews.slice(0, B().avoidRecent).map(r => r.key);
  }

  /** 販売結果からレビューを作って保存する。新しく届いたレビューを返す */
  function fromSales(state, result, rng, now) {
    const added = [];
    for (const it of result.items) {
      if (added.length >= B().maxPerStep) break;
      if (!rng.chance(B().chance)) continue;
      const p = state.potions.find(x => x.id === it.potionId);
      if (!p) continue;
      const r = create(p, rng, now, recentKeys(state).concat(added.map(a => a.key)));
      added.push(r);
    }
    if (added.length) {
      state.reviews.unshift(...added.reverse());
      state.reviews.length = Math.min(state.reviews.length, B().max);
    }
    return added;
  }

  function unreadCount(state) { return state.reviews.filter(r => !r.read).length; }
  function markAllRead(state) { state.reviews.forEach(r => { r.read = true; }); }

  /** 表示用の商品名（名前変更後は新しい名前） */
  function potionNameOf(state, review) {
    const p = state.potions.find(x => x.id === review.potionId);
    return p ? p.name : review.potionName;
  }

  PS.core.reviews = { create, fromSales, unreadCount, markAllRead, potionNameOf };
})(window.PS);
