import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: process.env.NEXT_PUBLIC_PICO_ENV === "beta" ? "Pico Club" : "Pico Club Desenvolvimento",
    short_name: process.env.NEXT_PUBLIC_PICO_ENV === "beta" ? "Pico Club" : "Pico Club Dev",
    description: "Me acha no Pico. Encontre sua turma nos esportes de areia.",
    lang: "pt-BR",
    start_url: "/feed",
    scope: "/",
    display: "standalone",
    background_color: "#F8F3E7",
    theme_color: "#F8F3E7",
    icons: [
      { src: "/icons/pico-club-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/pico-club-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/pico-club-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
