importScripts(
    "https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js"
  );
  
  const { precacheAndRoute, createHandlerBoundToURL } = workbox.precaching;
  const { registerRoute } = workbox.routing;
  const { StaleWhileRevalidate } = workbox.strategies;
  
  // ---- Precache assets built by Vite ----
  precacheAndRoute(self.__WB_MANIFEST || []);
  
  // ---- App Shell Routing (critical for offline) ----
  const handler = createHandlerBoundToURL("/index.html");
  
  registerRoute(
    ({ request }) => request.mode === "navigate",
    handler
  );
  
  // ---- Cache static assets ----
  registerRoute(
    ({ request }) =>
      request.destination === "style" ||
      request.destination === "script" ||
      request.destination === "worker",
    new StaleWhileRevalidate({
      cacheName: "static-resources",
    })
  );
  
  // ---- Handle Push Notifications ----
  self.addEventListener("push", (event) => {
    if (!event.data) return;
  
    const payload = event.data.json();
  
    const options = {
      body: payload.body,
      icon: "/icons/icon-192.png",
      badge: "/icons/badge.png",
      vibrate: [100, 50, 100],
      data: {
        url: payload.data?.url || "/",
        timestamp: payload.timestamp,
      },
    };
  
    event.waitUntil(
      self.registration.showNotification(payload.title, options)
    );
  });
  
  // ---- Handle notification clicks ----
  self.addEventListener("notificationclick", (event) => {
    event.notification.close();
  
    event.waitUntil(
      clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientsArr) => {
        const url = event.notification.data?.url || "/";
  
        for (const client of clientsArr) {
          if (client.url.includes(url)) {
            return client.focus();
          }
        }
  
        return clients.openWindow(url);
      })
    );
  });
  