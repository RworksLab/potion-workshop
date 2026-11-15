/*
 * はじめての人向けのチュートリアル（5枚のスライド）
 *  ・初めて遊ぶとき（新しいセーブデータのとき）だけ自動で表示する
 *  ・最後まで見るか「スキップ」したら、次からは自動で出さない（この端末に印を残すだけで、ゲームのデータは変えない）
 *  ・設定画面の「遊び方を見る」からいつでも見直せる
 *  ・スライドの文章や絵は SLIDES を書きかえれば変えられる（\n で改行する位置を決められる）
 *  ui.tutorial.open() / ui.tutorial.shouldAutoShow(isNewGame)
 */
(function (PS) {
  'use strict';
  const ui = PS.ui;
  const SEEN_KEY = 'fushigi-potion:tutorial-seen';
  const A = () => PS.assets.art;

  /* ---------- 絵：実際の画面をわかりやすく小さくしたもの（ゲームの絵とUIを組み合わせて描く） ---------- */
  const potion = (bottle, color, texture, rarity) => A().renderPotion({ bottle, color, texture: texture || 'smooth', rarity: rarity || 'N' });
  const tap = style => `<span class="mk-tap" style="${style}"><i></i></span>`;   // タップの目印
  const rb = id => ui.rarityBadge(id);
  const screen = (title, body, tab) => `<div class="mk">
      <div class="mk-head"><b>${title}</b></div>
      <div class="mk-body">${body}</div>
      <div class="mk-tabs">${['garden', 'lab', 'codex', 'shop', 'upgrade'].map(id =>
        `<span class="tab ${id === tab ? 'active' : ''}" data-screen="${id}"><span class="tab-icon">${A().render('nav_' + id)}</span></span>`).join('')}</div>
    </div>`;

  const SLIDES = [
    {
      title: 'ようこそ、\nふしぎなポーション工房へ！',
      text: '薬草や花を収穫して、\nポーションの材料を集めよう！',
      bg: '#dcf2dc',
      art: () => screen('薬草園', `
        <div class="mk-garden">
          <div class="mk-sky">${A().render('garden_sky', { tod: 'day' })}</div>
          <div class="mk-grid">${['mat_green_herb', 'mat_red_flower', 'sprout', 'mat_mint_leaf', 'mat_sun_berry', 'mat_moonlight_grass']
            .map((k, i) => `<span class="mk-plot ${i === 4 ? 'hit' : ''}"><span class="mk-soil"></span><span class="mk-plant">${A().render(k)}</span></span>`).join('')}</div>
          <span class="mk-float">太陽の実 +2</span>
          ${tap('left:50%;top:74%')}
        </div>
        <div class="mk-basket">🧺 かごの中を見る</div>`, 'garden'),
    },
    {
      title: '何ができるかは、お楽しみ！',
      text: '好きな材料を好きな量だけ投入して、\nあなただけのポーションを調合しよう！',
      bg: '#e8dcfb',
      art: () => screen('調合室', `
        ${[['mat_red_flower', '赤い花', 2], ['mat_moonlight_grass', '月光草', 2], ['mat_sun_berry', '太陽の実', 1]].map(([k, n, q]) =>
          `<div class="mk-row on"><span class="mk-icon">${A().render(k)}</span><b>${n}</b><span class="mk-qty"><i>−</i><em>${q}</em><i>＋</i></span></div>`).join('')}
        <div class="mk-row"><span class="mk-icon">${A().render('mat_mint_leaf')}</span><b>ミントの葉</b><span class="mk-qty"><i>−</i><em>0</em><i>＋</i></span></div>
        <div class="mk-cap"><span><i style="width:100%"></i></span>投入 5 / 5　できる本数 2本</div>
        <div class="mk-btns"><span class="mk-btn ghost">クリア</span><span class="mk-btn primary">⚗️ 調合する</span></div>
        <span class="mk-q">？</span>
        ${tap('left:70%;top:86%')}`, 'lab'),
    },
    {
      title: 'ポーションをお店に並べよう！',
      text: '棚に並べたポーションは自動で販売！\nお客さんのレビューも楽しみに。',
      bg: '#fde3c8',
      art: () => screen('お店', `
        <div class="mk-stats"><span>今日の売上<b>236G</b></span><span>売れた数<b>4本</b></span><span>これまで<b>1,280G</b></span></div>
        <div class="mk-cabinet">
          ${[['round', 'strawberry_milk', 'fizzy', 'R', 'いちごの夢', 72, 70], ['tube', 'soda_float', 'sparkle', 'SR', '星のソーダ', 118, 35], ['cone', 'honey_lemon', 'smooth', 'N', '元気の素', 38, 85]]
            .map(([b, c, x, r, n, pr, prog]) => `<div class="mk-slot"><span class="mk-bottle">${potion(b, c, x, r)}</span>
              <span class="mk-tag"><b>${n}</b><span>${rb(r)}<em>${pr}G</em></span><i style="--p:${prog}%"></i></span></div>`).join('')}
        </div>
        <span class="mk-coin" style="top:46px">${A().render('coin')}+118</span>
        <div class="mk-review"><span>${potion('tube', 'soda_float', 'sparkle', 'SR')}</span><p><b>★★★★★</b>しゅわしゅわで元気が出た！</p><em>NEW</em></div>`, 'shop'),
    },
    {
      title: 'お店と薬草園を大きくしよう！',
      text: '売上で畑や設備を強化して、\nもっとたくさんのポーションを作ろう！',
      bg: '#d6ecfa',
      art: () => screen('強化', `
        ${[['up_field_expand', '畑の拡張', 'Lv.1', '3×4 → 4×4', '700'], ['up_cauldron', '調合釜', 'Lv.2', '10個 → 15個', '700'], ['up_shelf', '商品棚', 'Lv.0', '3段 → 4段', '500']]
          .map(([k, n, lv, eff, cost], i) => `<div class="mk-up ${i === 0 ? 'hit' : ''}"><span class="mk-upicon">${A().render(k)}</span>
            <span class="mk-uptext"><b>${n} <small>${lv}</small></b><small>${eff}</small><span class="mk-pips">${'<i class="on"></i>'.repeat(i ? 1 : 2)}<i></i><i></i><i></i></span></span>
            <span class="mk-buy">${A().render('coin')}${cost}</span></div>`).join('')}
        ${tap('left:87%;top:16%')}
        <span class="mk-levelup">Lv.UP!</span>`, 'upgrade'),
    },
    {
      title: 'あなただけのポーション図鑑を！',
      text: '不思議な薬も、へんてこな薬も。\n世界にひとつだけのポーションを\nたくさん生み出そう！',
      bg: '#fbd9e7',
      art: () => screen('ポーション図鑑', `
        <div class="mk-codex">${[['star', 'mint_choco', 'sparkle', 'UR', '星降る夜'], ['heart', 'pink', 'foam', 'SR', 'ときめき水'], ['round', 'grape_lemon', 'swirl', 'R', 'ふしぎ汁'],
          ['drop', 'blue', 'mist', 'SSR', '氷のしずく'], ['gourd', 'melon_soda', 'fizzy', 'N', 'へんてこ薬'], ['pot', 'cafe_au_lait', 'thick', 'R', 'ねむねむ']]
          .map(([b, c, x, r, n]) => `<div class="mk-card r-${r}"><span>${potion(b, c, x, r)}</span><b>${n}</b>${rb(r)}</div>`).join('')}</div>`, 'codex'),
    },
  ];

  /* ---------- 表示 ---------- */
  let root = null, index = 0, onClose = null, touchX = null;

  function seen() { try { return localStorage.getItem(SEEN_KEY) === '1'; } catch (e) { return false; } }
  function markSeen() { try { localStorage.setItem(SEEN_KEY, '1'); } catch (e) { /* 保存できない環境でも続ける */ } }

  function render() {
    const s = SLIDES[index], last = index === SLIDES.length - 1;
    root.querySelector('.tut-track').style.transform = `translateX(${-index * 100}%)`;
    root.querySelectorAll('.tut-slide').forEach((el, i) => {
      el.classList.toggle('on', i === index);
      el.setAttribute('aria-hidden', i !== index);
    });
    root.querySelectorAll('.tut-dot').forEach((d, i) => d.classList.toggle('on', i === index));
    root.querySelector('.tut-count').textContent = `${index + 1} / ${SLIDES.length}`;
    root.querySelector('#tut-prev').style.visibility = index === 0 ? 'hidden' : 'visible';
    root.querySelector('#tut-next').hidden = last;
    root.querySelector('#tut-start').hidden = !last;
    root.querySelector('#tut-skip').style.visibility = last ? 'hidden' : 'visible';
    root.style.setProperty('--tut-bg', s.bg);
  }

  function go(i) {
    const n = Math.max(0, Math.min(SLIDES.length - 1, i));
    if (n === index) return;
    index = n;
    PS.assets.sound.play('tap');
    render();
  }

  function close(done) {
    if (!root) return;
    markSeen();
    PS.assets.sound.play(done ? 'confirm' : 'tap');
    root.classList.add('closing');
    const el = root; root = null;
    document.removeEventListener('keydown', onKey);
    setTimeout(() => el.remove(), 320);
    if (onClose) onClose(done);
  }

  function onKey(e) {
    if (e.key === 'ArrowRight') go(index + 1);
    else if (e.key === 'ArrowLeft') go(index - 1);
    else if (e.key === 'Escape') close(false);
  }

  function open(opts) {
    if (root) return;
    opts = opts || {};
    onClose = opts.onClose || null;
    index = 0;
    root = document.createElement('div');
    root.className = 'tutorial';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-label', '遊び方');
    root.innerHTML = `
      <div class="tut-top"><span class="tut-count"></span><button class="tut-skip" id="tut-skip">スキップ</button></div>
      <div class="tut-viewport"><div class="tut-track">
        ${SLIDES.map((s, i) => `<section class="tut-slide" style="--bg:${s.bg}">
          <div class="tut-art"><div class="tut-art-inner">${s.art()}</div></div>
          <h2 class="tut-title">${ui.esc(s.title)}</h2>
          <p class="tut-text">${ui.esc(s.text)}</p>
          ${s.finale ? `<p class="tut-finale">✨ ${ui.esc(s.finale)} ✨</p>` : ''}
        </section>`).join('')}
      </div></div>
      <div class="tut-dots">${SLIDES.map((_, i) => `<button class="tut-dot" data-i="${i}" aria-label="${i + 1}枚目"></button>`).join('')}</div>
      <div class="tut-nav">
        <button class="btn ghost tut-prev" id="tut-prev">前へ</button>
        <button class="btn primary big tut-next" id="tut-next">次へ</button>
        <button class="btn primary big tut-start" id="tut-start" hidden>ゲームをはじめる</button>
      </div>`;
    document.body.appendChild(root);
    root.querySelector('#tut-prev').onclick = () => go(index - 1);
    root.querySelector('#tut-next').onclick = () => go(index + 1);
    root.querySelector('#tut-start').onclick = () => close(true);
    root.querySelector('#tut-skip').onclick = () => close(false);
    root.querySelectorAll('.tut-dot').forEach(d => { d.onclick = () => go(Number(d.dataset.i)); });
    // 横にスワイプしてもめくれる
    const vp = root.querySelector('.tut-viewport');
    vp.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
    vp.addEventListener('touchend', e => {
      if (touchX === null) return;
      const dx = e.changedTouches[0].clientX - touchX; touchX = null;
      if (Math.abs(dx) > 50) go(index + (dx < 0 ? 1 : -1));
    });
    document.addEventListener('keydown', onKey);
    render();
    requestAnimationFrame(() => root && root.classList.add('show'));
  }

  ui.tutorial = {
    open,
    /** 初めて遊ぶ人（新しいセーブデータ）で、まだ見ていなければ自動で出す */
    shouldAutoShow: isNewGame => isNewGame && !seen(),
    isOpen: () => !!root,
    slides: SLIDES,
  };
})(window.PS);
