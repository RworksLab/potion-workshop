/*
 * BGM（曲をその場で合成して流す）
 *  ・曲は SONGS に「テンポ・コード進行・1小節ぶんの演奏（bar）」として書く。メロディは毎回少しずつ変わる
 *  ・曲を増やすときは SONGS に1曲足し、設定画面の選択肢（list）に名前が出る
 *  ・音声ファイルに差し替えるときは assets/manifest.js の bgm を { type:'file', src:'…' } にする
 *  ・PS.assets.bgm.setEnabled(true/false) / setVolume(0〜1) / setSong('auto' | 'picnic' …)
 *  ・'auto' は時間帯で曲を切り替える（AUTO：朝・昼・夕方は「ピクニック」、夜は「のどかな草原」）
 *  ・アプリを開いたらすぐに鳴らす（autostart）。ブラウザが音を止めている場合は、最初のタップで鳴り始める
 */
(function (PS) {
  'use strict';

  const NOTE = n => 440 * Math.pow(2, (n - 69) / 12);   // MIDI 番号 → 周波数
  const R = () => Math.random();
  let ctx = null, master = null, bus = null, delay = null;

  /* ---------- 楽器 ---------- */
  function env(g, t, a, peak, d) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
  }
  const I = {
    /** やわらかいパッド */
    pad(n, t, len, gain = 0.035) {
      const o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      o.type = 'triangle'; o.frequency.value = NOTE(n); o.detune.value = (R() - 0.5) * 8;
      f.type = 'lowpass'; f.frequency.value = 900;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(gain, t + Math.min(0.9, len / 3));
      g.gain.setValueAtTime(gain, t + len - 0.4);
      g.gain.linearRampToValueAtTime(0.0001, t + len + 0.3);
      o.connect(f); f.connect(g); g.connect(bus);
      o.start(t); o.stop(t + len + 0.4);
    },
    /** 丸いベース */
    bass(n, t, len, gain = 0.13) {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = NOTE(n);
      env(g, t, 0.02, gain, len);
      o.connect(g); g.connect(master);
      o.start(t); o.stop(t + len + 0.1);
    },
    /** はずむベース（少しだけ倍音のあるはじく音） */
    pluckBass(n, t, len, gain = 0.16) {
      const o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      o.type = 'triangle'; o.frequency.value = NOTE(n);
      f.type = 'lowpass'; f.frequency.setValueAtTime(1400, t); f.frequency.exponentialRampToValueAtTime(300, t + len);
      env(g, t, 0.01, gain, len);
      o.connect(f); f.connect(g); g.connect(master);
      o.start(t); o.stop(t + len + 0.05);
    },
    /** オルゴール */
    bell(n, t, gain = 0.05) {
      [[1, 1], [2.01, 0.25], [3.98, 0.08]].forEach(([m, v]) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'sine'; o.frequency.value = NOTE(n) * m;
        env(g, t, 0.006, gain * v, 1.4 / m);
        o.connect(g); g.connect(bus);
        o.start(t); o.stop(t + 1.6);
      });
    },
    /** マリンバ（ころころした木の音） */
    marimba(n, t, gain = 0.07) {
      [[1, 1, 0.45], [4, 0.14, 0.09]].forEach(([m, v, d]) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'sine'; o.frequency.value = NOTE(n) * m;
        env(g, t, 0.006, gain * v, d);
        o.connect(g); g.connect(bus);
        o.start(t); o.stop(t + d + 0.05);
      });
    },
    /** 笛 */
    flute(n, t, len, gain = 0.06) {
      const o = ctx.createOscillator(), g = ctx.createGain(), lfo = ctx.createOscillator(), lg = ctx.createGain();
      o.type = 'sine'; o.frequency.value = NOTE(n);
      lfo.frequency.value = 5; lg.gain.value = NOTE(n) * 0.006;
      lfo.connect(lg); lg.connect(o.frequency);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(gain, t + Math.min(0.1, len / 3));
      g.gain.setValueAtTime(gain, t + len * 0.7);
      g.gain.linearRampToValueAtTime(0.0001, t + len);
      o.connect(g); g.connect(bus);
      o.start(t); lfo.start(t); o.stop(t + len + 0.05); lfo.stop(t + len + 0.05);
    },
    /** シェイカー（しゃっ、しゃっ）。耳ざわりにならないよう、帯域をしぼってふんわり鳴らす */
    shaker(t, gain = 0.02) {
      const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      s.buffer = noise(); f.type = 'bandpass'; f.frequency.value = 7000; f.Q.value = 0.9;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(gain, t + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
      s.connect(f); f.connect(g); g.connect(master);
      s.start(t, Math.random() * 0.05); s.stop(t + 0.14);
    },
    /** 雨音（ぽつぽつ。高い音だけのやわらかいノイズを短く） */
    drop(t, gain = 0.012) {
      const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      s.buffer = noise(); f.type = 'bandpass'; f.frequency.value = 2500 + R() * 3500; f.Q.value = 6;
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(gain, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
      s.connect(f); f.connect(g); g.connect(master);
      s.start(t, R() * 0.1); s.stop(t + 0.09);
    },
    /** やさしい太鼓（どん） */
    drum(t, gain = 0.16) {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(60, t + 0.18);
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(gain, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
      o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.32);
    },
    /** ウッドブロック（こんこん） */
    block(t, gain = 0.05, hi) {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(hi ? 1250 : 950, t); o.frequency.exponentialRampToValueAtTime(hi ? 1000 : 760, t + 0.05);
      env(g, t, 0.006, gain, 0.08);
      o.connect(g); g.connect(master);
      o.start(t); o.stop(t + 0.1);
    },
  };
  let noiseBuf = null;
  function noise() {
    if (noiseBuf && noiseBuf.sampleRate === ctx.sampleRate) return noiseBuf;
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = R() * 2 - 1;
    return noiseBuf;
  }

  /** メロディ：音階の中をゆっくり歩き、小節の頭は和音の音に寄せる */
  function walker(scale) {
    let pos = Math.floor(scale.length / 2);
    return {
      step(chord, onBeat) {
        pos = Math.max(0, Math.min(scale.length - 1, pos + [-2, -1, -1, 0, 1, 1, 2][Math.floor(R() * 7)]));
        if (onBeat) {
          const c = scale.map((n, i) => i).filter(i => chord.some(x => (x - scale[i]) % 12 === 0));
          if (c.length) pos = c.reduce((a, b) => (Math.abs(b - pos) < Math.abs(a - pos) ? b : a));
        }
        return scale[pos];
      },
    };
  }

  /* ---------- 曲 ---------- */
  const SONGS = {
    // ピクニック：ト長調・軽快。はずむベース＋マリンバ＋シェイカー＋ウッドブロック（メロディなし）
    picnic: {
      name: 'ピクニック',
      bpm: 112,
      chords: [
        [43, 67, 71, 74], [40, 64, 67, 71], [36, 64, 67, 72], [38, 62, 66, 69], // G Em C D
        [43, 67, 71, 74], [36, 64, 67, 72], [38, 62, 66, 69], [43, 67, 71, 74], // G C D G
        [36, 64, 67, 72], [38, 62, 66, 69], [47, 66, 71, 74], [40, 64, 67, 71], // C D Bm Em
        [36, 64, 67, 72], [38, 62, 66, 69], [43, 67, 71, 74], [43, 67, 71, 74], // C D G G
      ],
      bar(p) {
        const { t, beat, ch, i } = p, root = ch[0];
        // ベース：ドン・(ン)ド・ドン・(ン)ド
        [[0, 0, 0.45], [1.5, 7, 0.3], [2, 0, 0.45], [3.5, 12, 0.3]].forEach(([at, add, l]) => I.pluckBass(root + add, t + at * beat, beat * l * 2));
        // パッド（うすく）
        ch.slice(1).forEach(n => I.pad(n - 12, t, beat * 4, 0.018));
        // マリンバの分散和音（8分音符、上がって下がる）
        const arp = [ch[1], ch[2], ch[3], ch[2] + 12, ch[3], ch[2], ch[1] + 12, ch[3]];
        arp.forEach((n, k) => { if (k === 0 || R() < 0.85) I.marimba(n, t + k * beat / 2, k % 2 ? 0.045 : 0.065); });
        // リズム：シェイカーは裏拍、ウッドブロックは2拍目と4拍目
        for (let k = 0; k < 8; k++) I.shaker(t + k * beat / 2, k % 2 ? 0.02 : 0.009);
        I.block(t + beat, 0.04); I.block(t + beat * 3, 0.04, true);
        if (i % 4 === 3) I.block(t + beat * 3.5, 0.03, true);
      },
    },
    // のどかな草原：ヘ長調・ゆっくり。パッド＋ベース＋オルゴール＋ときどき笛
    meadow: {
      name: 'のどかな草原',
      bpm: 72,
      chords: [
        [41, 65, 69, 72], [38, 62, 65, 69], [46, 62, 65, 70], [36, 64, 67, 72],
        [41, 65, 69, 72], [45, 64, 69, 72], [46, 62, 65, 70], [36, 60, 64, 67],
      ],
      scale: [65, 67, 69, 72, 74, 77, 79, 81],
      bar(p) {
        const { t, beat, ch, i } = p;
        ch.slice(1).forEach(n => I.pad(n - 12, t, beat * 4));
        I.bass(ch[0], t, beat * 1.8); I.bass(ch[0] + 7, t + beat * 2, beat * 1.6);
        for (let k = 0; k < 8; k++) {
          if (R() < (k % 2 ? 0.35 : 0.6)) I.bell(ch[1 + ((k + i) % 3)] + 12 * (R() < 0.3 ? 1 : 0), t + k * beat / 2, k === 0 ? 0.07 : 0.045);
        }
        if (Math.floor(i / 8) % 2 === 1) {
          let at = 0;
          while (at < 4) {
            const len = R() < 0.5 ? 1 : (R() < 0.6 ? 2 : 0.5);
            if (R() < 0.8) I.flute(p.melody.step(ch.slice(1), at === 0), t + at * beat, Math.min(len, 4 - at) * beat * 0.95);
            at += len;
          }
        }
      },
    },
  };

  /* ---------- お店で買える曲（data/decor.js の songs で値段を決める） ---------- */
  Object.assign(SONGS, {
    // 雨の日の工房：ヘ長調・ゆっくり。あたたかい和音とオルゴールに、窓の外のやさしい雨音
    rainy: {
      name: '雨の日の工房', bpm: 68, gain: 1.2,
      chords: [[41, 64, 69, 72], [45, 64, 67, 72], [46, 62, 65, 69], [48, 64, 67, 69], [41, 64, 69, 72], [38, 65, 69, 72], [43, 65, 70, 74], [48, 64, 67, 72]],
      bar(p) {
        const { t, beat, ch, i } = p;
        ch.slice(1).forEach(n => I.pad(n - 12, t, beat * 4, 0.026));
        I.bass(ch[0], t, beat * 2.5, 0.09); I.bass(ch[0] + 7, t + beat * 2, beat * 1.8, 0.06);
        const arp = [ch[1], ch[2], ch[3], ch[2] + 12];
        arp.forEach((n, k) => { if (k === 0 || R() < 0.75) I.bell(n + 12, t + k * beat, k === 0 ? 0.045 : 0.03); });
        if (i % 2 === 1 && R() < 0.6) I.bell(ch[3] + 24, t + beat * 3.5, 0.02);
        for (let k = 0; k < 7; k++) I.drop(t + R() * beat * 4, 0.004 + R() * 0.005);
      },
    },
    // お祭りの夜：ヘ長調のにぎやかな五音音階。太鼓とウッドブロック、オルゴールの分散和音
    festival: {
      name: 'お祭りの夜', bpm: 118, gain: 1.7,
      chords: [[41, 65, 69, 72], [41, 65, 69, 72], [46, 65, 70, 74], [48, 67, 72, 76], [41, 65, 69, 72], [43, 67, 70, 74], [48, 67, 72, 76], [41, 65, 69, 72]],
      bar(p) {
        const { t, beat, ch, i } = p;
        I.drum(t, 0.17); I.drum(t + beat * 2, 0.13); if (i % 2) I.drum(t + beat * 3.5, 0.1);
        I.block(t + beat, 0.035); I.block(t + beat * 3, 0.035, true);
        I.pluckBass(ch[0], t, beat * 0.9); I.pluckBass(ch[0] + 7, t + beat * 2, beat * 0.9);
        const arp = [ch[1], ch[2], ch[3], ch[2], ch[1] + 12, ch[3], ch[2], ch[3] + 12];
        arp.forEach((n, k) => { if (k === 0 || R() < 0.8) I.marimba(n, t + k * beat / 2, k % 2 ? 0.04 : 0.06); });
        for (let k = 0; k < 8; k++) I.shaker(t + k * beat / 2, k % 2 ? 0.016 : 0.007);
      },
    },
    // 月夜のワルツ：3拍子。ベースが1拍目、和音が2・3拍目
    waltz: {
      name: '月夜のワルツ', bpm: 108, beats: 3, gain: 1.7,
      chords: [[43, 67, 71, 74], [40, 64, 67, 71], [36, 64, 67, 72], [38, 62, 66, 69], [43, 67, 71, 74], [45, 64, 69, 72], [38, 62, 66, 69], [43, 67, 71, 74]],
      bar(p) {
        const { t, beat, ch, i } = p;
        I.bass(ch[0], t, beat * 1.2, 0.12);
        [1, 2].forEach(b => ch.slice(1).forEach(n => I.marimba(n, t + b * beat, 0.028)));
        I.bell(ch[1 + (i % 3)] + 12, t, 0.06); if (R() < 0.6) I.bell(ch[1 + ((i + 1) % 3)] + 12, t + beat * 2, 0.04);
        ch.slice(1).forEach(n => I.pad(n - 12, t, beat * 3, 0.015));
      },
    },
    // 星屑のオルゴール：ゆっくりの子守歌。高いオルゴールがきらきら
    starbox: {
      name: '星屑のオルゴール', bpm: 60, gain: 1.7,
      chords: [[48, 72, 76, 79], [45, 72, 76, 81], [41, 72, 77, 81], [43, 71, 74, 79], [48, 72, 76, 79], [40, 71, 76, 79], [41, 69, 72, 77], [43, 71, 74, 79]],
      bar(p) {
        const { t, beat, ch } = p;
        ch.slice(1).forEach(n => I.pad(n - 24, t, beat * 4, 0.02));
        I.bass(ch[0], t, beat * 3.5, 0.08);
        const arp = [ch[1], ch[2], ch[3], ch[2] + 12, ch[3], ch[2]];
        arp.forEach((n, k) => I.bell(n + 12, t + k * beat * 4 / 6, k === 0 ? 0.05 : 0.03));
      },
    },
  });

  /** 時間で切り替えるときの曲（時間帯は薬草園の空と同じ：夜は19時〜5時） */
  const AUTO = { morning: 'picnic', day: 'picnic', evening: 'picnic', night: 'meadow' };
  const timeOfDay = () => (PS.ui && PS.ui.timeOfDay ? PS.ui.timeOfDay() : 'day');

  /* ---------- 演奏の進行 ---------- */
  let enabled = true, volume = 0.5, started = false, playing = false, choice = 'auto', songId = 'picnic';
  let timer = null, nextBar = 0, barIndex = 0, melody = null;
  let fileAudio = null;
  let previewId = null, previewTimer = null;   // 試聴中の曲（買う前に聞ける）
  const song = () => SONGS[songId] || SONGS.picnic;
  const resolve = () => previewId || (choice === 'auto' ? AUTO[timeOfDay()] : choice);

  /** 時間で切り替える設定のとき、時間帯が変わったら曲を替える（1分ごとに確かめる） */
  setInterval(() => {
    const id = resolve();
    if (id === songId) return;
    songId = id;
    if (playing) { stop(); setTimeout(start, 650); }
  }, 60000);

  function scheduleBar(s, t) {
    const beat = 60 / s.bpm;
    const i = barIndex % s.chords.length;
    s.bar({ t, beat, ch: s.chords[i], i, melody });
    barIndex++;
    return beat * (s.beats || 4);
  }

  let lateCount = 0;
  function tick() {
    if (!ctx) return;
    const s = song(), now = ctx.currentTime;
    // 画面の処理などで予約が遅れた：過ぎた小節は鳴らさず、少し先から始め直す（音がぶつ切れになるのを防ぐ）
    if (nextBar < now + 0.05) { lateCount++; nextBar = now + 0.15; }
    while (nextBar < now + 2.5) nextBar += scheduleBar(s, nextBar);
  }

  /** 合成の準備（余韻用のディレイ） */
  function setup(c) {
    ctx = c || PS.assets.sound.context();
    if (!ctx) return false;
    master = ctx.createGain(); master.gain.value = 0.0001; master.connect(ctx.destination);
    bus = ctx.createGain(); bus.connect(master);
    delay = ctx.createDelay(1);
    const fb = ctx.createGain(), wet = ctx.createGain(), lp = ctx.createBiquadFilter();
    fb.gain.value = 0.28; wet.gain.value = 0.3; lp.type = 'lowpass'; lp.frequency.value = 2400;
    bus.connect(delay); delay.connect(lp); lp.connect(fb); fb.connect(delay); lp.connect(wet); wet.connect(master);
    return true;
  }
  function resetSong(s) {
    barIndex = 0; melody = s.scale ? walker(s.scale) : null;
    delay.delayTime.value = (60 / s.bpm) * 0.75;   // 付点8分の山びこ
  }

  const level = () => volume * 0.8 * (song().gain || 1);   // gain：曲ごとの大きさのそろえ

  function startSynth() {
    if (!ctx && !setup()) return;
    if (ctx.state === 'suspended') ctx.resume();
    resetSong(song());
    nextBar = ctx.currentTime + 0.05;
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), ctx.currentTime);
    master.gain.linearRampToValueAtTime(level(), ctx.currentTime + 0.3);   // すぐ聞こえるように、ごく短くふわっと
    tick();
    clearInterval(timer); timer = setInterval(tick, 200);
  }

  function stopSynth() {
    if (!ctx) return;
    clearInterval(timer); timer = null;
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
    master.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
    // 予約済みの音が鳴り終わったら、出力ごと作り直す（次に始めるときは新しい出力で）
    const old = master;
    setTimeout(() => { try { old.disconnect(); } catch (e) {} }, 1500);
    ctx = null;
  }

  function start() {
    if (playing || !started || !(enabled || previewId) || document.hidden) return;
    playing = true;
    songId = resolve();
    const def = PS.assets.manifest.bgm || {};
    try {
      if (def.type === 'file') {
        if (!fileAudio) { fileAudio = new Audio(def.src); fileAudio.loop = true; }
        fileAudio.volume = Math.min(1, level() * (def.volume || 1));
        fileAudio.play().catch(() => { playing = false; });
      } else startSynth();
    } catch (e) { playing = false; }
  }

  function stop() {
    if (!playing) return;
    playing = false;
    if (fileAudio) fileAudio.pause();
    stopSynth();
  }

  // ブラウザによっては、画面に一度ふれるまで音を出せない。最初のタップ（キー操作）で音を有効にして鳴らす
  function onFirstGesture() {
    ['pointerdown', 'touchend', 'keydown'].forEach(ev => window.removeEventListener(ev, onFirstGesture, true));
    started = true;
    const c = PS.assets.sound.context();
    if (c && c.state !== 'running') c.resume().catch(() => {});
    start();
  }
  ['pointerdown', 'touchend', 'keydown'].forEach(ev => window.addEventListener(ev, onFirstGesture, true));

  /** アプリを開いたらすぐに鳴らす（ホーム画面から開いた場合など、ブラウザが許せばすぐ鳴る） */
  function autostart() {
    started = true;
    const c = PS.assets.sound.context();
    if (c && c.state !== 'running') c.resume().catch(() => {});
    start();
  }
  // アプリが裏に回ったら止め、戻ったら再開する
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));

  PS.assets.bgm = {
    setEnabled(on) { enabled = !!on; enabled ? start() : stop(); },
    setVolume(v) {
      volume = Math.max(0, Math.min(1, Number(v) || 0));
      if (fileAudio) fileAudio.volume = Math.min(1, level() * ((PS.assets.manifest.bgm || {}).volume || 1));
      if (playing && master && ctx) { master.gain.cancelScheduledValues(ctx.currentTime); master.gain.setTargetAtTime(Math.max(level(), 0.0001), ctx.currentTime, 0.1); }
    },
    /** 曲を切り替える（流れている時は、いったん止めて新しい曲で始め直す） */
    setSong(id) {
      if (id !== 'auto' && !SONGS[id]) id = 'auto';
      choice = id;
      if (resolve() === songId) return;
      if (playing) { stop(); setTimeout(start, 650); } else songId = resolve();
    },
    /** 曲の一覧（canUse で、持っている曲だけにしぼれる） */
    list: canUse => [{ id: 'auto', name: '時間で切り替え' }].concat(Object.entries(SONGS).filter(([id]) => !canUse || canUse(id)).map(([id, s]) => ({ id, name: s.name }))),
    /** 試聴：その曲を seconds 秒だけ流して、もとの曲に戻す（BGM がオフでも聞ける） */
    preview(id, seconds) {
      if (!SONGS[id]) return;
      clearTimeout(previewTimer);
      started = true;
      const c = PS.assets.sound.context(); if (c && c.state !== 'running') c.resume().catch(() => {});
      previewId = id;
      if (playing) { stop(); setTimeout(start, 650); } else start();
      previewTimer = setTimeout(() => this.stopPreview(), (seconds || 15) * 1000);
    },
    stopPreview() {
      if (!previewId) return;
      clearTimeout(previewTimer); previewId = null;
      stop(); setTimeout(start, 650);
    },
    previewing: () => previewId,
    current: () => songId,
    autostart,
    isPlaying: () => playing,
    audioState: () => (PS.assets.sound.context() || {}).state,
    stats: () => ({ lateCount, scheduledUntil: ctx ? +(nextBar - ctx.currentTime).toFixed(2) : 0 }),
    /** 確認用：曲を seconds 秒ぶん書き出す（AudioBuffer を返す） */
    async renderPreview(seconds, id) {
      const keep = { ctx, master, bus, delay, barIndex, melody, songId };
      if (id) songId = id;
      const off = new OfflineAudioContext(2, 44100 * seconds, 44100);
      setup(off); master.gain.value = level(); resetSong(song());
      let t = 0.05; while (t < seconds) t += scheduleBar(song(), t);
      const buf = await off.startRendering();
      ({ ctx, master, bus, delay, barIndex, melody, songId } = keep);
      return buf;
    },
  };
})(window.PS);
