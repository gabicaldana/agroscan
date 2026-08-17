/**
 * GERADO AUTOMATICAMENTE por `npm run base` a partir de
 * data/contrato_modelo.json, que por sua vez e gerado por
 * `python -m app.modelo`. Nao editar a mao.
 *
 * Liga cada uma das 38 saidas do modelo de imagem a base de conhecimento.
 *
 * A ORDEM E COPIADA, NUNCA RECALCULADA. Nao existe nenhum `sort` de classes
 * neste lado do projeto, e nao pode passar a existir: a ordem canonica e
 * `sorted()` do Python, que ordena por ponto de codigo, e um `localeCompare`
 * ou um `sort()` padrao do JavaScript produziria outra. Trocar dois indices
 * faz o app responder a doenca errada, sempre da cultura certa, sem quebrar
 * tela nenhuma.
 *
 * `POR_CULTURA` so tem as culturas que o modelo cobre. As de
 * `IDS_FORA_DO_MODELO` estao AUSENTES dele de proposito, e nao presentes com
 * lista vazia: uma lista vazia seria indistinguivel de cultura inexistente, e
 * as duas pedem respostas diferentes - uma e bug, a outra e um fato que o
 * agronomo precisa ouvir antes de tirar a foto.
 */

export type TipoClasse = "doenca" | "saudavel";

export type ClasseModelo = {
  /** Posicao no vetor de saida do modelo. */
  indice: number;
  /** Rotulo do PlantVillage, com os erros de grafia do dataset preservados. */
  classe: string;
  culturaId: string;
  tipo: TipoClasse;
  /** Ficha que esta classe abre, ou null quando e uma classe saudavel. */
  doencaId: string | null;
};

export type Preprocessamento = {
  entrada: {
    largura: number;
    altura: number;
    canais: number;
    layout: string;
    tipo: string;
  };
  redimensionamento: {
    ladoMenor: number;
    recorte: string;
    metodo: string;
    cantosAlinhados: boolean;
  };
  normalizacao: { escala: number; media: number[]; desvio: number[] };
  saida: { tipo: string; classes: number };
};

/**
 * Limiares de recusa. Nulos ate a fase 4b medir a curva risco-cobertura:
 * chutar um numero daria ao agronomo uma recusa que nao significa nada.
 */
export type Recusa = {
  temperatura: number | null;
  limiarMsp: number | null;
  limiarEnergia: number | null;
  calibradoEm: string | null;
  /** Lembrete de que a pontuacao vai sobre os logits CRUS, antes da mascara. */
  medirSobre: string;
  saboresDeForaDaDistribuicao: string[];
};

export const TOTAL_DE_CLASSES: number = 38;

