/*
 * 素材マニフェスト（絵と音の一覧）
 * ゲーム側は「キー名」だけを使い、実体（SVG / 画像ファイル / 合成音 / 音声ファイル）はここで決める。
 *
 * ■ 画像ファイルに差し替える方法
 *   例）緑の薬草を PNG にする
 *     mat_green_herb: { type: 'image', src: 'assets/img/green_herb.png' },
 *   瓶の場合は bottle_round などを image にすると、その瓶の絵に置き換わる
 *   （画像の場合、液体の色は自動で塗られないので、色違いの画像を用意するか SVG のままにする）
 *
 * ■ 音声ファイルに差し替える方法
 *   例）採取音を mp3 にする
 *     pluck: { type: 'file', src: 'assets/sound/pluck.mp3', volume: 0.8 },
 *
 * ※ 新しいファイルを追加したら sw.js の PRECACHE にもパスを追加すると、オフラインでも使える。
 */
PS.assets.manifest = {
  /*
   * BGM
   *  type:'synth' … assets/bgm.js の曲（song）をその場で合成して流す
   *  type:'file'  … 音声ファイルをくり返し流す。例：{ type: 'file', src: 'assets/audio/bgm.mp3', volume: 0.8 }
   */
  bgm: { type: 'synth', song: 'meadow' },

  art: {
    // 素材（params は assets/art.js の描画関数へ渡される）
    mat_green_herb:      { type: 'svg', draw: 'herb',     params: { leaf: '#6cc47a', dark: '#3f9a55' } },
    mat_red_flower:      { type: 'svg', draw: 'flower',   params: { petal: '#ef6f6c', center: '#ffd86b', leaf: '#74c68a' } },
    mat_mint_leaf:       { type: 'svg', draw: 'herb',     params: { leaf: '#9fe0b8', dark: '#4fb894', round: true } },
    mat_sun_berry:       { type: 'svg', draw: 'berry',    params: { berry: '#f5a25a', leaf: '#7fc47d' } },
    mat_puff_bean:       { type: 'svg', draw: 'bean',     params: { pod: '#b9db6a', bean: '#e8f4a8' } },
    mat_moonlight_grass: { type: 'svg', draw: 'blades',   params: { leaf: '#9cc7f5', glow: '#dff0ff' } },
    mat_poison_mushroom: { type: 'svg', draw: 'mushroom', params: { cap: '#a678d6', dot: '#f4e9ff', stem: '#f3e6d0' } },
    mat_stardust_flower: { type: 'svg', draw: 'starflower', params: { petal: '#f3d35b', center: '#fff6c4', leaf: '#74c68a' } },
    mat_fairy_flower:    { type: 'svg', draw: 'fairy',    params: { petal: '#f8a8cf', center: '#fff0f7', wing: '#c9f1ff', leaf: '#86d3a0' } },
    sprout:              { type: 'svg', draw: 'sprout',   params: { leaf: '#8fd49a' } },

    // 瓶（ポーションの描画に使う）
    bottle_round:  { type: 'svg', draw: 'bottle', params: { shape: 'round' } },
    bottle_tube:   { type: 'svg', draw: 'bottle', params: { shape: 'tube' } },
    bottle_cone:   { type: 'svg', draw: 'bottle', params: { shape: 'cone' } },
    bottle_pot:    { type: 'svg', draw: 'bottle', params: { shape: 'pot' } },
    bottle_drop:   { type: 'svg', draw: 'bottle', params: { shape: 'drop' } },
    bottle_gourd:  { type: 'svg', draw: 'bottle', params: { shape: 'gourd' } },
    bottle_heart:  { type: 'svg', draw: 'bottle', params: { shape: 'heart' } },
    bottle_star:   { type: 'svg', draw: 'bottle', params: { shape: 'star' } },


    // 下部メニューのアイコン（図鑑は name を codex1〜codex5 から選ぶ）
    nav_garden:  { type: 'svg', draw: 'navIcon', params: { name: 'garden' } },
    nav_lab:     { type: 'svg', draw: 'navIcon', params: { name: 'lab' } },
    nav_codex:   { type: 'svg', draw: 'navIcon', params: { name: 'codex2' } },
    nav_shop:    { type: 'svg', draw: 'navIcon', params: { name: 'shop' } },
    nav_upgrade: { type: 'svg', draw: 'navIcon', params: { name: 'upgrade' } },

    // 薬草園の景色と、たまに遊びに来る生き物（data/gardenEvents.js の art から参照）
    garden_sky:        { type: 'svg', draw: 'gardenSky', params: {} },
    visitor_butterfly: { type: 'svg', draw: 'butterfly', params: {} },
    visitor_ladybug:   { type: 'svg', draw: 'ladybug', params: {} },

    // UI
    cauldron: { type: 'svg', draw: 'cauldron', params: {} },
    coin:     { type: 'svg', draw: 'coin', params: {} },
  },

  sound: {
    // wave: sine / triangle / square / sawtooth / noise
    // freq: [開始Hz, 終了Hz]  dur: 秒  at: 開始までの秒  gain: 音量
    pluck:   { type: 'synth', voices: [
      { wave: 'sine', freq: [260, 880], dur: 0.12, gain: 0.5 },
      { wave: 'noise', dur: 0.05, gain: 0.15 },
      { wave: 'triangle', freq: [1320, 1500], dur: 0.08, at: 0.06, gain: 0.18 },
    ] },
    tap:     { type: 'synth', voices: [{ wave: 'triangle', freq: [700, 640], dur: 0.05, gain: 0.25 }] },
    plus:    { type: 'synth', voices: [{ wave: 'sine', freq: [880, 990], dur: 0.05, gain: 0.25 }] },
    minus:   { type: 'synth', voices: [{ wave: 'sine', freq: [660, 560], dur: 0.05, gain: 0.25 }] },
    error:   { type: 'synth', voices: [{ wave: 'square', freq: [180, 140], dur: 0.15, gain: 0.12 }] },
    bubble:  { type: 'synth', voices: [
      { wave: 'sine', freq: [200, 420], dur: 0.09, gain: 0.35 },
      { wave: 'sine', freq: [240, 520], dur: 0.09, at: 0.18, gain: 0.3 },
      { wave: 'sine', freq: [180, 380], dur: 0.09, at: 0.34, gain: 0.3 },
      { wave: 'sine', freq: [260, 600], dur: 0.1,  at: 0.52, gain: 0.3 },
      { wave: 'sine', freq: [220, 480], dur: 0.1,  at: 0.72, gain: 0.3 },
    ] },
    reveal_N:   { type: 'synth', voices: [
      { wave: 'triangle', freq: [523, 523], dur: 0.18, gain: 0.3 },
      { wave: 'triangle', freq: [659, 659], dur: 0.25, at: 0.1, gain: 0.3 } ] },
    reveal_R:   { type: 'synth', voices: [
      { wave: 'triangle', freq: [523, 523], dur: 0.15, gain: 0.3 },
      { wave: 'triangle', freq: [659, 659], dur: 0.15, at: 0.1, gain: 0.3 },
      { wave: 'triangle', freq: [784, 784], dur: 0.3, at: 0.2, gain: 0.3 } ] },
    reveal_SR:  { type: 'synth', voices: [
      { wave: 'sine', freq: [587, 587], dur: 0.15, gain: 0.3 },
      { wave: 'sine', freq: [740, 740], dur: 0.15, at: 0.1, gain: 0.3 },
      { wave: 'sine', freq: [880, 880], dur: 0.15, at: 0.2, gain: 0.3 },
      { wave: 'sine', freq: [1175, 1175], dur: 0.4, at: 0.3, gain: 0.3 } ] },
    reveal_SSR: { type: 'synth', voices: [
      { wave: 'sine', freq: [659, 659], dur: 0.12, gain: 0.3 },
      { wave: 'sine', freq: [784, 784], dur: 0.12, at: 0.09, gain: 0.3 },
      { wave: 'sine', freq: [988, 988], dur: 0.12, at: 0.18, gain: 0.3 },
      { wave: 'sine', freq: [1319, 1319], dur: 0.2, at: 0.27, gain: 0.3 },
      { wave: 'triangle', freq: [1568, 1568], dur: 0.5, at: 0.38, gain: 0.25 } ] },
    reveal_UR:  { type: 'synth', voices: [
      { wave: 'sine', freq: [523, 523], dur: 0.12, gain: 0.3 },
      { wave: 'sine', freq: [659, 659], dur: 0.12, at: 0.08, gain: 0.3 },
      { wave: 'sine', freq: [784, 784], dur: 0.12, at: 0.16, gain: 0.3 },
      { wave: 'sine', freq: [1047, 1047], dur: 0.12, at: 0.24, gain: 0.3 },
      { wave: 'sine', freq: [1319, 1319], dur: 0.12, at: 0.32, gain: 0.3 },
      { wave: 'sine', freq: [1568, 1568], dur: 0.12, at: 0.4, gain: 0.3 },
      { wave: 'triangle', freq: [2093, 2093], dur: 0.8, at: 0.5, gain: 0.25 },
      { wave: 'sine', freq: [1047, 1047], dur: 0.8, at: 0.5, gain: 0.2 } ] },
    confirm: { type: 'synth', voices: [
      { wave: 'triangle', freq: [784, 784], dur: 0.1, gain: 0.3 },
      { wave: 'triangle', freq: [1047, 1047], dur: 0.22, at: 0.09, gain: 0.3 } ] },
    event:   { type: 'synth', voices: [
      { wave: 'sine', freq: [880, 1175], dur: 0.12, gain: 0.22 },
      { wave: 'sine', freq: [1319, 1568], dur: 0.18, at: 0.1, gain: 0.2 },
      { wave: 'triangle', freq: [1760, 1760], dur: 0.25, at: 0.22, gain: 0.12 } ] },
    upgrade: { type: 'synth', voices: [
      { wave: 'triangle', freq: [392, 392], dur: 0.1, gain: 0.3 },
      { wave: 'triangle', freq: [523, 523], dur: 0.1, at: 0.08, gain: 0.3 },
      { wave: 'triangle', freq: [659, 659], dur: 0.1, at: 0.16, gain: 0.3 },
      { wave: 'sine', freq: [784, 1568], dur: 0.35, at: 0.24, gain: 0.25 } ] },
    review:  { type: 'synth', voices: [
      { wave: 'sine', freq: [1047, 1047], dur: 0.12, gain: 0.22 },
      { wave: 'sine', freq: [1397, 1397], dur: 0.25, at: 0.1, gain: 0.2 } ] },
    coin:    { type: 'synth', voices: [
      { wave: 'square', freq: [988, 988], dur: 0.06, gain: 0.1 },
      { wave: 'square', freq: [1319, 1319], dur: 0.18, at: 0.06, gain: 0.1 } ] },
  },
};
