/*
 * セーブデータの書き出し・読み込み（JSON）
 * 機種変更・別のブラウザへの引っ越し・念のための控えに使う。
 *
 * 書き出す形：
 *  { app: 'chiisana-potion-shop', format: 1, appVersion, schemaVersion, exportedAt, state: {...} }
 * 読み込みでは、この形のほか「state だけ」の JSON も受け付ける。
 * 古いバージョンのデータは migrations.js で最新の形に変換してから取り込む。
 *
 * 引き継ぎコード（テキストで移すとき用。中身は上と同じ JSON を圧縮したもの）：
 *  「FPW1-」＋ gzip で圧縮して base64url にした文字列。中身はまったく同じなので、何も失われない
 *  読み込みでは、引き継ぎコードと、これまでの JSON テキストの両方を受け付ける（改行や空白が混ざっても読める）
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

  /* ---------- 引き継ぎコード（圧縮） ---------- */
  const CODE_PREFIX = 'FPW1-';
  const canCompress = () => typeof CompressionStream === 'function' && typeof DecompressionStream === 'function' && typeof Response === 'function';

  function bytesToB64url(bytes) {
    let s = '';
    for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function b64urlToBytes(str) {
    let b = str.replace(/-/g, '+').replace(/_/g, '/');
    while (b.length % 4) b += '=';
    const bin = atob(b);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  async function gzip(text) {
    const stream = new Blob([text]).stream().pipeThrough(new CompressionStream('gzip'));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  }
  async function gunzip(bytes) {
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
    return new Response(stream).text();
  }

  /** 引き継ぎコードを作る（圧縮できない古いブラウザでは null） */
  async function toCode(state, now) {
    if (!canCompress()) return null;
    const text = toText(state, now);
    const code = CODE_PREFIX + bytesToB64url(await gzip(text));
    // 念のため、元に戻して同じになるか確かめてから渡す（壊れたコードを渡さないため）
    if ((await decodeCode(code)) !== text) throw new Error('引き継ぎコードを作れませんでした');
    return code;
  }

  async function decodeCode(code) {
    if (!canCompress()) throw new Error('このブラウザは引き継ぎコードに対応していません。ファイルで読み込んでください');
    let bytes;
    try { bytes = b64urlToBytes(code.slice(CODE_PREFIX.length)); }
    catch (_) { throw new Error('引き継ぎコードが正しくありません（文字が足りないか、ちがう文字が混ざっています）'); }
    try { return await gunzip(bytes); }
    catch (_) { throw new Error('引き継ぎコードが途中で切れているか、まちがっています。もう一度コピーしてください'); }
  }

  /** 引き継ぎコードでも JSON テキストでも読み込む（parse と同じく、今のデータには触らない） */
  async function parseAny(input) {
    if (typeof input !== 'string' || !input.trim()) throw new Error('データが空です');
    const at = input.indexOf(CODE_PREFIX);
    if (at >= 0 && input.trim()[0] !== '{') {
      // 改行・空白・かっこなど、コードに使わない文字が混ざっても読めるように取りのぞく
      const code = CODE_PREFIX + input.slice(at + CODE_PREFIX.length).replace(/[^A-Za-z0-9_-]/g, '');
      return parse(await decodeCode(code));
    }
    return parse(input);
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

  PS.save.exportImport = { buildExport, toText, toCode, decodeCode, parseAny, canCompress, fileName, parse, summarize, APP_ID, CODE_PREFIX };
})(window.PS);