export const CLASSES: readonly ClasseModelo[] = [
  {
    "indice": 0,
    "classe": "Apple___Apple_scab",
    "culturaId": "Apple",
    "tipo": "doenca",
    "doencaId": "maca_sarna"
  },
  {
    "indice": 1,
    "classe": "Apple___Black_rot",
    "culturaId": "Apple",
    "tipo": "doenca",
    "doencaId": "maca_podridao_preta"
  },
  {
    "indice": 2,
    "classe": "Apple___Cedar_apple_rust",
    "culturaId": "Apple",
    "tipo": "doenca",
    "doencaId": "maca_ferrugem_cedro"
  },
  {
    "indice": 3,
    "classe": "Apple___healthy",
    "culturaId": "Apple",
    "tipo": "saudavel",
    "doencaId": null
  },
  {
    "indice": 4,
    "classe": "Blueberry___healthy",
    "culturaId": "Blueberry",
    "tipo": "saudavel",
    "doencaId": null
  },
  {
    "indice": 5,
    "classe": "Cherry_(including_sour)___Powdery_mildew",
    "culturaId": "Cherry",
    "tipo": "doenca",
    "doencaId": "cereja_oidio"
  },
  {
    "indice": 6,
    "classe": "Cherry_(including_sour)___healthy",
    "culturaId": "Cherry",
    "tipo": "saudavel",
    "doencaId": null
  },
  {
    "indice": 7,
    "classe": "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot",
    "culturaId": "Corn",
    "tipo": "doenca",
    "doencaId": "milho_cercosporiose"
  },
  {
    "indice": 8,
    "classe": "Corn_(maize)___Common_rust_",
    "culturaId": "Corn",
    "tipo": "doenca",
    "doencaId": "milho_ferrugem_comum"
  },
  {
    "indice": 9,
    "classe": "Corn_(maize)___Northern_Leaf_Blight",
    "culturaId": "Corn",
    "tipo": "doenca",
    "doencaId": "milho_helmintosporiose"
  },
  {
    "indice": 10,
    "classe": "Corn_(maize)___healthy",
    "culturaId": "Corn",
    "tipo": "saudavel",
    "doencaId": null
  },
  {
    "indice": 11,
    "classe": "Grape___Black_rot",
    "culturaId": "Grape",
    "tipo": "doenca",
    "doencaId": "uva_podridao_preta"
  },
  {
    "indice": 12,
    "classe": "Grape___Esca_(Black_Measles)",
    "culturaId": "Grape",
    "tipo": "doenca",
    "doencaId": "uva_esca"
  },
  {
    "indice": 13,
    "classe": "Grape___Leaf_blight_(Isariopsis_Leaf_Spot)",
    "culturaId": "Grape",
    "tipo": "doenca",
    "doencaId": "uva_mancha_das_folhas"
  },
  {
    "indice": 14,
    "classe": "Grape___healthy",
    "culturaId": "Grape",
    "tipo": "saudavel",
    "doencaId": null
  },
  {
    "indice": 15,
    "classe": "Orange___Haunglongbing_(Citrus_greening)",
    "culturaId": "Orange",
    "tipo": "doenca",
    "doencaId": "laranja_greening"
  },
  {
    "indice": 16,
    "classe": "Peach___Bacterial_spot",
    "culturaId": "Peach",
    "tipo": "doenca",
    "doencaId": "pessego_mancha_bacteriana"
  },
  {
    "indice": 17,
    "classe": "Peach___healthy",
    "culturaId": "Peach",
    "tipo": "saudavel",
    "doencaId": null
  },
  {
    "indice": 18,
    "classe": "Pepper,_bell___Bacterial_spot",
    "culturaId": "Pepper",
    "tipo": "doenca",
    "doencaId": "pimentao_mancha_bacteriana"
  },
  {
    "indice": 19,
    "classe": "Pepper,_bell___healthy",
    "culturaId": "Pepper",
    "tipo": "saudavel",
    "doencaId": null
  },
  {
    "indice": 20,
    "classe": "Potato___Early_blight",
    "culturaId": "Potato",
    "tipo": "doenca",
    "doencaId": "batata_pinta_preta"
  },
  {
    "indice": 21,
    "classe": "Potato___Late_blight",
    "culturaId": "Potato",
    "tipo": "doenca",
    "doencaId": "batata_requeima"
  },
  {
    "indice": 22,
    "classe": "Potato___healthy",
    "culturaId": "Potato",
    "tipo": "saudavel",
    "doencaId": null
  },
  {
    "indice": 23,
    "classe": "Raspberry___healthy",
    "culturaId": "Raspberry",
    "tipo": "saudavel",
    "doencaId": null
  },
  {
    "indice": 24,
    "classe": "Soybean___healthy",
    "culturaId": "Soybean",
    "tipo": "saudavel",
    "doencaId": null
  },
  {
    "indice": 25,
    "classe": "Squash___Powdery_mildew",
    "culturaId": "Squash",
    "tipo": "doenca",
    "doencaId": "abobora_oidio"
  },
  {
    "indice": 26,
    "classe": "Strawberry___Leaf_scorch",
    "culturaId": "Strawberry",
    "tipo": "doenca",
    "doencaId": "morango_queima_das_folhas"
  },
  {
    "indice": 27,
    "classe": "Strawberry___healthy",
    "culturaId": "Strawberry",
    "tipo": "saudavel",
    "doencaId": null
  },
  {
    "indice": 28,
    "classe": "Tomato___Bacterial_spot",
    "culturaId": "Tomato",
    "tipo": "doenca",
    "doencaId": "tomate_mancha_bacteriana"
  },
  {
    "indice": 29,
    "classe": "Tomato___Early_blight",
    "culturaId": "Tomato",
    "tipo": "doenca",
    "doencaId": "tomate_pinta_preta"
  },
  {
    "indice": 30,
    "classe": "Tomato___Late_blight",
    "culturaId": "Tomato",
    "tipo": "doenca",
    "doencaId": "tomate_requeima"
  },
  {
    "indice": 31,
    "classe": "Tomato___Leaf_Mold",
    "culturaId": "Tomato",
    "tipo": "doenca",
    "doencaId": "tomate_mofo_de_folha"
  },
  {
    "indice": 32,
    "classe": "Tomato___Septoria_leaf_spot",
    "culturaId": "Tomato",
    "tipo": "doenca",
    "doencaId": "tomate_septoriose"
  },
  {
    "indice": 33,
    "classe": "Tomato___Spider_mites Two-spotted_spider_mite",
    "culturaId": "Tomato",
    "tipo": "doenca",
    "doencaId": "tomate_acaro_rajado"
  },
  {
    "indice": 34,
    "classe": "Tomato___Target_Spot",
    "culturaId": "Tomato",
    "tipo": "doenca",
    "doencaId": "tomate_mancha_alvo"
  },
  {
    "indice": 35,
    "classe": "Tomato___Tomato_Yellow_Leaf_Curl_Virus",
    "culturaId": "Tomato",
    "tipo": "doenca",
    "doencaId": "tomate_geminivirus"
  },
  {
    "indice": 36,
    "classe": "Tomato___Tomato_mosaic_virus",
    "culturaId": "Tomato",
    "tipo": "doenca",
    "doencaId": "tomate_mosaico"
  },
  {
    "indice": 37,
    "classe": "Tomato___healthy",
    "culturaId": "Tomato",
    "tipo": "saudavel",
    "doencaId": null
  }
];

