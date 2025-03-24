self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("message", (event) => {
    const data = event.data;
    self.registration.showNotification(data.title, {
        body: data.body,
        icon: "https://cdn-icons-png.flaticon.com/512/3095/3095583.png",
        vibrate: [200, 100, 200],
    });
});
