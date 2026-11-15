/*
 * 効果音の再生
 * PS.assets.sound.play('pluck') のようにキー名で鳴らす。
 * 実体（合成音 / 音声ファイル）は assets/manifest.js で決める。
 */
(function (PS) {
  'use strict';

  let ctx = null;
  let noiseBuf = null;
  let volume = 0.7;
  const audioCache = {};

  function ensureCtx() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    const len = ctx.sampleRate * 0.5;
    noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return ctx;
  }

  /** スマホでは最初のタップで音声を有効化する必要がある */
  function unlock() {
    const c = ensureCtx();
    if (c && c.state === 'suspended') c.resume();
  }

  function playVoice(c, v, master) {
    const t0 = c.currentTime + (v.at || 0);
    const dur = v.dur || 0.1;
    const g = c.createGain();
    const peak = (v.gain || 0.3) * master;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t0 + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    g.connect(c.destination);
    let src;
    if (v.wave === 'noise') {
      src = c.createBufferSource();
      src.buffer = noiseBuf;
    } else {
      src = c.createOscillator();
      src.type = v.wave || 'sine';
      const [f0, f1] = v.freq || [440, 440];
      src.frequency.setValueAtTime(f0, t0);
      src.frequency.exponentialRampToValueAtTime(Math.max(f1, 1), t0 + dur);
    }
    src.connect(g);
    src.start(t0);
    src.stop(t0 + dur + 0.02);
  }

  function play(key) {
    if (volume <= 0) return;
    const def = PS.assets.manifest.sound[key];
    if (!def) return;
    try {
      if (def.type === 'file') {
        const base = audioCache[key] || (audioCache[key] = new Audio(def.src));
        const a = base.cloneNode();
        a.volume = Math.min(1, volume * (def.volume || 1));
        a.play().catch(() => {});
        return;
      }
      const c = ensureCtx();
      if (!c) return;
      if (c.state === 'suspended') c.resume();
      for (const v of def.voices) playVoice(c, v, volume);
    } catch (e) { /* 音が鳴らなくてもゲームは続ける */ }
  }

  PS.assets.sound = {
    play, unlock,
    context: ensureCtx,   // BGM（assets/bgm.js）と同じ音声の仕組みを使う
    setVolume(v) { volume = Math.max(0, Math.min(1, Number(v) || 0)); },
  };
})(window.PS);
