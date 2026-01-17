importScripts(
    "https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js"
  );
  
  workbox.routing.registerRoute(
    ({ request }) => request.mode === "navigate",
    new workbox.strategies.NetworkFirst({
      cacheName: "pages-cache",
    })
  );
  
  self.addEventListener("push", (event) => {
    const data = event.data?.json() || {
      title: "Cardora",
      body: "You have a new update",
    };
  
    event.waitUntil(
      self.registration.showNotification(data.title, {
        body: data.body,
        icon: "/logo.png",
        badge: "/logo.png",
        data: data,
      })
    );
  });
  
  self.addEventListener("notificationclick", (event) => {
    event.notification.close();
  
    event.waitUntil(
      clients.openWindow("https://cardora.net")
    );
  });
  