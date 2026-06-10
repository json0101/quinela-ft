import type { MetadataRoute } from "next";

// Web App Manifest: permite instalar la quiniela como app (PWA).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Quiniela Mundial 2026",
    short_name: "Quiniela",
    description: "Predicciones y ranking de la Quiniela del Mundial 2026.",
    start_url: "/quinela/calendario",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#F5F6FA",
    theme_color: "#E4002B",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon-maskable.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
