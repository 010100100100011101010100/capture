const CACHE_NAME = "capture-pwa-v1"
const STATIC_ASSETS = ["/", "/manifest.json"]

// Install event
self.addEventListener("install", (event) => {
  console.log("Service Worker installing...")
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Caching static assets")
      return cache.addAll(STATIC_ASSETS)
    }),
  )
  self.skipWaiting()
})

// Activate event
self.addEventListener("activate", (event) => {
  console.log("Service Worker activating...")
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("Deleting old cache:", cacheName)
            return caches.delete(cacheName)
          }
        }),
      )
    }),
  )
  self.clients.claim()
})

// Fetch event
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return

  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response
      }
      return fetch(event.request).catch(() => {
        if (event.request.destination === "document") {
          return new Response(
            `
            <!DOCTYPE html>
            <html>
            <head>
              <title>CAPTURE - Offline</title>
              <style>
                body { 
                  font-family: system-ui; 
                  background: #fde047; 
                  padding: 20px; 
                  text-align: center; 
                  margin: 0;
                }
                .container { 
                  background: white; 
                  border: 4px solid black; 
                  padding: 40px; 
                  max-width: 400px; 
                  margin: 50px auto;
                  box-shadow: 6px 6px 0px 0px rgba(0,0,0,1);
                }
                h1 { 
                  font-size: 3rem; 
                  font-weight: 900; 
                  margin: 0 0 20px 0; 
                }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>CAPTURE</h1>
                <p><strong>You're offline!</strong></p>
                <p>Your notes are still here and will sync when you're back online.</p>
                <button onclick="window.location.reload()" style="
                  background: #3b82f6;
                  color: white;
                  border: 4px solid black;
                  padding: 12px 24px;
                  font-weight: bold;
                  cursor: pointer;
                ">TRY AGAIN</button>
              </div>
            </body>
            </html>
          `,
            {
              headers: { "Content-Type": "text/html" },
            },
          )
        }
      })
    }),
  )
})
