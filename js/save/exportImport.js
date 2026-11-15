/*
 * セーブデータの書き出し・読み込み（JSON）
 * 機種変更・別のブラウザへの引っ越し・念のための控えに使う。
 *
 * 書き出す形：
 *  { app: 'chiisana-potion-shop', format: 1, appVersion, schemaVersion, exportedAt, state: {...} }
 * 読み込みでは、この形のほか「state だけ」の JSON も受け付ける。
 * 古いバージョンのデータは migrations.js で最新の形に変換してから取り込む。
 */
(function (PS) {
  'use strict';

  const APP_ID = 'chiisana-potion-shop'; // タイトル変更後も、以前のセーブデータを読めるようにこのまま
  const FORMAT = 1;
  const MAX_BYTES = 20 * 1024 * 1024; // 異常に大きいファイルは読まない

  function buildExport(state, now) {
    return {
      app: APP_ID,
      format: FORMAT,
      appVersion: PS.VERSION,
      schemaVersion: state.schemaVersion,
      exportedAt: now || Date.now(),
      state: JSON.parse(JSON.stringify(state)),
    };
  }

  function toText(state, now) {
    return JSON.stringify(buildExport(state, now));
  }

  function fileName(now) {
    const d = new Date(now || Date.now());
    const z = n => String(n).padStart(2, '0');
    return `potion-shop-save-${d.getFullYear()}${z(d.getMonth() + 1)}${z(d.getDate())}-${z(d.getHours())}${z(d.getMinutes())}.json`;
  }

  /** 内容の要約（読み込み前の確認表示用） */
  function summarize(state, meta) {
    const kinds = new Set(state.potions.map(p => p.generated && p.generated.signature)).size;
    const levels = Object.values(state.upgrades || {}).reduce((a, b) => a + b, 0);
    let field = '3×3';
    try { const f = PS.core.gather.fieldSize(state); field = `${f.cols}×${f.rows}`; } catch (_) { /* noop */ }
    return {
      coins: state.coins,
      potions: state.potions.length,
      kinds,
      reviews: (state.reviews || []).length,
      upgrades: levels,
      field,
      createdAt: state.createdAt,
      savedAt: (meta && meta.exportedAt) || state.lastActiveAt,
      appVersion: (meta && meta.appVersion) || '不明',
      fromSchema: (meta && meta.schemaVersion) || state.schemaVersion,
    };
  }

  /**
   * 文字列を読み込み、検証・移行して state を返す。
   * 問題があれば、わかりやすいメッセージ付きの Error を投げる（今のデータには触らない）。
   * @returns {{state, summary}}
   */
  function parse(text) {
    if (typeof text !== 'string' || !text.trim()) throw new Error('データが空です');
    if (text.length > MAX_BYTES) throw new Error('ファイルが大きすぎます');
    let obj;
    try { obj = JSON.parse(text.trim()); }
    catch (_) { throw new Error('セーブデータの形式ではありません（JSONとして読めません）'); }
    if (!obj || typeof obj !== 'object') throw new Error('セーブデータの形式ではありません');

    let meta = null, raw = obj;
    if (obj.app !== undefined || obj.state !== undefined) {
      if (obj.app !== APP_ID) throw new Error('「ふしぎなポーション工房」のセーブデータではありません');
      if (typeof obj.format === 'number' && obj.format > FORMAT) throw new Error('新しいバージョンのアプリで作られたデータです。アプリを更新してから読み込んでください');
      meta = obj; raw = obj.state;
    }
    if (!raw || typeof raw !== 'object' || typeof raw.schemaVersion !== 'number' || !Array.isArray(raw.potions)) {
      throw new Error('セーブデータの中身が見つかりません');
    }
    let state;
    try {
      state = PS.core.state.normalize(PS.save.migrations.migrate(JSON.parse(JSON.stringify(raw))));
    } catch (e) {
      throw new Error('データを読み込めませんでした：' + (e.message || e));
    }
    return { state, summary: summarize(state, meta) };
  }

  PS.save.exportImport = { buildExport, toText, fileName, parse, summarize, APP_ID };
})(window.PS);
