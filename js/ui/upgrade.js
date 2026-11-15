/* 強化の画面 */
(function (PS) {
  'use strict';
  const ui = PS.ui;
  const U = () => PS.core.upgrades;
  let root, listEl;

  /* 効果の表示形式（data/upgrades.js の fmt） */
  const FORMATS = {
    field: v => {
      const sz = PS.data.balance.garden.fieldSizes;
      const [c, r] = sz[Math.max(0, Math.min(sz.length - 1, Math.round(v)))];
      return `${c}×${r}（${c * r}）`;
    },
    growSpeed: v => `×${(1 / v).toFixed(2)}`,
    plusItems: v => `+${Math.round(v)}個`,
    area: v => (Math.round(v) ? `${Math.round(v) + 1}マス同時` : '1マスずつ'),
    rare: v => `+${Math.round(v * 100)}%`,
    autoSec: v => (v > 0 ? `${v.toFixed(1)}秒ごと` : 'なし'),
    cap: v => `${Math.round(v)}個まで`,
    shelves: v => `${Math.round(v)}段`,
    sellSpeed: v => `×${v.toFixed(2)}`,
  };
  const fmt = (u, v) => (FORMATS[u.fmt] || (x => String(x)))(v);

  function cardHtml(u) {
    const s = PS.store.state;
    const lv = U().level(s, u.id);
    const cost = U().cost(s, u.id);
    const now = PS.core.stats.get(s, u.effect.stat);
    const max = cost === null;
    const next = max ? null : PS.core.stats.get(s, u.effect.stat, { id: u.id, level: lv + 1 });
    const can = !max && s.coins >= cost;
    const pips = Array.from({ length: u.maxLevel }, (_, i) => `<i class="${i < lv ? 'on' : ''}"></i>`).join('');
    return `<div class="up-card ${max ? 'max' : ''} ${can ? 'can' : ''}" data-id="${u.id}">
      <span class="up-icon">${u.icon}</span>
      <div class="up-body">
        <div class="up-title"><b>${ui.esc(u.name)}</b><span class="up-lv">Lv.${lv}${max ? ' MAX' : ` / ${u.maxLevel}`}</span></div>
        <p class="up-desc">${ui.esc(u.desc)}</p>
        <div class="up-pips">${pips}</div>
        <p class="up-effect">${max ? `<b>${fmt(u, now)}</b>` : `${fmt(u, now)} <span class="arrow">→</span> <b>${fmt(u, next)}</b>`}</p>
      </div>
      <button class="btn ${can ? 'primary' : 'ghost'} up-buy" data-id="${u.id}" ${can ? '' : 'disabled'}>
        ${max ? 'MAX' : `<span class="up-cost">${PS.assets.art.render('coin')}${cost.toLocaleString()}</span>
          <small>${can ? '強化する' : `あと${(cost - s.coins).toLocaleString()}G`}</small>`}
      </button>
    </div>`;
  }

  function render() {
    const s = PS.store.state;
    const tier = U().shopTier(s);
    listEl.innerHTML = PS.data.upgradeCategories.map(cat => `
      <h3 class="section-title">${cat.name}</h3>
      ${cat.id === 'shop' ? `<p class="up-tier">いまのお店：<b>${ui.esc(s.shopName)}</b>（${ui.esc(tier.name)}）</p>` : ''}
      <div class="up-list">${PS.data.upgrades.filter(u => u.category === cat.id).map(cardHtml).join('')}</div>`).join('');
  }

  function buy(id) {
    const before = U().shopTier(PS.store.state);
    let lv;
    try { lv = PS.store.commit('upgrade', s => U().buy(s, id)); }
    catch (e) { ui.toast(e.message); PS.assets.sound.play('error'); return; }
    const u = U().byId(id);
    PS.assets.sound.play('upgrade');
    render();
    const card = listEl.querySelector(`.up-card[data-id="${id}"]`);
    if (card) card.classList.add('just-up');
    const after = U().shopTier(PS.store.state);
    if (after !== before) ui.toast(`🏠 お店の評判が上がり「${after.name}」になりました！`, 3000);
    else if (id === 'field_expand') {
      const fs = PS.core.gather.fieldSize(PS.store.state);
      ui.toast(`🟫 畑が ${fs.cols}×${fs.rows} に広がりました！`, 3000);
    }
    else ui.toast(`${u.name}が Lv.${lv} になりました`);
  }

  ui.registerScreen({
    id: 'upgrade', label: '強化', icon: '🔨',
    mount(el) {
      root = el;
      el.innerHTML = `<div class="screen-head"><h2>強化</h2><p class="sub">売上のコインで、お店と薬草園を育てよう</p></div>
        <div id="up-list"></div>`;
      listEl = el.querySelector('#up-list');
      listEl.addEventListener('click', e => {
        const b = e.target.closest('.up-buy');
        if (b && !b.disabled) buy(b.dataset.id);
      });
    },
    onShow: render,
  });

  /* コインが増えたら、買える強化の数をタブに表示（強化画面を開いていれば表示も更新） */
  let lastAffordable = -1;
  PS.store.subscribe((s, reason) => {
    const n = PS.data.upgrades.filter(u => U().canBuy(s, u.id)).length;
    if (n !== lastAffordable) { ui.setTabBadge('upgrade', n, 'good'); lastAffordable = n; }
    if (ui.currentScreen() === 'upgrade' && reason !== 'upgrade') render();
  });
})(window.PS);
