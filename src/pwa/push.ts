export async function requestPushPermission(): Promise<string | null> {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      console.warn("Push messaging is not supported");
      return null;
    }
  
    const registration = await navigator.serviceWorker.ready;
  
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.warn("Notification permission denied");
      return null;
    }
  
    try {
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: import.meta.env.VITE_VAPID_PUBLIC_KEY,
      });
  
      return JSON.stringify(subscription);
    } catch (err) {
      console.error("Push subscription failed:", err);
      return null;
    }
  }
  