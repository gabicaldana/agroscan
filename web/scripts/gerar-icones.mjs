/**
 * Gera os ícones do PWA a partir de um SVG inline.
 *
 * Rodar: node scripts/gerar-icones.mjs
 *
 * Mantém os ícones reprodutíveis a partir do código, em vez de binários
 * opacos versionados sem origem. `sharp` já vem como dependência do Next.
 */
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const VERDE = "#15803d";
const BRANCO = "#ffffff";

/** Folha estilizada dentro de uma moldura de visor — o gesto do app. */
function svg({ fundo, traco, escala }) {
  const margem = (1 - escala) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="${fundo}"/>
  <g transform="translate(${512 * margem} ${512 * margem}) scale(${escala})"
     fill="none" stroke="${traco}" stroke-width="30"
     stroke-linecap="round" stroke-linejoin="round">
    <path d="M40 150V80a40 40 0 0 1 40-40h70"/>
    <path d="M362 40h70a40 40 0 0 1 40 40v70"/>
    <path d="M472 362v70a40 40 0 0 1-40 40h-70"/>
    <path d="M150 472H80a40 40 0 0 1-40-40v-70"/>
    <path d="M256 372c-62 0-104-42-104-104 0-62 42-136 104-136s104 74 104 136c0 62-42 104-104 104Z"/>
    <path d="M256 372V180"/>
    <path d="M256 250l52-46M256 300l-52-46"/>
  </g>
</svg>`;
}

const SAIDA = new URL("../public/", import.meta.url);

async function gerar(nome, tamanho, opcoes) {
  // fileURLToPath em vez de `.pathname`: no Windows o pathname vem como
  // "/C:/..." e o sharp nao abre esse caminho.
  const destino = fileURLToPath(new URL(nome, SAIDA));
  await sharp(Buffer.from(svg(opcoes)))
    .resize(tamanho, tamanho)
    .png()
    .toFile(destino);
  console.log(`  ${nome} (${tamanho}x${tamanho})`);
}

await mkdir(fileURLToPath(SAIDA), { recursive: true });
console.log("Gerando ícones:");

// Ícones comuns: desenho ocupa quase todo o quadro.
await gerar("icone-192.png", 192, { fundo: BRANCO, traco: VERDE, escala: 0.86 });
await gerar("icone-512.png", 512, { fundo: BRANCO, traco: VERDE, escala: 0.86 });

// Maskable: fundo cheio e desenho dentro da zona segura (~80%), para o
// sistema recortar em círculo/squircle sem decepar o traço.
await gerar("icone-maskable-512.png", 512, {
  fundo: VERDE,
  traco: BRANCO,
  escala: 0.62,
});

// Favicon em PNG, referenciado por app/icon.png.
await gerar("../app/icon.png", 96, {
  fundo: BRANCO,
  traco: VERDE,
  escala: 0.86,
});

console.log("Pronto.");
