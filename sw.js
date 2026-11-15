/*
 * Service Worker（オフライン対応）
 * ゲームのファイルをすべて端末にキャッシュし、通信がなくても起動できるようにする。
 *
 * ■ ファイルを更新・追加したら
 *   1) 下の CACHE_VERSION の数字を上げる（古いキャッシュが自動で消える）
 *   2) 新しいファイルは PRECACHE に追加する
 */
const CACHE_VERSION = 'v1.2.1';
const CACHE_NAME = 'potion-shop-' + CACHE_VERSION;

const PRECACHE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/style.css',
  './icons/icon-192-v2.png',
  './icons/icon-512-v2.png',
  './icons/icon-maskable-512-v2.png',
  './icons/apple-touch-icon-v2.png',
  './js/namespace.js',
  './data/balance.js',
  './data/materials.js',
  './data/rarities.js',
  './data/effects.js',
  './data/flavors.js',
  './data/looks.js',
  './data/descriptions.js',
  './data/reviews.js',
  './data/upgrades.js',
  './data/gardenEvents.js',
  './data/orders.js',
  './data/memories.js',
  './assets/manifest.js',
  './assets/art.js',
  './assets/sound.js',
  './assets/bgm.js',
  './js/core/rng.js',
  './js/core/lookup.js',
  './js/core/stats.js',
  './js/core/state.js',
  './js/core/gather.js',
  './js/core/describe.js',
  './js/core/generator.js',
  './js/core/brew.js',
  './js/core/sales.js',
  './js/core/reviews.js',
  './js/core/upgrades.js',
  './js/core/orders.js',
  './js/core/memories.js',
  './js/save/db.js',
  './js/save/migrations.js',
  './js/save/repository.js',
  './js/save/exportImport.js',
  './js/store.js',
  './js/clock.js',
  './js/ui/common.js',
  './js/ui/potionNote.js',
  './js/ui/garden.js',
  './js/ui/lab.js',
  './js/ui/codex.js',
  './js/ui/share.js',
  './js/ui/tutorial.js',
  './js/ui/shop.js',
  './js/ui/upgrade.js',
  './js/ui/settings.js',
  './js/main.js',
];

self.addEventListener('install', event => {
  // cache:'reload'：ブラウザの一時保存を使わず、必ずサーバーから最新のファイルを取ってくる
  // （GitHub Pages はファイルを10分ほど一時保存させるため、古いファイルが混ざらないように）
  event.waitUntil(caches.open(CACHE_NAME)
    .then(c => c.addAll(PRECACHE.map(u => new Request(u, { cache: 'reload' }))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('potion-shop-') && k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// 開発中（localhost）は「通信優先」にして、ファイルを書き換えたらすぐ反映されるようにする
const IS_DEV = ['localhost', '127.0.0.1'].includes(self.location.hostname);

// 本番はキャッシュ優先。なければ通信して取得し、同じサイトのファイルはキャッシュに追加
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (IS_DEV) {
    event.respondWith(
      fetch(req).then(res => {
        if (res && res.ok) { const copy = res.clone(); caches.open(CACHE_NAME).then(c => c.put(req, copy)); }
        return res;
      }).catch(() => caches.match(req, { ignoreSearch: true })
        .then(hit => hit || (req.mode === 'navigate' ? caches.match('./index.html') : Response.error())))
    );
    return;
  }
  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then(hit => {
      if (hit) return hit;
      return fetch(req).then(res => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(req, copy));
        }
        return res;
      }).catch(() => (req.mode === 'navigate' ? caches.match('./index.html') : Response.error()));
    })
  );
});
