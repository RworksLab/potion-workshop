/*
 * グローバル名前空間 PS（Potion Shop）
 * すべてのモジュールはこの下にぶら下がる。
 *  PS.data    … マスターデータ（素材・効果・味など。data/ フォルダ）
 *  PS.assets  … 絵と音（assets/ フォルダ。ゲーム処理とは分離）
 *  PS.core    … ゲームロジック（画面に依存しない純粋な処理）
 *  PS.save    … 保存・読み込み
 *  PS.ui      … 画面
 *
 * ※ ES Modules ではなく通常の <script> で読み込む構成にしているのは、
 *   index.html をダブルクリックするだけ（file://）でも動作確認できるようにするため。
 */
window.PS = window.PS || {
  VERSION: '1.0.5',
  data: {},
  assets: {},
  core: {},
  save: {},
  ui: {},
};
