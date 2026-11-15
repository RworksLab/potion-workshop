/*
 * 商品棚と自動販売
 * 販売は「経過秒数」だけで計算する simulate(state, 秒) に一本化している。
 * 起動中の1秒ごとの進行も、アプリを閉じていた間の売上も、同じ関数で計算するので結果が一致する。
 */
(function (PS) {
  'use strict';

  const B = () => PS.data.balance.shop;
  const findPotion = (state, id) => state.potions.find(p => p.id === id);

  /** 棚の数（能力値） */
  function shelfCount(state) { return Math.round(PS.core.stats.get(state, 'shelfSlots')); }

  /** 棚の数をそろえ、存在しない・在庫切れの商品を下ろす */
  function ensureShelves(state) {
    const n = shelfCount(state);
    for (let i = 0; i < n; i++) if (!state.shelves[i]) state.shelves[i] = { potionId: null, progress: 0 };
    const seen = new Set();
    for (const sh of state.shelves) {
      const p = sh.potionId && findPotion(state, sh.potionId);
      if (!p || p.stock <= 0 || seen.has(sh.potionId)) { sh.potionId = null; sh.progress = 0; }
      else seen.add(sh.potionId);
    }
  }

  /** 1本売れるまでの秒数（state を渡すと店舗拡張による客足の増加も反映） */
  function intervalFor(potion, state) {
    const b = B();
    const base = potion.generated.basePrice || potion.price || 1;
    const rm = b.rarityInterval[potion.generated.rarity] || 1;
    const speed = state ? PS.core.stats.get(state, 'sellSpeed') : 1;
    const sec = b.baseSellIntervalSec * rm * Math.pow(potion.price / base, b.priceElasticity) / speed;
    return Math.max(b.minIntervalSec, sec);
  }

  function priceRange(potion) {
    const base = potion.generated.basePrice || 1;
    return [B().minPrice, Math.max(B().minPrice, Math.round(base * B().maxPriceRate))];
  }

  /**
   * 指定秒数ぶん販売を進める
   * @returns {{items: {potionId, name, qty, coins, shelf, soldOut}[], total: number, qty: number}}
   */
  function simulate(state, dtSec) {
    const out = { items: [], total: 0, qty: 0 };
    if (!(dtSec > 0)) return out;
    state.shelves.forEach((sh, idx) => {
      if (!sh.potionId) return;
      const p = findPotion(state, sh.potionId);
      if (!p || p.stock <= 0) { sh.potionId = null; sh.progress = 0; return; }
      sh.progress += dtSec;
      const iv = intervalFor(p, state);
      const n = Math.min(Math.floor(sh.progress / iv), p.stock);
      if (n <= 0) return;
      const coins = n * p.price;
      p.stock -= n;
      p.sold += n;
      state.coins += coins;
      state.stats.sold += n;
      state.stats.earned += coins;
      sh.progress -= n * iv;
      const soldOut = p.stock <= 0;
      if (soldOut) { sh.potionId = null; sh.progress = 0; }
      out.items.push({ potionId: p.id, name: p.name, qty: n, coins, shelf: idx, soldOut });
      out.total += coins;
      out.qty += n;
    });
    return out;
  }

  /**
   * 前回の計算から今までの時間ぶん販売を進める（上限時間あり）
   * 端末の時計が過去に戻っていた場合は何もしない（不正に増えも減りもしない）
   */
  function advance(state, now) {
    const raw = (now - state.lastSimAt) / 1000;
    state.lastSimAt = now;
    if (!(raw > 0)) return Object.assign(simulate(state, 0), { elapsed: 0, capped: false });
    const cap = B().offlineCapHours * 3600;
    const dt = Math.min(raw, cap);
    return Object.assign(simulate(state, dt), { elapsed: raw, capped: raw > cap });
  }

  function addLog(state, result, now) {
    for (const it of result.items) {
      state.salesLog.unshift({ t: now, potionId: it.potionId, name: it.name, qty: it.qty, coins: it.coins, soldOut: it.soldOut });
    }
    state.salesLog.length = Math.min(state.salesLog.length, B().logMax);
  }

  function shelfOf(state, potionId) {
    return state.shelves.findIndex(sh => sh.potionId === potionId);
  }

  /** 棚に並べる */
  function place(state, shelfIndex, potionId) {
    const sh = state.shelves[shelfIndex];
    const p = findPotion(state, potionId);
    if (!sh) throw new Error('棚が見つかりません');
    if (!p || p.stock <= 0) throw new Error('在庫がありません');
    if (shelfOf(state, potionId) >= 0) throw new Error('すでに並べています');
    sh.potionId = potionId;
    sh.progress = 0;
  }

  /** 空いている最初の棚に並べる。空きがなければ -1 */
  function placeAnywhere(state, potionId) {
    const i = state.shelves.findIndex(sh => !sh.potionId);
    if (i < 0) return -1;
    place(state, i, potionId);
    return i;
  }

  /** 取り下げ（在庫は図鑑に残る） */
  function remove(state, shelfIndex) {
    const sh = state.shelves[shelfIndex];
    if (sh) { sh.potionId = null; sh.progress = 0; }
  }

  function setPrice(state, potionId, price) {
    const p = findPotion(state, potionId);
    if (!p) return null;
    const [lo, hi] = priceRange(p);
    p.price = Math.max(lo, Math.min(hi, Math.round(Number(price) || lo)));
    return p.price;
  }

  /** 並べられるポーション（在庫あり・未陳列） */
  function placeable(state) {
    const on = new Set(state.shelves.map(sh => sh.potionId).filter(Boolean));
    return state.potions.filter(p => p.stock > 0 && !on.has(p.id));
  }

  /** 日付のキー（端末の日付） */
  function dayKey(now) {
    const d = new Date(now);
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  }

  /** 今日の売上に加算（日付が変わったらリセット） */
  function recordDaily(state, result, now) {
    const key = dayKey(now);
    const d = state.stats.daily && state.stats.daily.date === key ? state.stats.daily : { date: key, earned: 0, sold: 0 };
    d.earned += result.total || 0;
    d.sold += result.qty || 0;
    state.stats.daily = d;
  }

  function today(state, now) {
    const d = state.stats.daily;
    return d && d.date === dayKey(now) ? d : { earned: 0, sold: 0 };
  }

  PS.core.sales = {
    recordDaily, today,
    ensureShelves, intervalFor, priceRange, simulate, advance, addLog,
    place, placeAnywhere, remove, setPrice, placeable, shelfOf, shelfCount,
  };
})(window.PS);
