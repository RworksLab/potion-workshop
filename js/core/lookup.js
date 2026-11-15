/* マスターデータの索引（IDから素早く引けるようにする） */
(function (PS) {
  'use strict';

  const L = {};

  L.build = function () {
    const d = PS.data;
    const idx = arr => Object.fromEntries(arr.map(x => [x.id, x]));
    L.material = idx(d.materials);
    L.effect = idx(d.effects);
    L.taste = idx(d.tastes);
    L.aroma = idx(d.aromas);
    L.color = idx(d.colors);
    L.texture = idx(d.textures);
    L.bottle = idx(d.bottles);
    L.rarity = idx(d.rarities);
    L.potency = idx(d.potency);
    L.raritiesSorted = d.rarities.slice().sort((a, b) => a.order - b.order);
  };

  /** レアリティID → 順位（未定義なら0） */
  L.rarityOrder = function (id) {
    return id && L.rarity[id] ? L.rarity[id].order : 0;
  };

  PS.core.lookup = L;
})(window.PS);
