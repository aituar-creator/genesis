import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Послесвечение",
    short_name: "Послесвечение",
    description: "Дневник, который помнит, как ощущался день.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0d0f24",
    theme_color: "#0d0f24",
    lang: "ru",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
