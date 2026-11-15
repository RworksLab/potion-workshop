/* 画面共通の部品：画面登録・切替、モーダル、トースト、ポーション表示 */
(function (PS) {
  'use strict';

  const ui = PS.ui;

  /* HTML エスケープ（プレイヤーが付けた名前を安全に表示するため） */
  ui.esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  ui.$ = (sel, root) => (root || document).querySelector(sel);
  ui.$$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  /* ---------- 画面の登録と切替 ---------- */
  const screens = [];
  let current = null;

  /**
   * 画面を登録する
   * @param {{id, label, icon, tab?:boolean, mount(el), onShow?(), onHide?()}} def
   */
  ui.registerScreen = function (def) {
    screens.push(Object.assign({ tab: true }, def));
  };

  ui.buildScreens = function () {
    const root = ui.$('#screen-root');
    const nav = ui.$('#tabbar');
    for (const s of screens) {
      const el = document.createElement('section');
      el.className = 'screen';
      el.id = 'screen-' + s.id;
      el.hidden = true;
      root.appendChild(el);
      s.el = el;
      s.mount(el);
      if (s.tab) {
        const b = document.createElement('button');
        b.className = 'tab';
        b.dataset.screen = s.id;
        const icon = PS.assets.manifest.art['nav_' + s.id] ? PS.assets.art.render('nav_' + s.id) : s.icon;
        b.innerHTML = `<span class="tab-icon">${icon}</span><span class="tab-label">${s.label}</span>`;
        b.addEventListener('click', () => { PS.assets.sound.play('tap'); ui.show(s.id); });
        nav.appendChild(b);
      }
    }
  };

  ui.show = function (id) {
    const next = screens.find(s => s.id === id);
    if (!next || next === current) return;
    if (current) {
      if (current.tab) ui.prevScreen = current.id;
      current.el.hidden = true; current.onHide && current.onHide();
    }
    current = next;
    next.el.hidden = false;
    next.el.scrollTop = 0;
    ui.$$('#tabbar .tab').forEach(b => b.classList.toggle('active', b.dataset.screen === id));
    next.onShow && next.onShow();
  };

  ui.currentScreen = () => (current ? current.id : null);

  /** 個数を短く表示する：999 まではそのまま、1,000以上は「1.2k」、100万以上は「1.2M」、10億以上は「1.2B」 */
  ui.shortNum = function (n) {
    n = Math.floor(Number(n) || 0);
    const f = (v, u) => (v >= 100 ? Math.floor(v) : Math.floor(v * 10) / 10) + u;
    if (n >= 1e9) return f(n / 1e9, 'B');
    if (n >= 1e6) return f(n / 1e6, 'M');
    if (n >= 1e3) return f(n / 1e3, 'k');
    return String(n);
  };

  /** 端末の時刻から時間帯を決める（朝 5〜9時 / 昼 9〜16時 / 夕方 16〜19時 / 夜） */
  ui.timeOfDay = function (date) {
    const h = (date || new Date()).getHours();
    if (h >= 5 && h < 9) return 'morning';
    if (h >= 9 && h < 16) return 'day';
    if (h >= 16 && h < 19) return 'evening';
    return 'night';
  };

  /** タブに数字バッジを付ける（0 で消える） */
  ui.setTabBadge = function (id, n, cls) {
    const tab = ui.$(`#tabbar .tab[data-screen="${id}"]`);
    if (!tab) return;
    let b = tab.querySelector('.tab-badge');
    if (!n) { if (b) b.remove(); return; }
    if (!b) { b = document.createElement('span'); b.className = 'tab-badge ' + (cls || ''); tab.appendChild(b); }
    b.textContent = n > 99 ? '99+' : n;
  };

  /** レビュー1件の表示 */
  ui.reviewCard = function (r, opts) {
    opts = opts || {};
    const s = PS.store.state;
    const p = s.potions.find(x => x.id === r.potionId);
    const name = PS.core.reviews.potionNameOf(s, r);
    return `<article class="review mood-${r.mood} ${opts.isNew ? 'is-new' : ''}">
      <header class="review-head">
        ${opts.hidePotion ? '' : `<span class="review-art">${p ? PS.assets.art.renderPotion(p.generated) : ''}</span>`}
        <div class="review-who">
          ${opts.hidePotion ? '' : `<b class="review-potion">「${ui.esc(name)}」</b>`}
          <span class="review-meta"><span class="review-stars" aria-label="評価${r.stars}">${'★'.repeat(r.stars)}<i>${'★'.repeat(5 - r.stars)}</i></span>
          ${ui.esc(r.customer)}</span>
        </div>
        ${opts.isNew ? '<span class="new-tag">NEW</span>' : ''}
      </header>
      <p class="review-text">${ui.esc(r.text)}</p>
      <time class="review-time">${ui.formatDate(r.t)}</time>
    </article>`;
  };

  /* ---------- トースト ---------- */
  ui.toast = function (msg, ms) {
    const root = ui.$('#toast-root');
    while (root.children.length >= 2) root.firstElementChild.remove(); // 同時に出すのは2つまで
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    root.appendChild(t);
    requestAnimationFrame(() => t.classList.add('show'));
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, ms || 2200);
  };

  /* ---------- モーダル ---------- */
  ui.modal = {
    /**
     * @param {string} html 中身
     * @param {{dismissible?:boolean, cls?:string, onClose?:Function}} opts
     * @returns {HTMLElement} モーダルの中身の要素
     */
    open(html, opts) {
      opts = opts || {};
      const root = ui.$('#modal-root');
      const wrap = document.createElement('div');
      wrap.className = 'modal-wrap';
      wrap.innerHTML = `<div class="modal ${opts.cls || ''}" role="dialog" aria-modal="true">
        ${opts.dismissible !== false ? '<button class="modal-close" aria-label="閉じる">×</button>' : ''}
        <div class="modal-body">${html}</div></div>`;
      root.appendChild(wrap);
      const close = () => ui.modal.close(wrap);
      wrap._onClose = opts.onClose;
      if (opts.dismissible !== false) {
        wrap.addEventListener('click', e => { if (e.target === wrap) close(); });
        wrap.querySelector('.modal-close').addEventListener('click', close);
      }
      requestAnimationFrame(() => wrap.classList.add('show'));
      const body = wrap.querySelector('.modal-body');
      body.close = close;
      return body;
    },
    close(wrap) {
      if (!wrap) { const all = ui.$$('#modal-root .modal-wrap'); wrap = all[all.length - 1]; }
      if (!wrap || wrap._closing) return;
      wrap._closing = true;
      wrap.classList.remove('show');
      setTimeout(() => wrap.remove(), 220);
      wrap._onClose && wrap._onClose();
    },
    /** お知らせダイアログ（Promise） */
    alert(message) {
      return new Promise(resolve => {
        const body = ui.modal.open(`<p class="confirm-msg">${ui.esc(message)}</p>
          <button class="btn primary wide" data-a="ok">OK</button>`, { onClose: resolve });
        body.querySelector('[data-a="ok"]').onclick = () => body.close();
      });
    },
    /** 確認ダイアログ（Promise<boolean>） */
    confirm(message, okLabel, danger) {
      return new Promise(resolve => {
        let answered = false;
        const body = ui.modal.open(`<p class="confirm-msg">${ui.esc(message)}</p>
          <div class="btn-row"><button class="btn ghost" data-a="no">やめる</button>
          <button class="btn ${danger ? 'danger' : 'primary'}" data-a="yes">${ui.esc(okLabel || 'OK')}</button></div>`,
          { onClose: () => { if (!answered) resolve(false); } });
        body.addEventListener('click', e => {
          const a = e.target.closest('[data-a]');
          if (!a) return;
          answered = true;
          resolve(a.dataset.a === 'yes');
          body.close();
        });
      });
    },
  };

  /* ---------- ポーション表示部品 ---------- */
  ui.rarityBadge = function (rid) {
    const r = PS.core.lookup.rarity[rid];
    return `<span class="rarity rarity-${rid}" style="--rc:${r ? r.color : '#999'}">${rid}</span>`;
  };

  /** 名前の長さに合わせた文字サイズのクラス（20文字でも切れないように） */
  ui.nameSizeClass = function (name) {
    const n = [...String(name)].length;
    return n > 15 ? 'len-l' : n > 10 ? 'len-m' : '';
  };

  ui.stars = (n, max) => '★'.repeat(n) + (max ? '☆'.repeat(Math.max(0, max - n)) : '');

  /** 効果のカテゴリ */
  ui.effectCategory = function (effectId) {
    const e = PS.core.lookup.effect[effectId];
    return e ? PS.data.effectCategories.find(c => c.id === e.cat) : null;
  };

  ui.ingredientsText = function (ings) {
    const L = PS.core.lookup;
    return ings.map(i => `${L.material[i.materialId] ? L.material[i.materialId].name : '？'}×${i.qty}`).join('、');
  };

  ui.formatDate = function (ts) {
    const d = new Date(ts);
    const z = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}/${z(d.getMonth() + 1)}/${z(d.getDate())} ${z(d.getHours())}:${z(d.getMinutes())}`;
  };

  /** 長押しで連続実行するボタン */
  ui.holdRepeat = function (el, fn) {
    let t1 = null, t2 = null;
    const stop = () => { clearTimeout(t1); clearInterval(t2); t1 = t2 = null; };
    el.addEventListener('pointerdown', e => {
      e.preventDefault();
      fn();
      t1 = setTimeout(() => { t2 = setInterval(fn, 70); }, 380);
    });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => el.addEventListener(ev, stop));
    el.addEventListener('contextmenu', e => e.preventDefault());
  };
})(window.PS);
