import { Workbox } from "workbox-window";

export function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    const wb = new Workbox("/sw.js");

    wb.addEventListener("installed", (event) => {
      if (event.isUpdate) {
        console.log("New service worker installed.");
      }
    });

    wb.addEventListener("activated", () => {
      console.log("Service worker activated.");
      window.location.reload();
    });

    wb.register().catch((err) => {
      console.error("Service worker registration failed:", err);
    });
  }
}
