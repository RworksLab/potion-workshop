/* 調合室の画面と、調合演出・命名 */
(function (PS) {
  'use strict';
  const ui = PS.ui;
  let root, listEl, footEl;
  let selection = {}; // { materialId: 個数 }（画面上だけの一時データ）

  const cap = () => PS.core.stats.get(PS.store.state, 'cauldronCap');
  const total = () => Object.values(selection).reduce((a, b) => a + b, 0);

  function clampSelection() {
    const inv = PS.store.state.inventory;
    for (const id of Object.keys(selection)) {
      selection[id] = Math.max(0, Math.min(selection[id], inv[id] || 0));
      if (!selection[id]) delete selection[id];
    }
  }

  function setQty(id, q) {
    const inv = PS.store.state.inventory[id] || 0;
    const others = total() - (selection[id] || 0);
    const maxByCap = cap() - others;
    const v = Math.max(0, Math.min(Math.floor(q) || 0, inv, maxByCap));
    if (v) selection[id] = v; else delete selection[id];
    return v;
  }

  function renderList() {
    const inv = PS.store.state.inventory;
    const mats = PS.data.materials.filter(m => inv[m.id] > 0 || selection[m.id]);
    if (!mats.length) {
      listEl.innerHTML = `<p class="empty">素材がありません。<br>まずは薬草園で摘んでこよう。</p>
        <button class="btn primary" data-go="garden">薬草園へ</button>`;
      return;
    }
    listEl.innerHTML = mats.map(m => {
      const q = selection[m.id] || 0;
      return `<div class="mat-row ${q ? 'on' : ''}" data-id="${m.id}">
        <span class="mat-icon">${PS.assets.art.render(m.art)}</span>
        <span class="mat-info"><b>${ui.esc(m.name)}</b><small><span class="stars r${m.rarity}">${ui.stars(m.rarity)}</span> 所持 ${ui.shortNum(inv[m.id] || 0)}</small></span>
        <span class="stepper">
          <button class="step minus" data-d="-1" aria-label="減らす">−</button>
          <input class="qty" type="number" inputmode="numeric" min="0" value="${q}" aria-label="${ui.esc(m.name)}の数">
          <button class="step plus" data-d="1" aria-label="増やす">＋</button>
        </span></div>`;
    }).join('');
    ui.$$('.mat-row', listEl).forEach(row => {
      const id = row.dataset.id;
      ui.$$('.step', row).forEach(b => ui.holdRepeat(b, () => {
        const before = selection[id] || 0;
        const after = setQty(id, before + Number(b.dataset.d));
        PS.assets.sound.play(after === before ? 'error' : (after > before ? 'plus' : 'minus'));
        updateRow(row); renderFoot();
      }));
      const input = row.querySelector('.qty');
      input.addEventListener('focus', () => input.select());
      input.addEventListener('change', () => { setQty(id, Number(input.value)); updateRow(row); renderFoot(); });
    });
  }

  function updateRow(row) {
    const q = selection[row.dataset.id] || 0;
    row.querySelector('.qty').value = q;
    row.classList.toggle('on', q > 0);
  }

  /** フッターは一度だけ作り、以降は中身の数値だけ更新する（ボタンを作り直すとタップが失われるため） */
  function buildFoot() {
    footEl.innerHTML = `
      <div class="cap"><div class="cap-bar"><i id="lab-cap-bar"></i></div>
        <span id="lab-cap-text"></span></div>
      <div class="btn-row">
        <button class="btn ghost" id="lab-clear">クリア</button>
        <button class="btn primary big" id="lab-brew">⚗️ 調合する</button>
      </div>`;
    footEl.querySelector('#lab-clear').onclick = () => { selection = {}; renderList(); renderFoot(); };
    footEl.querySelector('#lab-brew').onclick = brew;
  }

  function renderFoot() {
    const t = total();
    const v = PS.core.brew.validate(PS.store.state, selection);
    footEl.querySelector('#lab-cap-bar').style.width = Math.min(100, t / cap() * 100) + '%';
    footEl.querySelector('#lab-cap-text').innerHTML =
      `投入 <b>${t}</b> / ${cap()}　できる本数 <b>${t ? PS.core.brew.yieldCount(t) : 0}</b>本`;
    footEl.querySelector('#lab-clear').disabled = !t;
    footEl.querySelector('#lab-brew').disabled = !v.ok;
  }

  /* ---------- 調合 → 演出 → 命名 ---------- */
  function brew() {
    const v = PS.core.brew.validate(PS.store.state, selection);
    if (!v.ok) { ui.toast(v.reason); PS.assets.sound.play('error'); return; }
    let pend;
    try {
      pend = PS.store.commit('brew', s => PS.core.brew.execute(s, selection, PS.core.rng.fresh(), Date.now()));
    } catch (e) { ui.toast(e.message); return; }
    PS.store.flush(); // 素材消費と結果をすぐ保存
    selection = {};
    renderList(); renderFoot();
    playBrewAnimation(pend, () => openNaming(pend, true));
  }

  function playBrewAnimation(pend, done) {
    const L = PS.core.lookup;
    const c = L.color[pend.generated.color];
    const rc = L.rarity[pend.generated.rarity].color;
    const ov = document.createElement('div');
    ov.className = 'brew-overlay rarity-fx-' + pend.generated.rarity;
    ov.style.setProperty('--lc', c.hex);
    ov.style.setProperty('--rc', rc);
    ov.innerHTML = `<div class="brew-stage">
        <div class="brew-bubbles"><i></i><i></i><i></i><i></i><i></i></div>
        ${PS.assets.art.render('cauldron')}
        <p class="brew-msg">ぐつぐつ…</p></div><div class="brew-flash"></div>`;
    document.body.appendChild(ov);
    PS.assets.sound.play('bubble');
    const order = L.rarity[pend.generated.rarity].order;
    const wait = 1300 + order * 250; // 高レアほど少しためる
    setTimeout(() => { ov.classList.add('flash'); PS.assets.sound.play('reveal_' + pend.generated.rarity); }, wait);
    setTimeout(() => { done(); ov.classList.add('out'); }, wait + 350);
    setTimeout(() => ov.remove(), wait + 900);
    ov.addEventListener('click', () => { /* 演出中のタップは無視 */ });
  }

  /** 命名画面（閉じられない。名前を決めると図鑑に登録） */
  function openNaming(pend, fresh) {
    const g = pend.generated;
    const L = PS.core.lookup;
    const known = pend.knownName;
    const suggestion = PS.core.describe.suggestName(g, PS.core.rng.fresh());
    const body = ui.modal.open(`
      <div class="result ${fresh ? 'pop' : ''} result-${g.rarity}">
        <p class="result-banner">できあがり！ <b>×${pend.count}本</b>　<span>販売価格の目安 ${g.basePrice}G</span></p>
        ${g.surprise ? '<p class="surprise">✨ 予想外の結果！</p>' : ''}
        ${known ? `<p class="known">📖 以前「<b>${ui.esc(known)}</b>」と名付けたポーションと同じ内容です！</p>` : ''}
        ${ui.potionNote(g, { name: known || '', number: PS.store.state.potions.length + 1, date: pend.createdAt })}
        <div class="name-dock">
          <label class="name-label" for="potion-name">商品名をつけよう（20文字まで）</label>
          <div class="name-row">
            <input id="potion-name" type="text" maxlength="20" placeholder="${ui.esc(suggestion)}" value="${ui.esc(known || '')}" enterkeyhint="done" autocomplete="off">
            <button class="btn ghost small" id="name-auto">おまかせ</button>
          </div>
          <button class="btn primary big wide" id="name-ok">この名前で登録</button>
        </div>
      </div>`, { dismissible: false, cls: 'modal-result' });
    const input = body.querySelector('#potion-name');
    const title = body.querySelector('#note-name');
    // 入力した名前をノートの見出しにすぐ反映
    const syncTitle = () => {
      const v = input.value.trim();
      title.className = 'note-name ' + ui.nameSizeClass(v);
      title.innerHTML = v ? ui.esc(v) : '<span class="note-name-empty">（名前をつけてね）</span>';
    };
    input.addEventListener('input', syncTitle);
    body.querySelector('#name-auto').onclick = () => {
      input.value = PS.core.describe.suggestName(g, PS.core.rng.fresh());
      syncTitle();
      PS.assets.sound.play('tap');
    };
    const ok = () => {
      const name = PS.core.brew.sanitizeName(input.value) || PS.core.brew.sanitizeName(input.placeholder);
      if (!name) { ui.toast('名前を入力してください'); return; }
      try {
        const p = PS.store.commit('finalize', s => PS.core.brew.finalize(s, name, Date.now()));
        PS.store.flush();
        PS.assets.sound.play('confirm');
        body.close();
        ui.toast(`「${p.name}」を図鑑に登録しました`);
        renderList(); renderFoot();
      } catch (e) { ui.toast(e.message); }
    };
    body.querySelector('#name-ok').onclick = ok;
    input.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.isComposing) ok(); });
  }

  ui.registerScreen({
    id: 'lab', label: '調合室', icon: '⚗️',
    mount(el) {
      root = el;
      el.innerHTML = `
        <div class="screen-head"><h2>調合室</h2><p class="sub">好きな素材を好きなだけ入れてみよう</p></div>
        <div class="mat-list" id="lab-list"></div>
        <div class="lab-foot" id="lab-foot"></div>`;
      listEl = el.querySelector('#lab-list');
      footEl = el.querySelector('#lab-foot');
      buildFoot();
      listEl.addEventListener('click', e => { const g = e.target.closest('[data-go]'); if (g) ui.show(g.dataset.go); });
    },
    onShow() {
      clampSelection(); renderList(); renderFoot();
      ui.lab.resumePending();
    },
  });

  ui.lab = {
    /** 命名前に閉じたポーションがあれば命名画面を再表示 */
    resumePending() {
      const p = PS.store.state.pendingPotion;
      if (p && !document.querySelector('.modal-result')) openNaming(p, false);
    },
  };
})(window.PS);
