/* NIGHTFALL service worker — zero-dependency offline shell */
const CACHE_PREFIX = "nightfall-build-mafia-pwa-game-";
const CACHE = `${CACHE_PREFIX}v1`;
const CORE = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "icons/icon-512.png",
  "avatars/434393482_1871613659928432_8426288221371325188_n.jpg",
  "avatars/632113238_17871285780544138_2169966287937961429_n.jpg",
  "avatars/730942684_17880471111671378_4230290639489894676_n.jpg",
  "avatars/751764554_17937153504297311_855254776719694712_n.jpg",
  "avatars/786944556_17953628265209536_9031587733587423338_n.jpg",
  "avatars/791143523_18010802381933223_2286477951539705360_n.jpg",
  "avatars/av1.jpg",
  "avatars/av6.jpg",
  "avatars/av7.jpg",
  "avatars/this one.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(CORE)).catch(() => null)
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k.startsWith(CACHE_PREFIX) && k !== CACHE)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(
      (hit) =>
        hit ||
        fetch(req)
          .then((res) => {
            if (res && res.ok && new URL(req.url).origin === self.location.origin) {
              const clone = res.clone();
              caches.open(CACHE).then((c) => c.put(req, clone));
            }
            return res;
          })
          .catch(() => caches.match("./index.html"))
    )
  );
});
