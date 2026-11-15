/* 設定画面：音量・セーブデータの管理（書き出し・読み込み・復元・初期化）・確認用のデバッグ機能 */
(function (PS) {
  'use strict';
  const ui = PS.ui;
  const XI = () => PS.save.exportImport;
  const repo = () => PS.save.repository;
  let root;
  const debug = /[?&]debug=1/.test(location.search);

  const STORAGE_LABEL = {
    indexeddb: '端末内（IndexedDB）',
    localstorage: '端末内（localStorage・代替）',
    memory: '⚠️ 保存できません（ブラウザの設定を確認してください）',
  };

  const fmtBytes = n => (n == null ? '-' : n < 1024 * 1024 ? `${Math.max(1, Math.round(n / 1024))}KB` : `${(n / 1024 / 1024).toFixed(1)}MB`);

  function summaryHtml(sm, title) {
    return `<div class="save-summary">
      ${title ? `<p class="save-summary-title">${title}</p>` : ''}
      <dl class="traits">
        <dt>コイン</dt><dd>${Number(sm.coins).toLocaleString()}G</dd>
        <dt>ポーション</dt><dd>${sm.potions}件（内容の種類 ${sm.kinds}）</dd>
        <dt>畑</dt><dd>${sm.field}　強化 ${sm.upgrades}回</dd>
        <dt>レビュー</dt><dd>${sm.reviews}件</dd>
        <dt>保存日時</dt><dd>${sm.savedAt ? ui.formatDate(sm.savedAt) : '-'}</dd>
        <dt>作成</dt><dd>v${ui.esc(sm.appVersion)}（データ形式 ${sm.fromSchema}）</dd>
      </dl></div>`;
  }

  async function render() {
    const s = PS.store.state;
    root.innerHTML = `
      <div class="screen-head"><h2>設定</h2></div>
      <h3 class="section-title">サウンド</h3>
      <div class="card">
        <label class="row">効果音 <input type="range" id="se-vol" min="0" max="1" step="0.05" value="${s.settings.seVolume}"></label>
        <label class="row">BGM <span class="switch"><input type="checkbox" id="bgm-on" ${s.settings.bgmOn !== false ? 'checked' : ''}><i></i></span></label>
        <label class="row">BGM の曲 <select id="bgm-song">${PS.assets.bgm.list().map(x => `<option value="${x.id}" ${x.id === s.settings.bgmSong ? 'selected' : ''}>${x.name}</option>`).join('')}</select></label>
        <p class="bgm-hint">「時間で切り替え」：朝・昼・夕方はピクニック、夜（19時〜5時）はのどかな草原</p>
        <label class="row">BGM の音量 <input type="range" id="bgm-vol" min="0" max="1" step="0.05" value="${s.settings.bgmVolume}"></label>
      </div>

      <h3 class="section-title">セーブデータ</h3>
      <div class="card">
        <p class="note top">機種変更や、別のブラウザで続きを遊ぶときに使います。ときどき書き出しておくと安心です。</p>
        <button class="btn primary wide" id="exp-file">📤 ファイルに書き出す</button>
        <button class="btn ghost wide" id="exp-copy">📋 テキストでコピーする</button>
        <hr class="sep">
        <button class="btn primary wide" id="imp-file">📥 ファイルから読み込む</button>
        <button class="btn ghost wide" id="imp-paste">📝 テキストを貼り付けて読み込む</button>
        <input type="file" id="imp-input" accept=".json,application/json,text/plain" hidden>
      </div>
      <div class="card" id="backup-card">
        <p class="row">自動バックアップ <span id="backup-at">確認中…</span></p>
        <p class="note">約5分ごとに、端末内へ控えを残しています。データがおかしくなったときに戻せます。</p>
        <button class="btn ghost wide" id="restore-backup" disabled>自動バックアップから戻す</button>
        <button class="btn ghost wide" id="restore-import" hidden>読み込む前のデータに戻す</button>
      </div>
      <div class="card">
        <p class="row">保存先 <span>${STORAGE_LABEL[repo().kind] || '-'}</span></p>
        <p class="row">データの保護 <span id="persist-state">確認中…</span></p>
        <p class="row">使用量 <span id="usage">-</span></p>
      </div>

      <h3 class="section-title">このゲームについて</h3>
      <div class="card">
        <p class="row">ポーションの組み合わせ <span>約${Math.round(PS.core.generator.countCombinations() / 1e8) / 100}億通り</span></p>
        <p class="row">バージョン <span>${PS.VERSION}</span></p>
      </div>
      <div class="card">
        <button class="btn danger wide" id="wipe">データを初期化する</button>
      </div>
      ${debug ? `<div class="card debug"><h3>🛠 デバッグ</h3>
        <button class="btn ghost wide" id="dbg-mats">素材を各30個追加</button>
        <button class="btn ghost wide" id="dbg-coins">コインを1000G追加</button>
        <button class="btn ghost wide" id="dbg-sim">生成シミュレーション（1000回）</button>
        <button class="btn ghost wide" id="dbg-rev">レビューを5件届ける</button>
        <div class="btn-row">${PS.data.gardenEvents.list.map(e => `<button class="btn ghost small" data-dbg-ev="${e.id}">${e.id}</button>`).join('')}</div>
        <p class="hint">↑ 薬草園で出来事を起こす（押すと薬草園へ移動）</p>
        <pre id="dbg-out"></pre></div>` : ''}
      <button class="btn ghost wide" id="back">もどる</button>`;
    bind();
    fillStorageInfo();
  }

  async function fillStorageInfo() {
    const info = await repo().storageInfo();
    const ps = root.querySelector('#persist-state');
    if (ps) ps.textContent = info.persisted === true ? '保護されています' : info.persisted === false ? '通常（ホーム画面に追加すると保護されやすくなります）' : '-';
    const us = root.querySelector('#usage');
    if (us) us.textContent = info.usage != null ? `${fmtBytes(info.usage)}${info.quota ? ` / ${fmtBytes(info.quota)}` : ''}` : '-';
    const b = await repo().backupInfo();
    const at = root.querySelector('#backup-at'), btn = root.querySelector('#restore-backup');
    if (at) at.textContent = b ? ui.formatDate(b.savedAt) : 'まだありません';
    if (btn) btn.disabled = !b;
    const pre = await repo().getCopy('before_import');
    const bi = root.querySelector('#restore-import');
    if (bi && pre) { bi.hidden = false; bi.textContent = `読み込む前のデータに戻す（${ui.formatDate(pre.savedAt)}）`; }
  }

  /* ---------- 書き出し ---------- */
  async function exportFile() {
    await PS.store.flush();
    const now = Date.now();
    const text = XI().toText(PS.store.state, now);
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = XI().fileName(now);
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    ui.toast('セーブデータを書き出しました');
  }

  async function exportCopy() {
    await PS.store.flush();
    const text = XI().toText(PS.store.state);
    const body = ui.modal.open(`<h3 class="modal-title">テキストでコピー</h3>
      <p class="note top">下の文字をすべてコピーして、メモ帳などに保存してください。別の端末では「テキストを貼り付けて読み込む」で戻せます。</p>
      <textarea class="save-text" readonly>${ui.esc(text)}</textarea>
      <button class="btn primary wide" id="copy-now">コピーする</button>`);
    const ta = body.querySelector('textarea');
    body.querySelector('#copy-now').onclick = async () => {
      let ok = false;
      try { await navigator.clipboard.writeText(text); ok = true; } catch (_) { /* noop */ }
      if (!ok) { ta.focus(); ta.select(); try { ok = document.execCommand('copy'); } catch (_) { /* noop */ } }
      ui.toast(ok ? 'コピーしました' : '自動でコピーできませんでした。文字を長押ししてコピーしてください');
    };
  }

  /* ---------- 読み込み ---------- */
  async function confirmAndApply(text) {
    let parsed;
    try { parsed = XI().parse(text); }
    catch (e) { PS.assets.sound.play('error'); await ui.modal.alert(e.message); return; }
    const cur = XI().summarize(PS.store.state, { appVersion: PS.VERSION, exportedAt: Date.now() });
    const body = ui.modal.open(`<h3 class="modal-title">このデータを読み込みますか？</h3>
      ${summaryHtml(parsed.summary, '読み込むデータ')}
      ${summaryHtml(cur, '今のデータ（上書きされます）')}
      <p class="note">今のデータは端末内に控えておくので、あとで「読み込む前のデータに戻す」で戻せます。</p>
      <div class="btn-row"><button class="btn ghost" id="imp-no">やめる</button>
        <button class="btn primary" id="imp-yes">読み込む</button></div>`);
    body.querySelector('#imp-no').onclick = () => body.close();
    body.querySelector('#imp-yes').onclick = async () => {
      try {
        await PS.store.flush();
        await repo().keepCopy('before_import', PS.store.state);
        await PS.app.applyState(parsed.state, { catchUp: true });
        PS.assets.sound.play('confirm');
        ui.toast('セーブデータを読み込みました');
      } catch (e) { ui.toast('読み込みに失敗しました：' + e.message, 4000); }
    };
  }

  function importFile() {
    const input = root.querySelector('#imp-input');
    input.value = '';
    input.onchange = () => {
      const f = input.files && input.files[0];
      if (!f) return;
      const reader = new FileReader();
      reader.onload = () => confirmAndApply(String(reader.result || ''));
      reader.onerror = () => ui.toast('ファイルを読めませんでした');
      reader.readAsText(f);
    };
    input.click();
  }

  function importPaste() {
    const body = ui.modal.open(`<h3 class="modal-title">テキストを貼り付けて読み込む</h3>
      <p class="note top">書き出したセーブデータの文字を、すべて貼り付けてください。</p>
      <textarea class="save-text" id="paste-area" placeholder='{"app":"chiisana-potion-shop", ...}'></textarea>
      <button class="btn primary wide" id="paste-go">確認する</button>`);
    body.querySelector('#paste-go').onclick = () => {
      const text = body.querySelector('#paste-area').value;
      body.close();
      confirmAndApply(text);
    };
  }

  /* ---------- 復元 ---------- */
  async function restoreFrom(getter, label) {
    const b = await getter();
    if (!b) { ui.toast('戻せるデータがありません'); return; }
    const body = ui.modal.open(`<h3 class="modal-title">${label}</h3>
      ${summaryHtml(XI().summarize(b.state, { exportedAt: b.savedAt, appVersion: PS.VERSION }), '戻す先のデータ')}
      <p class="note">今のデータは上書きされます。</p>
      <div class="btn-row"><button class="btn ghost" id="rs-no">やめる</button>
        <button class="btn primary" id="rs-yes">このデータに戻す</button></div>`);
    body.querySelector('#rs-no').onclick = () => body.close();
    body.querySelector('#rs-yes').onclick = async () => {
      await PS.app.applyState(b.state, { catchUp: true });
      ui.toast('データを戻しました');
    };
  }

  function bind() {
    root.querySelector('#se-vol').addEventListener('input', e => PS.assets.sound.setVolume(e.target.value));
    root.querySelector('#se-vol').addEventListener('change', e => {
      PS.store.commit('settings', st => { st.settings.seVolume = Number(e.target.value); });
      PS.assets.sound.play('tap');
    });
    root.querySelector('#bgm-on').addEventListener('change', e => { PS.app.setBgm(e.target.checked); PS.assets.sound.play('tap'); });
    root.querySelector('#bgm-song').addEventListener('change', e => {
      PS.store.commit('settings', st => { st.settings.bgmSong = e.target.value; });
      PS.assets.bgm.setSong(e.target.value);
    });
    root.querySelector('#bgm-vol').addEventListener('input', e => PS.assets.bgm.setVolume(e.target.value));
    root.querySelector('#bgm-vol').addEventListener('change', e => {
      PS.store.commit('settings', st => { st.settings.bgmVolume = Number(e.target.value); });
    });
    root.querySelector('#exp-file').onclick = exportFile;
    root.querySelector('#exp-copy').onclick = exportCopy;
    root.querySelector('#imp-file').onclick = importFile;
    root.querySelector('#imp-paste').onclick = importPaste;
    root.querySelector('#restore-backup').onclick = () => restoreFrom(() => repo().backupInfo(), '自動バックアップから戻す');
    root.querySelector('#restore-import').onclick = () => restoreFrom(() => repo().getCopy('before_import'), '読み込む前のデータに戻す');
    root.querySelector('#back').onclick = () => ui.show(ui.prevScreen || 'garden');
    root.querySelector('#wipe').onclick = async () => {
      if (!await ui.modal.confirm('すべてのデータを消して最初からやり直します。よろしいですか？', '次へ', true)) return;
      if (!await ui.modal.confirm('本当に消しますか？ この操作は取り消せません。（念のため、先に「ファイルに書き出す」をおすすめします）', '初期化する', true)) return;
      await repo().wipe();
      await PS.app.applyState(PS.core.state.createInitialState());
      ui.toast('データを初期化しました');
    };
    if (debug) bindDebug();
  }

  function bindDebug() {
    root.querySelectorAll('[data-dbg-ev]').forEach(b => b.addEventListener('click', () => {
      ui.show('garden'); setTimeout(() => ui.gardenEvent(b.dataset.dbgEv), 300);
    }));
    root.querySelector('#dbg-mats').onclick = () => {
      PS.store.commit('debug', st => { PS.data.materials.forEach(m => { st.inventory[m.id] = (st.inventory[m.id] || 0) + 30; }); });
      ui.toast('素材を追加しました');
    };
    root.querySelector('#dbg-coins').onclick = () => {
      PS.store.commit('debug', st => { st.coins += 1000; });
      ui.toast('コインを追加しました');
    };
    root.querySelector('#dbg-rev').onclick = () => {
      const ps = PS.store.state.potions;
      if (!ps.length) { ui.toast('先にポーションを作ってください'); return; }
      const rng = PS.core.rng.fresh();
      const items = Array.from({ length: 5 }, () => ({ potionId: rng.pick(ps).id, qty: 1 }));
      const saved = PS.data.balance.reviews.chance;
      PS.data.balance.reviews.chance = 1;
      PS.store.commit('debug', s => PS.core.reviews.fromSales(s, { items }, rng, Date.now()));
      PS.data.balance.reviews.chance = saved;
      ui.toast('レビューを5件追加しました');
    };
    root.querySelector('#dbg-sim').onclick = () => {
      const out = root.querySelector('#dbg-out');
      const sel = PS.data.materials.filter(m => PS.store.state.inventory[m.id] > 0).slice(0, 3).map(m => ({ materialId: m.id, qty: 3 }));
      const ing = sel.length ? sel : [{ materialId: 'green_herb', qty: 5 }];
      const rng = PS.core.rng.create(1), eff = {}, rar = {};
      for (let i = 0; i < 1000; i++) {
        const g = PS.core.generator.generate(ing, rng);
        eff[g.effect] = (eff[g.effect] || 0) + 1; rar[g.rarity] = (rar[g.rarity] || 0) + 1;
      }
      const L = PS.core.lookup;
      out.textContent = '材料: ' + ui.ingredientsText(ing) + '\n\nレア: ' +
        ['N', 'R', 'SR', 'SSR', 'UR'].map(k => `${k} ${((rar[k] || 0) / 10).toFixed(1)}%`).join(' / ') + '\n\n効果:\n' +
        Object.entries(eff).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([k, v]) => `  ${L.effect[k].name} ${(v / 10).toFixed(1)}%`).join('\n');
    };
  }

  ui.registerScreen({
    id: 'settings', label: '設定', icon: '⚙️', tab: false,
    mount(el) { root = el; },
    onShow: render,
  });
})(window.PS);