export const POR_CULTURA: Readonly<Record<string, readonly number[]>> = {
  "Apple": [
    0,
    1,
    2,
    3
  ],
  "Blueberry": [
    4
  ],
  "Cherry": [
    5,
    6
  ],
  "Corn": [
    7,
    8,
    9,
    10
  ],
  "Grape": [
    11,
    12,
    13,
    14
  ],
  "Orange": [
    15
  ],
  "Peach": [
    16,
    17
  ],
  "Pepper": [
    18,
    19
  ],
  "Potato": [
    20,
    21,
    22
  ],
  "Raspberry": [
    23
  ],
  "Soybean": [
    24
  ],
  "Squash": [
    25
  ],
  "Strawberry": [
    26,
    27
  ],
  "Tomato": [
    28,
    29,
    30,
    31,
    32,
    33,
    34,
    35,
    36,
    37
  ]
};

export const IDS_FORA_DO_MODELO: readonly string[] = [
  "Coffee",
  "Cotton",
  "Sugarcane"
];

export const PREPROCESSAMENTO: Preprocessamento = {
  "entrada": {
    "largura": 224,
    "altura": 224,
    "canais": 3,
    "layout": "NCHW",
    "tipo": "float32"
  },
  "redimensionamento": {
    "ladoMenor": 256,
    "recorte": "central",
    "metodo": "bilinear",
    "cantosAlinhados": false
  },
  "normalizacao": {
    "escala": 255,
    "media": [
      0.485,
      0.456,
      0.406
    ],
    "desvio": [
      0.229,
      0.224,
      0.225
    ]
  },
  "saida": {
    "tipo": "logits",
    "classes": 38
  }
};

export const RECUSA: Recusa = {
  "temperatura": null,
  "limiarMsp": null,
  "limiarEnergia": null,
  "calibradoEm": null,
  "medirSobre": "LOGITS CRUS, antes da mascara por cultura. A mascara renormaliza sobre as classes de uma cultura so, e isso faz QUALQUER imagem - inclusive uma mangueira apontada como tomate - sair com confianca alta. Calcular a recusa depois da mascara e o mesmo que nao ter recusa.",
  "saboresDeForaDaDistribuicao": [
    "cultura fora do dataset, DECLARADA na base - cana, cafe e algodao. O app nem chega a chamar o modelo quando o agronomo seleciona uma delas: `culturas_fora_do_modelo` resolve o caso antes da inferencia. Continuam sendo fora-da-distribuicao para o modelo, porque nada impede que uma folha de cafe seja fotografada com 'tomate' selecionado - e ai a recusa e a unica defesa.",
    "cultura fora do dataset e fora da base - feijao, trigo, manga. So a recusa pega, e depois dela a camada 3.",
    "cultura conhecida e classe desconhecida - doenca de soja, que o modelo so conhece saudavel. E o caso mais perigoso do app."
  ]
};

export const ARQUIVO: { nome: string | null; sha256: string | null } = {
  "nome": null,
  "sha256": null
};
