// Service Worker: يخزن ملفات الواجهة عشان تفتح أوفلاين.
// ملاحظة: ده مش تنبيه في الخلفية. الإشعارات بتتعامل معاها الصفحة أو طبقة أندرويد الأصلية.
const CACHE = "zaad-v6";
const SHELL = ["/", "/manifest.json", "/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // طلبات APIs الخارجية مش بتتخزن هنا، والتطبيق بيخزن نتائجها بنفسه
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(req).then(
      (hit) =>
        hit ||
        fetch(req)
          .then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(CACHE).then((c) => c.put(req, copy));
            }
            return res;
          })
          .catch(() => caches.match("/"))
    )
  );
});
