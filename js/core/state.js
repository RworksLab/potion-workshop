/*
 * ゲーム状態の定義
 * セーブデータの形はここで一元管理する。項目を増やすときは
 *  1) createInitialState に初期値を追加
 *  2) 必要なら js/save/migrations.js に変換処理を追加
 */
(function (PS) {
  'use strict';

  const SCHEMA_VERSION = 5;

  function createInitialState(now) {
    now = now || Date.now();
    return {
      schemaVersion: SCHEMA_VERSION,
      createdAt: now,
      lastActiveAt: now,
      coins: 0,
      shopName: 'ポーション屋',  // 看板に書くお店の名前（10文字まで）
      inventory: {},            // { materialId: 個数 }
      garden: { slots: [], cols: 3 }, // 畑のマス（左上から横に並ぶ）[{ materialId, readyAt, plantedAt }]
      potions: [],              // 作ったポーション（図鑑）
      nameBook: {},             // { 内容の署名: { name, potionId } } 同じ内容のポーションの名前を覚えておく
      pendingPotion: null,      // 調合済み・命名前のポーション（途中で閉じても失われない）
      shelves: [],              // 商品棚 [{ potionId|null, progress: 次の1本までの経過秒 }]
      lastSimAt: now,           // 販売の時間計算を最後に行った日時（オフライン売上の計算に使う）
      salesLog: [],             // 販売履歴 [{ t, potionId, name, qty, coins, soldOut }]
      reviews: [],              // お客さんのレビュー（新しい順）[{ id, t, potionId, potionName, customer, mood, stars, text, key, read }]
      upgrades: {},             // 強化レベル { upgradeId: レベル }
      autoGather: { progressSec: 0 }, // 自動採取（お手伝い妖精）の準備の進み具合
      orders: { list: [], nextAt: now + ((PS.data.orders && PS.data.orders.firstDelayMin) || 2) * 60000 }, // お客さんの注文 [{ id, customer, kind, value, text, createdAt, expiresAt }]
      memories: {},             // 思い出の称号 { 称号ID: 手に入れた日時 }
      stats: { harvested: 0, brewed: 0, sold: 0, earned: 0, spent: 0, autoHarvested: 0, daily: { date: '', earned: 0, sold: 0 } },
      settings: { seVolume: 0.7, bgmVolume: 0.5, bgmOn: true, bgmSong: 'auto' },
    };
  }

  /**
   * 読み込んだデータを検証し、足りない項目を初期値で補う。
   * 形が明らかに壊れている場合は例外を投げる（呼び出し側でバックアップに切り替える）。
   */
  function normalize(raw) {
    if (!raw || typeof raw !== 'object') throw new Error('セーブデータが空です');
    if (typeof raw.schemaVersion !== 'number') throw new Error('バージョン情報がありません');
    const base = createInitialState(raw.createdAt);
    const s = Object.assign(base, raw);
    // 型チェック（壊れていたら初期値へ）
    s.shopName = typeof s.shopName === 'string' ? s.shopName.replace(/[\u0000-\u001f]/g, '').trim().slice(0, 10) : '';
    if (!s.shopName) s.shopName = 'ポーション屋';
    if (typeof s.coins !== 'number' || !isFinite(s.coins) || s.coins < 0) s.coins = 0;
    if (!s.inventory || typeof s.inventory !== 'object') s.inventory = {};
    for (const k of Object.keys(s.inventory)) {
      const v = Math.floor(Number(s.inventory[k]));
      if (!isFinite(v) || v <= 0) delete s.inventory[k]; else s.inventory[k] = v;
    }
    if (!s.garden || !Array.isArray(s.garden.slots)) s.garden = { slots: [], cols: 3 };
    if (!(s.garden.cols >= 1)) s.garden.cols = 3;
    // お客さんの注文・思い出の称号（v5）
    if (!s.orders || typeof s.orders !== 'object' || !Array.isArray(s.orders.list)) s.orders = { list: [], nextAt: 0 };
    s.orders.list = s.orders.list.filter(o => o && o.id && o.kind && o.text && isFinite(o.expiresAt)).slice(0, (PS.data.orders && PS.data.orders.slots) || 3);
    if (!isFinite(s.orders.nextAt)) s.orders.nextAt = 0;
    if (!s.memories || typeof s.memories !== 'object' || Array.isArray(s.memories)) s.memories = {};
    for (const k of Object.keys(s.memories)) if (!isFinite(s.memories[k])) delete s.memories[k];
    s.garden.slots.forEach(sl => { if (sl && sl.special && !['lucky'].includes(sl.special)) delete sl.special; });
    if (!Array.isArray(s.potions)) throw new Error('ポーションデータが壊れています');
    s.potions = s.potions.filter(p => p && typeof p.id === 'string' && p.generated);
    if (!s.nameBook || typeof s.nameBook !== 'object') s.nameBook = {};
    s.stats = Object.assign(base.stats, s.stats || {});
    if (!s.stats.daily || typeof s.stats.daily !== 'object') s.stats.daily = { date: '', earned: 0, sold: 0 };
    s.settings = Object.assign(base.settings, s.settings || {});
    if (!Array.isArray(s.shelves)) s.shelves = [];
    s.shelves = s.shelves.map(sh => ({
      potionId: sh && typeof sh.potionId === 'string' ? sh.potionId : null,
      progress: sh && isFinite(sh.progress) && sh.progress > 0 ? Number(sh.progress) : 0,
    }));
    if (typeof s.lastSimAt !== 'number' || !isFinite(s.lastSimAt)) s.lastSimAt = s.lastActiveAt || Date.now();
    if (!Array.isArray(s.salesLog)) s.salesLog = [];
    if (!Array.isArray(s.reviews)) s.reviews = [];
    s.reviews = s.reviews.filter(r => r && typeof r.text === 'string' && typeof r.potionId === 'string');
    const fixSubs = g => { if (g && !Array.isArray(g.subEffects)) g.subEffects = g.subEffect ? [g.subEffect] : []; };
    if (s.pendingPotion) fixSubs(s.pendingPotion.generated);
    for (const p of s.potions) {
      fixSubs(p.generated);
      if (!isFinite(p.stock) || p.stock < 0) p.stock = 0;
      if (!isFinite(p.price) || p.price < 1) p.price = p.generated.basePrice || 1;
      if (!isFinite(p.sold)) p.sold = 0;
    }
    if (!s.upgrades || typeof s.upgrades !== 'object') s.upgrades = {};
    for (const k of Object.keys(s.upgrades)) {
      const u = PS.data.upgrades.find(x => x.id === k);
      const v = Math.floor(Number(s.upgrades[k]));
      if (!u || !isFinite(v) || v <= 0) delete s.upgrades[k]; else s.upgrades[k] = Math.min(v, u.maxLevel);
    }
    if (!s.autoGather || typeof s.autoGather !== 'object') s.autoGather = { progressSec: 0 };
    if (!isFinite(s.autoGather.progressSec) || s.autoGather.progressSec < 0) s.autoGather.progressSec = 0;
    return s;
  }

  PS.core.state = { SCHEMA_VERSION, createInitialState, normalize };
})(window.PS);
