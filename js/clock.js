/*
 * ゲーム内の時間進行
 * 1秒ごとに「自動採取」と「販売」を進める。
 * アプリを閉じていた・裏に回っていた時間も、戻ってきた時に同じ計算でまとめて処理する（上限あり）。
 * 今後、時間で進む要素を増やすときはここに足す。
 */
(function (PS) {
  'use strict';

  let timer = null;
  const clock = {
    /** 直近の結果（画面の演出用） */
    lastResult: null,

    /**
     * 時間を進める
     * @returns {{items, total, qty, elapsed, capped, gather, reviews, catchUp}}
     */
    step(now, opts) {
      now = now || Date.now();
      const state = PS.store.state;
      const rng = PS.core.rng.fresh();
      // 自動採取（販売と同じ時間幅・同じ上限で計算）
      const cap = PS.data.balance.shop.offlineCapHours * 3600 * 1000;
      const from = Math.max(state.lastSimAt, now - cap);
      const gather = now > from ? PS.core.gather.autoGather(state, from, now, rng) : { items: [], total: {} };
      // 販売（lastSimAt はここで更新される）
      const r = PS.core.sales.advance(state, now);
      r.gather = gather;
      r.catchUp = !!(opts && opts.catchUp); // 「おかえりなさい」でまとめて見せる分は個別のお知らせを出さない
      if (r.items.length || gather.items.length) {
        clock.lastResult = r;
        PS.store.commit('sales', s => {
          s.stats.autoHarvested = (s.stats.autoHarvested || 0) + gather.items.reduce((t, x) => t + x.qty, 0);
          PS.core.sales.addLog(s, r, now);
          PS.core.sales.recordDaily(s, r, now);
          r.reviews = PS.core.reviews.fromSales(s, r, rng, now);
        });
      }
      // お客さんの注文：帰った人を外し、空いた枠に次のお客さんを入れる
      if (PS.core.orders && PS.core.orders.due(state, now)) {
        PS.store.commit('orders', s => PS.core.orders.refresh(s, now, rng));
      }
      return r;
    },

    start() {
      clearInterval(timer);
      timer = setInterval(() => clock.step(), 1000);
    },
    stop() { clearInterval(timer); timer = null; },
  };

  PS.clock = clock;
})(window.PS);
