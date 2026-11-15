/*
 * ポーションの詳細「調合ノート」
 * 調合直後の結果画面と、図鑑の詳細画面で共通に使う。
 *  ui.potionNote(g, opts) → HTML
 *   g    … 生成データ（potion.generated / pendingPotion.generated）
 *   opts … { name, number, date }
 * ※ 材料は結果を決めない（同じ材料でも毎回違う結果になる）ので表示しない
 */
(function (PS) {
  'use strict';
  const ui = PS.ui;

  /* 付箋の色（味・香り・色・質感） */
  const SENSES = [
    { key: 'taste',   icon: '👅', label: '味',   tone: 'pink' },
    { key: 'aroma',   icon: '👃', label: '香り', tone: 'mint' },
    { key: 'color',   icon: '🎨', label: '色',   tone: 'yellow' },
    { key: 'texture', icon: '✨', label: '質感', tone: 'lavender' },
  ];

  /* 副効果の印（良い / 困った / よくわからない） */
  const SUB_MARK = { good: '👍', bad: '⚠️', odd: '❓' };

  function stamp(rarityId) {
    const r = PS.core.lookup.rarity[rarityId];
    return `<div class="note-stamp stamp-${rarityId}" style="--sc:${r ? r.color : '#999'}">
      <b>${rarityId}</b><small>${r ? ui.esc(r.label) : ''}</small></div>`;
  }

  function senseValue(g, key) {
    const L = PS.core.lookup;
    if (key === 'color') {
      return `<span class="swatch" style="background:${PS.assets.art.colorCss(g.color)}"></span>${ui.esc(L.color[g.color].name)}`;
    }
    const map = { taste: L.taste, aroma: L.aroma, texture: L.texture };
    return ui.esc(map[key][g[key]].name);
  }

  ui.potionNote = function (g, opts) {
    opts = opts || {};
    const L = PS.core.lookup;
    const eff = L.effect[g.effect];
    const pot = L.potency[g.potency];
    const subs = (g.subEffects || (g.subEffect ? [g.subEffect] : [])).map(id => L.effect[id]).filter(Boolean);
    const cat = ui.effectCategory(g.effect);
    const name = opts.name ? ui.esc(opts.name) : '<span class="note-name-empty">（名前をつけてね）</span>';
    const starMax = PS.data.potency.length;
    return `<article class="note note-${g.rarity}">
      <span class="note-tape"></span>
      <header class="note-head">
        <span>調合記録 <b>No.${opts.number || '—'}</b></span>
        <span>${opts.date ? ui.formatDate(opts.date).slice(0, 10) : ''}</span>
      </header>
      <div class="note-top">
        <div class="note-photo"><span class="note-photo-tape"></span>${PS.assets.art.renderPotion(g, { cls: 'big' })}</div>
        <div class="note-title">
          <h3 class="note-name ${ui.nameSizeClass(opts.name || '')}" id="note-name">${name}</h3>
          <p class="note-bottle">🧪 ${ui.esc(L.bottle[g.bottle].name)}</p>
          ${stamp(g.rarity)}
        </div>
      </div>
      <section class="note-effect">
        <span class="note-label">効果</span>${cat ? `<span class="note-cat">${cat.icon} ${ui.esc(cat.name)}</span>` : ''}
        <p class="note-effect-name"><mark>${ui.esc(eff.name)}</mark></p>
        <p class="note-potency"><span class="note-stars">${'★'.repeat(pot.stars)}<i>${'★'.repeat(Math.max(0, starMax - pot.stars))}</i></span>${ui.esc(pot.name)}</p>
        ${eff.desc ? `<p class="note-effect-desc">${ui.esc(eff.desc)}</p>` : ''}
        ${subs.length ? `<ul class="note-subs">${subs.map(s => `<li class="sub-${s.polarity}">
          <span class="sub-head"><span class="sub-mark">${SUB_MARK[s.polarity] || '＋'}</span>副効果 <b>${ui.esc(s.name)}</b></span>
          ${s.desc ? `<small>${ui.esc(s.desc)}</small>` : ''}</li>`).join('')}</ul>` : ''}
      </section>
      <section class="note-senses">
        ${SENSES.map((s, i) => `<div class="sense sense-${s.tone}" style="--rot:${i % 2 ? 1.2 : -1.2}deg">
          <span class="sense-label">${s.icon} ${s.label}</span><b class="sense-value">${senseValue(g, s.key)}</b></div>`).join('')}
      </section>
      <section class="note-memo">
        <span class="note-label">📝 店主のメモ</span>
        <p>${ui.esc(g.description)}</p>
      </section>
    </article>`;
  };
})(window.PS);
