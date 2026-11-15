/* 薬草園：出現・成長・採取・自動採取のロジック */
(function (PS) {
  'use strict';

  const stat = (state, name) => PS.core.stats.get(state, name);

  function pickMaterial(state, rng) {
    const bonus = stat(state, 'rareBonus');
    return rng.weighted(PS.data.materials, m => m.spawnWeight * (1 + bonus * (m.rarity - 1))).id;
  }

  function regrowMs(state, materialId) {
    const m = PS.core.lookup.material[materialId];
    return (m ? m.regrowSec : 5) * 1000 * stat(state, 'regrowMultiplier');
  }

  /** 現在の畑の広さ */
  function fieldSize(state) {
    const sizes = PS.data.balance.garden.fieldSizes;
    const lv = Math.max(0, Math.min(sizes.length - 1, Math.round(stat(state, 'fieldLevel'))));
    const [cols, rows] = sizes[lv];
    return { cols, rows, count: cols * rows, level: lv };
  }

  /**
   * 畑の広さに合わせてマスをそろえる。
   * 横幅が変わったときは、今ある草花が同じ位置（行・列）に残るように並べ直す。
   * 新しく増えたマスには、すぐ摘める草花が生える。
   */
  function ensureGarden(state, rng, now) {
    const { cols, rows, count } = fieldSize(state);
    const g = state.garden;
    const oldCols = g.cols || 3;
    let slots = g.slots;
    if (oldCols !== cols && slots.length) {
      const moved = new Array(count);
      slots.forEach((s, i) => {
        const r = Math.floor(i / oldCols), c = i % oldCols;
        if (r < rows && c < cols) moved[r * cols + c] = s;
      });
      slots = moved;
    }
    for (let i = 0; i < count; i++) {
      const s = slots[i];
      if (!s || !PS.core.lookup.material[s.materialId]) {
        slots[i] = { materialId: pickMaterial(state, rng), readyAt: now, plantedAt: now };
      }
    }
    slots.length = count;
    g.slots = slots;
    g.cols = cols;
  }

  function isReady(slot, now) { return !!slot && now >= slot.readyAt; }

  /** 0〜1 の成長度（植えた時刻から計算） */
  function growth(slot, now) {
    if (isReady(slot, now)) return 1;
    const start = slot.plantedAt || (slot.readyAt - 5000);
    const total = Math.max(1, slot.readyAt - start);
    return Math.max(0, Math.min(1, (now - start) / total));
  }

  /** 光る芽から採れる珍しい素材（希少度3以上から出やすさで選ぶ） */
  function pickRare(rng) {
    const rare = PS.data.materials.filter(m => m.rarity >= 3);
    return rng.weighted(rare, m => m.spawnWeight).id;
  }

  /**
   * 1マス採取する。成長しきっていなければ null。
   * 特別なマス（光る芽）なら、珍しい素材が採れる。
   * @returns {{index, materialId, qty, special}|null}
   */
  function harvest(state, index, rng, now) {
    const slot = state.garden.slots[index];
    if (!isReady(slot, now)) return null;
    const special = slot.special || null;
    if (special === 'lucky') slot.materialId = pickRare(rng);
    const m = PS.core.lookup.material[slot.materialId];
    const qty = rng.int(m.yield[0], m.yield[1]) + Math.round(stat(state, 'yieldBonus'));
    delete slot.special;
    state.inventory[m.id] = (state.inventory[m.id] || 0) + qty;
    state.stats.harvested += qty;
    const next = pickMaterial(state, rng);
    slot.materialId = next;
    slot.plantedAt = now;
    slot.readyAt = now + regrowMs(state, next);
    return { index, materialId: m.id, qty, special };
  }

  /* ---------- たまに起きる出来事 ---------- */

  /** 育ち途中の草花をいっせいに育てる（蝶々・にわか雨） */
  function bloomAll(state, now) {
    let n = 0;
    for (const s of state.garden.slots) if (s.readyAt > now) { s.readyAt = now; n++; }
    return n;
  }

  /** 素材をいくつかもらう（てんとう虫） */
  function gift(state, rng) {
    const [lo, hi] = PS.data.gardenEvents.giftRange;
    const n = rng.int(lo, hi), got = {};
    for (let i = 0; i < n; i++) {
      const id = pickMaterial(state, rng);
      got[id] = (got[id] || 0) + 1;
      state.inventory[id] = (state.inventory[id] || 0) + 1;
    }
    state.stats.harvested += n;
    return got;
  }

  /** 畑の1マスを特別にする（光る芽）。特別でないマスから選ぶ */
  function makeSpecial(state, type, rng, now) {
    const cands = state.garden.slots.map((s, i) => (s.special ? -1 : i)).filter(i => i >= 0);
    if (!cands.length) return -1;
    const i = rng.pick(cands);
    const slot = state.garden.slots[i];
    slot.special = type;
    if (type === 'lucky') { slot.plantedAt = now; slot.readyAt = now; } // 光る芽はすぐ摘める
    return i;
  }

  /** となりのマス（上下左右 → ななめ の順） */
  function neighbors(state, index) {
    const { cols, count: n } = fieldSize(state);
    const r = Math.floor(index / cols), c = index % cols;
    const at = (dr, dc) => {
      const rr = r + dr, cc = c + dc;
      return rr >= 0 && cc >= 0 && cc < cols && rr * cols + cc < n ? rr * cols + cc : -1;
    };
    return [at(-1, 0), at(1, 0), at(0, -1), at(0, 1), at(-1, -1), at(-1, 1), at(1, -1), at(1, 1)].filter(i => i >= 0);
  }

  /** タップ採取（採取範囲の強化があれば、となりの育ったマスもまとめて摘む） */
  function harvestTap(state, index, rng, now) {
    const first = harvest(state, index, rng, now);
    if (!first) return [];
    const out = [first];
    let extra = Math.round(stat(state, 'harvestArea'));
    for (const i of neighbors(state, index)) {
      if (extra <= 0) break;
      const r = harvest(state, i, rng, now);
      if (r) { out.push(r); extra--; }
    }
    return out;
  }

  /**
   * 自動採取：fromMs〜toMs の間に、お手伝い妖精が育ったマスを順番に摘む。
   * 起動中もアプリを閉じていた間も、この関数で同じように計算する。
   * @returns {{items: {index, materialId, qty}[], total: {materialId: 個数}}}
   */
  function autoGather(state, fromMs, toMs, rng) {
    const out = { items: [], total: {} };
    const iv = stat(state, 'autoGatherSec');
    const ag = state.autoGather;
    if (!(iv > 0) || !(toMs > fromMs)) return out;
    const max = PS.data.balance.garden.autoGatherMaxPerStep;
    let t = fromMs;
    let prog = Math.min(ag.progressSec || 0, iv);
    while (out.items.length < max) {
      const need = (iv - prog) * 1000;
      if (t + need > toMs) { prog += (toMs - t) / 1000; break; }
      t += need; prog = iv; // 妖精の準備ができた
      let ready = state.garden.slots.map((s, i) => (isReady(s, t) ? i : -1)).filter(i => i >= 0);
      if (!ready.length) {
        // 育っているマスがなければ、いちばん早く育つマスまで待つ
        const next = Math.min(...state.garden.slots.map(s => s.readyAt));
        if (next > toMs) break;
        t = next;
        ready = state.garden.slots.map((s, i) => (isReady(s, t) ? i : -1)).filter(i => i >= 0);
      }
      const r = harvest(state, rng.pick(ready), rng, t);
      if (r) {
        out.items.push(r);
        out.total[r.materialId] = (out.total[r.materialId] || 0) + r.qty;
      }
      prog = 0;
    }
    ag.progressSec = Math.min(prog, iv);
    return out;
  }

  PS.core.gather = { bloomAll, gift, makeSpecial, fieldSize, ensureGarden, isReady, growth, harvest, harvestTap, autoGather, pickMaterial, neighbors };
})(window.PS);
