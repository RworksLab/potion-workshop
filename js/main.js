/* 起動処理 */
(function (PS) {
  'use strict';
  const ui = PS.ui;

  let shownCoins = null;
  function updateHeader(s) {
    const el = ui.$('#coin-count');
    if (!el || shownCoins === s.coins) return;
    if (shownCoins !== null && s.coins > shownCoins) {
      const box = el.parentElement;
      box.classList.remove('bump'); void box.offsetWidth; box.classList.add('bump');
    }
    shownCoins = s.coins;
    el.textContent = s.coins.toLocaleString();
  }

  /** アプリに戻ってきた時：離れていた時間ぶん販売を進め、長ければ売上を見せる */
  function catchUp(isBoot) {
    const before = PS.store.state.lastSimAt;
    const away = (Date.now() - before) / 1000;
    const showSummary = isBoot || away >= PS.data.balance.shop.welcomeBackSec;
    const r = PS.clock.step(Date.now(), { catchUp: showSummary });
    const gathered = r.gather && r.gather.items.length;
    if ((r.items.length || gathered) && showSummary && away >= 30) ui.showWelcomeBack(r);
  }

  /**
   * 別のセーブデータに切り替える（読み込み・復元・初期化で使う）
   * 時間進行を止め、開いている画面を閉じ、新しいデータを整えて保存し直す。
   */
  /** 効果音・BGM の設定を反映する */
  function applySound(st) {
    PS.assets.sound.setVolume(st.seVolume);
    PS.assets.bgm.setVolume(st.bgmVolume);
    PS.assets.bgm.setSong(st.bgmSong);
    PS.assets.bgm.setEnabled(st.bgmOn !== false);
  }

  /** BGM のオン・オフを切り替えて保存する（設定画面から呼ぶ） */
  function setBgm(on) {
    PS.store.commit('settings', s => { s.settings.bgmOn = !!on; });
    applySound(PS.store.state.settings);
  }

  async function applyState(state, opts) {
    PS.clock.stop();
    ui.$$('#modal-root .modal-wrap').forEach(w => w.remove());
    PS.core.gather.ensureGarden(state, PS.core.rng.fresh(), Date.now());
    PS.core.sales.ensureShelves(state);
    PS.store.replace(state);
    applySound(state.settings);
    await PS.store.flush();
    ui.show('garden');
    PS.store.notify('boot');
    if (opts && opts.catchUp) catchUp(true);
    if (state.pendingPotion) ui.lab.resumePending();
    PS.clock.start();
  }
  PS.app = { applyState, applySound, setBgm };

  async function boot() {
    PS.core.lookup.build();

    // 保存先の準備と読み込み
    await PS.save.repository.init();
    const res = await PS.save.repository.load();
    let state = res.state;
    if (!state) state = PS.core.state.createInitialState();
    PS.core.gather.ensureGarden(state, PS.core.rng.fresh(), Date.now());
    PS.core.sales.ensureShelves(state);
    PS.store.replace(state);
    applySound(state.settings);
    PS.assets.bgm.autostart();   // 設定を読んだらすぐ BGM（ブラウザが止めている場合は最初のタップで鳴る）

    // 画面の構築
    ui.$('#coin-icon').innerHTML = PS.assets.art.render('coin');
    ui.buildScreens();
    PS.store.subscribe(updateHeader);
    PS.store.notify('boot'); // ヘッダー・タブのバッジなどを初期表示
    ui.$('#open-settings').addEventListener('click', () => { PS.assets.sound.play('tap'); ui.show('settings'); });
    ui.show('garden');
    document.body.classList.add('ready');

    if (res.recovered) ui.toast('セーブデータの読み込みに失敗したため、バックアップから復元しました', 4000);
    else if (res.error) ui.toast('セーブデータを読み込めなかったため、新しく始めます', 4000);
    if (PS.save.repository.kind === 'memory') ui.toast('このブラウザではデータを保存できません', 4000);
    if (!res.state) await PS.store.flush(); // 初回は即保存
    if (state.pendingPotion) ui.lab.resumePending();
    // はじめて遊ぶ人にだけ、遊び方のスライドを出す（ゲームのデータは変えない）
    if (ui.tutorial.shouldAutoShow(!res.state)) ui.tutorial.open();

    // 閉じていた間の販売を反映してから、時間進行を開始
    catchUp(true);
    PS.clock.start();

    // 自動保存
    setInterval(() => PS.store.flush(), PS.data.balance.save.autosaveSec * 1000);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { PS.clock.step(); PS.store.flush(); }
      else catchUp(false);
    });
    window.addEventListener('pagehide', () => PS.store.flush());

    // スマホの音声は最初のタップで有効化
    window.addEventListener('pointerdown', () => PS.assets.sound.unlock(), { once: true });

    registerServiceWorker();
    PS.save.repository.requestPersist(); // データが消えにくくなるようにお願い（対応ブラウザのみ）
  }

  /* PWA：http(s) で配信されている時だけ Service Worker を登録（file:// では使えない） */
  function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    if (!/^https?:$/.test(location.protocol)) return;
    // すでに前の版が動いていたかどうか（初めて開いたときは「新しい版」の案内を出さない）
    let hadController = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.register('./sw.js').then(reg => {
      // アプリに戻ってきたときにも、新しい版が出ていないか確かめる
      document.addEventListener('visibilitychange', () => { if (!document.hidden) reg.update().catch(() => {}); });
    }).catch(e => console.warn('Service Worker の登録に失敗', e));
    // 新しい版の準備ができたら、画面の下に案内を出す（タップで切り替え）
    // （初めて開いた画面のままでも、その後に新しい版が出たら案内する）
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (hadController) showUpdateBar(); hadController = true; });
  }

  function showUpdateBar() {
    if (ui.$('#update-bar')) return;
    const bar = document.createElement('button');
    bar.id = 'update-bar';
    bar.className = 'update-bar';
    bar.innerHTML = '<span>✨ 新しいバージョンがあります</span><b>タップで更新</b>';
    bar.addEventListener('click', async () => {
      bar.disabled = true;
      bar.querySelector('b').textContent = '更新中…';
      await PS.store.flush();   // 遊んでいた内容を保存してから切り替える
      location.reload();
    });
    document.body.appendChild(bar);
  }

  boot().catch(e => {
    console.error(e);
    document.body.innerHTML = `<div class="fatal"><h2>起動できませんでした</h2><p>${ui.esc(e.message || e)}</p>
      <button onclick="location.reload()">再読み込み</button></div>`;
  });
})(window.PS);
