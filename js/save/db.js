/*
 * 保存先（バックエンド）
 * 第一候補は IndexedDB。使えない環境では localStorage、それも駄目ならメモリ上（保存されない）に切り替える。
 * どのバックエンドも get / set / remove の同じ形で使える。
 */
(function (PS) {
  'use strict';

  const DB_NAME = 'chiisana-potion-shop';
  const DB_VERSION = 1;
  const STORE = 'saves';

  function idbBackend() {
    return new Promise((resolve, reject) => {
      if (!('indexedDB' in window) || !window.indexedDB) return reject(new Error('IndexedDB 非対応'));
      let req;
      try { req = indexedDB.open(DB_NAME, DB_VERSION); } catch (e) { return reject(e); }
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
      };
      req.onerror = () => reject(req.error || new Error('IndexedDB を開けません'));
      req.onblocked = () => reject(new Error('IndexedDB がブロックされました'));
      req.onsuccess = () => {
        const db = req.result;
        const tx = (mode, fn) => new Promise((res, rej) => {
          const t = db.transaction(STORE, mode);
          const st = t.objectStore(STORE);
          let out;
          const r = fn(st);
          if (r) r.onsuccess = () => { out = r.result; };
          t.oncomplete = () => res(out);
          t.onerror = () => rej(t.error);
          t.onabort = () => rej(t.error || new Error('保存が中断されました'));
        });
        resolve({
          kind: 'indexeddb',
          get: key => tx('readonly', st => st.get(key)),
          set: (key, val) => tx('readwrite', st => st.put(val, key)),
          remove: key => tx('readwrite', st => st.delete(key)),
        });
      };
    });
  }

  function localStorageBackend() {
    const ls = window.localStorage;
    const t = '__ps_test__';
    ls.setItem(t, '1'); ls.removeItem(t);
    const P = 'chiisana-potion-shop:';
    return {
      kind: 'localstorage',
      get: async key => { const v = ls.getItem(P + key); return v == null ? undefined : JSON.parse(v); },
      set: async (key, val) => { ls.setItem(P + key, JSON.stringify(val)); },
      remove: async key => { ls.removeItem(P + key); },
    };
  }

  function memoryBackend() {
    const m = new Map();
    return {
      kind: 'memory',
      get: async key => m.get(key),
      set: async (key, val) => { m.set(key, val); },
      remove: async key => { m.delete(key); },
    };
  }

  async function open() {
    try { return await idbBackend(); }
    catch (e) { console.warn('IndexedDB が使えないため代替の保存先を使います:', e); }
    try { return localStorageBackend(); }
    catch (e) { console.warn('localStorage も使えません。データは保存されません:', e); }
    return memoryBackend();
  }

  PS.save.db = { open };
})(window.PS);
