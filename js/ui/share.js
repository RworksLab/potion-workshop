/*
 * ポーションの共有
 *  図鑑の詳細画面の「共有する」から使う。
 *  ・ポーションを1枚の画像カード（1080×1350）にして、スマホの共有メニュー（LINE・SNS など）に渡す
 *  ・画像を共有できない環境では、画像の保存と文章のコピーができる画面を出す
 *  ui.sharePotion(potion)
 */
(function (PS) {
  'use strict';
  const ui = PS.ui;
  const W = 1080, H = 1350;
  const INK = '#5b5470', SOFT = '#8a8399';
  const FONT = '"Hiragino Maru Gothic ProN","Hiragino Sans","M PLUS Rounded 1c","Noto Sans JP","Yu Gothic",sans-serif';
  const SUB_MARK = { good: '👍', bad: '⚠️', odd: '❓' };

  const gameUrl = () => location.origin + location.pathname.replace(/index\.html$/, '');

  /** 共有するときの文章 */
  function shareText(p) {
    const L = PS.core.lookup, g = p.generated;
    const eff = L.effect[g.effect], pot = L.potency[g.potency];
    const subs = (g.subEffects || []).map(id => L.effect[id]).filter(Boolean);
    return [
      `「${p.name}」ができた！（${g.rarity}）`,
      `効果：${eff.name}（${'★'.repeat(pot.stars)}）` + (subs.length ? `／副効果：${subs.map(s => s.name).join('・')}` : ''),
      `味：${L.taste[g.taste].name}　香り：${L.aroma[g.aroma].name}`,
      '#ふしぎなポーション工房',
    ].join('\n');
  }

  /* ---------- 画像カードを描く ---------- */
  function roundRect(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  }

  /** 横幅に収まるように折り返す（最大 maxLines 行。あふれたら …） */
  function wrap(c, text, maxW, maxLines) {
    const lines = []; let cur = '';
    const NO_HEAD = '、。，．）」』】！？ー…ぁぃぅぇぉっゃゅょ';   // 行のはじめに来ないようにする文字
    for (const ch of text) {
      if (c.measureText(cur + ch).width > maxW && cur && !NO_HEAD.includes(ch)) { lines.push(cur); cur = ch; } else cur += ch;
    }
    if (cur) lines.push(cur);
    if (lines.length > maxLines) { lines.length = maxLines; lines[maxLines - 1] = lines[maxLines - 1].slice(0, -1) + '…'; }
    return lines;
  }

  function loadSvg(markup, w, h) {
    const sized = markup.replace('<svg ', `<svg width="${w}" height="${h}" `);
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(new Blob([sized], { type: 'image/svg+xml' }));
      img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = e => { URL.revokeObjectURL(url); reject(e); };
      img.src = url;
    });
  }

  /**
   * 調合記録（図鑑の詳細と同じノートの見た目）を画像にする。幅1080、高さは内容に合わせる（最低1350）
   * 先に中身だけを描いて高さを決め、そのあとノートの紙を敷いて重ねる
   */
  async function makeCard(p) {
    const L = PS.core.lookup, g = p.generated;
    const r = L.rarity[g.rarity];
    const eff = L.effect[g.effect], pot = L.potency[g.potency];
    const subs = (g.subEffects || []).map(id => L.effect[id]).filter(Boolean);
    const cat = ui.effectCategory(g.effect);
    const number = PS.store.state.potions.indexOf(p) + 1;
    const font = (size, bold) => `${bold ? 'bold ' : ''}${size}px ${FONT}`;
    const LINE = 68;                       // ノートの罫線の間隔
    const PX = 150, PR = 960;              // 書く範囲（左の赤線の右〜右端）

    const layer = document.createElement('canvas'); layer.width = W; layer.height = 2600;
    const c = layer.getContext('2d');
    c.textBaseline = 'alphabetic';
    const rot = (cx, cy, deg, fn) => { c.save(); c.translate(cx, cy); c.rotate(deg * Math.PI / 180); fn(); c.restore(); };

    // 見出し
    c.font = font(30); c.fillStyle = SOFT; c.textAlign = 'left';
    c.fillText('調合記録 ', PX, 170);
    c.font = font(30, true); c.fillStyle = INK; c.fillText('No.' + number, PX + c.measureText('調合記録 ').width + 4, 170);
    c.font = font(30); c.fillStyle = SOFT; c.textAlign = 'right'; c.fillText(ui.formatDate(p.createdAt).slice(0, 10), PR, 170);

    // ポラロイド写真の瓶
    let img = null;
    try { img = await loadSvg(PS.assets.art.renderPotion(g), 300, 320); } catch (e) { img = null; }
    rot(PX + 165, 395, -3, () => {
      c.shadowColor = 'rgba(91,84,112,.22)'; c.shadowBlur = 22; c.shadowOffsetY = 8;
      c.fillStyle = '#fff'; roundRect(c, -160, -180, 320, 360, 10); c.fill();
      c.shadowColor = 'transparent';
      if (img) c.drawImage(img, -150, -168, 300, 320);
      c.fillStyle = 'rgba(255,214,120,.65)'; c.fillRect(-60, -200, 120, 36);   // 写真のテープ
    });

    // 名前・瓶の種類・スタンプ
    const TX = PX + 365, TW = PR - TX;
    c.textAlign = 'left'; c.fillStyle = '#4a4360';
    const nsize = p.name.length > 15 ? 44 : p.name.length > 10 ? 52 : 60;
    c.font = font(nsize, true);
    const nameLines = wrap(c, p.name, TW, 3);
    let ty = 250;
    nameLines.forEach(ln => { c.fillText(ln, TX, ty); ty += nsize * 1.3; });
    c.font = font(28); c.fillStyle = SOFT; c.fillText('🧪 ' + L.bottle[g.bottle].name, TX, ty + 4);
    rot(PR - 95, 485, -14, () => {
      c.globalAlpha = .9;
      c.fillStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.arc(0, 0, 88, 0, Math.PI * 2); c.fill();
      c.strokeStyle = r.color; c.lineWidth = 5;
      c.beginPath(); c.arc(0, 0, 88, 0, Math.PI * 2); c.stroke();
      c.beginPath(); c.arc(0, 0, 76, 0, Math.PI * 2); c.stroke();
      c.fillStyle = r.color; c.textAlign = 'center';
      c.font = font(g.rarity.length > 2 ? 48 : 56, true); c.fillText(g.rarity, 0, 12);
      c.font = font(18, true); c.fillText(r.label, 0, 46);
      c.globalAlpha = 1;
    });

    // 効果
    let y = 660;
    c.textAlign = 'left'; c.font = font(28); c.fillStyle = SOFT; c.fillText('効果', PX, y);
    if (cat) {
      const label = `${cat.icon} ${cat.name}`;
      c.font = font(24); const cw = c.measureText(label).width + 36;
      roundRect(c, PX + 80, y - 32, cw, 44, 22); c.fillStyle = '#fff'; c.fill(); c.strokeStyle = '#eadfcd'; c.lineWidth = 3; c.stroke();
      c.fillStyle = SOFT; c.fillText(label, PX + 98, y - 2);
    }
    y += 78;
    c.font = font(60, true);
    const effLines = wrap(c, eff.name, PR - PX, 2);
    effLines.forEach(ln => {
      const w = c.measureText(ln).width;
      c.fillStyle = g.rarity === 'UR' ? '#ffd6ea' : '#fff09a';
      c.fillRect(PX - 4, y - 22, w + 8, 22);                       // 蛍光ペン
      c.fillStyle = INK; c.fillText(ln, PX, y); y += 76;
    });
    const starMax = PS.data.potency.length;
    c.font = font(44); c.fillStyle = '#f0b54a';
    const on = '★'.repeat(pot.stars), off = '★'.repeat(Math.max(0, starMax - pot.stars));
    c.fillText(on, PX, y); const onW = c.measureText(on).width;
    c.fillStyle = '#e7ddcb'; c.fillText(off, PX + onW, y);
    const starsW = c.measureText(on + off).width;
    c.font = font(32); c.fillStyle = SOFT; c.fillText(pot.name, PX + starsW + 20, y - 4);
    y += 56;
    if (eff.desc) {
      c.font = font(32); c.fillStyle = INK;
      wrap(c, eff.desc, PR - PX, 2).forEach(ln => { c.fillText(ln, PX, y); y += 46; });
    }
    // 副効果
    const SUBBG = { good: '#eaf7ee', bad: '#fdeceb', odd: '#f1ecfd' };
    subs.forEach(s => {
      y += 14;
      roundRect(c, PX, y - 6, PR - PX, 70, 22); c.fillStyle = SUBBG[s.polarity] || '#f3f0ff'; c.fill();
      const head = `${SUB_MARK[s.polarity] || '＋'} 副効果`;
      c.font = font(28); c.fillStyle = SOFT; c.fillText(head, PX + 22, y + 40);
      const hw = c.measureText(head).width;
      c.font = font(34, true); c.fillStyle = INK; c.fillText(s.name, PX + 22 + hw + 16, y + 41);
      y += 70;
    });

    // 味・香り・色・質感の付箋（2×2）
    y += 34;
    const senses = [['👅 味', L.taste[g.taste].name, '#ffe1ea'], ['👃 香り', L.aroma[g.aroma].name, '#dcf4e8'],
      ['🎨 色', L.color[g.color].name, '#fff2bf', true], ['✨ 質感', L.texture[g.texture].name, '#ebe2fb']];
    const sw = (PR - PX - 24) / 2, sh = 120;
    senses.forEach(([label, val, bg, swatch], i) => {
      const sx = PX + (i % 2) * (sw + 24), sy = y + Math.floor(i / 2) * (sh + 22);
      rot(sx + sw / 2, sy + sh / 2, i % 2 ? 1.2 : -1.2, () => {
        c.shadowColor = 'rgba(91,84,112,.14)'; c.shadowBlur = 10; c.shadowOffsetY = 5;
        roundRect(c, -sw / 2, -sh / 2, sw, sh, 10); c.fillStyle = bg; c.fill(); c.shadowColor = 'transparent';
        c.textAlign = 'left'; c.font = font(26); c.fillStyle = SOFT; c.fillText(label, -sw / 2 + 24, -sh / 2 + 42);
        let vx = -sw / 2 + 24;
        if (swatch) {
          c.fillStyle = L.color[g.color].hex || '#ccc';
          c.beginPath(); c.arc(vx + 14, sh / 2 - 36, 14, 0, Math.PI * 2); c.fill(); c.strokeStyle = 'rgba(91,84,112,.3)'; c.lineWidth = 2; c.stroke();
          vx += 40;
        }
        c.fillStyle = INK; c.font = font(val.length > 9 ? 30 : 36, true);
        c.fillText(wrap(c, val, sw / 2 - vx + sw / 2 - 20, 1)[0], vx, sh / 2 - 22);
      });
    });
    y += sh * 2 + 22 + 70;

    // 店主のメモ（罫線にそろえて書く）
    c.textAlign = 'left'; c.font = font(28); c.fillStyle = SOFT; c.fillText('📝 店主のメモ', PX, y);
    y += LINE;
    c.font = font(34); c.fillStyle = INK;
    wrap(c, g.description || '', PR - PX, 6).forEach(ln => { c.fillText(ln, PX, y - 16); y += LINE; });

    // 下：タグとURL
    y += 10;
    c.font = font(26); c.fillStyle = SOFT; c.textAlign = 'right';
    c.fillText('#ふしぎなポーション工房　' + gameUrl().replace(/^https?:\/\//, ''), PR, y);
    const H2 = Math.max(H, y + 90);

    // 紙を敷いて、中身を重ねる
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H2;
    const k = cv.getContext('2d');
    k.fillStyle = '#f6efe4'; k.fillRect(0, 0, W, H2);
    const NX = 60, NY = 70, NW = W - 120, NH = H2 - 120;
    k.save();
    k.shadowColor = 'rgba(91,84,112,.16)'; k.shadowBlur = 30; k.shadowOffsetY = 12;
    roundRect(k, NX, NY, NW, NH, 30); k.fillStyle = '#fffdf6'; k.fill();
    k.restore();
    k.save(); roundRect(k, NX, NY, NW, NH, 30); k.clip();
    k.fillStyle = '#e6edf7';
    for (let ly = NY + LINE + 30; ly < NY + NH - 20; ly += LINE) k.fillRect(NX, ly, NW, 3);   // 罫線
    k.fillStyle = '#f6c2c2'; k.fillRect(NX + 54, NY, 5, NH);                                   // 左の赤線
    k.fillStyle = '#e9dfcc';
    for (let hy = NY + 50; hy < NY + NH - 30; hy += LINE) { k.beginPath(); k.arc(NX + 22, hy, 8, 0, Math.PI * 2); k.fill(); }  // とじ穴
    k.restore();
    // 上のマスキングテープ
    k.save(); k.translate(W / 2, NY + 4); k.rotate(-2 * Math.PI / 180);
    for (let i = 0; i < 20; i++) { k.fillStyle = i % 2 ? 'rgba(200,170,240,.55)' : 'rgba(180,139,232,.55)'; k.fillRect(-130 + i * 13, -26, 13, 52); }
    k.restore();
    k.drawImage(layer, 0, 0, W, H2, 0, 0, W, H2);

    return new Promise(res => cv.toBlob(res, 'image/png'));
  }

  /* ---------- 共有する ---------- */
  /** 画像は詳細を開いたときに先に作っておく（ボタンを押してから共有メニューが開くまでを短くするため） */
  const cardCache = new Map();
  function prepare(p) {
    const key = p.id + '|' + p.name;
    if (!cardCache.has(key)) cardCache.set(key, makeCard(p).catch(() => null));
    return cardCache.get(key);
  }

  /**
   * LINE や Instagram などは、画像といっしょに渡した文章を受け取らないことが多い。
   * そこで、ボタンを押した瞬間に文章をコピーしておき、送り先で貼り付けられるようにする
   */
  function copyText(s) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(s).then(() => true, () => legacyCopy(s));
    } catch (e) { /* 下の方法で */ }
    return Promise.resolve(legacyCopy(s));
  }
  function legacyCopy(s) {
    const ta = document.createElement('textarea');
    ta.value = s; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;top:-100px;opacity:0';
    document.body.appendChild(ta); ta.select();
    let ok = false; try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    ta.remove(); return ok;
  }

  async function sharePotion(p) {
    const text = shareText(p);
    const url = gameUrl();
    const copied = copyText(text + '\n' + url);    // 押した直後にコピー（このあと待つとコピーできなくなるため）
    const blob = await prepare(p);
    const fileName = `potion-${p.generated.rarity}-${Date.now()}.png`;
    const file = blob ? new File([blob], fileName, { type: 'image/png' }) : null;

    // スマホの共有メニュー（画像つき）
    if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
      if (await copied) ui.toast('文章もコピーしました。送り先で貼り付けてね', 3500);
      try { await navigator.share({ files: [file], text: text + '\n' + url }); return 'shared'; }
      catch (e) { if (e && e.name === 'AbortError') return 'cancel'; }
    }
    // 画像を共有できない環境：画像の保存と文章のコピー
    const imgUrl = blob ? URL.createObjectURL(blob) : '';
    const body = ui.modal.open(`
      <div class="share-box">
        <h3>ポーションを共有</h3>
        ${imgUrl ? `<img class="share-img" src="${imgUrl}" alt="共有用の画像">` : ''}
        <textarea class="share-text" readonly rows="5">${ui.esc(text + '\n' + url)}</textarea>
        <div class="btn-row">
          ${imgUrl ? `<a class="btn primary" id="share-save" href="${imgUrl}" download="${fileName}">🖼 画像を保存</a>` : ''}
          <button class="btn ghost" id="share-copy">📋 文章をコピー</button>
        </div>
        ${navigator.share ? '<button class="btn ghost wide" id="share-text-only">📤 文章だけ送る</button>' : ''}
      </div>`, { cls: 'modal-share' });
    body.querySelector('#share-copy').onclick = async () => {
      try { await navigator.clipboard.writeText(text + '\n' + url); ui.toast('文章をコピーしました'); }
      catch (e) { const ta = body.querySelector('.share-text'); ta.select(); document.execCommand('copy'); ui.toast('文章をコピーしました'); }
    };
    const t = body.querySelector('#share-text-only');
    if (t) t.onclick = () => navigator.share({ text, url }).catch(() => {});
    return 'fallback';
  }

  ui.sharePotion = sharePotion;
  ui.prepareShareCard = prepare;
  ui.sharePotionCard = makeCard;     // 確認用
  ui.sharePotionText = shareText;
})(window.PS);
