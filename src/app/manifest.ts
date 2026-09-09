import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Pico — O ponto de encontro da areia.",
    short_name: "Pico",
    description: "Me acha no Pico. Encontre sua turma nos esportes de areia.",
    lang: "pt-BR",
    start_url: "/feed",
    scope: "/",
    display: "standalone",
    background_color: "#07080A",
    theme_color: "#07080A",
    icons: [
      { src: "/icons/pico-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/pico-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/pico-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
