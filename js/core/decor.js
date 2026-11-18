/*
 * お店の模様替え（画面に依存しない処理）
 *  state.decor = { owned: [買った品のID], use: { wood, wall, tag, name } }
 */
(function (PS) {
  'use strict';
  const D = () => PS.data.decor;
  const byId = id => D().items.find(x => x.id === id);

  const owns = (state, id) => { const it = byId(id); return !!it && (it.price === 0 || state.decor.owned.includes(id)); };
  const songItem = key => (D().songs || []).find(x => x.song === key);
  /** その曲を聞けるか（お店で売っていない曲は最初から聞ける） */
  const ownsSong = (state, key) => { const it = songItem(key); return !it || state.decor.owned.includes(it.id); };
  function buySong(state, id) {
    const it = (D().songs || []).find(x => x.id === id);
    if (!it) throw new Error('この曲はありません');
    if (state.decor.owned.includes(id)) throw new Error('もう持っています');
    if (state.coins < it.price) throw new Error('コインが足りません');
    state.coins -= it.price;
    state.stats.spent = (state.stats.spent || 0) + it.price;
    state.decor.owned.push(id);
    state.settings.bgmSong = it.song;   // 買ったらその曲にする
    return it;
  }
  /** 今使っている品（壊れていたら最初の品） */
  function current(state, cat) {
    const id = state.decor.use[cat];
    return owns(state, id) && byId(id).cat === cat ? byId(id) : byId(D().defaults[cat]);
  }

  function buy(state, id) {
    const it = byId(id);
    if (!it) throw new Error('この品はありません');
    if (owns(state, id)) throw new Error('もう持っています');
    if (state.coins < it.price) throw new Error('コインが足りません');
    state.coins -= it.price;
    state.stats.spent = (state.stats.spent || 0) + it.price;
    state.decor.owned.push(id);
    state.decor.use[it.cat] = id;   // 買ったらすぐ使う
    return it;
  }

  function use(state, id) {
    const it = byId(id);
    if (!it || !owns(state, id)) throw new Error('まだ持っていません');
    state.decor.use[it.cat] = id;
    return it;
  }

  /** 読み込んだデータを整える（知らない品は外し、使っている品が変なら最初の品に戻す） */
  function normalize(s) {
    if (!s.decor || typeof s.decor !== 'object') s.decor = {};
    const known = new Set(D().items.map(x => x.id).concat((D().songs || []).map(x => x.id)));
    s.decor.owned = Array.isArray(s.decor.owned) ? [...new Set(s.decor.owned.filter(id => known.has(id)))] : [];
    const u = s.decor.use && typeof s.decor.use === 'object' ? s.decor.use : {};
    s.decor.use = {};
    for (const c of D().cats) {
      const it = byId(u[c.id]);
      s.decor.use[c.id] = it && it.cat === c.id && (it.price === 0 || s.decor.owned.includes(it.id)) ? it.id : D().defaults[c.id];
    }
    // 持っていない曲が選ばれていたら「時間で切り替え」に戻す
    if (s.settings && s.settings.bgmSong && s.settings.bgmSong !== 'auto' && !ownsSong(s, s.settings.bgmSong)) s.settings.bgmSong = 'auto';
    return s;
  }

  PS.core.decor = { owns, ownsSong, buySong, songItem, current, buy, use, normalize, byId };
})(window.PS);
