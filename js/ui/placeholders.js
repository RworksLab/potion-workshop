/* まだ実装していない画面（タブの位置だけ先に用意しておく） */
(function (PS) {
  'use strict';
  const ui = PS.ui;

  function soon(el, title, step, text) {
    el.innerHTML = `<div class="screen-head"><h2>${title}</h2></div>
      <div class="soon"><div class="soon-art">${PS.assets.art.render('coin')}</div>
      <p><b>準備中</b>（${step}で実装予定）</p><p class="sub">${text}</p></div>`;
  }

  ui.registerScreen({
    id: 'upgrade', label: '強化', icon: '🔨',
    mount(el) { soon(el, '強化', 'STEP 6', '売上のコインで採取や設備を強化できるようになります。'); },
  });
})(window.PS);
