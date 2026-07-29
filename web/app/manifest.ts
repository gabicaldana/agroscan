import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AgroScan — diagnóstico de doenças em plantas",
    short_name: "AgroScan",
    description:
      "Identifique doenças em culturas agrícolas pela câmera do celular, em campo e offline.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#15803d",
    lang: "pt-BR",
    dir: "ltr",
    categories: ["productivity", "utilities"],
    icons: [
      { src: "/icone-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icone-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icone-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        // Deixa o sistema recortar no formato dele sem cortar o desenho.
        purpose: "maskable",
      },
    ],
  };
}
