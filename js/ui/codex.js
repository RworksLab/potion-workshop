/* ポーション図鑑（作ったポーションの記録。在庫・販売・レビューはお店の画面だけで扱う） */
(function (PS) {
  'use strict';
  const ui = PS.ui;
  let root, listEl, headEl;
  const view = { filter: 'all', sort: 'new', cat: 'all' };
  const effectsOf = p => [p.generated.effect, ...(p.generated.subEffects || [])];

  const FILTERS = [['all', 'すべて'], ['fav', '★お気に入り'], ['N', 'N'], ['R', 'R'], ['SR', 'SR'], ['SSR', 'SSR'], ['UR', 'UR']];
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
    headEl.innerHTML = `
      <div class="found-effects"><span>🔍 見つけた効果 <b>${found.size}</b> / ${totalEff}</span>
        <span class="found-bar"><i style="width:${(found.size / totalEff * 100).toFixed(1)}%"></i></span></div>
      <p class="codex-count">登録 <b>${ps.length}</b> 件（内容の種類 ${kinds}）</p>
      <div class="chips">${FILTERS.map(([k, l]) => `<button class="chip ${view.filter === k ? 'on' : ''}" data-f="${k}">${l}</button>`).join('')}</div>
      <select class="sort cat-select" aria-label="効果の種類">${[['all', '効果：すべて'], ...PS.data.effectCategories.map(c => [c.id, `${c.icon} ${c.name}`])].map(([k, l]) => `<option value="${k}" ${view.cat === k ? 'selected' : ''}>${l}</option>`).join('')}</select>
      <select class="sort" aria-label="並べ替え">${SORTS.map(([k, l]) => `<option value="${k}" ${view.sort === k ? 'selected' : ''}>${l}</option>`).join('')}</select>`;
  }

  function renderList() {
    const L = PS.core.lookup;
    const list = filtered();
    if (!PS.store.state.potions.length) {
      listEl.innerHTML = `<p class="empty">まだポーションがありません。<br>調合室で作ってみよう！</p><button class="btn primary" data-go="lab">調合室へ</button>`;
      return;
    }
    if (!list.length) { listEl.innerHTML = '<p class="empty">条件に合うポーションはありません。</p>'; return; }
    listEl.innerHTML = list.map(p => `
      <button class="potion-card r-${p.generated.rarity}" data-id="${p.id}">
        ${p.favorite ? '<span class="fav-mark">★</span>' : ''}
        <span class="pc-art">${PS.assets.art.renderPotion(p.generated)}</span>
        <span class="pc-name ${ui.nameSizeClass(p.name)}">${ui.esc(p.name)}</span>
        <span class="pc-meta">${ui.rarityBadge(p.generated.rarity)}<small>${ui.esc(L.effect[p.generated.effect].name)}</small></span>
      </button>`).join('');
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
    body.querySelector('#d-share').onclick = async e => {
      const btn = e.currentTarget;
      btn.disabled = true; btn.textContent = '画像を作っています…';
      PS.assets.sound.play('tap');
      await ui.sharePotion(p);
      btn.disabled = false; btn.textContent = '📤 このポーションを共有する';
    };
    body.querySelector('#d-fav').onclick = e => {
      const on = PS.store.commit('favorite', s => PS.core.brew.toggleFavorite(s, id));
      e.currentTarget.classList.toggle('on', on);
      e.currentTarget.textContent = on ? '★ お気に入り' : '☆ お気に入り';
      PS.assets.sound.play('tap');
      renderList();
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
        if (ok) { ui.toast('名前を変更しました'); PS.assets.sound.play('confirm'); renderList(); }
      };
      row.querySelector('button').onclick = done;
      inp.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.isComposing) done(); });
    };
  }

  ui.registerScreen({
    id: 'codex', label: '図鑑', icon: '📖',
    mount(el) {
      root = el;
      el.innerHTML = `<div class="screen-head"><h2>ポーション図鑑</h2><p class="sub">これまでに作ったポーション</p></div>
        <div class="codex-head" id="codex-head"></div><div class="potion-grid" id="codex-list"></div>`;
      headEl = el.querySelector('#codex-head');
      listEl = el.querySelector('#codex-list');
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
