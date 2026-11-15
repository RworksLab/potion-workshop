/*
 * 調合と命名・登録
 * 調合すると素材を消費し、結果を state.pendingPotion に保存する（命名前に閉じても失われない）。
 * 名前を決めると potions（図鑑）に登録される。
 */
(function (PS) {
  'use strict';

  const B = () => PS.data.balance.brew;

  function cleanSelection(selection) {
    return Object.entries(selection || {})
      .map(([materialId, qty]) => ({ materialId, qty: Math.floor(Number(qty) || 0) }))
      .filter(x => x.qty > 0);
  }

  /** @returns {{ok:boolean, reason?:string, total:number}} */
  function validate(state, selection) {
    const items = cleanSelection(selection);
    const total = items.reduce((s, x) => s + x.qty, 0);
    if (state.pendingPotion) return { ok: false, reason: '命名待ちのポーションがあります', total };
    if (total < B().minTotal) return { ok: false, reason: `材料を${B().minTotal}個以上入れてください`, total };
    const cap = PS.core.stats.get(state, 'cauldronCap');
    if (total > cap) return { ok: false, reason: `調合釜に入るのは${cap}個までです`, total };
    for (const { materialId, qty } of items) {
      if (!PS.core.lookup.material[materialId]) return { ok: false, reason: '不明な素材があります', total };
      if ((state.inventory[materialId] || 0) < qty) return { ok: false, reason: '素材が足りません', total };
    }
    return { ok: true, total };
  }

  function yieldCount(total) {
    const b = B();
    return Math.min(b.yieldMax, b.yieldBase + Math.floor(total / b.yieldPerQty));
  }

  /** 同じ内容のポーションに以前付けた名前 */
  function knownNameFor(state, signature) {
    const entry = state.nameBook[signature];
    if (entry && entry.name) return entry.name;
    const p = state.potions.find(x => x.generated.signature === signature);
    return p ? p.name : null;
  }

  function execute(state, selection, rng, now) {
    const v = validate(state, selection);
    if (!v.ok) throw new Error(v.reason);
    const items = cleanSelection(selection);
    for (const { materialId, qty } of items) {
      state.inventory[materialId] -= qty;
      if (state.inventory[materialId] <= 0) delete state.inventory[materialId];
    }
    const generated = PS.core.generator.generate(items, rng);
    state.pendingPotion = {
      generated,
      ingredients: items,
      count: yieldCount(v.total),
      createdAt: now,
      knownName: knownNameFor(state, generated.signature),
    };
    state.stats.brewed += 1;
    return state.pendingPotion;
  }

  function newId(now) {
    return 'p_' + now.toString(36) + '_' + Math.floor(Math.random() * 1e9).toString(36);
  }

  function sanitizeName(name) {
    return String(name || '').replace(/[\u0000-\u001f]/g, '').trim().slice(0, 20);
  }

  /** 名前を付けて図鑑に登録 */
  function finalize(state, name, now) {
    const pend = state.pendingPotion;
    if (!pend) throw new Error('命名するポーションがありません');
    const nm = sanitizeName(name);
    if (!nm) throw new Error('名前を入力してください');
    const potion = {
      id: newId(now),
      name: nm,
      generated: pend.generated,
      price: pend.generated.basePrice,
      ingredients: pend.ingredients,
      createdAt: pend.createdAt,
      favorite: false,
      stock: pend.count,
      sold: 0,
    };
    state.potions.push(potion);
    state.nameBook[potion.generated.signature] = { name: nm, potionId: potion.id };
    state.pendingPotion = null;
    return potion;
  }

  function rename(state, potionId, name) {
    const p = state.potions.find(x => x.id === potionId);
    const nm = sanitizeName(name);
    if (!p || !nm) return false;
    p.name = nm;
    state.nameBook[p.generated.signature] = { name: nm, potionId: p.id };
    return true;
  }

  function toggleFavorite(state, potionId) {
    const p = state.potions.find(x => x.id === potionId);
    if (p) p.favorite = !p.favorite;
    return p ? p.favorite : false;
  }

  PS.core.brew = { validate, execute, finalize, rename, toggleFavorite, yieldCount, sanitizeName };
})(window.PS);
