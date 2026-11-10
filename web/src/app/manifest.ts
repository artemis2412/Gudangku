import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "GUDANGKU — Manajemen Persediaan",
    short_name: "GUDANGKU",
    description: "Aplikasi manajemen stok dan gudang.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#f7f9f6",
    theme_color: "#236b4b",
    lang: "id-ID",
    categories: ["business", "productivity"],
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
