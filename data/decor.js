/*
 * お店の模様替え（見た目だけの着せ替え。遊びには影響しない）
 *  ・コインで買い、買ったものはいつでも切り替えられる。price が 0 のものは最初から持っている
 *  ・保存するのは「どれを買ったか」「どれを使っているか」だけ（容量はほとんど増えない）
 *  ・増やすときは items に1件追加する（cat … wood 棚の木 / wall 棚の奥の壁紙 / tag 値札 / name お店の名前の札）
 *    wood … [明るい面, 木の色, 暗い面, 影] / wall … CSS の背景 / tag・name … 色など
 */
PS.data.decor = {
  cats: [
    { id: 'wood', name: '棚の木' },
    { id: 'wall', name: '壁紙' },
    { id: 'tag',  name: '値札' },
    { id: 'name', name: '名前の札' },
  ],
  items: [
    // 棚の木（注文ボードの木もいっしょに変わる）
    { id: 'wood_basic',    cat: 'wood', name: 'やさしい木',   price: 0,    wood: ['#d5a675', '#c99a6b', '#b5865a', '#8d6440'] },
    { id: 'wood_white',    cat: 'wood', name: '白木',         price: 8000, wood: ['#f0e2c8', '#e6d3b3', '#d6bf9a', '#b39a76'] },
    { id: 'wood_dark',     cat: 'wood', name: 'こげ茶',       price: 8000, wood: ['#a97a55', '#946545', '#7d5337', '#5c3c27'] },
    { id: 'wood_sakura',   cat: 'wood', name: 'さくら色',     price: 15000, wood: ['#f6cdd2', '#eeb4bd', '#e09ba6', '#c27a87'] },
    { id: 'wood_mint',     cat: 'wood', name: 'ミント',       price: 15000, wood: ['#c9ead8', '#ade0c3', '#8fcfab', '#6aa887'] },
    { id: 'wood_lavender', cat: 'wood', name: 'ラベンダー',   price: 15000, wood: ['#ddd0f3', '#c9b8ec', '#b19ddf', '#8c77bd'] },
    { id: 'wood_sky',      cat: 'wood', name: 'そら色',       price: 15000, wood: ['#cfe7f8', '#b4d9f2', '#97c5e8', '#6e9fc6'] },
    // 棚の奥の壁紙
    { id: 'wall_stripe', cat: 'wall', name: 'クリームの縞', price: 0,
      wall: 'repeating-linear-gradient(90deg, #fff7ea 0 18px, #fcf0dc 18px 36px)' },
    { id: 'wall_plain',  cat: 'wall', name: '無地',         price: 5000, wall: '#fff8ee' },
    { id: 'wall_dots',   cat: 'wall', name: '水玉',         price: 12000,
      wall: 'radial-gradient(circle, #f9d6e1 3px, transparent 3.5px) 0 0 / 22px 22px, radial-gradient(circle, #f9d6e1 3px, transparent 3.5px) 11px 11px / 22px 22px, #fff8f6' },
    { id: 'wall_check',  cat: 'wall', name: 'チェック',     price: 12000,
      wall: 'linear-gradient(90deg, rgba(200,226,214,.55) 50%, transparent 50%) 0 0 / 28px 28px, linear-gradient(rgba(200,226,214,.55) 50%, transparent 50%) 0 0 / 28px 28px, #fbfdf8' },
    { id: 'wall_star',   cat: 'wall', name: '星空',         price: 25000,
      wall: 'radial-gradient(circle, #fff6c9 1.6px, transparent 2px) 0 0 / 26px 26px, radial-gradient(circle, #ffffff 1.1px, transparent 1.5px) 13px 9px / 26px 26px, linear-gradient(#4b4688, #7a62a8)' },
    { id: 'wall_lemon',  cat: 'wall', name: 'レモンの縞',   price: 10000,
      wall: 'repeating-linear-gradient(90deg, #fffbe6 0 18px, #fff2bd 18px 36px)' },
    // 値札
    { id: 'tag_white',  cat: 'tag', name: '白い札',     price: 0,    tag: { bg: '#ffffff', border: '#e6d9c2', string: '#b5865a' } },
    { id: 'tag_cream',  cat: 'tag', name: 'クリーム',   price: 5000, tag: { bg: '#fff8e4', border: '#efdcb0', string: '#c9a46e' } },
    { id: 'tag_wood',   cat: 'tag', name: '木札',       price: 10000, tag: { bg: '#f3dfc2', border: '#c99a6b', string: '#8d6440', ink: '#5b4632' } },
    { id: 'tag_pink',   cat: 'tag', name: 'リボン',     price: 12000, tag: { bg: '#fff5f8', border: '#f6b7cb', string: '#f07aa8', ribbon: '#f59bc0' } },
    { id: 'tag_mint',   cat: 'tag', name: 'ミントの札', price: 12000, tag: { bg: '#f2fbf6', border: '#a9dcc0', string: '#6aa887', ribbon: '#8fd6a8' } },
    // お店の名前の札
    { id: 'name_basic', cat: 'name', name: 'ふつう',     price: 0,    name_: { bg: '#ffffff', border: '#e6d9c2', ink: '#5b5470' } },
    { id: 'name_wood',  cat: 'name', name: '木の札',     price: 8000, name_: { bg: '#f3dfc2', border: '#c99a6b', ink: '#5b4632' } },
    { id: 'name_pink',  cat: 'name', name: 'ピンク',     price: 8000, name_: { bg: '#fff0f5', border: '#f6b7cb', ink: '#b9557f' } },
    { id: 'name_night', cat: 'name', name: '夜空',       price: 15000, name_: { bg: '#4b4688', border: '#7a62a8', ink: '#fff6c9' } },
  ],
  // お店で買える BGM（song は assets/bgm.js の SONGS のキー。ピクニック・のどかな草原は最初から聞ける）
  songs: [
    { id: 'song_rainy',    song: 'rainy',    name: '雨の日の工房',     price: 15000, desc: '窓の外のやさしい雨音と、あたたかい和音' },
    { id: 'song_starbox',  song: 'starbox',  name: '星屑のオルゴール', price: 15000, desc: 'ゆっくりきらきら、夜の子守歌' },
    { id: 'song_waltz',    song: 'waltz',    name: '月夜のワルツ',     price: 20000, desc: '3拍子でくるくる踊るような曲' },
    { id: 'song_festival', song: 'festival', name: 'お祭りの夜',       price: 20000, desc: '太鼓がどんどん、にぎやかな夜祭り' },
  ],
  defaults: { wood: 'wood_basic', wall: 'wall_stripe', tag: 'tag_white', name: 'name_basic' },
};
