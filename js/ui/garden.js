/*
 * 薬草園の画面
 *  ・空と丘、黄緑の枠の畑で「景色」をつくる（端末の時刻で朝・昼・夕方・夜に変わる）
 *  ・たまに出来事が起きる（data/gardenEvents.js）：蝶々・てんとう虫・光る芽・にわか雨
 *  ・画面をスクロールしなくても遊べるように、持ち物は「かご」ボタンにしまい、タップで開く
 */
(function (PS) {
  'use strict';
  const ui = PS.ui;
  const G = () => PS.core.gather;
  const EV = () => PS.data.gardenEvents;
  const stat = name => PS.core.stats.get(PS.store.state, name);
  let root, sceneEl, gridEl, basketEl, autoEl, fxEl, timer = null, tod = null;

  /* ---------- 畑のマス ---------- */
  function slotHtml(slot, i, now) {
    const m = PS.core.lookup.material[slot.materialId];
    const ready = G().isReady(slot, now);
    const g = G().growth(slot, now);
    const sp = slot.special || '';
    const art = ready ? PS.assets.art.render(m.art) : PS.assets.art.render('sprout');
    return `<button class="plot ${ready ? 'ready' : 'growing'} ${ready && m.rarity >= 3 ? 'rare' : ''} ${sp ? 'special-' + sp : ''}" data-i="${i}"
        aria-label="${ready ? m.name + 'を採取' : '成長中'}">
      <span class="plot-soil"></span>
      <span class="plot-plant" style="--g:${(0.45 + g * 0.55).toFixed(2)}">${art}</span>
      ${ready ? '' : `<span class="plot-bar"><i style="width:${Math.round(g * 100)}%"></i></span>`}
    </button>`;
  }

  function renderGrid() {
    const s = PS.store.state, now = Date.now();
    const fs = G().fieldSize(s);
    gridEl.style.setProperty('--cols', fs.cols);
    gridEl.dataset.cols = fs.cols;
    gridEl.style.setProperty('--rows', fs.rows);
    gridEl.innerHTML = s.garden.slots.map((sl, i) => slotHtml(sl, i, now)).join('');
  }

  function renderSlot(i) {
    const el = gridEl.querySelector(`[data-i="${i}"]`);
    if (!el) return null;
    const tmp = document.createElement('div');
    tmp.innerHTML = slotHtml(PS.store.state.garden.slots[i], i, Date.now());
    const nb = tmp.firstElementChild;
    el.replaceWith(nb);
    return nb;
  }

  /* ---------- 景色（時間帯で変わる） ---------- */
  function renderScene(force) {
    const t = ui.timeOfDay();
    if (!force && t === tod) return;
    tod = t;
    sceneEl.className = 'garden-scene tod-' + t;
    root.querySelector('#garden-sky').innerHTML = PS.assets.art.render('garden_sky', { tod: t });
    // 夜はホタルが飛ぶ
    fxEl.querySelectorAll('.firefly').forEach(f => f.remove());
    if (t === 'night') {
      for (let k = 0; k < 7; k++) {
        const f = document.createElement('i');
        f.className = 'firefly';
        f.style.left = (8 + Math.random() * 84) + '%';
        f.style.top = (20 + Math.random() * 70) + '%';
        f.style.animationDelay = (Math.random() * 4).toFixed(1) + 's';
        f.style.animationDuration = (4 + Math.random() * 3).toFixed(1) + 's';
        fxEl.appendChild(f);
      }
    }
  }

  /* ---------- かご（タップで開く持ち物の一覧） ---------- */
  let basketOpen = false;
  function renderBasket() {
    const inv = PS.store.state.inventory;
    const items = PS.data.materials.filter(m => inv[m.id] > 0);
    basketEl.classList.toggle('open', basketOpen);
    const btn = basketEl.querySelector('.basket-btn');
    btn.setAttribute('aria-expanded', basketOpen);
    btn.querySelector('.basket-label').textContent = basketOpen ? '🧺 かごを閉じる' : '🧺 かごの中を見る';
    const panel = basketEl.querySelector('.basket-panel');
    panel.hidden = !basketOpen;
    if (!basketOpen) return;
    panel.innerHTML = items.length
      ? `<div class="basket-grid">${items.map(m => `<div class="basket-item r${m.rarity}">
          <span class="basket-icon">${PS.assets.art.render(m.art)}</span>
          <span class="basket-name">${ui.esc(m.name)}</span><b title="${inv[m.id].toLocaleString()}">${ui.shortNum(inv[m.id])}</b></div>`).join('')}</div>`
      : '<p class="basket-empty">まだ空っぽ。育った草花をタップして摘もう</p>';
  }
  function bumpBasket() {
    const btn = basketEl.querySelector('.basket-btn');
    btn.classList.remove('bump'); void btn.offsetWidth; btn.classList.add('bump');
  }

  /* ---------- お手伝い妖精 ---------- */
  function renderAuto() {
    const iv = stat('autoGatherSec');
    autoEl.hidden = !(iv > 0);
    if (iv > 0) autoEl.innerHTML = `🧚 <small>${iv.toFixed(0)}秒ごと</small><span class="auto-bar"><i id="auto-bar"></i></span>`;
    updateAutoBar();
  }

  function updateAutoBar() {
    const bar = autoEl.querySelector('#auto-bar');
    const iv = stat('autoGatherSec');
    if (bar && iv > 0) bar.style.width = Math.min(100, PS.store.state.autoGather.progressSec / iv * 100) + '%';
  }

  /* ---------- 成長中のマスの見た目だけ更新 ---------- */
  function tick() {
    const s = PS.store.state, now = Date.now();
    s.garden.slots.forEach((sl, i) => {
      const el = gridEl.querySelector(`[data-i="${i}"]`);
      if (!el) return;
      const ready = G().isReady(sl, now);
      if (ready && el.classList.contains('growing')) { renderSlot(i); return; }
      if (!ready) {
        const g = G().growth(sl, now);
        const bar = el.querySelector('.plot-bar i');
        if (bar) bar.style.width = Math.round(g * 100) + '%';
        el.querySelector('.plot-plant').style.setProperty('--g', (0.45 + g * 0.55).toFixed(2));
      }
    });
    updateAutoBar();
    renderScene();
  }

  /* ---------- 摘む ---------- */
  function floatText(el, text, cls) {
    const r = el.getBoundingClientRect(), rr = root.getBoundingClientRect();
    const f = document.createElement('div');
    f.className = 'float-text ' + (cls || '');
    f.textContent = text;
    f.style.left = (r.left - rr.left + r.width / 2) + 'px';
    f.style.top = (r.top - rr.top + root.scrollTop + 4) + 'px';
    root.appendChild(f);
    setTimeout(() => f.remove(), 1100);
  }

  /** 引っこ抜きアニメーション：植物を複製して、かごのほうへ飛ばす */
  function pluckFly(btn, delay) {
    const plant = btn.querySelector('.plot-plant');
    const fly = plant.cloneNode(true);
    fly.classList.add('pluck-fly');
    if (delay) fly.style.animationDelay = delay + 'ms';
    const r = plant.getBoundingClientRect(), rr = root.getBoundingClientRect();
    Object.assign(fly.style, { left: (r.left - rr.left) + 'px', top: (r.top - rr.top + root.scrollTop) + 'px', width: r.width + 'px', height: r.height + 'px' });
    root.appendChild(fly);
    setTimeout(() => fly.remove(), 750 + (delay || 0));
  }

  function showPicked(results, opts) {
    const L = PS.core.lookup;
    results.forEach((res, k) => {
      const btn = gridEl.querySelector(`[data-i="${res.index}"]`);
      if (!btn) return;
      const m = L.material[res.materialId];
      pluckFly(btn, k * 60);
      const pre = opts && opts.auto ? '🧚 ' : '';
      const cls = (m.rarity >= 3 || res.special ? 'rare ' : '') + (opts && opts.auto ? 'auto' : '');
      floatText(btn, `${pre}${m.name} +${res.qty}`, cls);
      const nb = renderSlot(res.index);
      if (nb) nb.classList.add('just-picked');
    });
    if (results.some(r => r.special)) PS.assets.sound.play('event');
    renderBasket(); bumpBasket();
  }

  function onTap(e) {
    const btn = e.target.closest('.plot');
    if (!btn) return;
    const i = Number(btn.dataset.i);
    const res = PS.store.commit('harvest', s => G().harvestTap(s, i, PS.core.rng.fresh(), Date.now()));
    if (!res.length) { btn.classList.remove('shake'); void btn.offsetWidth; btn.classList.add('shake'); return; }
    PS.assets.sound.play('pluck');
    if (res.length > 1) setTimeout(() => PS.assets.sound.play('pluck'), 90);
    showPicked(res);
  }

  /* ---------- たまに起きる出来事 ---------- */
  let nextEventAt = 0, pending = false, lastEventAt = 0;

  function scheduleNext(now) {
    const ev = EV();
    const wait = Math.max(ev.minIntervalSec, -Math.log(1 - Math.random()) * ev.meanIntervalSec);
    nextEventAt = now + wait * 1000;
  }

  /** アプリを開いている間、出来事の時間が来たか確かめる（薬草園を見ていなければ、次に開いたときに起こす） */
  function checkEvent() {
    const now = Date.now();
    if (!nextEventAt) { scheduleNext(now); return; }
    if (now < nextEventAt) return;
    if (ui.currentScreen() === 'garden' && !document.hidden) fireEvent();
    else pending = true;
  }

  function fireEvent(forceId) {
    const now = Date.now();
    pending = false;
    lastEventAt = now;
    scheduleNext(now);
    const list = EV().list;
    const ev = forceId ? list.find(x => x.id === forceId) : PS.core.rng.fresh().weighted(list, x => x.weight);
    if (!ev) return;
    if (ev.kind === 'plot') {
      const i = PS.store.commit('event', s => G().makeSpecial(s, ev.special, PS.core.rng.fresh(), now));
      if (i < 0) return;
      const nb = renderSlot(i);
      if (nb) nb.classList.add('appear');
    } else if (ev.kind === 'auto') {
      PS.store.commit('event', s => G().bloomAll(s, now));
      rainShower();
      renderGrid();
    } else if (ev.kind === 'visitor') {
      spawnVisitor(ev);
    }
    PS.assets.sound.play('event');
    ui.toast(ev.appear, 3200);
  }

  function rainShower() {
    const r = document.createElement('div');
    r.className = 'rain';
    fxEl.appendChild(r);
    setTimeout(() => r.remove(), 3200);
  }

  /** 蝶々・てんとう虫：畑のどこかにとまり、タップするとごほうび。しばらくすると帰る */
  function spawnVisitor(ev) {
    fxEl.querySelectorAll('.visitor').forEach(v => v.remove());
    const plots = Array.from(gridEl.querySelectorAll('.plot'));
    const target = plots[Math.floor(Math.random() * plots.length)];
    if (!target) return;
    const v = document.createElement('button');
    v.className = 'visitor visitor-' + ev.id;
    v.setAttribute('aria-label', ev.id === 'butterfly' ? '蝶々' : 'てんとう虫');
    v.innerHTML = PS.assets.art.render(ev.art);
    const r = target.getBoundingClientRect(), sr = sceneEl.getBoundingClientRect();
    v.style.left = (r.left - sr.left + r.width * 0.55) + 'px';
    v.style.top = (r.top - sr.top + r.height * 0.05) + 'px';
    fxEl.appendChild(v);
    const leave = setTimeout(() => { v.classList.add('leave'); setTimeout(() => v.remove(), 800); }, EV().visitorStaySec * 1000);
    v.addEventListener('click', () => {
      clearTimeout(leave);
      const now = Date.now();
      if (ev.reward === 'bloom') {
        PS.store.commit('event', s => G().bloomAll(s, now));
        renderGrid();
      } else if (ev.reward === 'gift') {
        const got = PS.store.commit('event', s => G().gift(s, PS.core.rng.fresh()));
        const L = PS.core.lookup;
        floatText(v, Object.entries(got).map(([id, n]) => `${L.material[id].name}+${n}`).join(' '), 'rare');
        renderBasket(); bumpBasket();
      }
      PS.assets.sound.play('confirm');
      ui.toast(ev.done, 2600);
      v.classList.add('leave');
      setTimeout(() => v.remove(), 800);
    }, { once: true });
  }

  ui.registerScreen({
    id: 'garden', label: '薬草園', icon: '🌿',
    mount(el) {
      root = el;
      el.innerHTML = `
        <div class="garden-top"><h2>薬草園</h2><span class="auto-pill" id="garden-auto" hidden></span></div>
        <div class="garden-scene" id="garden-scene">
          <div class="garden-sky" id="garden-sky"></div>
          <div class="garden-field"><div class="garden-grid" id="garden-grid"></div></div>
          <div class="garden-fx" id="garden-fx"></div>
        </div>
        <div class="basket" id="garden-basket">
          <div class="basket-panel" hidden></div>
          <button class="basket-btn" aria-expanded="false"><span class="basket-label">🧺 かごの中を見る</span><span class="basket-arrow">▲</span></button>
        </div>`;
      sceneEl = el.querySelector('#garden-scene');
      gridEl = el.querySelector('#garden-grid');
      basketEl = el.querySelector('#garden-basket');
      autoEl = el.querySelector('#garden-auto');
      fxEl = el.querySelector('#garden-fx');
      gridEl.addEventListener('click', onTap);
      basketEl.querySelector('.basket-btn').addEventListener('click', () => { basketOpen = !basketOpen; PS.assets.sound.play('tap'); renderBasket(); });
      setInterval(checkEvent, 5000);
    },
    onShow() {
      renderScene(true); renderAuto(); renderGrid(); renderBasket();
      clearInterval(timer); timer = setInterval(tick, 400);
      if (pending) setTimeout(() => { if (ui.currentScreen() === 'garden') fireEvent(); }, 1500);
    },
    onHide() { clearInterval(timer); timer = null; basketOpen = false; },
  });

  /** 確認用：出来事をすぐに起こす（デバッグ機能から呼ぶ） */
  ui.gardenEvent = id => { if (ui.currentScreen() === 'garden') fireEvent(id); };

  PS.store.subscribe((s, reason) => {
    if (ui.currentScreen() !== 'garden') return;
    if (reason === 'replace' || reason === 'upgrade') { renderAuto(); renderGrid(); renderBasket(); return; }
    if (reason === 'sales') {
      const r = PS.clock.lastResult;
      const items = (r && r.gather && r.gather.items) || [];
      if (!items.length) return;
      if (r.catchUp || items.length > 6) { renderGrid(); renderBasket(); return; }
      showPicked(items, { auto: true });
      PS.assets.sound.play('tap');
    }
  });
})(window.PS);
