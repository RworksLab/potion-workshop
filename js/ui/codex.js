/* ポーション図鑑（作ったポーションの記録。在庫・販売・レビューはお店の画面だけで扱う） */
(function (PS) {
  'use strict';
  const ui = PS.ui;
  let root, listEl, headEl, moreEl, observer = null;
  const PAGE = 30;                 // 一度に表示する数（下までスクロールすると次の30本）
  let current = [], shown = 0;
  const artCache = new Map();      // 同じ見た目の瓶の絵は使い回す（たくさんあっても軽く表示するため）
  function potionArt(g) {
    const key = [g.bottle, g.color, g.texture, g.rarity].join('|');
    if (!artCache.has(key)) {
      if (artCache.size > 400) artCache.clear();
      artCache.set(key, PS.assets.art.renderPotion(g));
    }
    return artCache.get(key);
  }
  const view = { filter: 'all', sort: 'new', cat: 'all' };
  const effectsOf = p => [p.generated.effect, ...(p.generated.subEffects || [])];

  const FILTERS = [['all', 'すべて'], ['fav', '★お気に入り'], ['UR', 'UR'], ['SSR', 'SSR'], ['SR', 'SR'], ['R', 'R'], ['N', 'N']];   // レアなものから
  const SORTS = [['new', '新しい順'], ['old', '古い順'], ['rarity', 'レア順'], ['name', '名前順']];

  function filtered() {
    const L = PS.core.lookup;
    let list = PS.store.state.potions.slice();
    if (view.filter === 'fav') list = list.filter(p => p.favorite);
    else if (view.filter !== 'all') list = list.filter(p => p.generated.rarity === view.filter);
    if (view.cat !== 'all') list = list.filter(p => effectsOf(p).some(id => L.effect[id] && L.effect[id].cat === view.cat));
    const cmp = {
      new: (a, b) => b.createdAt - a.createdAt,
      old: (a, b) => a.createdAt - b.createdAt,
      rarity: (a, b) => L.rarityOrder(b.generated.rarity) - L.rarityOrder(a.generated.rarity) || b.createdAt - a.createdAt,
      name: (a, b) => a.name.localeCompare(b.name, 'ja'),
    }[view.sort];
    return list.sort(cmp);
  }

  function renderHead() {
    const ps = PS.store.state.potions;
    const kinds = new Set(ps.map(p => p.generated.signature)).size;
    // 見つけた効果（メイン・副効果のどちらで出ても1つと数える）
    const found = new Set(ps.flatMap(effectsOf));
    const totalEff = PS.data.effects.length;
    root.querySelector('#codex-kinds').innerHTML = `<b>${kinds}</b>種類`;
    headEl.innerHTML = `
      <div class="found-effects"><span>🔍 見つけた効果 <b>${found.size}</b> / ${totalEff}</span>
        <span class="found-bar"><i style="width:${(found.size / totalEff * 100).toFixed(1)}%"></i></span></div>
      <div class="chips">${FILTERS.map(([k, l]) => `<button class="chip ${view.filter === k ? 'on' : ''}" data-f="${k}">${l}</button>`).join('')}</div>
      <select class="sort cat-select" aria-label="効果の種類">${[['all', '効果：すべて'], ...PS.data.effectCategories.map(c => [c.id, `${c.icon} ${c.name}`])].map(([k, l]) => `<option value="${k}" ${view.cat === k ? 'selected' : ''}>${l}</option>`).join('')}</select>
      <select class="sort" aria-label="並べ替え">${SORTS.map(([k, l]) => `<option value="${k}" ${view.sort === k ? 'selected' : ''}>${l}</option>`).join('')}</select>`;
  }

  function cardHtml(p) {
    const L = PS.core.lookup;
    return `<button class="potion-card r-${p.generated.rarity}" data-id="${p.id}">
        ${p.favorite ? '<span class="fav-mark">★</span>' : ''}
        <span class="pc-art">${potionArt(p.generated)}</span>
        <span class="pc-name ${ui.nameSizeClass(p.name)}">${ui.esc(p.name)}</span>
        <span class="pc-meta">${ui.rarityBadge(p.generated.rarity)}<small>${ui.esc(L.effect[p.generated.effect].name)}</small></span>
      </button>`;
  }

  /** 絞り込み・並べ替えは全部のポーションにかけ、その結果を30本ずつ表示する */
  function renderList(keep) {
    const want = keep ? Math.max(PAGE, shown) : PAGE;   // お気に入り・名前の変更のあとは、見ていた所までそのまま
    current = filtered();
    shown = 0;
    moreEl.hidden = true;
    if (!PS.store.state.potions.length) {
      listEl.innerHTML = `<p class="empty">まだポーションがありません。<br>調合室で作ってみよう！</p><button class="btn primary" data-go="lab">調合室へ</button>`;
      return;
    }
    if (!current.length) { listEl.innerHTML = '<p class="empty">条件に合うポーションはありません。</p>'; return; }
    listEl.innerHTML = '';
    showMore(want);
  }

  function showMore(count) {
    if (shown >= current.length) return;
    const next = current.slice(shown, shown + (typeof count === 'number' ? count : PAGE));
    listEl.insertAdjacentHTML('beforeend', next.map(cardHtml).join(''));
    shown += next.length;
    moreEl.hidden = shown >= current.length;
  }

  /** 一番下の目印が見えたら、次の30本を足す */
  function watchMore() {
    if (observer || !('IntersectionObserver' in window)) return;
    observer = new IntersectionObserver(entries => {
      if (entries.some(e => e.isIntersecting)) showMore();
    }, { root, rootMargin: '0px 0px 600px 0px' });
    observer.observe(moreEl);
  }

  function openDetail(id) {
    const p = PS.store.state.potions.find(x => x.id === id);
    if (!p) return;
    const g = p.generated;
    const sameCount = PS.store.state.potions.filter(x => x.generated.signature === g.signature).length;
    const number = PS.store.state.potions.indexOf(p) + 1;
    const body = ui.modal.open(`
      <div class="detail">
        ${ui.potionNote(g, { name: p.name, number, date: p.createdAt })}
        <div class="detail-actions">
          <button class="btn ghost small" id="d-rename">✏️ 名前を変える</button>
          <button class="btn ghost small fav-btn ${p.favorite ? 'on' : ''}" id="d-fav">${p.favorite ? '★ お気に入り' : '☆ お気に入り'}</button>
        </div>
        <button class="btn primary wide" id="d-share">📤 このポーションを共有する</button>
        ${sameCount > 1 ? `<p class="shop-note">📖 同じ内容のポーションが ${sameCount}件 登録されています</p>` : ''}
      </div>`, { cls: 'modal-detail' });
    ui.prepareShareCard(p);   // 共有用の画像を先に作っておく
    body.querySelector('#d-share').onclick = async e => {
      const btn = e.currentTarget;
      btn.disabled = true; btn.textContent = '共有の準備をしています…';
      PS.assets.sound.play('tap');
      await ui.sharePotion(p);
      btn.disabled = false; btn.textContent = '📤 このポーションを共有する';
    };
    body.querySelector('#d-fav').onclick = e => {
      const on = PS.store.commit('favorite', s => PS.core.brew.toggleFavorite(s, id));
      e.currentTarget.classList.toggle('on', on);
      e.currentTarget.textContent = on ? '★ お気に入り' : '☆ お気に入り';
      PS.assets.sound.play('tap');
      renderList(true);
    };
    body.querySelector('#d-rename').onclick = () => {
      if (body.querySelector('.rename-row')) return;
      const row = document.createElement('div');
      row.className = 'name-row rename-row';
      row.innerHTML = `<input class="rename-input" type="text" maxlength="20" value="${ui.esc(p.name)}" enterkeyhint="done" autocomplete="off">
        <button class="btn primary small">決定</button>`;
      body.querySelector('.detail-actions').after(row);
      const inp = row.querySelector('input');
      inp.focus(); inp.select();
      const title = body.querySelector('#note-name');
      inp.addEventListener('input', () => {
        const v = inp.value.trim();
        title.className = 'note-name ' + ui.nameSizeClass(v);
        title.textContent = v || p.name;
      });
      const done = () => {
        const ok = PS.store.commit('rename', s => PS.core.brew.rename(s, id, inp.value));
        title.className = 'note-name ' + ui.nameSizeClass(p.name);
        title.textContent = p.name;
        row.remove();
        if (ok) { ui.toast('名前を変更しました'); PS.assets.sound.play('confirm'); renderList(true); }
      };
      row.querySelector('button').onclick = done;
      inp.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.isComposing) done(); });
    };
  }

  /* ---------- 思い出の称号 ---------- */
  function openMemories() {
    const got = PS.store.state.memories;
    const list = PS.data.memories.list;
    ui.modal.open(`
      <h3 class="modal-title memories-title"><span class="memories-btn-art">${PS.assets.art.render('memory', { name: 'gemUR', color: '#ffe8f2' })}</span>思い出</h3>
      <p class="memories-sub">工房で過ごした、たいせつな出来事</p>
      <div class="memories">${list.map(m => got[m.id]
        ? `<div class="memory on"><span class="memory-icon">${PS.assets.art.render('memory', { name: m.badge, color: m.color })}</span><b>${ui.esc(m.name)}</b><small>${ui.esc(m.desc)}</small><em>${ui.formatDate(got[m.id]).slice(0, 10)}</em></div>`
        : `<div class="memory"><span class="memory-icon">${PS.assets.art.render('memory', { locked: true })}</span><b>？？？</b><small>${ui.esc(m.hint || 'まだ見ぬ思い出')}</small></div>`).join('')}</div>`, { cls: 'modal-memories' });
  }

  /** 出来事のあとに称号を調べる。起動直後・読み込み直後は、すでに満たしている分をお祝いなしで記録する */
  const MEMORY_REASONS = ['finalize', 'sales', 'upgrade', 'order', 'orders', 'replace', 'boot'];
  let memTimer = null;
  PS.store.subscribe((s, reason) => {
    if (!MEMORY_REASONS.includes(reason) || !s || !s.memories) return;
    const silent = reason === 'replace' || reason === 'boot';
    clearTimeout(memTimer);
    memTimer = setTimeout(() => {
      const earned = PS.store.commit('memory', st => PS.core.memories.evaluate(st, Date.now()));
      if (silent || !earned.length) return;
      earned.forEach((m, i) => setTimeout(() => {
        ui.toast(`思い出「${m.name}」を手に入れました`, 3200);
        PS.assets.sound.play('event');
      }, i * 900));
    }, silent ? 0 : 400);
  });

  ui.registerScreen({
    id: 'codex', label: '図鑑', icon: '📖',
    mount(el) {
      root = el;
      el.innerHTML = `<div class="screen-head codex-title"><div><h2>ポーション図鑑</h2><p class="sub">これまでに作ったポーション <span class="codex-kinds" id="codex-kinds"></span></p></div>
          <button class="memories-btn" id="open-memories"><span class="memories-btn-art">${PS.assets.art.render('memory', { badge: 'gemUR', name: 'gemUR', color: '#ffe8f2' })}</span>思い出</button></div>
        <div class="codex-head" id="codex-head"></div><div class="potion-grid" id="codex-list"></div>
        <button class="codex-more" id="codex-more" hidden>続きを表示</button>`;
      headEl = el.querySelector('#codex-head');
      listEl = el.querySelector('#codex-list');
      moreEl = el.querySelector('#codex-more');
      moreEl.addEventListener('click', () => showMore());   // 自動で出ないときのための予備
      watchMore();
      el.querySelector('#open-memories').addEventListener('click', () => { PS.assets.sound.play('tap'); openMemories(); });
      headEl.addEventListener('click', e => {
        const c = e.target.closest('[data-f]');
        if (c) { view.filter = c.dataset.f; renderHead(); renderList(); }
      });
      headEl.addEventListener('change', e => {
        if (e.target.matches('.cat-select')) { view.cat = e.target.value; renderList(); }
        else if (e.target.matches('.sort')) { view.sort = e.target.value; renderList(); }
      });
      listEl.addEventListener('click', e => {
        const g = e.target.closest('[data-go]'); if (g) { ui.show(g.dataset.go); return; }
        const c = e.target.closest('.potion-card'); if (c) { PS.assets.sound.play('tap'); openDetail(c.dataset.id); }
      });
    },
    onShow() { renderHead(); renderList(); },
  });
})(window.PS);
