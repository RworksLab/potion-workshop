/*
 * 絵の描画（SVG）
 * PS.assets.art.render(キー) で HTML 文字列を返す。
 * manifest で type:'image' に変えると、同じキーで画像ファイルが表示される。
 */
(function (PS) {
  'use strict';

  let uid = 0;
  const nextId = p => `${p}${++uid}`;
  const svg = (inner, vb = '0 0 64 64', cls = '') =>
    `<svg class="art ${cls}" viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${inner}</svg>`;

  /* ---------- 植物 ---------- */
  const leaf = (x, y, rx, ry, rot, fill) =>
    `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" transform="rotate(${rot} ${x} ${y})" fill="${fill}"/>`;
  const stem = (c = '#5aa86a') => `<path d="M32 60 C31 48 33 40 32 30" stroke="${c}" stroke-width="3" fill="none" stroke-linecap="round"/>`;

  const drawers = {
    herb(p) {
      const r = p.round ? 1.25 : 1;
      return svg(stem(p.dark) +
        leaf(23, 42, 9 * r, 4.5 * r, -35, p.dark) + leaf(41, 40, 9 * r, 4.5 * r, 35, p.dark) +
        leaf(24, 30, 9 * r, 4.5 * r, -50, p.leaf) + leaf(40, 28, 9 * r, 4.5 * r, 50, p.leaf) +
        leaf(32, 18, 5 * r, 10 * r, 0, p.leaf) +
        `<path d="M32 10 L32 26" stroke="${p.dark}" stroke-width="1" opacity=".5"/>`);
    },
    flower(p) {
      let petals = '';
      for (let i = 0; i < 6; i++) {
        const a = i * 60 * Math.PI / 180;
        petals += `<circle cx="${32 + Math.cos(a) * 8}" cy="${22 + Math.sin(a) * 8}" r="7" fill="${p.petal}"/>`;
      }
      return svg(stem() + leaf(24, 44, 8, 4, -30, p.leaf) + leaf(40, 46, 8, 4, 30, p.leaf) +
        petals + `<circle cx="32" cy="22" r="5.5" fill="${p.center}"/>`);
    },
    starflower(p) {
      const pts = [];
      for (let i = 0; i < 10; i++) {
        const a = (i * 36 - 90) * Math.PI / 180, rr = i % 2 ? 6 : 15;
        pts.push(`${(32 + Math.cos(a) * rr).toFixed(1)},${(22 + Math.sin(a) * rr).toFixed(1)}`);
      }
      return svg(stem() + leaf(24, 46, 8, 4, -30, p.leaf) + leaf(40, 46, 8, 4, 30, p.leaf) +
        `<circle cx="32" cy="22" r="17" fill="${p.center}" opacity=".35"/>` +
        `<polygon points="${pts.join(' ')}" fill="${p.petal}" stroke="#fff6c4" stroke-width="1"/>` +
        `<circle cx="32" cy="22" r="4" fill="${p.center}"/>` +
        `<circle cx="14" cy="12" r="1.5" fill="#fff6c4"/><circle cx="50" cy="16" r="1.2" fill="#fff6c4"/>`);
    },
    fairy(p) {
      let petals = '';
      for (let i = 0; i < 5; i++) {
        const a = (i * 72 - 90) * Math.PI / 180;
        petals += leaf(32 + Math.cos(a) * 7, 24 + Math.sin(a) * 7, 7, 4.5, i * 72, p.petal);
      }
      return svg(`<circle cx="32" cy="24" r="20" fill="#fff" opacity=".35"/>` + stem() +
        leaf(24, 46, 8, 4, -30, p.leaf) + leaf(40, 46, 8, 4, 30, p.leaf) +
        `<ellipse cx="18" cy="14" rx="7" ry="4" fill="${p.wing}" opacity=".85" transform="rotate(-30 18 14)"/>` +
        `<ellipse cx="46" cy="14" rx="7" ry="4" fill="${p.wing}" opacity=".85" transform="rotate(30 46 14)"/>` +
        petals + `<circle cx="32" cy="24" r="4" fill="${p.center}"/>`);
    },
    berry(p) {
      return svg(stem('#6aa866') + leaf(22, 36, 11, 6, -25, p.leaf) + leaf(42, 34, 11, 6, 25, p.leaf) +
        leaf(32, 24, 10, 6, 0, p.leaf) +
        `<circle cx="26" cy="30" r="5" fill="${p.berry}"/><circle cx="37" cy="28" r="5.5" fill="${p.berry}"/>` +
        `<circle cx="31" cy="38" r="5" fill="${p.berry}"/>` +
        `<circle cx="24.5" cy="28.5" r="1.5" fill="#fff" opacity=".7"/><circle cx="35.5" cy="26.5" r="1.5" fill="#fff" opacity=".7"/>`);
    },
    bean(p) {
      return svg(stem('#7fb35a') +
        `<path d="M18 40 Q14 24 28 16 Q26 30 18 40Z" fill="${p.pod}"/>` +
        `<path d="M46 38 Q52 22 38 14 Q38 28 46 38Z" fill="${p.pod}"/>` +
        `<circle cx="22" cy="30" r="2.5" fill="${p.bean}"/><circle cx="25" cy="24" r="2.5" fill="${p.bean}"/>` +
        `<circle cx="43" cy="28" r="2.5" fill="${p.bean}"/><circle cx="41" cy="22" r="2.5" fill="${p.bean}"/>` +
        leaf(32, 30, 4, 8, 0, '#9ccc65'));
    },
    blades(p) {
      const b = (x, h, c) => `<path d="M${x} 60 Q${x - 3} ${60 - h / 2} ${x + 2} ${60 - h} Q${x + 3} ${60 - h / 2} ${x + 4} 60Z" fill="${c}"/>`;
      return svg(`<circle cx="32" cy="28" r="20" fill="${p.glow}" opacity=".4"/>` +
        b(20, 34, p.leaf) + b(26, 46, p.glow) + b(31, 52, p.leaf) + b(37, 42, p.glow) + b(42, 32, p.leaf) +
        `<circle cx="33" cy="9" r="2" fill="#fff"/><circle cx="18" cy="20" r="1.2" fill="#fff"/>`);
    },
    mushroom(p) {
      return svg(`<path d="M27 58 Q26 44 29 36 H35 Q38 44 37 58Z" fill="${p.stem}"/>` +
        `<path d="M10 38 Q12 14 32 12 Q52 14 54 38 Q32 44 10 38Z" fill="${p.cap}"/>` +
        `<circle cx="22" cy="26" r="3.5" fill="${p.dot}"/><circle cx="36" cy="20" r="3" fill="${p.dot}"/>` +
        `<circle cx="44" cy="31" r="2.5" fill="${p.dot}"/><circle cx="30" cy="33" r="2" fill="${p.dot}"/>` +
        `<circle cx="27" cy="48" r="1.4" fill="#4a4358"/><circle cx="37" cy="48" r="1.4" fill="#4a4358"/>`);
    },
    sprout(p) {
      return svg(`<path d="M32 60 V44" stroke="#6aa866" stroke-width="3" stroke-linecap="round"/>` +
        leaf(26, 42, 7, 3.5, -30, p.leaf) + leaf(38, 42, 7, 3.5, 30, p.leaf));
    },
    coin() {
      return svg(`<circle cx="32" cy="32" r="26" fill="#f0c04a"/><circle cx="32" cy="32" r="20" fill="#f7d774"/>` +
        `<text x="32" y="41" font-size="24" text-anchor="middle" fill="#c4902a" font-weight="bold" font-family="sans-serif">G</text>`);
    },
    /* ---------- 下部メニューのアイコン（ふんわりフラット） ----------
     * 色は CSS で決める（.ni-main 濃い色 / .ni-sub 淡い色 / .ni-line 線 / .ni-wline 白い線 / .ni-white 白 / .ni-spark きらきら）
     * 図鑑は codex1〜codex5 の中から選べる（assets/manifest.js の nav_codex の name を変える）
     */
    navIcon(p) {
      const D = {
        garden: `<ellipse class="ni-sub" cx="12" cy="20.2" rx="7" ry="1.9"/><path class="ni-line" d="M12 20 V11.5"/>
          <path class="ni-main" d="M12 14 C7 14 3.6 11 3.6 6.4 C8.6 6.4 12 9.4 12 14Z"/><path class="ni-main" d="M12 11.6 C12 6.6 15.2 3.4 20.4 3.4 C20.4 8.4 17.2 11.6 12 11.6Z"/>`,
        lab: `<path class="ni-sub ni-line" d="M10.4 3.4 V9.2 L5 17.6 A2.2 2.2 0 0 0 6.9 21 H17.1 A2.2 2.2 0 0 0 19 17.6 L13.6 9.2 V3.4"/><path class="ni-line" d="M9.4 3.3 H14.6"/>
          <path class="ni-main" d="M7.6 14 H16.4 L18.6 17.7 A1.7 1.7 0 0 1 17.1 20.3 H6.9 A1.7 1.7 0 0 1 5.4 17.7Z"/><circle class="ni-white" cx="10.6" cy="17.4" r="1"/><circle class="ni-white" cx="13.6" cy="15.9" r=".75"/>`,
        // 図鑑1：開いた本と星
        codex1: `<path class="ni-main" d="M3.4 5.4 A2 2 0 0 1 5.4 3.4 H10 A2 2 0 0 1 12 5.2 A2 2 0 0 1 14 3.4 H18.6 A2 2 0 0 1 20.6 5.4 V18 H14.2 A2.2 2.2 0 0 0 12 20.4 A2.2 2.2 0 0 0 9.8 18 H3.4Z"/>
          <path class="ni-wline" d="M12 5.6 V19.2"/><path class="ni-white" d="M16.3 7.3 l.75 1.55 1.7 .2 -1.25 1.15 .33 1.7 -1.53 -.85 -1.52 .85 .33 -1.7 -1.25 -1.15 1.7 -.2Z"/>`,
        // 図鑑2：表紙にポーションの瓶がある本
        codex2: `<path class="ni-sub" d="M6 17.6 H19.6 V21 H6.8 A1.7 1.7 0 0 1 6 17.6Z"/><rect class="ni-main" x="4.4" y="2.8" width="15.2" height="16" rx="2.2"/>
          <path class="ni-wline" d="M7.4 3.4 V18.2"/><path class="ni-white" d="M12.6 6.6 h2.6 v1.7 l1.9 2.7 a2 2 0 0 1 -1.65 3.2 h-3.1 a2 2 0 0 1 -1.65 -3.2 l1.9 -2.7Z"/>`,
        // 図鑑3：しおりのリボンが付いた本
        codex3: `<path class="ni-main" d="M3.4 5.4 A2 2 0 0 1 5.4 3.4 H10 A2 2 0 0 1 12 5.2 A2 2 0 0 1 14 3.4 H18.6 A2 2 0 0 1 20.6 5.4 V18 H14.2 A2.2 2.2 0 0 0 12 20.4 A2.2 2.2 0 0 0 9.8 18 H3.4Z"/>
          <path class="ni-wline" d="M12 5.6 V19.2"/><path class="ni-spark" d="M15 2.4 H18.4 V12.4 L16.7 10.8 L15 12.4Z"/>
          <path class="ni-wline" d="M5.8 8 H9.4 M5.8 11 H9.4 M5.8 14 H8.2"/>`,
        // 図鑑4：本と虫めがね
        codex4: `<path class="ni-sub" d="M5 17.6 H15.6 V21 H5.8 A1.7 1.7 0 0 1 5 17.6Z"/><rect class="ni-main" x="3.4" y="2.8" width="12.6" height="16" rx="2.2"/>
          <path class="ni-wline" d="M6.4 6.8 H12.6 M6.4 9.8 H11"/><path class="ni-line" d="M19.4 18.6 L21.6 20.8"/><circle class="ni-lens" cx="16.4" cy="15.6" r="3.9"/>`,
        // 図鑑5：本の上に瓶
        codex5: `<rect class="ni-main" x="2.8" y="15.2" width="18.4" height="5.6" rx="1.8"/><path class="ni-wline" d="M5.6 18 H18.4"/>
          <path class="ni-sub ni-line" d="M10.6 3.2 h2.8 v2.6 l2.8 3.6 a2.6 2.6 0 0 1 -2.05 4.2 h-4.3 a2.6 2.6 0 0 1 -2.05 -4.2 l2.8 -3.6Z"/>
          <path class="ni-main" d="M8.2 10.4 H15.8 L16.2 11 a2.2 2.2 0 0 1 -1.75 2.4 h-4.9 a2.2 2.2 0 0 1 -1.75 -2.4Z"/><path class="ni-line" d="M10 3.2 H14"/>`,
        shop: `<path class="ni-main" d="M5 10.6 V20.4 H19 V10.6"/><path class="ni-sub" d="M3.2 9.2 L5 4 H19 L20.8 9.2 A2.6 2.6 0 0 1 15.6 9.2 A2.6 2.6 0 0 1 10.4 9.2 A2.6 2.6 0 0 1 5.2 9.2 A2.6 2.6 0 0 1 3.2 9.2Z"/>
          <path class="ni-white" d="M10.2 20.4 V15.6 A1.8 1.8 0 0 1 13.8 15.6 V20.4Z"/>`,
        upgrade: `<path class="ni-main" d="M11 3.4 L18 10.6 H14 V20.4 H8 V10.6 H4Z"/>
          <path class="ni-spark s1" d="M19.4 2.6 l.8 1.8 1.9 .5 -1.9 .6 -.8 1.8 -.8 -1.8 -1.9 -.6 1.9 -.5Z"/>
          <path class="ni-spark s2" d="M19.2 13.6 l.6 1.3 1.4 .4 -1.4 .4 -.6 1.3 -.6 -1.3 -1.4 -.4 1.4 -.4Z"/><circle class="ni-spark s3" cx="3.4" cy="15.6" r="1.1"/>`,
      };
      const FIT = { garden: 'translate(0 -0.7)', shop: 'translate(12 12.2) scale(1.1) translate(-12 -12.2)', upgrade: 'translate(0 0.6)' };
      const body = FIT[p.name] ? `<g transform="${FIT[p.name]}">${D[p.name]}</g>` : (D[p.name] || '');
      return svg(body, '0 0 24 24', 'nav-icon');
    },

    /* ---------- 薬草園の景色 ---------- */
    /** 畑の上の空と丘（tod：morning / day / evening / night） */
    gardenSky(p) {
      const T = {
        morning: ['#bfe3f7', '#ffe6cf', '#cfe6b4', '#b9d99c'],
        day:     ['#a9dcf5', '#e9f7fc', '#c9e6ae', '#b0d692'],
        evening: ['#9d86cf', '#fbc39a', '#c9b09c', '#b29a94'],
        night:   ['#262250', '#4a4483', '#3d4270', '#33385f'],
      }[p.tod || 'day'];
      const id = nextId('gs');
      let s = `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${T[0]}"/><stop offset="1" stop-color="${T[1]}"/></linearGradient></defs>
        <rect width="320" height="80" fill="url(#${id})"/>`;
      if (p.tod === 'night') {
        s += [[20, 10], [58, 26], [96, 8], [140, 20], [190, 12], [232, 28], [300, 14], [118, 34], [270, 40]].map(([x, y], i) =>
          `<circle class="g-twinkle" style="animation-delay:${i * .4}s" cx="${x}" cy="${y}" r="${i % 3 ? 1 : 1.5}" fill="#fff8d6"/>`).join('');
        s += `<path d="M276 10 A11 11 0 0 0 276 32 A6 11 0 0 1 276 10Z" fill="#fff6cf"/>`;
      } else if (p.tod === 'evening') {
        s += `<circle cx="250" cy="52" r="16" fill="#ffd08a" opacity=".9"/><ellipse cx="70" cy="18" rx="24" ry="5" fill="#ffd0c0" opacity=".8"/>`;
      } else {
        const sun = p.tod === 'morning' ? [52, 34, '#ffe2a8'] : [276, 20, '#fff3c4'];
        s += `<circle cx="${sun[0]}" cy="${sun[1]}" r="11" fill="${sun[2]}"/>
          <ellipse class="g-cloud" cx="${p.tod === 'morning' ? 200 : 80}" cy="20" rx="22" ry="6" fill="#fff" opacity=".9"/>
          <ellipse class="g-cloud slow" cx="${p.tod === 'morning' ? 120 : 190}" cy="12" rx="16" ry="5" fill="#fff" opacity=".85"/>`;
      }
      const tree = (x, y, r) => `<rect x="${x - 1.5}" y="${y}" width="3" height="${80 - y}" fill="#8b6a4e" opacity=".7"/>
        <circle cx="${x}" cy="${y - r * .3}" r="${r}" fill="${T[3]}"/><circle cx="${x - r * .6}" cy="${y + r * .2}" r="${r * .7}" fill="${T[3]}"/>
        <circle cx="${x + r * .3}" cy="${y - r * .8}" r="1.6" fill="${p.tod === 'night' ? '#c9b3ff' : '#f8b8d0'}"/>`;
      s += `<path d="M0 56 Q60 38 120 54 T240 50 T320 52 V80 H0Z" fill="${T[3]}"/>
        <path d="M0 64 Q50 54 110 62 T220 60 T320 62 V80 H0Z" fill="${T[2]}"/>` + tree(26, 52, 11) + tree(296, 50, 13) + tree(46, 60, 7);
      return svg(s, '0 0 320 80', 'garden-sky-art');
    },
    /** 遊びに来る蝶々 */
    butterfly() {
      return svg(`<g class="bf-wings"><path d="M32 30 C18 8 4 14 8 28 C10 36 24 36 32 32Z" fill="#f8a8cf" stroke="#5b5470" stroke-width="2"/>
        <path d="M32 30 C46 8 60 14 56 28 C54 36 40 36 32 32Z" fill="#f8a8cf" stroke="#5b5470" stroke-width="2"/>
        <path d="M32 34 C22 38 14 48 22 52 C28 54 31 44 32 36Z" fill="#c9b3ff" stroke="#5b5470" stroke-width="2"/>
        <path d="M32 34 C42 38 50 48 42 52 C36 54 33 44 32 36Z" fill="#c9b3ff" stroke="#5b5470" stroke-width="2"/>
        <circle cx="18" cy="24" r="3" fill="#fff" opacity=".8"/><circle cx="46" cy="24" r="3" fill="#fff" opacity=".8"/></g>
        <rect x="30" y="22" width="4" height="26" rx="2" fill="#5b5470"/><path d="M31 23 q-4 -8 -8 -10 M33 23 q4 -8 8 -10" stroke="#5b5470" stroke-width="1.5" fill="none"/>`);
    },
    /** 遊びに来るてんとう虫 */
    ladybug() {
      return svg(`<ellipse cx="32" cy="38" rx="20" ry="17" fill="#ef6f6c" stroke="#5b5470" stroke-width="2.5"/>
        <path d="M32 22 V55" stroke="#5b5470" stroke-width="2"/>
        <circle cx="22" cy="34" r="3.6" fill="#4a4358"/><circle cx="42" cy="34" r="3.6" fill="#4a4358"/><circle cx="24" cy="46" r="3" fill="#4a4358"/><circle cx="40" cy="46" r="3" fill="#4a4358"/>
        <path d="M18 26 Q32 10 46 26 Z" fill="#4a4358"/><circle cx="27" cy="20" r="2" fill="#fff"/><circle cx="37" cy="20" r="2" fill="#fff"/>
        <path d="M26 14 q-3 -6 -7 -6 M38 14 q3 -6 7 -6" stroke="#5b5470" stroke-width="1.6" fill="none"/>
        <ellipse cx="26" cy="30" rx="4" ry="2" fill="#fff" opacity=".5"/>`);
    },
    /* ---------- 強化の一覧のアイコン（紫の縁取り＋パステル、48×48） ---------- */
    upgradeIcon(p) {
      const K = '#5b5470', W = 2.6;
      const st = (fill, w = W) => `fill="${fill}" stroke="${K}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
      const sprout = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 0 V-6" stroke="${K}" stroke-width="2.2" stroke-linecap="round"/>
        <path d="M0 -4 C-5 -4 -7 -7 -7 -10 C-3 -10 0 -8 0 -4Z" ${st('#8fd6a8', 2)}/><path d="M0 -5 C0 -9 3 -12 7 -12 C7 -8 4 -5 0 -5Z" ${st('#6cc38a', 2)}/></g>`;
      const spark = (x, y, r, c = '#ffd75e') => `<path d="M${x} ${y - r} Q${x} ${y} ${x + r} ${y} Q${x} ${y} ${x} ${y + r} Q${x} ${y} ${x - r} ${y} Q${x} ${y} ${x} ${y - r}Z" fill="${c}"/>`;
      const bottle = (x, y, c, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-2.6 -11 V-6.4 A6.4 6.4 0 1 0 2.6 -6.4 V-11Z" ${st('#fff', 2.2)}/>
        <path d="M-5.4 -1.4 Q-2.6 -3 0 -1.4 T5.4 -1.4 A5.6 5.6 0 0 1 -5.4 -1.4Z" fill="${c}"/><path d="M-2.6 -11 V-6.4 A6.4 6.4 0 1 0 2.6 -6.4 V-11Z" fill="none" stroke="${K}" stroke-width="2.2" stroke-linejoin="round"/>
        <rect x="-3.8" y="-14.4" width="7.6" height="4" rx="1.4" ${st('#d39a6a', 1.8)}/></g>`;
      const D = {
        // 畑の拡張：土の畑に芽、右上に「広がる」矢印
        field_expand: `<rect x="5" y="20" width="30" height="22" rx="6" ${st('#c9946a')}/><path d="M11 31 H29 M11 36.5 H29" stroke="#a97650" stroke-width="2" stroke-linecap="round"/>
          ${sprout(14, 29, .9)}${sprout(26, 29, .9)}
          <path d="M33 15 L42 6 M35 6 H42 V13" fill="none" stroke="#6cc38a" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>`,
        // 採取速度：ストップウォッチ
        gather_speed: `<rect x="20.5" y="4" width="7" height="5" rx="1.6" ${st('#b48be8')}/><path d="M35 10 L38 7" stroke="${K}" stroke-width="${W}" stroke-linecap="round"/>
          <circle cx="24" cy="27" r="16" ${st('#fff')}/><circle cx="24" cy="27" r="11.5" fill="#e8dcfb"/>
          <path d="M24 27 V18.5 M24 27 L30 30.5" stroke="${K}" stroke-width="2.6" stroke-linecap="round"/><circle cx="24" cy="27" r="2" fill="${K}"/>
          <path d="M3 22 H9 M2 28 H8 M4 34 H9" stroke="#b48be8" stroke-width="2.2" stroke-linecap="round"/>`,
        // 採取量：薬草がいっぱいのかご
        gather_amount: `<path d="M14 21 C14 10 34 10 34 21" fill="none" stroke="${K}" stroke-width="${W}" stroke-linecap="round"/>
          <path d="M12 16 C8 10 10 6 14 5 C17 8 16 13 12 16Z" ${st('#8fd6a8', 2.2)}/><path d="M21 15 C19 8 22 4 26 4 C27 9 25 13 21 15Z" ${st('#6cc38a', 2.2)}/>
          <path d="M30 17 C32 11 36 9 40 10 C39 15 35 18 30 17Z" ${st('#8fd6a8', 2.2)}/><circle cx="34" cy="13" r="3" ${st('#f59bc0', 2)}/>
          <path d="M6 20 H42 L38 41 A3 3 0 0 1 35 43.4 H13 A3 3 0 0 1 10 41Z" ${st('#e9c08f')}/>
          <path d="M9 27 H39 M10.5 34 H37.5 M18 21 L19 43 M30 21 L29 43" stroke="#c9946a" stroke-width="2" stroke-linecap="round"/>`,
        // 自動採取：お手伝い妖精
        auto_gather: `<path d="M22 22 C14 10 4 14 6 22 C7 28 16 28 22 25Z" ${st('#d6ecfa', 2.2)}/><path d="M26 22 C34 10 44 14 42 22 C41 28 32 28 26 25Z" ${st('#d6ecfa', 2.2)}/>
          <path d="M17 42 C17 32 20 27 24 27 C28 27 31 32 31 42Z" ${st('#c9b3ff')}/>
          <circle cx="24" cy="19" r="7.5" ${st('#ffe8d6')}/><path d="M16.8 17 C17 10 31 10 31.2 17 C28 14 20 14 16.8 17Z" ${st('#f3c97a', 2)}/>
          <circle cx="21.4" cy="20" r="1.2" fill="${K}"/><circle cx="26.6" cy="20" r="1.2" fill="${K}"/><path d="M22.4 23 Q24 24.4 25.6 23" fill="none" stroke="${K}" stroke-width="1.4" stroke-linecap="round"/>
          <path d="M33 34 L40 27" stroke="${K}" stroke-width="2.2" stroke-linecap="round"/>${spark(41.5, 25.5, 4.5)}${spark(8, 36, 2.6, '#f59bc0')}`,
        // レア素材出現率：きらきら光る星の花
        rare_rate: `${spark(14, 13, 7, '#ffd75e')}${spark(39, 37, 4.5, '#f59bc0')}
          <path d="M28 8 L31.3 16.6 L40.4 17.1 L33.3 22.9 L35.7 31.8 L28 26.8 L20.3 31.8 L22.7 22.9 L15.6 17.1 L24.7 16.6Z" transform="translate(-2 6)" ${st('#fff3a6')}/>
          <circle cx="26" cy="26" r="3.2" fill="#ffc94a"/><path d="M8 40 H18" stroke="#c9b3ff" stroke-width="2.2" stroke-linecap="round"/>`,
        // 採取範囲：となりのマスもいっしょに
        gather_area: `<rect x="4" y="10" width="17" height="17" rx="4" ${st('#c9946a')}/><rect x="27" y="10" width="17" height="17" rx="4" ${st('#c9946a')}/>
          <rect x="4" y="31" width="17" height="13" rx="4" ${st('#e9dccb')}/><rect x="27" y="31" width="17" height="13" rx="4" ${st('#e9dccb')}/>
          ${sprout(12.5, 23, .85)}${sprout(35.5, 23, .85)}
          <path d="M18 6 Q24 1 30 6" fill="none" stroke="#6cc38a" stroke-width="2.6" stroke-linecap="round"/><path d="M27.6 3.4 L30 6 L26.8 6.8" fill="none" stroke="#6cc38a" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`,
        // 調合釜：ぐつぐつの大鍋
        cauldron: `<circle cx="19" cy="12" r="3.4" ${st('#b8f0c8', 2)}/><circle cx="28" cy="7" r="4.4" ${st('#b8f0c8', 2)}/><circle cx="34" cy="14" r="2.4" ${st('#b8f0c8', 1.8)}/>
          <path d="M7 21 Q5 40 24 41.5 Q43 40 41 21Z" ${st('#7a7097')}/><path d="M12 26 Q12 34 18 37" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".3"/>
          <ellipse cx="24" cy="21" rx="19" ry="5.4" ${st('#8a80a8')}/><ellipse cx="24" cy="21" rx="15" ry="3.4" fill="#8fe0a8"/>
          <path d="M14 41 L12 45 M34 41 L36 45" stroke="${K}" stroke-width="${W}" stroke-linecap="round"/>`,
        // 商品棚：木の棚に瓶
        shelf: `<rect x="4" y="5" width="40" height="38" rx="5" ${st('#e2b07f')}/><rect x="8.5" y="9" width="31" height="30" rx="2.5" fill="#f6dfc4"/>
          <path d="M8.5 24 H39.5" stroke="${K}" stroke-width="${W}" stroke-linecap="round"/>
          ${bottle(16, 22, '#f59bc0', .78)}${bottle(31, 22, '#8fd6ee', .78)}${bottle(16, 37.6, '#ffd36b', .78)}${bottle(31, 37.6, '#b48be8', .78)}`,
        // 店舗拡張：屋根付きのお店と上向き矢印
        shop_expand: `<path d="M7 22 V42 H35 V22" ${st('#fff7ea')}/><path d="M4 21 L8 11 H34 L38 21 A3.4 3.4 0 0 1 31.2 21 A3.4 3.4 0 0 1 24.4 21 A3.4 3.4 0 0 1 17.6 21 A3.4 3.4 0 0 1 10.8 21 A3.4 3.4 0 0 1 4 21Z" ${st('#f8b8d0')}/>
          <path d="M13 11 L12 21 M21 11 V21 M29 11 L30 21" stroke="#fff" stroke-width="2" opacity=".7"/>
          <path d="M17 42 V33 A4 4 0 0 1 25 33 V42" ${st('#e2b07f')}/><rect x="9.5" y="26" width="6" height="6" rx="1.4" ${st('#d6ecfa', 2)}/>
          <circle cx="38" cy="10" r="7.5" fill="#6cc38a"/><path d="M38 14 V6.5 M34.6 9.6 L38 6.2 L41.4 9.6" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>`,
      };
      return svg(D[p.name] || '', '0 0 48 48', 'up-icon-art');
    },
    /* ---------- 思い出の称号のメダル（48×48）----------
     *  name … 絵柄（下の G のキー）/ color … メダルの地の色 / locked … まだ手に入れていない（灰色の「？」）
     *  絵柄は、ゲームの絵（大鍋・コイン・瓶・畑・お店）と、メダル用に描いた小さな絵を組み合わせる
     */
    memoryBadge(p) {
      const K = '#5b5470';
      const st = (fill, w = 2) => `fill="${fill}" stroke="${K}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
      const nest = (markup, x, y, w, h) => markup.replace('<svg ', `<svg x="${x}" y="${y}" width="${w}" height="${h}" `);
      const spark = (x, y, r, c) => `<path d="M${x} ${y - r} Q${x} ${y} ${x + r} ${y} Q${x} ${y} ${x} ${y + r} Q${x} ${y} ${x - r} ${y} Q${x} ${y} ${x} ${y - r}Z" fill="${c || '#ffd75e'}"/>`;
      const stars = n => Array.from({ length: n }, (_, i) => spark(24 + (i - (n - 1) / 2) * 6.5, 36.5, 2.8, '#ffc93a')).join('');
      const potion = (bottle, color, texture, rarity) => renderPotion({ bottle, color, texture: texture || 'smooth', rarity: rarity || 'N' });
      const gem = c => `<path d="M17 18 L21 13 H27 L31 18 L24 30Z" ${st(c)}/><path d="M17 18 H31 M21 13 L24 18 L27 13 M24 18 V30" fill="none" stroke="${K}" stroke-width="1.2" opacity=".6"/>`;
      const G = {
        cauldron: () => nest(render('up_cauldron'), 11, 9, 26, 26),
        coin: () => nest(render('coin'), 12, 10, 24, 24),
        coins: () => nest(render('coin'), 9, 15, 18, 18) + nest(render('coin'), 21, 15, 18, 18) + nest(render('coin'), 15, 8, 18, 18),
        treasure: () => nest(render('coin'), 7, 19, 17, 17) + nest(render('coin'), 24, 19, 17, 17) + nest(render('coin'), 15.5, 22, 17, 17)
          + `<path d="M16 13 L20 8 H28 L32 13 L24 24Z" ${st('#9fd7ff')}/><path d="M16 13 H32 M20 8 L24 13 L28 8 M24 13 V24" fill="none" stroke="${K}" stroke-width="1.1" opacity=".6"/>${spark(36, 9, 2.8, '#fff')}`,
        bubble: () => `<path d="M12 13 H36 A3 3 0 0 1 39 16 V28 A3 3 0 0 1 36 31 H22 L16 36 V31 H12 A3 3 0 0 1 9 28 V16 A3 3 0 0 1 12 13Z" ${st('#fff')}/>${spark(24, 22, 5, '#ffc93a')}`,
        bubbles: () => `<path d="M8 11 H27 A3 3 0 0 1 30 14 V22 A3 3 0 0 1 27 25 H15 L11 29 V25 H8 A3 3 0 0 1 5 22 V14 A3 3 0 0 1 8 11Z" ${st('#ffe1ea')}/>
          <path d="M21 20 H40 A3 3 0 0 1 43 23 V31 A3 3 0 0 1 40 34 H37 V38 L33 34 H21 A3 3 0 0 1 18 31 V23 A3 3 0 0 1 21 20Z" ${st('#fff')}/>${spark(30.5, 27, 3.5, '#ffc93a')}`,
        scroll: () => `<path d="M14 12 H32 V34 A3 3 0 0 1 29 37 H14Z" ${st('#fff6dc')}/><path d="M14 12 A3 3 0 0 0 14 18 H17 V12" ${st('#f0dca8')}/>
          <path d="M29 37 A3 3 0 0 0 32 34 V31 H35 V34 A3 3 0 0 1 32 37Z" ${st('#f0dca8')}/><path d="M19 20 H28 M19 25 H28 M19 30 H25" stroke="#c9a96e" stroke-width="1.8" stroke-linecap="round"/>`,
        scrollHeart: () => G.scroll() + `<path d="M33 9 c-2 -3 -7 -1 -5 3 l5 4 l5 -4 c2 -4 -3 -6 -5 -3z" ${st('#f59bc0', 1.6)}/>`,
        gemSR: () => gem('#c9b3ff') + `<text x="24" y="39" font-size="8" text-anchor="middle" font-weight="bold" fill="#8e63d4" font-family="sans-serif">SR</text>`,
        gemSSR: () => gem('#ffd08a') + `<text x="24" y="39" font-size="7.5" text-anchor="middle" font-weight="bold" fill="#d08a1e" font-family="sans-serif">SSR</text>`,
        gemUR: () => { const id = nextId('ur'); return `<defs><linearGradient id="${id}" x1="0" x2="1"><stop offset="0" stop-color="#ff9cc8"/><stop offset=".5" stop-color="#9fd7ff"/><stop offset="1" stop-color="#c9b3ff"/></linearGradient></defs>`
          + gem(`url(#${id})`) + `<text x="24" y="39" font-size="8" text-anchor="middle" font-weight="bold" fill="#e0609c" font-family="sans-serif">UR</text>`; },
        heart: () => nest(potion('heart', 'pink', 'fizzy', 'R'), 12, 8, 24, 27),
        star: () => nest(potion('star', 'yellow', 'sparkle', 'R'), 11, 8, 26, 28),
        laugh: () => `<circle cx="24" cy="23" r="12" ${st('#ffe08a')}/><path d="M18 20 q2 -3 4 0 M26 20 q2 -3 4 0" fill="none" stroke="${K}" stroke-width="1.8" stroke-linecap="round"/>
          <path d="M17.5 25 Q24 33 30.5 25Z" ${st('#ff8a9a', 1.6)}/><path d="M12 19 l-3 -2 M36 19 l3 -2" stroke="#8fd6ee" stroke-width="2" stroke-linecap="round"/>`,
        dizzy: () => `<circle cx="24" cy="23" r="12" ${st('#d6f0d0')}/><path d="M17 20 a2.5 2.5 0 1 1 3 2.5 M27 20 a2.5 2.5 0 1 1 3 2.5" fill="none" stroke="${K}" stroke-width="1.6" stroke-linecap="round"/>
          <path d="M19 28 q2.5 -2 5 0 t5 0" fill="none" stroke="${K}" stroke-width="1.8" stroke-linecap="round"/>${spark(35, 12, 3, '#c9b3ff')}${spark(13, 12, 2.4, '#c9b3ff')}`,
        flask: n => () => nest(potion('round', 'green', 'fizzy', 'N'), 13, 6, 22, 25) + stars(n),
        book: () => `<path d="M14 9 H34 V35 H17 A3 3 0 0 1 14 32Z" ${st('#f8b8d0')}/><path d="M17 35 V38 H34 V35" ${st('#fff')}/>
          <path d="M22.5 15 h3 v2.4 l2.5 3.4 a2 2 0 0 1 -1.7 3 h-4.6 a2 2 0 0 1 -1.7 -3 l2.5 -3.4Z" fill="#fff"/><path d="M17 9 V35" stroke="${K}" stroke-width="1.4" opacity=".4"/>`,
        palette: () => `<path d="M24 10 C35 10 40 17 39 23 C38 29 31 27 30 31 C29 36 26 38 22 37 C13 36 8 30 9 22 C10 15 16 10 24 10Z" ${st('#fff3dc')}/>
          <circle cx="17" cy="19" r="2.8" fill="#f59bc0"/><circle cx="24" cy="15.5" r="2.8" fill="#ffc93a"/><circle cx="31" cy="18" r="2.8" fill="#8fd6ee"/><circle cx="15.5" cy="27" r="2.8" fill="#9fd9b5"/><circle cx="23" cy="30" r="2.8" fill="#c9b3ff"/>`,
        glass: n => () => `<circle cx="21" cy="21" r="9" ${st('#e8f6ff', 2.4)}/><path d="M27.5 27.5 L35 35" stroke="${K}" stroke-width="3.6" stroke-linecap="round"/>
          <path d="M16.5 18 a5 5 0 0 1 4 -3" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/>${spark(35, 11, 3.6)}${n > 1 ? spark(12, 34, 3, '#f59bc0') + spark(39, 21, 2.4) : ''}`,
        field: () => nest(render('up_field_expand'), 10, 9, 28, 28),
        shop: () => nest(render('up_shop_expand'), 10, 8, 28, 28),
        moon: () => `<path d="M27 9 A13 13 0 1 0 37 30 A10 10 0 1 1 27 9Z" ${st('#fff3a6')}/>${spark(14, 13, 3.4, '#fff')}${spark(36, 13, 2.6, '#fff')}<circle cx="31" cy="21" r="1.2" fill="#fff"/>`,
      };
      G.flask1 = G.flask(1); G.flask2 = G.flask(2); G.flask3 = G.flask(3); G.glass1 = G.glass(1); G.glass2 = G.glass(2);
      if (p.plain) return svg(G[p.name] ? G[p.name]() : '', '4 4 40 40', 'badge-plain');   // メダルの枠なしで絵柄だけ
      const bg = p.locked ? '#e6e0ec' : (p.color || '#fff3d6');
      const ring = p.locked ? '#cfc8da' : '#f3c64e';
      const glyph = p.locked
        ? `<text x="24" y="30.5" font-size="17" text-anchor="middle" font-weight="bold" fill="#b3acc2" font-family="sans-serif">?</text>`
        : (G[p.name] ? G[p.name]() : '');
      const ribbon = p.locked ? '' : `<path d="M15 40 L12 47 L17 45 L19 48 L21 41Z" fill="#f59bc0" stroke="${K}" stroke-width="1.4" stroke-linejoin="round"/>
        <path d="M33 40 L36 47 L31 45 L29 48 L27 41Z" fill="#8fd6ee" stroke="${K}" stroke-width="1.4" stroke-linejoin="round"/>`;
      return svg(`${ribbon}<circle cx="24" cy="23" r="21" fill="${ring}" stroke="${K}" stroke-width="2"/>
        <circle cx="24" cy="23" r="17.2" fill="${bg}"/><circle cx="24" cy="23" r="17.2" fill="none" stroke="#fff" stroke-width="1.2" opacity=".7"/>
        <g>${glyph}</g>`, '0 0 48 48', 'memory-badge' + (p.locked ? ' locked' : ''));
    },
    cauldron() {
      return svg(`<ellipse cx="60" cy="40" rx="42" ry="10" fill="#4a4358"/>` +
        `<path d="M18 40 Q14 86 40 92 H80 Q106 86 102 40Z" fill="#5b5470"/>` +
        `<ellipse cx="60" cy="40" rx="38" ry="8" class="cauldron-liquid" fill="#8fd6ee"/>` +
        `<path d="M30 92 L24 104 M90 92 L96 104" stroke="#4a4358" stroke-width="6" stroke-linecap="round"/>` +
        `<ellipse cx="40" cy="58" rx="6" ry="10" fill="#fff" opacity=".12"/>`, '0 0 120 110', 'cauldron-art');
    },
  };

  /* ---------- 瓶（ポーション） ---------- */
  // 瓶は「首から胴体まで1本の輪郭」で描く（つなぎ目に線やすき間ができないように）
  //  d: 輪郭（クリップと線の両方に使う）/ top: 液面の高さ / cork: [x, y, 幅, 高さ] / hl: 光の反射 [x, y, 横半径, 縦半径]
  const SHAPES = {
    round: { // 丸フラスコ：細い首 → まるい胴
      d: 'M27.5 9 H36.5 V24.6 A18 18 0 1 1 27.5 24.6 Z',
      top: 31, cork: [25.5, 3, 13, 8], hl: [22.5, 40, 2.6, 6.5] },
    tube: { // 試験管：ふちが少し広がった細長い管
      d: 'M23 9 H41 V12 H39.5 V50 A7.5 7.5 0 0 1 24.5 50 V12 H23 Z',
      top: 24, cork: [22, 3, 20, 9.5], hl: [28.5, 34, 1.8, 9] },
    cone: { // 三角フラスコ
      d: 'M27.5 9 H36.5 V24 L50.5 51.5 Q53.5 58 46.5 58 H17.5 Q10.5 58 13.5 51.5 L27.5 24 Z',
      top: 33, cork: [25.5, 3, 13, 8], hl: [23, 46, 2.2, 6] },
    pot: { // ずんぐり壺：太い首からなだらかな肩でつながる
      d: 'M24.5 9 H39.5 V17 C39.5 20 54 22.5 54 40 C54 53 44.5 59 32 59 C19.5 59 10 53 10 40 C10 22.5 24.5 20 24.5 17 Z',
      top: 29, cork: [22.5, 3, 19, 8], hl: [18, 38, 3, 7] },
    drop: { // しずく瓶：首からすっと広がるしずく形
      d: 'M28.5 9 H35.5 V15 C39 22 50 30 50 41.5 A18 18 0 0 1 14 41.5 C14 30 25 22 28.5 15 Z',
      top: 30, cork: [26.5, 3, 11, 8], hl: [22, 40, 2.5, 6.5] },
    gourd: { // ひょうたん瓶：上下の玉がくびれでつながる
      d: 'M29 9 H35 V14 C42 15 44.5 26 38.5 31 C49.5 33.5 51 58 32 59.5 C13 58 14.5 33.5 25.5 31 C19.5 26 22 15 29 14 Z',
      top: 22, cork: [27, 3, 10, 8], hl: [20.5, 46, 2.6, 6.5] },
    heart: { // ハート瓶：首がハートのくぼみにつながる
      d: 'M28 9 H36 V21 C39.5 17.5 50 17 52.5 26.5 C55 38 43.5 48.5 32 58 C20.5 48.5 9 38 11.5 26.5 C14 17 24.5 17.5 28 21 Z',
      top: 30, cork: [26, 3, 12, 8], hl: [17.5, 31, 2.4, 5] },
    star: { // 星形瓶：星の上の角が首になる
      d: 'M28.5 9 H35.5 V22 L38 31.5 H52.5 L40.8 40.5 L45 55.5 L32 46.5 L19 55.5 L23.2 40.5 L11.5 31.5 H26 L28.5 22 Z',
      top: 31, cork: [26.5, 3, 11, 8], hl: [27, 40, 1.8, 4.5] },
  };

  /**
   * 液体の塗り（data/looks.js の liquid に従う）
   * @returns {{defs, fill, over}} over は二層の上側・星などの上乗せ
   */
  function liquidPaint(colorId, id, top) {
    const c = PS.core.lookup.color[colorId];
    if (!c) return { defs: '', fill: '#8fd6ee', over: '' };
    const lq = c.liquid;
    if (!lq) return { defs: '', fill: c.hex, over: '' };
    if (lq.type === 'layer') {
      const [up, down] = lq.colors;
      const mid = top + (60 - top) * 0.46;
      const wave = `M0 ${top} H64 V${mid} q-4 2.5 -8 0 t-8 0 t-8 0 t-8 0 t-8 0 t-8 0 t-8 0 t-8 0 Z`;
      return { defs: '', fill: down, over: `<path d="${wave}" fill="${up}"/>` };
    }
    // グラデーション
    const n = lq.colors.length;
    const stops = lq.colors.map((col, i) => `<stop offset="${n > 1 ? i / (n - 1) : 0}" stop-color="${col}"/>`).join('');
    const grad = lq.dir === 'diagonal'
      ? `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">${stops}</linearGradient>`
      : `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="0" y1="${top}" x2="0" y2="60">${stops}</linearGradient>`;
    const over = lq.sparkle
      ? `<g fill="#fff"><circle cx="24" cy="${top + 10}" r=".9"/><circle cx="36" cy="${top + 16}" r="1.2"/><circle cx="29" cy="${top + 22}" r=".8"/><circle cx="40" cy="${top + 8}" r=".7"/><circle cx="21" cy="${top + 18}" r=".7"/><path d="M33 ${top + 4} l.8 2 2 .8 -2 .8 -.8 2 -.8 -2 -2 -.8 2 -.8z"/></g>`
      : '';
    return { defs: grad, fill: `url(#${id})`, over };
  }

  /** 色見本など、HTML で使う背景（CSS） */
  function colorCss(colorId) {
    const c = PS.core.lookup.color[colorId];
    if (!c) return '#ccc';
    const lq = c.liquid;
    if (!lq) return c.hex;
    if (lq.type === 'layer') return `linear-gradient(180deg, ${lq.colors[0]} 50%, ${lq.colors[1]} 50%)`;
    return `linear-gradient(${lq.dir === 'diagonal' ? '135deg' : '180deg'}, ${lq.colors.join(', ')})`;
  }

  function fxLayer(fx, top) {
    switch (fx) {
      case 'bubbles': return `<g class="fx-bubbles" fill="#fff" opacity=".7"><circle cx="26" cy="50" r="1.8"/><circle cx="35" cy="54" r="1.4"/><circle cx="31" cy="46" r="1.1"/></g>`;
      case 'sparkles': return `<g fill="#fff"><circle cx="24" cy="44" r="1"/><circle cx="38" cy="40" r="1.3"/><circle cx="32" cy="52" r="0.9"/><circle cx="41" cy="50" r="1"/><circle cx="27" cy="36" r=".8"/></g>`;
      case 'foam': return `<g fill="#fff" opacity=".85"><circle cx="24" cy="${top}" r="4"/><circle cx="31" cy="${top - 1}" r="4.5"/><circle cx="38" cy="${top}" r="4"/></g>`;
      case 'layers': return `<rect x="0" y="${(top + 60) / 2}" width="64" height="40" fill="#000" opacity=".18"/>`;
      case 'swirl': return `<path d="M32 46 a3 3 0 1 1 3 -3 a6 6 0 1 1 -8 6 a9 9 0 1 1 14 -10" stroke="#fff" stroke-width="1.3" fill="none" opacity=".55"/>`;
      case 'glow': return `<circle cx="32" cy="44" r="10" fill="#fff" opacity=".35"/>`;
      default: return '';
    }
  }

  function outerFx(fx) {
    if (fx === 'steam') return `<g class="fx-steam" stroke="#fff" stroke-width="1.6" fill="none" opacity=".8" stroke-linecap="round"><path d="M26 4 q-3 -3 0 -6"/><path d="M38 4 q3 -3 0 -6"/></g>`;
    if (fx === 'mist') return `<g fill="#e6f4f8" opacity=".75"><ellipse cx="18" cy="56" rx="8" ry="3"/><ellipse cx="46" cy="57" rx="9" ry="3"/></g>`;
    return '';
  }

  /** ポーションの絵（生成データ g から） */
  function renderPotion(g, opts) {
    const L = PS.core.lookup;
    const bottle = L.bottle[g.bottle];
    const key = 'bottle_' + (bottle ? bottle.shape : 'round');
    const m = PS.assets.manifest.art[key];
    if (m && m.type === 'image') return `<img class="art" src="${m.src}" alt="">`;
    const sh = SHAPES[(m && m.params.shape) || 'round'] || SHAPES.round;
    const clip = nextId('clip'), grad = nextId('grad');
    const lq = liquidPaint(g.color, grad, sh.top);
    const tex = L.texture[g.texture];
    const rarity = g.rarity;
    const aura = (rarity === 'SSR' || rarity === 'UR')
      ? `<circle cx="32" cy="34" r="27" fill="${L.rarity[rarity].color}" fill-opacity=".22" class="fx-aura"/>` : '';
    const [cx, cy, cw, ch] = sh.cork;
    const [hx, hy, hrx, hry] = sh.hl;
    const inner =
      `<defs>${lq.defs}<clipPath id="${clip}"><path d="${sh.d}"/></clipPath></defs>` + aura +
      `<path d="${sh.d}" fill="#ffffff" fill-opacity=".6"/>` +
      `<g clip-path="url(#${clip})"><rect x="0" y="${sh.top}" width="64" height="40" fill="${lq.fill}"/>` + lq.over +
      `<rect x="0" y="${sh.top}" width="64" height="2.5" fill="#fff" opacity=".35"/>` +
      fxLayer(tex && tex.fx, sh.top) + `</g>` +
      `<path d="${sh.d}" fill="none" stroke="#5b5470" stroke-width="2" stroke-linejoin="round"/>` +
      `<ellipse cx="${hx}" cy="${hy}" rx="${hrx}" ry="${hry}" fill="#fff" opacity=".6"/>` +
      `<rect x="${cx}" y="${cy}" width="${cw}" height="${ch}" rx="2" fill="#c98b5a" stroke="#8a5a3a" stroke-width="1.2"/>` +
      `<rect x="${cx + 1.5}" y="${cy + 1.5}" width="${cw - 3}" height="1.6" rx=".8" fill="#e0aa7a"/>` +
      outerFx(tex && tex.fx);
    return svg(inner, '0 -4 64 68', 'potion-art ' + ((opts && opts.cls) || ''));
  }

  /**
   * キーから絵を返す
   * @param {string} key manifest のキー
   * @param {object} [dyn] その場で変わる情報（時間帯・飾るポーションなど）。params に上書きして描画関数へ渡す
   */
  function render(key, dyn) {
    const m = PS.assets.manifest.art[key];
    if (!m) return svg('<circle cx="32" cy="32" r="20" fill="#ddd"/>');
    if (m.type === 'image') return `<img class="art" src="${m.src}" alt="">`;
    const fn = drawers[m.draw];
    return fn ? fn(Object.assign({}, m.params || {}, dyn || {})) : svg('');
  }

  PS.assets.art = { render, renderPotion, colorCss, svg, nextId };
})(window.PS);
