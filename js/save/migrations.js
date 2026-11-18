/*
 * セーブデータの移行処理
 * データ構造を変えたら state.js の SCHEMA_VERSION を +1 し、
 * ここに「旧バージョン → 新バージョン」の変換関数を追加する。
 *
 * 例）バージョン1 → 2 で potion に quality を追加する場合
 *   2: s => { s.potions.forEach(p => { p.quality = p.quality || 0; }); return s; },
 */
(function (PS) {
  'use strict';

  const steps = {
    // v1 → v2（STEP 5）：商品棚・販売の時間計算・販売履歴を追加
    2: s => {
      s.shelves = [];
      s.lastSimAt = s.lastActiveAt || Date.now();
      s.salesLog = [];
      return s;
    },
    // v2 → v3：お客さんのレビューを追加
    3: s => {
      s.reviews = [];
      return s;
    },
    // v3 → v4（STEP 6）：設備強化・自動採取を追加
    4: s => {
      s.upgrades = s.upgrades || {};
      s.autoGather = { progressSec: 0 };
      return s;
    },
    // v4 → v5：お客さんの注文・思い出の称号を追加
    5: s => {
      s.orders = { list: [], nextAt: 0 };
      s.memories = {};
      return s;
    },
    // v5 → v6：お店の模様替えを追加（今までの見た目のまま始まる）
    6: s => {
      s.decor = { owned: [], use: {} };
      return s;
    },
  };

  function migrate(raw) {
    const target = PS.core.state.SCHEMA_VERSION;
    let s = raw;
    if (typeof s.schemaVersion !== 'number') throw new Error('バージョン情報がありません');
    if (s.schemaVersion > target) throw new Error('新しいバージョンのセーブデータです（アプリを更新してください）');
    while (s.schemaVersion < target) {
      const next = s.schemaVersion + 1;
      const fn = steps[next];
      if (!fn) throw new Error('移行処理が見つかりません: v' + next);
      s = fn(s);
      s.schemaVersion = next;
    }
    return s;
  }

  PS.save.migrations = { migrate };
})(window.PS);
