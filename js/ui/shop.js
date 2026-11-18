/* お店の画面：商品棚（主役）・陳列・価格変更・売上・お客さんの声・販売履歴 */
(function (PS) {
  'use strict';
  const ui = PS.ui;
  const S = () => PS.core.sales;
  let root, cabinetEl, statsEl, logEl, reviewsEl, bottomEl, ordersEl, timer = null, readTimer = null;
  let bottomTab = 'reviews'; // 下部のタブ：reviews お客さんの声 / log 販売履歴

  const findPotion = id => PS.store.state.potions.find(p => p.id === id);

  ui.formatDuration = function (sec) {
    sec = Math.max(0, Math.round(sec));
    if (sec < 60) return `${sec}秒`;
    if (sec < 3600) return `${Math.floor(sec / 60)}分${sec % 60 ? (sec % 60) + '秒' : ''}`;
    const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60);
    return `${h}時間${m ? m + '分' : ''}`;
  };

  /* ---------- 上部：タイトル・お店の名前・売上 ---------- */
  function renderTop() {
    root.querySelector('#shop-name').textContent = PS.store.state.shopName;
  }

  function renderStats() {
    const s = PS.store.state;
    const d = PS.core.sales.today(s, Date.now());
    statsEl.innerHTML = `
      <div class="stat"><small>今日の売上</small><b>${d.earned.toLocaleString()}<i>G</i></b></div>
      <div class="stat"><small>今日売れた数</small><b>${d.sold}<i>本</i></b></div>
      <div class="stat"><small>これまでの売上</small><b>${s.stats.earned.toLocaleString()}<i>G</i></b></div>`;
  }

  /* ---------- お店の模様替え ---------- */
  const DC = () => PS.core.decor;
  /** 使っている模様替えを、お店の画面の色（CSS の変数）に反映する */
  function decorVars(state) {
    const w = DC().current(state, 'wood').wood, wall = DC().current(state, 'wall').wall;
    const tg = DC().current(state, 'tag'), t = tg.tag, n = DC().current(state, 'name').name_;
    const def = tg.id === PS.data.decor.defaults.tag;
    return {
      '--wood-hi': w[0], '--wood': w[1], '--wood-lo': w[2], '--wood-sh': w[3], '--wall': wall,
      '--tag-bg': t.bg, '--tag-border': t.border, '--tag-string': t.string, '--tag-ink': t.ink || 'inherit', '--tag-ribbon': t.ribbon || 'transparent',
      '--tag-ssr-bg': def ? '' : t.bg, '--tag-ur-bg': def ? '' : t.bg,
      '--name-bg': n.bg, '--name-border': n.border, '--name-ink': n.ink,
      ribbon: !!t.ribbon,
    };
  }
  function applyDecor() {
    if (!root) return;
    const v = decorVars(PS.store.state);
    for (const [k, val] of Object.entries(v)) if (k.startsWith('--')) { if (val) root.style.setProperty(k, val); else root.style.removeProperty(k); }
    root.classList.toggle('decor-ribbon', v.ribbon);
  }

  /** 見本：その品を使ったときの棚の一部を小さく描く */
  function decorSample(it) {
    const s = JSON.parse(JSON.stringify({ decor: PS.store.state.decor }));
    s.decor.owned = s.decor.owned.concat(it.id); s.decor.use[it.cat] = it.id;
    const v = decorVars(s);
    const style = Object.entries(v).filter(([k, val]) => k.startsWith('--') && val).map(([k, val]) => `${k}:${val}`).join(';');
    if (it.cat === 'name') return `<span class="dc-sample dc-name" style="${style}"><span class="shop-name-btn">${ui.esc(PS.store.state.shopName)}</span></span>`;
    if (it.cat === 'tag') return `<span class="dc-sample dc-tag ${v.ribbon ? 'decor-ribbon' : ''}" style="${style}"><span class="slot"><span class="tag"><span class="tag-name">ポーション</span><span class="tag-row"><b class="tag-price">80<i>G</i></b></span></span></span></span>`;
    return `<span class="dc-sample dc-shelf" style="${style}"><span class="cabinet"><span class="cabinet-inner"><span class="dc-board"></span></span></span></span>`;
  }

  let decorCat = 'wood';
  function openDecor() {
    const body = ui.modal.open(`<h3 class="modal-title dc-title"><span class="dc-title-art">${PS.assets.art.render('decor_icon')}</span>お店の模様替え</h3>
      <p class="dc-sub">見た目だけが変わります。買ったものは、いつでも切り替えられます</p>
      <div class="seg dc-tabs">${PS.data.decor.cats.concat([{ id: 'bgm', name: 'BGM' }]).map(c => `<button class="seg-btn ${c.id === decorCat ? 'on' : ''}" data-cat="${c.id}">${c.name}</button>`).join('')}</div>
      <div class="dc-list" id="dc-list"></div>`, { cls: 'modal-decor', onClose: () => PS.assets.bgm.stopPreview() });
    const list = body.querySelector('#dc-list');
    const NOTE_COLORS = { rainy: ['#d6ecfa', '#6fb6e6'], starbox: ['#e8dcfb', '#b48be8'], waltz: ['#fde2ea', '#f07aa8'], festival: ['#fde3c8', '#f3a85c'] };
    const songArt = key => { const [bg, fg] = NOTE_COLORS[key] || ['#eee', '#999'];
      return `<span class="dc-sample dc-song" style="background:${bg}"><svg viewBox="0 0 48 48"><path d="M19 32 V13 L35 9 V28" fill="none" stroke="${fg}" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>
        <ellipse cx="15" cy="33" rx="5.5" ry="4.2" fill="${fg}"/><ellipse cx="31" cy="29" rx="5.5" ry="4.2" fill="${fg}"/></svg></span>`; };
    const drawSongs = () => {
      const s = PS.store.state, playingPrev = PS.assets.bgm.previewing();
      list.innerHTML = PS.data.decor.songs.map(it => {
        const owned = DC().ownsSong(s, it.song), using = s.settings.bgmSong === it.song;
        const pv = `<button class="btn ghost small dc-preview ${playingPrev === it.song ? 'on' : ''}" data-preview="${it.song}">${playingPrev === it.song ? '■ 止める' : '▶ 試聴'}</button>`;
        const btn = using ? '<span class="dc-using">流しています</span>'
          : owned ? `<button class="btn ghost small" data-song="${it.song}">この曲にする</button>`
          : `<button class="btn ${s.coins >= it.price ? 'primary' : 'ghost'} small dc-buy" data-buysong="${it.id}" ${s.coins >= it.price ? '' : 'disabled'}><span class="dc-coin">${PS.assets.art.render('coin')}</span>${it.price.toLocaleString()}</button>`;
        return `<div class="dc-item ${using ? 'using' : ''}">${songArt(it.song)}<b>${ui.esc(it.name)}</b><small class="dc-desc">${ui.esc(it.desc)}</small>${pv}${btn}</div>`;
      }).join('');
    };
    const draw = () => {
      if (decorCat === 'bgm') { drawSongs(); return; }
      const s = PS.store.state;
      list.innerHTML = PS.data.decor.items.filter(it => it.cat === decorCat).map(it => {
        const owned = DC().owns(s, it.id), using = DC().current(s, it.cat).id === it.id;
        const btn = using ? '<span class="dc-using">使っています</span>'
          : owned ? `<button class="btn ghost small" data-use="${it.id}">使う</button>`
          : `<button class="btn ${s.coins >= it.price ? 'primary' : 'ghost'} small dc-buy" data-buy="${it.id}" ${s.coins >= it.price ? '' : 'disabled'}><span class="dc-coin">${PS.assets.art.render('coin')}</span>${it.price.toLocaleString()}</button>`;
        return `<div class="dc-item ${using ? 'using' : ''}">${decorSample(it)}<b>${ui.esc(it.name)}</b>${btn}</div>`;
      }).join('');
    };
    draw();
    body.querySelector('.dc-tabs').addEventListener('click', e => {
      const b = e.target.closest('[data-cat]'); if (!b) return;
      decorCat = b.dataset.cat; PS.assets.sound.play('tap'); PS.assets.bgm.stopPreview();
      body.querySelectorAll('.dc-tabs .seg-btn').forEach(x => x.classList.toggle('on', x === b)); draw();
    });
    list.addEventListener('click', e => {
      const u = e.target.closest('[data-use]'), bb = e.target.closest('[data-buy]');
      const pv = e.target.closest('[data-preview]'), sg = e.target.closest('[data-song]'), bs = e.target.closest('[data-buysong]');
      if (pv) {
        if (PS.assets.bgm.previewing() === pv.dataset.preview) PS.assets.bgm.stopPreview(); else PS.assets.bgm.preview(pv.dataset.preview, 20);
        setTimeout(draw, 50); return;
      }
      if (sg || bs) {
        try {
          if (bs) { const it = PS.store.commit('settings', s => DC().buySong(s, bs.dataset.buysong)); PS.assets.sound.play('upgrade'); ui.toast(`「${it.name}」を手に入れました`); }
          else PS.store.commit('settings', s => { s.settings.bgmSong = sg.dataset.song; });
        } catch (err) { ui.toast(err.message); return; }
        PS.assets.bgm.stopPreview();
        PS.app.applySound(PS.store.state.settings);
        if (PS.store.state.settings.bgmOn === false) ui.toast('BGM はオフになっています（設定でオンにできます）');
        draw(); return;
      }
      try {
        if (u) { PS.store.commit('decor', s => DC().use(s, u.dataset.use)); PS.assets.sound.play('tap'); }
        else if (bb) { const it = PS.store.commit('decor', s => DC().buy(s, bb.dataset.buy)); PS.assets.sound.play('upgrade'); ui.toast(`「${it.name}」に模様替えしました`); }
        else return;
      } catch (err) { ui.toast(err.message); return; }
      applyDecor(); draw();
    });
  }

  /* ---------- お客さんの注文 ---------- */
  const O = () => PS.core.orders;
  function timeLeft(ms) {
    const h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000);
    return h >= 1 ? `あと${h}時間` : `あと${Math.max(1, m)}分`;
  }
  const OPEN_KEY = 'fushigi-potion:orders-open';
  let ordersOpen = (() => { try { return localStorage.getItem(OPEN_KEY) === '1'; } catch (e) { return false; } })();
  function renderOrders() {
    const s = PS.store.state, now = Date.now();
    const list = s.orders.list.slice().sort((a, b) => a.expiresAt - b.expiresAt);
    const canIds = new Set(list.filter(o => O().candidates(s, o).length).map(o => o.id));
    const wrap = root.querySelector('.orders-wrap');
    wrap.classList.toggle('open', ordersOpen);
    wrap.classList.toggle('has-can', canIds.size > 0);
    root.querySelector('#orders-summary').innerHTML = list.length
      ? `${list.length}件${canIds.size ? `<span class="orders-can">わたせる ${canIds.size}</span>` : ''}`
      : '<span class="orders-none">待っています…</span>';
    ordersEl.hidden = !ordersOpen;
    if (!ordersOpen) return;
    ordersEl.innerHTML = list.map((o, i) => {
      const can = canIds.has(o.id);
      return `<div class="order ${can ? 'can' : ''}" data-id="${o.id}">
        <span class="order-pin"></span>
        <small class="order-who">${ui.esc(o.customer)}より</small>
        <p class="order-text">${ui.esc(o.text)}</p>
        <div class="order-foot"><small class="order-time">${timeLeft(o.expiresAt - now)}で帰る</small>
          <button class="order-btn" data-act="give" ${can ? '' : 'disabled'}>${can ? 'わたす' : 'まだない'}</button></div>
      </div>`;
    }).join('') + (list.length < PS.data.orders.slots ? `<p class="order-wait">つぎのお客さんを待っています…</p>` : '');
  }

  /** 注文に合うポーションを選んでわたす */
  function openGive(orderId) {
    const s = PS.store.state;
    const o = s.orders.list.find(x => x.id === orderId);
    if (!o) return;
    const cands = O().candidates(s, o).sort((a, b) => O().reward(b, o) - O().reward(a, o));
    const body = ui.modal.open(`
      <h3 class="modal-title">どれをわたしますか？</h3>
      <p class="order-quote"><b>${ui.esc(o.customer)}</b>${ui.esc(o.text)}</p>
      <div class="pick-list">${cands.map(p => `<button class="pick-row r-${p.generated.rarity}" data-id="${p.id}">
        <span class="pick-art">${PS.assets.art.renderPotion(p.generated)}</span>
        <span class="pick-info"><b>${ui.esc(p.name)}</b><small>${ui.rarityBadge(p.generated.rarity)} 在庫 ${p.stock}本</small></span>
        <span class="pick-reward">お礼<b>${O().reward(p, o).toLocaleString()}G</b></span></button>`).join('')}</div>`, { cls: 'modal-give' });
    body.querySelector('.pick-list').addEventListener('click', e => {
      const b = e.target.closest('.pick-row');
      if (!b) return;
      let res;
      try { res = PS.store.commit('order', st => O().deliver(st, orderId, b.dataset.id, PS.core.rng.fresh(), Date.now())); }
      catch (err) { ui.toast(err.message); return; }
      body.close();
      PS.assets.sound.play('coin');
      setTimeout(() => PS.assets.sound.play('review'), 300);
      renderAll();
      const done = ui.modal.open(`<div class="order-done">
        <p class="order-done-title">🎉 注文にこたえました！</p>
        <p class="order-done-coins">お礼 <b>+${res.coins.toLocaleString()}G</b></p>
        ${ui.reviewCard(res.review)}
        <button class="btn primary wide" data-close>どういたしまして</button></div>`, { cls: 'modal-order-done' });
      done.querySelector('[data-close]').onclick = () => done.close();
    });
  }

  /* ---------- 商品棚（主役） ---------- */
  function slotHtml(sh, i) {
    if (!sh.potionId) {
      return `<button class="slot empty" data-i="${i}" aria-label="棚${i + 1}：商品を並べる">
        <span class="slot-bottle"><span class="slot-ghost">＋</span></span>
        <span class="tag empty-tag">並べる</span></button>`;
    }
    const p = findPotion(sh.potionId);
    if (!p) return '';
    const iv = S().intervalFor(p, PS.store.state);
    const g = p.generated;
    return `<button class="slot r-${g.rarity}" data-i="${i}" aria-label="${ui.esc(p.name)} ${p.price}G">
      <span class="slot-bottle">${PS.assets.art.renderPotion(g)}<span class="slot-stock">×${p.stock}</span></span>
      <span class="tag">
        <b class="tag-name ${ui.nameSizeClass(p.name)}">${ui.esc(p.name)}</b>
        <span class="tag-row">${ui.rarityBadge(g.rarity)}<b class="tag-price">${p.price.toLocaleString()}<i>G</i></b></span>
        <span class="sell-bar" title="約${ui.formatDuration(iv)}で1本"><i style="width:${Math.min(100, sh.progress / iv * 100)}%"></i></span>
      </span></button>`;
  }

  function renderShelves() {
    const s = PS.store.state;
    const onShelf = s.shelves.filter(sh => sh.potionId).length;
    root.querySelector('#cabinet-count').textContent = `${onShelf} / ${s.shelves.length}`;
    // 最後の段が3つに満たないときは、板だけの空きでうめて棚を1段そろえる
    const fill = (3 - s.shelves.length % 3) % 3;
    cabinetEl.innerHTML = s.shelves.map(slotHtml).join('')
      + '<div class="slot filler" aria-hidden="true"><span class="slot-bottle"></span></div>'.repeat(fill);
    const hint = root.querySelector('#cabinet-hint');
    const free = onShelf < s.shelves.length;
    const canPlace = S().placeable(s).length > 0;
    hint.textContent = !onShelf && !canPlace ? '調合室でポーションを作って、棚に並べよう'
      : free && canPlace ? '空いている棚をタップすると、商品を並べられます'
      : free ? '並べられる在庫がありません。調合室で作ろう'
      : '瓶をタップすると、価格の変更や取り下げができます';
  }

  function renderLog() {
    const log = PS.store.state.salesLog.slice(0, 12);
    logEl.innerHTML = log.length
      ? log.map(l => `<li><span class="log-time">${ui.formatDate(l.t).slice(11)}</span>
          <span class="log-name">${ui.esc(l.name)}${l.qty > 1 ? ` ×${l.qty}` : ''}${l.soldOut ? ' <em>完売</em>' : ''}</span>
          <b>+${l.coins}G</b></li>`).join('')
      : '<li class="empty">まだ売れていません</li>';
  }

  /* ---------- お客さんの声 ---------- */
  const REVIEW_PREVIEW = 3;

  function renderReviews() {
    const s = PS.store.state;
    const list = s.reviews.slice(0, REVIEW_PREVIEW);
    const unread = PS.core.reviews.unreadCount(s);
    reviewsEl.innerHTML = `
      ${list.length ? list.map(r => ui.reviewCard(r, { isNew: !r.read })).join('')
        : '<p class="empty small">ポーションが売れると、お客さんが感想を書いてくれることがあります。</p>'}
      ${s.reviews.length > REVIEW_PREVIEW ? `<button class="btn ghost wide" data-act="reviews">もっとお客さんの声を読む</button>` : ''}`;
    if (bottomTab === 'reviews') scheduleRead();
    renderBottomTabs();
  }

  /** 下部のタブ（お客さんの声 / 販売履歴） */
  function renderBottomTabs() {
    const unread = PS.core.reviews.unreadCount(PS.store.state);
    bottomEl.querySelector('[data-tab="reviews"]').innerHTML = `💬 お客さんの声${unread ? `<span class="new-count">${unread}</span>` : ''}`;
    bottomEl.querySelectorAll('[data-tab]').forEach(b => b.classList.toggle('on', b.dataset.tab === bottomTab));
    reviewsEl.hidden = bottomTab !== 'reviews';
    logEl.hidden = bottomTab !== 'log';
  }

  /** 表示したレビューは少し待ってから既読にする（NEW を見せるため） */
  function scheduleRead() {
    if (readTimer || !PS.core.reviews.unreadCount(PS.store.state)) return; // 予約済みなら延期しない
    const ids = new Set(PS.store.state.reviews.filter(r => !r.read).map(r => r.id));
    readTimer = setTimeout(() => {
      readTimer = null;
      if (ui.currentScreen() !== 'shop' || bottomTab !== 'reviews') return;
      PS.store.commit('reviewsRead', s => s.reviews.forEach(r => { if (ids.has(r.id)) r.read = true; }));
      renderReviews(); // まだ未読が残っていれば次を予約
    }, 4000);
  }

  function openAllReviews() {
    const s = PS.store.state;
    const unreadIds = new Set(s.reviews.filter(r => !r.read).map(r => r.id));
    ui.modal.open(`<h3 class="modal-title">お客さんの声</h3>
      <div class="review-list">${s.reviews.map(r => ui.reviewCard(r, { isNew: unreadIds.has(r.id) })).join('')}</div>
      <p class="note">お客さんの声は、新しいものから順に残ります（古いものは少しずつ消えていきます）。</p>`, { cls: 'modal-reviews' });
    PS.store.commit('reviewsRead', st => PS.core.reviews.markAllRead(st));
  }

  function renderAll() { applyDecor(); renderTop(); renderStats(); renderOrders(); renderShelves(); renderReviews(); renderLog(); }

  /** 売れるまでのバーだけ更新 */
  function tickBars() {
    PS.store.state.shelves.forEach((sh, i) => {
      if (!sh.potionId) return;
      const p = findPotion(sh.potionId);
      const bar = cabinetEl.querySelector(`.slot[data-i="${i}"] .sell-bar i`);
      if (p && bar) bar.style.width = Math.min(100, sh.progress / S().intervalFor(p, PS.store.state) * 100) + '%';
    });
  }

  /** 売れた瞬間：瓶がぴょんと跳ねて、コインが出る */
  function soldPop(i, text) {
    const slot = cabinetEl.querySelector(`.slot[data-i="${i}"]`);
    if (!slot) return;
    slot.classList.remove('sold'); void slot.offsetWidth; slot.classList.add('sold');
    const f = document.createElement('div');
    f.className = 'float-text coin-pop';
    f.textContent = text;
    const r = slot.getBoundingClientRect(), rr = root.getBoundingClientRect();
    f.style.left = (r.left - rr.left + r.width / 2) + 'px';
    f.style.top = (r.top - rr.top + root.scrollTop + 6) + 'px';
    root.appendChild(f);
    setTimeout(() => f.remove(), 1000);
  }

  /* ---------- お店の名前 ---------- */
  const NAME_IDEAS = ['まほうの雫堂', '星降る薬局', '月夜のポーション屋', 'こもれび薬草店', 'ほうき星堂', 'ふしぎ薬房', '虹色ポーション店', 'ねこのしっぽ堂', 'ひだまり調合所', 'ゆめみ草の店'];

  function openRename() {
    const s = PS.store.state;
    const body = ui.modal.open(`<h3 class="modal-title">お店の名前</h3>
      <p class="note top">お店の名前を決めよう（10文字まで）。</p>
      <div class="name-row">
        <input id="shop-name-input" type="text" maxlength="10" value="${ui.esc(s.shopName)}" enterkeyhint="done" autocomplete="off">
        <button class="btn ghost small" id="shop-name-auto">おまかせ</button>
      </div>
      <button class="btn primary big wide" id="shop-name-ok">この名前にする</button>`);
    const input = body.querySelector('#shop-name-input');
    body.querySelector('#shop-name-auto').onclick = () => {
      const cands = NAME_IDEAS.filter(n => n !== input.value);
      input.value = cands[Math.floor(Math.random() * cands.length)];
      PS.assets.sound.play('tap');
    };
    const ok = () => {
      const nm = input.value.replace(/[\u0000-\u001f]/g, '').trim().slice(0, 10);
      if (!nm) { ui.toast('名前を入力してください'); return; }
      PS.store.commit('shopName', st => { st.shopName = nm; });
      PS.assets.sound.play('confirm');
      body.close();
      renderTop();
      ui.toast(`お店の名前を「${nm}」にしました`);
    };
    body.querySelector('#shop-name-ok').onclick = ok;
    input.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.isComposing) ok(); });
  }

  /* ---------- 棚の商品をタップしたとき ---------- */
  function openSlot(i) {
    const sh = PS.store.state.shelves[i];
    const p = sh && findPotion(sh.potionId);
    if (!p) return;
    const g = p.generated, L = PS.core.lookup;
    const iv = S().intervalFor(p, PS.store.state);
    const body = ui.modal.open(`
      <div class="slot-detail">
        <div class="result-art">${PS.assets.art.renderPotion(g, { cls: 'big' })}</div>
        <h3 class="slot-detail-name">${ui.esc(p.name)}</h3>
        <div class="result-head">${ui.rarityBadge(g.rarity)}<span class="result-effect">${ui.esc(L.effect[g.effect].name)}</span></div>
        <div class="slot-detail-nums">
          <div><small>価格</small><b>${p.price.toLocaleString()}G</b></div>
          <div><small>在庫</small><b>${p.stock}本</b></div>
          <div><small>売れるまで</small><b>約${ui.formatDuration(iv)}</b></div>
        </div>
        <p class="desc">${ui.esc(g.description)}</p>
        <div class="btn-row">
          <button class="btn ghost" id="sd-remove">取り下げる</button>
          <button class="btn primary" id="sd-price">💰 価格を変える</button>
        </div>
      </div>`, { cls: 'modal-slot' });
    body.querySelector('#sd-price').onclick = () => { body.close(); setTimeout(() => openPrice(i), 230); };
    body.querySelector('#sd-remove').onclick = () => {
      PS.store.commit('unplace', s => S().remove(s, i));
      PS.assets.sound.play('minus');
      body.close();
      ui.toast(`「${p.name}」を棚から下ろしました（在庫は図鑑に残ります）`);
      renderAll();
    };
  }

  /* ---------- 商品を選んで並べる ---------- */
  function openPicker(shelfIndex) {
    const list = S().placeable(PS.store.state).sort((a, b) =>
      PS.core.lookup.rarityOrder(b.generated.rarity) - PS.core.lookup.rarityOrder(a.generated.rarity) || b.createdAt - a.createdAt);
    const body = ui.modal.open(`<h3 class="modal-title">並べる商品を選ぶ</h3>
      ${list.length ? `<div class="pick-list">${list.map(p => `
        <button class="pick-row" data-id="${p.id}">
          <span class="pick-art">${PS.assets.art.renderPotion(p.generated)}</span>
          <span class="pick-info"><b>${ui.esc(p.name)}</b>
            <small>${ui.rarityBadge(p.generated.rarity)} ${ui.esc(PS.core.lookup.effect[p.generated.effect].name)}</small></span>
          <span class="pick-num"><b>${p.price}G</b><small>在庫 ${p.stock}</small></span>
        </button>`).join('')}</div>`
      : `<p class="empty">並べられるポーションがありません。<br>調合室で作ってこよう！</p>
         <button class="btn primary" data-go="lab">調合室へ</button>`}`);
    body.addEventListener('click', e => {
      const go = e.target.closest('[data-go]');
      if (go) { body.close(); ui.show(go.dataset.go); return; }
      const row = e.target.closest('.pick-row');
      if (!row) return;
      try {
        PS.store.commit('place', s => S().place(s, shelfIndex, row.dataset.id));
        PS.assets.sound.play('confirm');
        body.close();
        renderAll();
      } catch (err) { ui.toast(err.message); }
    });
  }

  /* ---------- 価格変更 ---------- */
  function openPrice(shelfIndex) {
    const sh = PS.store.state.shelves[shelfIndex];
    const p = sh && findPotion(sh.potionId);
    if (!p) return;
    const [lo, hi] = S().priceRange(p);
    let price = p.price;
    const body = ui.modal.open(`<h3 class="modal-title">価格を決める</h3>
      <div class="price-head"><span class="pick-art">${PS.assets.art.renderPotion(p.generated)}</span>
        <div><b>${ui.esc(p.name)}</b><small>目安価格 ${p.generated.basePrice}G（${lo}〜${hi}G）</small></div></div>
      <div class="price-edit">
        <button class="step" data-d="-10">−10</button><button class="step" data-d="-1">−1</button>
        <input class="qty price-input" type="number" inputmode="numeric" value="${price}">
        <button class="step plus" data-d="1">＋1</button><button class="step plus" data-d="10">＋10</button>
      </div>
      <p class="price-est" id="price-est"></p>
      <div class="btn-row"><button class="btn ghost" id="price-reset">目安に戻す</button>
        <button class="btn primary" id="price-ok">この価格にする</button></div>`);
    const input = body.querySelector('.price-input');
    const est = body.querySelector('#price-est');
    const update = () => {
      price = Math.max(lo, Math.min(hi, Math.round(Number(price) || lo)));
      input.value = price;
      const iv = S().intervalFor(Object.assign({}, p, { price }), PS.store.state);
      const rate = price / iv * 60;
      est.innerHTML = `1本 約<b>${ui.formatDuration(iv)}</b>で売れる見込み<br><small>1分あたり 約${rate.toFixed(1)}G</small>`;
    };
    ui.$$('.price-edit .step', body).forEach(b => ui.holdRepeat(b, () => {
      price += Number(b.dataset.d); update(); PS.assets.sound.play('tap');
    }));
    input.addEventListener('change', () => { price = input.value; update(); });
    input.addEventListener('focus', () => input.select());
    body.querySelector('#price-reset').onclick = () => { price = p.generated.basePrice; update(); };
    body.querySelector('#price-ok').onclick = () => {
      price = input.value; update();
      PS.store.commit('price', s => S().setPrice(s, p.id, price));
      PS.assets.sound.play('confirm');
      body.close();
      renderShelves();
    };
    update();
  }

  ui.registerScreen({
    id: 'shop', label: 'お店', icon: '🏪',
    mount(el) {
      root = el;
      el.innerHTML = `
        <div class="shop-top">
          <div class="shop-title"><h2>お店</h2>
            <button class="shop-name-btn" id="shop-name-btn" aria-label="お店の名前を変える">🏷️ <span id="shop-name"></span> <small>✏️</small></button></div>
          <p class="sub">棚に並べたポーションが自動で売れていきます</p>
          <div class="shop-stats" id="shop-stats"></div>
        </div>
        <section class="orders-wrap">
          <button class="orders-head" id="orders-head" aria-expanded="false">
            <span class="orders-icon">${PS.assets.art.render('order_scroll')}</span>
            <b>お客さんの注文</b><span class="orders-summary" id="orders-summary"></span><span class="orders-arrow">▼</span>
          </button>
          <div class="orders" id="shop-orders" hidden></div>
        </section>
        <section class="cabinet-wrap">
          <div class="cabinet-head"><h3>商品棚</h3><span class="cabinet-count" id="cabinet-count"></span>
            <button class="decor-btn" id="decor-btn"><span class="decor-btn-art">${PS.assets.art.render('decor_icon')}</span>模様替え</button></div>
          <div class="cabinet"><div class="cabinet-inner" id="shop-cabinet"></div></div>
          <p class="cabinet-hint" id="cabinet-hint"></p>
        </section>
        <section class="shop-bottom" id="shop-bottom">
          <div class="seg">
            <button class="seg-btn on" data-tab="reviews"></button>
            <button class="seg-btn" data-tab="log">🧾 販売履歴</button>
          </div>
          <div class="reviews" id="shop-reviews"></div>
          <ul class="sales-log" id="shop-log" hidden></ul>
        </section>`;
      cabinetEl = el.querySelector('#shop-cabinet');
      statsEl = el.querySelector('#shop-stats');
      logEl = el.querySelector('#shop-log');
      reviewsEl = el.querySelector('#shop-reviews');
      bottomEl = el.querySelector('#shop-bottom');
      ordersEl = el.querySelector('#shop-orders');
      el.querySelector('#orders-head').addEventListener('click', e => {
        ordersOpen = !ordersOpen;
        try { localStorage.setItem(OPEN_KEY, ordersOpen ? '1' : '0'); } catch (err) { /* 覚えられなくても続ける */ }
        e.currentTarget.setAttribute('aria-expanded', ordersOpen);
        PS.assets.sound.play('tap');
        renderOrders();
      });
      ordersEl.addEventListener('click', e => {
        const b = e.target.closest('[data-act="give"]');
        if (!b || b.disabled) return;
        PS.assets.sound.play('tap');
        openGive(b.closest('.order').dataset.id);
      });
      el.querySelector('#decor-btn').addEventListener('click', () => { PS.assets.sound.play('tap'); openDecor(); });
      el.querySelector('#shop-name-btn').addEventListener('click', () => { PS.assets.sound.play('tap'); openRename(); });
      bottomEl.querySelector('.seg').addEventListener('click', e => {
        const b = e.target.closest('[data-tab]');
        if (!b) return;
        bottomTab = b.dataset.tab;
        PS.assets.sound.play('tap');
        renderBottomTabs();
        if (bottomTab === 'reviews') scheduleRead();
      });
      reviewsEl.addEventListener('click', e => {
        if (e.target.closest('[data-act="reviews"]')) { PS.assets.sound.play('tap'); openAllReviews(); }
      });
      cabinetEl.addEventListener('click', e => {
        const slot = e.target.closest('.slot');
        if (!slot) return;
        const i = Number(slot.dataset.i);
        PS.assets.sound.play('tap');
        if (slot.classList.contains('empty')) openPicker(i); else openSlot(i);
      });
    },
    onShow() {
      renderAll();
      clearInterval(timer); timer = setInterval(tickBars, 250);
    },
    onHide() { clearInterval(timer); timer = null; clearTimeout(readTimer); readTimer = null; },
  });

  /* 新着レビューの数をお店タブに表示 */
  PS.store.subscribe(s => ui.setTabBadge('shop', PS.core.reviews.unreadCount(s)));
  PS.store.subscribe((s, reason) => { if (reason === 'upgrade' || reason === 'replace') { if (ui.currentScreen() === 'shop') renderAll(); } });
  /* 注文が入れ替わった・ポーションができた：注文ボードを更新し、わたせる注文があればお知らせ */
  let lastIds = null;
  PS.store.subscribe((s, reason) => {
    if (!['orders', 'finalize', 'order', 'replace', 'boot', 'sales'].includes(reason)) return;
    if (ui.currentScreen() === 'shop' && ordersEl && root) renderOrders();
    const ids = s.orders.list.map(o => o.id);
    const arrived = lastIds !== null && reason === 'orders' && ids.some(id => !lastIds.includes(id));
    if (arrived && ui.currentScreen() !== 'shop') ui.toast('📜 お客さんから注文が届きました');
    lastIds = ids;
  });

  /* 売れた時：お店を開いていれば演出、別の画面なら売り切れだけお知らせ */
  PS.store.subscribe((s, reason) => {
    if (reason !== 'sales') return;
    const r = PS.clock.lastResult;
    if (!r) return;
    if (r.catchUp) { if (ui.currentScreen() === 'shop') renderAll(); return; }
    const newReviews = (r.reviews || []).length;
    if (ui.currentScreen() === 'shop') {
      renderAll();
      r.items.forEach(it => soldPop(it.shelf, `+${it.coins}G`));
      PS.assets.sound.play('coin');
      if (newReviews) setTimeout(() => PS.assets.sound.play('review'), 250);
    } else {
      r.items.filter(it => it.soldOut).forEach(it => ui.toast(`「${it.name}」が完売しました！`));
      if (newReviews) ui.toast('💬 お客さんからレビューが届きました');
    }
  });

  /** お留守番中の売上 */
  ui.showWelcomeBack = function (r) {
    const gathered = (r && r.gather && r.gather.total) || {};
    const gKeys = Object.keys(gathered);
    if (!r || (!r.items.length && !gKeys.length)) return;
    const merged = {};
    for (const it of r.items) {
      const m = merged[it.potionId] || (merged[it.potionId] = { name: it.name, qty: 0, coins: 0, soldOut: false });
      m.qty += it.qty; m.coins += it.coins; m.soldOut = m.soldOut || it.soldOut;
    }
    const body = ui.modal.open(`<div class="welcome">
      <div class="welcome-art">${PS.assets.art.render('coin')}</div>
      <h3>おかえりなさい！</h3>
      <p class="sub">${ui.formatDuration(r.elapsed)}のあいだ、お店はがんばっていました${r.capped ? `<br>（お留守番は最大${PS.data.balance.shop.offlineCapHours}時間分です）` : ''}</p>
      ${r.items.length ? `<ul class="sales-log">${Object.values(merged).map(m => `<li><span class="log-name">${ui.esc(m.name)} ×${m.qty}${m.soldOut ? ' <em>完売</em>' : ''}</span><b>+${m.coins}G</b></li>`).join('')}</ul>
      <p class="welcome-total">売上 <b>+${r.total.toLocaleString()}G</b></p>` : ''}
      ${gKeys.length ? `<p class="welcome-gather-title">🧚 お手伝い妖精が摘んでくれた素材</p>
        <div class="inventory welcome-gather">${PS.data.materials.filter(m => gathered[m.id]).map(m => `<div class="inv-chip r${m.rarity}">
          <span class="inv-icon">${PS.assets.art.render(m.art)}</span><span class="inv-name">${ui.esc(m.name)}</span><b>+${gathered[m.id]}</b></div>`).join('')}</div>` : ''}
      ${(r.reviews || []).length ? `<p class="welcome-reviews">💬 お客さんのレビューが <b>${r.reviews.length}件</b> 届いています</p>` : ''}
      <button class="btn primary big wide" id="wb-ok">受け取る</button></div>`, { cls: 'modal-welcome' });
    const goReviews = (r.reviews || []).length > 0;
    body.querySelector('#wb-ok').textContent = goReviews ? '受け取って、レビューを読む' : '受け取る';
    body.querySelector('#wb-ok').onclick = () => {
      PS.assets.sound.play('coin'); body.close();
      if (goReviews) ui.show('shop');
    };
  };
})(window.PS);
