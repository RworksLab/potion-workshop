/* 乱数ユーティリティ（シード指定で再現可能） */
(function (PS) {
  'use strict';

  // mulberry32：軽量で十分な品質の擬似乱数
  function create(seed) {
    let a = (seed >>> 0) || 1;
    const next = function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    return {
      next,
      /** min以上max以下の整数 */
      int(min, max) { return Math.floor(next() * (max - min + 1)) + min; },
      chance(p) { return next() < p; },
      pick(arr) { return arr[Math.floor(next() * arr.length)]; },
      /** 重み付き抽選。weightFn(item) が 0 以下の候補は選ばれない */
      weighted(items, weightFn) {
        let total = 0;
        const ws = items.map(it => { const w = Math.max(0, weightFn(it)); total += w; return w; });
        if (total <= 0) return items.length ? items[Math.floor(next() * items.length)] : undefined;
        let r = next() * total;
        for (let i = 0; i < items.length; i++) { r -= ws[i]; if (r < 0) return items[i]; }
        return items[items.length - 1];
      },
    };
  }

  /** 通常プレイ用（毎回異なるシード） */
  function fresh() {
    return create((Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0);
  }

  PS.core.rng = { create, fresh };
})(window.PS);
