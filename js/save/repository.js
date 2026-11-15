/*
 * セーブデータの読み書き
 *  main   … 最新のセーブ
 *  backup … 数分おきに残す控え（main が壊れた時の復旧用）
 *  corrupt_<日時> … 読めなかったデータの退避先（上書きで消さないため）
 */
(function (PS) {
  'use strict';

  const BACKUP_INTERVAL_MS = 5 * 60 * 1000;
  let backend = null;
  let lastBackupAt = 0;

  function pack(state) {
    return { savedAt: Date.now(), schemaVersion: state.schemaVersion, json: JSON.stringify(state) };
  }

  function unpack(rec) {
    if (!rec || typeof rec.json !== 'string') throw new Error('セーブ形式が不正です');
    const raw = JSON.parse(rec.json);
    return PS.core.state.normalize(PS.save.migrations.migrate(raw));
  }

  const repo = {
    get kind() { return backend ? backend.kind : 'none'; },

    async init() { backend = await PS.save.db.open(); return backend.kind; },

    /**
     * @returns {{state: object|null, recovered: boolean, error: string|null}}
     */
    async load() {
      let mainRec;
      try {
        mainRec = await backend.get('main');
        if (mainRec === undefined) return { state: null, recovered: false, error: null }; // 初回
        return { state: unpack(mainRec), recovered: false, error: null };
      } catch (e) {
        console.error('メインのセーブを読み込めません', e);
        // 壊れたデータは消さずに退避
        try { if (mainRec !== undefined) await backend.set('corrupt_' + Date.now(), mainRec); } catch (_) { /* noop */ }
        try {
          const b = await backend.get('backup');
          if (b !== undefined) return { state: unpack(b), recovered: true, error: String(e.message || e) };
        } catch (e2) { console.error('バックアップも読み込めません', e2); }
        return { state: null, recovered: false, error: String(e.message || e) };
      }
    },

    async save(state) {
      const rec = pack(state);
      await backend.set('main', rec);
      if (Date.now() - lastBackupAt > BACKUP_INTERVAL_MS) {
        await backend.set('backup', rec);
        lastBackupAt = Date.now();
      }
    },

    /** 自動バックアップの情報（なければ null） */
    async backupInfo() {
      try {
        const b = await backend.get('backup');
        if (!b) return null;
        const st = unpack(b);
        return { savedAt: b.savedAt, state: st };
      } catch (_) { return null; }
    },

    /** 読み込みなどの前に、今のデータを別の場所に控えておく */
    async keepCopy(key, state) {
      await backend.set(key, pack(state));
    },

    async getCopy(key) {
      try { const r = await backend.get(key); return r ? { savedAt: r.savedAt, state: unpack(r) } : null; }
      catch (_) { return null; }
    },

    /** データが消えにくくなるよう、ブラウザに永続保存をお願いする（対応ブラウザのみ） */
    async requestPersist() {
      try {
        if (navigator.storage && navigator.storage.persist) {
          if (await navigator.storage.persisted()) return true;
          return await navigator.storage.persist();
        }
      } catch (_) { /* noop */ }
      return false;
    },

    async storageInfo() {
      const out = { persisted: null, usage: null, quota: null };
      try {
        if (navigator.storage) {
          if (navigator.storage.persisted) out.persisted = await navigator.storage.persisted();
          if (navigator.storage.estimate) { const e = await navigator.storage.estimate(); out.usage = e.usage; out.quota = e.quota; }
        }
      } catch (_) { /* noop */ }
      return out;
    },

    async wipe() {
      await backend.remove('main');
      await backend.remove('backup');
      lastBackupAt = 0;
    },
  };

  PS.save.repository = repo;
})(window.PS);
