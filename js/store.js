/*
 * Store：ゲーム状態を一か所で持ち、変更を画面に通知する。
 * 状態の変更は必ず PS.store.commit(説明, 関数) を通す。
 * commit すると自動保存が予約され、購読している画面が再描画される。
 */
(function (PS) {
  'use strict';

  let state = null;
  const listeners = new Set();
  let saveTimer = null;

  const store = {
    get state() { return state; },

    replace(newState) {
      state = newState;
      emit('replace');
    },

    /**
     * 状態を変更する
     * @param {string} reason 変更内容（デバッグ用）
     * @param {(s)=>any} fn 状態を書き換える関数。戻り値はそのまま返す
     */
    commit(reason, fn) {
      const result = fn(state);
      state.lastActiveAt = Date.now();
      scheduleSave();
      emit(reason);
      return result;
    },

    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },

    /** 状態は変えずに、画面へ再表示だけ知らせる */
    notify(reason) { emit(reason || 'notify'); },

    /** すぐに保存（画面を閉じる時など） */
    async flush() {
      clearTimeout(saveTimer); saveTimer = null;
      if (!state) return;
      state.lastActiveAt = Date.now();
      try { await PS.save.repository.save(state); }
      catch (e) { console.error('保存に失敗しました', e); PS.ui.toast && PS.ui.toast('保存に失敗しました'); }
    },
  };

  function emit(reason) {
    for (const fn of listeners) {
      try { fn(state, reason); } catch (e) { console.error(e); }
    }
  }

  function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => store.flush(), PS.data.balance.save.debounceMs);
  }

  PS.store = store;
})(window.PS);
