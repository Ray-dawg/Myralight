// Service Worker for Trucking Logistics PWA

const CACHE_NAME = "trucking-logistics-v1";
const OFFLINE_URL = "/offline.html";

// Assets to cache immediately on install
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/offline.html",
  "/manifest.json",
  "/vite.svg",
  "/dashboard-preview.png",
  "/grid-pattern.svg",
];

// Install event - cache core assets
self.addEventListener("install", (event) => {
  console.log("[Service Worker] Installing Service Worker...");

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("[Service Worker] Caching app shell and content...");
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => {
        console.log("[Service Worker] Skip waiting on install");
        return self.skipWaiting();
      }),
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("[Service Worker] Activating Service Worker...");

  event.waitUntil(
    caches
      .keys()
      .then((keyList) => {
        return Promise.all(
          keyList.map((key) => {
            if (key !== CACHE_NAME) {
              console.log("[Service Worker] Removing old cache", key);
              return caches.delete(key);
            }
          }),
        );
      })
      .then(() => {
        console.log(
          "[Service Worker] Claiming clients for version",
          CACHE_NAME,
        );
        return self.clients.claim();
      }),
  );
});

// Fetch event - serve from cache or network
self.addEventListener("fetch", (event) => {
  // Skip cross-origin requests
  if (event.request.url.startsWith(self.location.origin)) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(event.request)
          .then((response) => {
            // Don't cache responses that aren't successful
            if (
              !response ||
              response.status !== 200 ||
              response.type !== "basic"
            ) {
              return response;
            }

            // Cache successful responses for future use
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });

            return response;
          })
          .catch(() => {
            // If fetch fails (offline), show offline page
            if (event.request.mode === "navigate") {
              return caches.match(OFFLINE_URL);
            }
          });
      }),
    );
  }
});

// Background sync for offline uploads
self.addEventListener("sync", (event) => {
  console.log("[Service Worker] Background Sync", event.tag);

  if (event.tag === "bol-upload") {
    event.waitUntil(syncBolUploads());
  }
});

// Push notification handler
self.addEventListener("push", (event) => {
  console.log("[Service Worker] Push Received", event);

  const data = event.data.json();
  const options = {
    body: data.body,
    icon: "/vite.svg",
    badge: "/vite.svg",
    vibrate: [100, 50, 100],
    data: {
      url: data.url || "/",
    },
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Notification click handler
self.addEventListener("notificationclick", (event) => {
  console.log("[Service Worker] Notification click received", event);

  event.notification.close();

  event.waitUntil(clients.openWindow(event.notification.data.url));
});

// Helper function to sync BOL uploads when back online
async function syncBolUploads() {
  try {
    // Get all pending uploads from IndexedDB
    const pendingUploads = await getPendingUploads();

    // Process each pending upload
    const uploadPromises = pendingUploads.map(async (upload) => {
      try {
        // Attempt to upload the file
        const response = await fetch("/api/upload-bol", {
          method: "POST",
          body: upload.formData,
          headers: {
            "X-Retry-Upload": "true",
          },
        });

        if (response.ok) {
          // If successful, remove from pending uploads
          await removePendingUpload(upload.id);
          return { success: true, id: upload.id };
        } else {
          return { success: false, id: upload.id };
        }
      } catch (error) {
        console.error("[Service Worker] Error uploading", upload.id, error);
        return { success: false, id: upload.id };
      }
    });

    return Promise.all(uploadPromises);
  } catch (error) {
    console.error("[Service Worker] Error in syncBolUploads", error);
    return Promise.reject(error);
  }
}

// These functions would be implemented with IndexedDB in a real app
function getPendingUploads() {
  // Placeholder - would actually retrieve from IndexedDB
  return Promise.resolve([]);
}

function removePendingUpload(id) {
  // Placeholder - would actually remove from IndexedDB
  return Promise.resolve();
}
