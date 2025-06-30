import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CAPTURE - Temporal Notes",
    short_name: "CAPTURE",
    description: "Capture thoughts before they fade - Notes with expiration dates",
    start_url: "/",
    display: "standalone",
    background_color: "#fde047",
    theme_color: "#000000",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable any",
      },
    ],
    categories: ["productivity", "utilities"],
    screenshots: [
      {
        src: "/screenshot-wide.png",
        sizes: "1280x720",
        type: "image/png",
        form_factor: "wide",
      },
      {
        src: "/screenshot-narrow.png",
        sizes: "640x1136",
        type: "image/png",
        form_factor: "narrow",
      },
    ],
  }
}
