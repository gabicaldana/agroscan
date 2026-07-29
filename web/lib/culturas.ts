/**
 * As 14 culturas cobertas pelo modelo local (recorte do PlantVillage).
 *
 * O `id` casa com o prefixo das classes do dataset (`Tomato___Early_blight`),
 * porque e ele que vai selecionar quais saidas do modelo permanecem ativas
 * na mascara por cultura — ver `lib/modelo.ts` (fase 5).
 *
 * Fora desta lista o app nao chuta: recusa e oferece a analise avancada.
 */
export type Cultura = {
  id: string;
  nome: string;
  nomeCientifico: string;
  emoji: string;
};

export const CULTURAS: readonly Cultura[] = [
  { id: "Apple", nome: "Maçã", nomeCientifico: "Malus domestica", emoji: "🍎" },
  { id: "Blueberry", nome: "Mirtilo", nomeCientifico: "Vaccinium spp.", emoji: "🫐" },
  { id: "Cherry", nome: "Cereja", nomeCientifico: "Prunus avium", emoji: "🍒" },
  { id: "Corn", nome: "Milho", nomeCientifico: "Zea mays", emoji: "🌽" },
  { id: "Grape", nome: "Uva", nomeCientifico: "Vitis vinifera", emoji: "🍇" },
  { id: "Orange", nome: "Laranja", nomeCientifico: "Citrus sinensis", emoji: "🍊" },
  { id: "Peach", nome: "Pêssego", nomeCientifico: "Prunus persica", emoji: "🍑" },
  { id: "Pepper", nome: "Pimentão", nomeCientifico: "Capsicum annuum", emoji: "🫑" },
  { id: "Potato", nome: "Batata", nomeCientifico: "Solanum tuberosum", emoji: "🥔" },
  { id: "Raspberry", nome: "Framboesa", nomeCientifico: "Rubus idaeus", emoji: "🍇" },
  { id: "Soybean", nome: "Soja", nomeCientifico: "Glycine max", emoji: "🌱" },
  { id: "Squash", nome: "Abóbora", nomeCientifico: "Cucurbita spp.", emoji: "🎃" },
  { id: "Strawberry", nome: "Morango", nomeCientifico: "Fragaria × ananassa", emoji: "🍓" },
  { id: "Tomato", nome: "Tomate", nomeCientifico: "Solanum lycopersicum", emoji: "🍅" },
] as const;
