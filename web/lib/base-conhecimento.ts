/**
 * GERADO AUTOMATICAMENTE por `npm run base` a partir de
 * data/base_conhecimento.json. Nao editar a mao: a proxima geracao
 * sobrescreve.
 *
 * O `id` da cultura e o nome curto usado no app. Ele NAO e necessariamente
 * o prefixo da classe no PlantVillage - `prefixoModelo` e quem carrega isso,
 * e os dois diferem em Cherry_(including_sour), Corn_(maize) e Pepper,_bell.
 * Quem precisa casar cultura com saida do modelo usa contrato-modelo.ts, que
 * ja traz os indices resolvidos.
 */

export type OrgaoId = "folha" | "caule" | "fruto" | "planta";
export type TipoTratamento = "cultural" | "biologico" | "quimico";
export type Gravidade = 1 | 2 | 3 | 4 | 5;

export type Orgao = {
  id: OrgaoId;
  /** Rotulo do grupo na tela de sintomas ("Na folha"). */
  rotulo: string;
  /** Ordem em que o agronomo olha a planta - nao e a ordem alfabetica. */
  ordem: number;
};

export type Sintoma = { id: string; nome: string; orgao: OrgaoId };

/** Peso de 0 a 1: 1.0 e o sintoma classico da doenca, 0.3 o ocasional. */
export type SintomaDoPerfil = { id: string; peso: number };

export type Tratamento = { tipo: TipoTratamento; descricao: string };

export type IngredienteAtivo = { nome: string; grupo: string; acao: string };

export type CondicoesFavoraveis = {
  temperatura: string;
  umidade: string;
  observacao: string;
};

export type Doenca = {
  id: string;
  /** Classe do PlantVillage, ou null quando o modelo nao a conhece. */
  classeModelo: string | null;
  nome: string;
  agente: string;
  tipoAgente: string;
  gravidade: Gravidade;
  descricao: string;
  sintomas: SintomaDoPerfil[];
  condicoesFavoraveis: CondicoesFavoraveis;
  tratamentos: Tratamento[];
  ingredientesAtivos: IngredienteAtivo[];
};

export type Cultura = {
  id: string;
  /**
   * Prefixo desta cultura nas classes do PlantVillage. Difere do id em tres.
   *
   * `null` quando o dataset nao contem a cultura de forma alguma - cana, cafe
   * e algodao, que entraram na base por serem lavouras centrais no Brasil.
   * Quem precisa saber se o modelo cobre uma cultura NAO deve testar este
   * campo: use `foraDoModelo` em modelo.ts, que le a lista do contrato.
   */
  prefixoModelo: string | null;
  nome: string;
  nomeCientifico: string;
  emoji: string;
  doencas: Doenca[];
};

/** Uma das 12 classes "healthy" do dataset. Nao e doenca e nao tem sintomas:
 *  so existe para o modelo ter para onde apontar quando nao reconhece nada. */
export type ClasseSaudavel = {
  culturaId: string;
  classeModelo: string;
  /** So presente quando ha algo especifico daquela cultura a dizer. */
  observacao?: string;
};

/** Cultura que existe no dataset, mas sem a classe "healthy" - laranja e
 *  abobora. O modelo responde por ela, mas nunca "sem doenca". */
export type CulturaSemClasseSaudavel = { culturaId: string; motivo: string };

/**
 * Cultura que o PlantVillage NAO CONTEM - nem doente, nem saudavel.
 *
 * Nao confundir com `CulturaSemClasseSaudavel`: la o modelo responde e so nao
 * sabe dizer "saudavel"; aqui ele nao tem saida nenhuma, e esperar a fase 4b
 * nao muda isso. O `motivo` e o que o app mostra ao agronomo, para a ausencia
 * nao parecer falha do aplicativo.
 */
export type CulturaForaDoModelo = { culturaId: string; motivo: string };

export const ORGAOS: readonly Orgao[] = [
  {
    "id": "folha",
    "rotulo": "Na folha",
    "ordem": 1
  },
  {
    "id": "caule",
    "rotulo": "No caule, ramo ou tronco",
    "ordem": 2
  },
  {
    "id": "fruto",
    "rotulo": "No fruto",
    "ordem": 3
  },
  {
    "id": "planta",
    "rotulo": "Na planta inteira",
    "ordem": 4
  }
];

export const SINTOMAS: readonly Sintoma[] = [
  {
    "id": "manchas_escuras_aneis",
    "nome": "Manchas escuras com anéis concêntricos, como um alvo",
    "orgao": "folha"
  },
  {
    "id": "manchas_amareladas",
    "nome": "Manchas amareladas (cloróticas)",
    "orgao": "folha"
  },
  {
    "id": "manchas_encharcadas",
    "nome": "Lesões encharcadas, com aspecto de queimadura",
    "orgao": "folha"
  },
  {
    "id": "manchas_pequenas_centro_claro",
    "nome": "Manchas pequenas com centro claro e borda escura",
    "orgao": "folha"
  },
  {
    "id": "pontuacoes_pretas_na_lesao",
    "nome": "Pontinhos pretos dentro da lesão",
    "orgao": "folha"
  },
  {
    "id": "mofo_branco_face_inferior",
    "nome": "Mofo esbranquiçado na face inferior da folha",
    "orgao": "folha"
  },
  {
    "id": "mofo_oliva_face_inferior",
    "nome": "Mofo aveludado verde-oliva a pardo na face inferior",
    "orgao": "folha"
  },
  {
    "id": "po_branco_superficie",
    "nome": "Pó branco, farináceo, na superfície da folha",
    "orgao": "folha"
  },
  {
    "id": "pustulas_ferruginosas",
    "nome": "Pústulas cor de ferrugem que soltam pó",
    "orgao": "folha"
  },
  {
    "id": "manchas_oliva_aveludadas",
    "nome": "Manchas verde-oliva de aspecto aveludado",
    "orgao": "folha"
  },
  {
    "id": "manchas_alongadas_entre_nervuras",
    "nome": "Lesões retangulares alongadas, limitadas pelas nervuras",
    "orgao": "folha"
  },
  {
    "id": "lesoes_charuto",
    "nome": "Lesões grandes e alongadas, em forma de charuto",
    "orgao": "folha"
  },
  {
    "id": "manchas_angulares_halo_amarelo",
    "nome": "Manchas angulares com halo amarelo ao redor",
    "orgao": "folha"
  },
  {
    "id": "manchas_angulares_escuras",
    "nome": "Manchas angulares escuras, delimitadas pelas nervuras",
    "orgao": "folha"
  },
  {
    "id": "furos_tiro_espingarda",
    "nome": "Centro da mancha seca e cai, deixando furos na folha",
    "orgao": "folha"
  },
  {
    "id": "manchas_purpuras",
    "nome": "Manchas arroxeadas que se juntam",
    "orgao": "folha"
  },
  {
    "id": "borda_folha_queimada",
    "nome": "Bordas da folha secas, com aspecto chamuscado",
    "orgao": "folha"
  },
  {
    "id": "manchas_alaranjadas",
    "nome": "Manchas alaranjadas brilhantes na face superior",
    "orgao": "folha"
  },
  {
    "id": "ecios_face_inferior",
    "nome": "Estruturas tubulares ou pilosas sob a mancha, na face inferior",
    "orgao": "folha"
  },
  {
    "id": "mosaico_verde_claro_escuro",
    "nome": "Mosaico de verde claro e verde escuro",
    "orgao": "folha"
  },
  {
    "id": "mosqueado_assimetrico",
    "nome": "Mosqueado amarelo assimétrico, diferente dos dois lados da nervura",
    "orgao": "folha"
  },
  {
    "id": "nervuras_amareladas",
    "nome": "Amarelecimento entre as nervuras",
    "orgao": "folha"
  },
  {
    "id": "faixas_necroticas_entre_nervuras",
    "nome": "Faixas amareladas e secas entre as nervuras (aspecto tigrado)",
    "orgao": "folha"
  },
  {
    "id": "folhas_deformadas",
    "nome": "Folhas deformadas, enroladas ou reduzidas",
    "orgao": "folha"
  },
  {
    "id": "folhas_filiformes",
    "nome": "Folhas estreitas e filiformes, com aspecto de samambaia",
    "orgao": "folha"
  },
  {
    "id": "pontuacoes_finas_cloroticas",
    "nome": "Pontuações finas e claras, como picadas de agulha",
    "orgao": "folha"
  },
  {
    "id": "bronzeamento_folha",
    "nome": "Folha bronzeada, cor de palha",
    "orgao": "folha"
  },
  {
    "id": "teia_fina",
    "nome": "Teia fina entre as folhas e hastes",
    "orgao": "folha"
  },
  {
    "id": "acaros_face_inferior",
    "nome": "Ácaros minúsculos na face inferior (visíveis com lupa)",
    "orgao": "folha"
  },
  {
    "id": "insetos_face_inferior",
    "nome": "Insetos pequenos na face inferior da folha",
    "orgao": "folha"
  },
  {
    "id": "pustulas_alaranjadas_face_inferior",
    "nome": "Pústulas alaranjadas e pulverulentas na face inferior",
    "orgao": "folha"
  },
  {
    "id": "manchas_angulares_esbranquicadas",
    "nome": "Manchas angulares esbranquiçadas ou acinzentadas, limitadas pelas nervuras",
    "orgao": "folha"
  },
  {
    "id": "manchas_circulares_centro_cinza_halo",
    "nome": "Manchas circulares com centro cinza-claro e halo amarelo",
    "orgao": "folha"
  },
  {
    "id": "lesoes_estreladas_folha",
    "nome": "Lesões de bordas rasgadas, em forma de estrela",
    "orgao": "folha"
  },
  {
    "id": "folhas_verde_azulado",
    "nome": "Folhas de verde muito escuro, quase azulado, e quebradiças",
    "orgao": "folha"
  },
  {
    "id": "lesoes_no_caule",
    "nome": "Lesões escuras no caule ou haste",
    "orgao": "caule"
  },
  {
    "id": "cancro_no_ramo",
    "nome": "Cancro deprimido no ramo ou tronco",
    "orgao": "caule"
  },
  {
    "id": "micelio_branco_no_caule",
    "nome": "Mofo branco cotonoso no caule, com grãos pretos por dentro",
    "orgao": "caule"
  },
  {
    "id": "madeira_escura_no_corte",
    "nome": "Madeira escurecida ao cortar o ramo",
    "orgao": "caule"
  },
  {
    "id": "morte_de_ramos",
    "nome": "Seca e morte de ramos ou braços inteiros",
    "orgao": "caule"
  },
  {
    "id": "morte_de_ponteiro",
    "nome": "Seca e morte do ponteiro (o broto do topo)",
    "orgao": "caule"
  },
  {
    "id": "nos_internos_avermelhados",
    "nome": "Pontos ou traços avermelhados nos nós, ao cortar o colmo",
    "orgao": "caule"
  },
  {
    "id": "lesoes_no_fruto",
    "nome": "Lesões deprimidas ou podridão no fruto",
    "orgao": "fruto"
  },
  {
    "id": "crostas_no_fruto",
    "nome": "Crostas ásperas e rachaduras na casca do fruto",
    "orgao": "fruto"
  },
  {
    "id": "podridao_aneis_fruto",
    "nome": "Podridão firme no fruto, com anéis concêntricos",
    "orgao": "fruto"
  },
  {
    "id": "frutos_mumificados",
    "nome": "Frutos secos e mumificados presos à planta",
    "orgao": "fruto"
  },
  {
    "id": "manchas_salientes_fruto",
    "nome": "Manchas ásperas e salientes, tipo verruga, no fruto",
    "orgao": "fruto"
  },
  {
    "id": "frutos_pequenos_assimetricos",
    "nome": "Frutos pequenos, tortos e com sementes abortadas",
    "orgao": "fruto"
  },
  {
    "id": "queda_de_frutos",
    "nome": "Queda prematura de frutos",
    "orgao": "fruto"
  },
  {
    "id": "perfuracao_no_fruto",
    "nome": "Furo redondo perto da coroa do fruto, às vezes com serragem",
    "orgao": "fruto"
  },
  {
    "id": "desfolha_baixo_para_cima",
    "nome": "Queda de folhas começando pelas mais baixas",
    "orgao": "planta"
  },
  {
    "id": "queda_precoce_folhas",
    "nome": "Queda precoce de folhas por toda a planta",
    "orgao": "planta"
  },
  {
    "id": "murcha",
    "nome": "Murcha da planta",
    "orgao": "planta"
  },
  {
    "id": "crescimento_reduzido",
    "nome": "Crescimento reduzido / nanismo",
    "orgao": "planta"
  },
  {
    "id": "amarelecimento_setorizado",
    "nome": "Amarelecimento concentrado num ramo ou setor da planta",
    "orgao": "planta"
  },
  {
    "id": "chicote_preto_no_apice",
    "nome": "Chicote preto e recurvado saindo do topo da planta",
    "orgao": "planta"
  },
  {
    "id": "superbrotamento",
    "nome": "Superbrotamento: muitos ramos curtos saindo do mesmo ponto",
    "orgao": "planta"
  },
  {
    "id": "internodios_curtos",
    "nome": "Entrenós curtos, planta compacta e atarracada",
    "orgao": "planta"
  }
];

export const CULTURAS: readonly Cultura[] = [
  {
    "id": "Apple",
    "prefixoModelo": "Apple",
    "nome": "Maçã",
    "nomeCientifico": "Malus domestica",
    "emoji": "🍎",
    "doencas": [
      {
        "id": "maca_sarna",
        "classeModelo": "Apple___Apple_scab",
        "nome": "Sarna da macieira",
        "agente": "Venturia inaequalis",
        "tipoAgente": "fungo",
        "gravidade": 4,
        "descricao": "A principal doença da macieira em regiões de primavera chuvosa. Nas folhas produz manchas verde-oliva de aspecto aveludado, com bordas difusas, que depois escurecem e provocam queda precoce. No fruto forma crostas ásperas que rompem a casca e causam rachaduras, inviabilizando a comercialização mesmo quando a polpa está sã.",
        "sintomas": [
          {
            "id": "manchas_oliva_aveludadas",
            "peso": 1
          },
          {
            "id": "crostas_no_fruto",
            "peso": 0.8
          },
          {
            "id": "queda_precoce_folhas",
            "peso": 0.7
          },
          {
            "id": "folhas_deformadas",
            "peso": 0.5
          },
          {
            "id": "manchas_amareladas",
            "peso": 0.3
          }
        ],
        "condicoesFavoraveis": {
          "temperatura": "16 a 22 °C",
          "umidade": "Molhamento foliar contínuo de 9 h ou mais",
          "observacao": "O inóculo primário sai das folhas caídas no inverno, liberado a cada chuva de primavera. A tabela de Mills relaciona temperatura e horas de molhamento para prever a infecção - é ela que define quando pulverizar, não o calendário."
        },
        "tratamentos": [
          {
            "tipo": "cultural",
            "descricao": "Recolher ou triturar as folhas caídas no inverno: é nelas que o fungo passa a entressafra."
          },
          {
            "tipo": "cultural",
            "descricao": "Poda de arejamento para encurtar o tempo de folha molhada dentro da copa."
          },
          {
            "tipo": "cultural",
            "descricao": "Preferir cultivares com resistência quando o mercado permitir."
          },
          {
            "tipo": "quimico",
            "descricao": "Protetores durante todo o período de liberação de ascósporos, com o momento definido por horas de molhamento e temperatura."
          }
        ],
        "ingredientesAtivos": [
          {
            "nome": "Mancozebe",
            "grupo": "Ditiocarbamato",
            "acao": "protetor"
          },
          {
            "nome": "Captana",
            "grupo": "Ftalimida",
            "acao": "protetor"
          },
          {
            "nome": "Difenoconazol",
            "grupo": "Triazol",
            "acao": "sistêmico"
          },
          {
            "nome": "Trifloxistrobina",
            "grupo": "Estrobilurina",
            "acao": "sistêmico"
          }
        ]
      },
      {
        "id": "maca_podridao_preta",
        "classeModelo": "Apple___Black_rot",
        "nome": "Podridão-preta (mancha-olho-de-rã)",
        "agente": "Botryosphaeria obtusa (Diplodia seriata)",
        "tipoAgente": "fungo",
        "gravidade": 4,
        "descricao": "Ataca folha, ramo e fruto com sintomas bem diferentes entre si. Na folha faz manchas circulares pequenas com centro claro e borda arroxeada, que lembram um olho de rã. No fruto causa podridão firme, escura, com anéis concêntricos nítidos. No ramo forma cancros deprimidos que servem de reservatório do fungo de um ano para o outro.",
        "sintomas": [
          {
            "id": "manchas_pequenas_centro_claro",
            "peso": 1
          },
          {
            "id": "podridao_aneis_fruto",
            "peso": 0.9
          },
          {
            "id": "cancro_no_ramo",
            "peso": 0.7
          },
          {
            "id": "manchas_purpuras",
            "peso": 0.6
          },
          {
            "id": "frutos_mumificados",
            "peso": 0.6
          }
        ],
        "condicoesFavoraveis": {
          "temperatura": "20 a 27 °C",
          "umidade": "Alta, com chuva prolongada",
          "observacao": "É uma doença de pomar mal limpo: cancros, ramos mortos e frutos mumificados que ficam na planta são a fonte de inóculo do ano seguinte. O fungo entra por ferimentos, então granizo e danos de colheita disparam o problema."
        },
        "tratamentos": [
          {
            "tipo": "cultural",
            "descricao": "Retirar e queimar ramos mortos, cancros e frutos mumificados - a limpeza vale mais que qualquer pulverização aqui."
          },
          {
            "tipo": "cultural",
            "descricao": "Evitar ferimentos na colheita e no manuseio; o fungo precisa de porta de entrada."
          },
          {
            "tipo": "cultural",
            "descricao": "Manter o pomar vigoroso: plantas estressadas formam mais cancros."
          },
          {
            "tipo": "quimico",
            "descricao": "Protetores da floração à pré-colheita, com reforço após granizo."
          }
        ],
        "ingredientesAtivos": [
          {
            "nome": "Captana",
            "grupo": "Ftalimida",
            "acao": "protetor"
          },
          {
            "nome": "Mancozebe",
            "grupo": "Ditiocarbamato",
            "acao": "protetor"
          },
          {
            "nome": "Tebuconazol",
            "grupo": "Triazol",
            "acao": "sistêmico"
          }
        ]
      },
      {
        "id": "maca_ferrugem_cedro",
        "classeModelo": "Apple___Cedar_apple_rust",
        "nome": "Ferrugem-do-cedro",
        "agente": "Gymnosporangium juniperi-virginianae",
        "tipoAgente": "fungo",
        "gravidade": 3,
        "descricao": "Forma manchas alaranjadas brilhantes na face superior da folha, quase luminosas, com pontuações escuras no centro. Na face inferior, sob a mancha, surgem estruturas tubulares e pilosas. O ciclo é obrigatoriamente alternante: o fungo precisa de um junípero por perto para se completar - sem ele, a doença não existe.",
        "sintomas": [
          {
            "id": "manchas_alaranjadas",
            "peso": 1
          },
          {
            "id": "ecios_face_inferior",
            "peso": 0.9
          },
          {
            "id": "pontuacoes_pretas_na_lesao",
            "peso": 0.5
          },
          {
            "id": "queda_precoce_folhas",
            "peso": 0.5
          },
          {
            "id": "lesoes_no_fruto",
            "peso": 0.3
          }
        ],
        "condicoesFavoraveis": {
          "temperatura": "10 a 24 °C",
          "umidade": "Chuvas de primavera, com folha molhada por 4 h ou mais",
          "observacao": "O inóculo vem das galhas gelatinosas do junípero após as primeiras chuvas quentes da primavera, e viaja quilômetros pelo vento. A doença não se propaga de macieira para macieira: sem o hospedeiro alternativo o ciclo quebra."
        },
        "tratamentos": [
          {
            "tipo": "cultural",
            "descricao": "Eliminar juníperos ornamentais num raio de algumas centenas de metros - é o controle mais eficaz que existe para esta doença."
          },
          {
            "tipo": "cultural",
            "descricao": "Escolher cultivares resistentes em regiões onde há junípero nativo."
          },
          {
            "tipo": "quimico",
            "descricao": "Triazóis do rompimento das gemas até cerca de duas semanas após a queda das pétalas, que é a janela de infecção."
          }
        ],
        "ingredientesAtivos": [
          {
            "nome": "Miclobutanil",
            "grupo": "Triazol",
            "acao": "sistêmico"
          },
          {
            "nome": "Tebuconazol",
            "grupo": "Triazol",
            "acao": "sistêmico"
          },
          {
            "nome": "Mancozebe",
            "grupo": "Ditiocarbamato",
            "acao": "protetor"
          }
        ]
      }
    ]
  },
  {
    "id": "Blueberry",
    "prefixoModelo": "Blueberry",
    "nome": "Mirtilo",
    "nomeCientifico": "Vaccinium spp.",
    "emoji": "🫐",
    "doencas": []
  },
  {
    "id": "Cherry",
    "prefixoModelo": "Cherry_(including_sour)",
    "nome": "Cereja",
    "nomeCientifico": "Prunus avium",
    "emoji": "🍒",
    "doencas": [
      {
        "id": "cereja_oidio",
        "classeModelo": "Cherry_(including_sour)___Powdery_mildew",
        "nome": "Oídio da cerejeira",
        "agente": "Podosphaera clandestina",
        "tipoAgente": "fungo",
        "gravidade": 3,
        "descricao": "Recobre as folhas novas com um pó branco farináceo. As folhas atacadas ainda em expansão ficam deformadas e enroladas, porque o fungo trava o crescimento de um lado do limbo. Ataca preferencialmente as brotações jovens e vigorosas do interior da copa, onde há sombra e pouco vento.",
        "sintomas": [
          {
            "id": "po_branco_superficie",
            "peso": 1
          },
          {
            "id": "folhas_deformadas",
            "peso": 0.6
          },
          {
            "id": "manchas_amareladas",
            "peso": 0.3
          },
          {
            "id": "lesoes_no_fruto",
            "peso": 0.3
          }
        ],
        "condicoesFavoraveis": {
          "temperatura": "21 a 27 °C",
          "umidade": "Moderada - não exige molhamento foliar",
          "observacao": "É a exceção entre os fungos foliares: água livre na folha atrapalha a germinação do oídio. Por isso ele aparece justamente nos períodos secos e no interior sombreado da copa, e não depois da chuva."
        },
        "tratamentos": [
          {
            "tipo": "cultural",
            "descricao": "Poda de arejamento e de abertura da copa, que reduz a sombra e o abrigo."
          },
          {
            "tipo": "cultural",
            "descricao": "Evitar excesso de nitrogênio e irrigação tardia, que estimulam brotação nova e suscetível."
          },
          {
            "tipo": "biologico",
            "descricao": "Bacillus subtilis em programa preventivo tem bom efeito sobre oídios."
          },
          {
            "tipo": "quimico",
            "descricao": "Enxofre ou triazóis, alternando modos de ação - oídios desenvolvem resistência rápido."
          }
        ],
        "ingredientesAtivos": [
          {
            "nome": "Enxofre",
            "grupo": "Inorgânico",
            "acao": "protetor"
          },
          {
            "nome": "Miclobutanil",
            "grupo": "Triazol",
            "acao": "sistêmico"
          },
          {
            "nome": "Trifloxistrobina",
            "grupo": "Estrobilurina",
            "acao": "sistêmico"
          }
        ]
      }
    ]
  },
  {
    "id": "Coffee",
    "prefixoModelo": null,
    "nome": "Café",
    "nomeCientifico": "Coffea arabica",
    "emoji": "☕",
    "doencas": [
      {
        "id": "cafe_ferrugem",
        "classeModelo": null,
        "nome": "Ferrugem do cafeeiro",
        "agente": "Hemileia vastatrix",
        "tipoAgente": "fungo",
        "gravidade": 5,
        "descricao": "A doença mais cara da cafeicultura brasileira. Começa como mancha amarelada translúcida vista contra a luz e, na face inferior, forma a massa alaranjada de esporos que dá nome à doença. A perda vem da desfolha: a planta que perde folha em plena granação não enche o grão e ainda compromete a florada do ano seguinte, o que faz a bienalidade da lavoura piorar.",
        "sintomas": [
          {
            "id": "pustulas_alaranjadas_face_inferior",
            "peso": 1
          },
          {
            "id": "manchas_amareladas",
            "peso": 0.8
          },
          {
            "id": "desfolha_baixo_para_cima",
            "peso": 0.8
          },
          {
            "id": "queda_precoce_folhas",
            "peso": 0.5
          }
        ],
        "condicoesFavoraveis": {
          "temperatura": "21 a 25 °C",
          "umidade": "Molhamento foliar por 24 h ou mais, com chuva frequente",
          "observacao": "A epidemia acompanha a estação chuvosa e é mais severa nos talhões de carga pendente alta - a planta cheia de fruto tem menos reserva para resistir. Por isso o controle começa antes do sintoma aparecer, e não depois."
        },
        "tratamentos": [
          {
            "tipo": "cultural",
            "descricao": "Cultivares com resistência (Catuaí resistente, IPR, Arara e similares) - é a medida de maior efeito e a única que não depende de calendário."
          },
          {
            "tipo": "cultural",
            "descricao": "Adubação equilibrada e manejo da carga pendente: planta debilitada por excesso de fruto adoece mais."
          },
          {
            "tipo": "cultural",
            "descricao": "Podas e espaçamento que arejem a saia do cafeeiro, reduzindo o tempo de molhamento foliar."
          },
          {
            "tipo": "quimico",
            "descricao": "Programa preventivo iniciado antes do pico epidêmico, alternando cobre protetor com misturas de triazol e estrobilurina. Aplicar depois da desfolha instalada é gasto sem retorno."
          }
        ],
        "ingredientesAtivos": [
          {
            "nome": "Oxicloreto de cobre",
            "grupo": "Inorgânico",
            "acao": "protetor"
          },
          {
            "nome": "Epoxiconazol + Piraclostrobina",
            "grupo": "Triazol + Estrobilurina",
            "acao": "sistêmico"
          },
          {
            "nome": "Ciproconazol + Azoxistrobina",
            "grupo": "Triazol + Estrobilurina",
            "acao": "sistêmico"
          }
        ]
      },
      {
        "id": "cafe_cercosporiose",
        "classeModelo": null,
        "nome": "Cercosporiose (mancha-de-olho-pardo)",
        "agente": "Cercospora coffeicola",
        "tipoAgente": "fungo",
        "gravidade": 3,
        "descricao": "Manchas circulares pardas com centro cinza-claro e halo amarelo - o desenho que lhe dá o nome de olho-pardo. Ataca folha e fruto: no fruto provoca depressão e maturação forçada, que derruba a qualidade da bebida. É doença de desequilíbrio, não de clima: aparece onde falta nutrição ou onde a muda pega sol direto demais no viveiro.",
        "sintomas": [
          {
            "id": "manchas_circulares_centro_cinza_halo",
            "peso": 1
          },
          {
            "id": "queda_precoce_folhas",
            "peso": 0.6
          },
          {
            "id": "lesoes_no_fruto",
            "peso": 0.5
          },
          {
            "id": "pontuacoes_pretas_na_lesao",
            "peso": 0.4
          }
        ],
        "condicoesFavoraveis": {
          "temperatura": "20 a 25 °C",
          "umidade": "Alta, combinada com alta luminosidade",
          "observacao": "O gatilho principal é nutricional - lavoura com deficiência de nitrogênio ou de boro adoece mesmo em ano bom. Corrigir a adubação costuma valer mais que aplicar fungicida."
        },
        "tratamentos": [
          {
            "tipo": "cultural",
            "descricao": "Corrigir a adubação, especialmente nitrogênio e boro: é o controle de maior efeito nesta doença."
          },
          {
            "tipo": "cultural",
            "descricao": "Sombrear o viveiro e evitar estresse hídrico nas mudas."
          },
          {
            "tipo": "quimico",
            "descricao": "Fungicida cúprico ou estrobilurina quando a incidência subir na fase de granação."
          }
        ],
        "ingredientesAtivos": [
          {
            "nome": "Hidróxido de cobre",
            "grupo": "Inorgânico",
            "acao": "protetor"
          },
          {
            "nome": "Azoxistrobina",
            "grupo": "Estrobilurina",
            "acao": "sistêmico"
          },
          {
            "nome": "Difenoconazol",
            "grupo": "Triazol",
            "acao": "sistêmico"
          }
        ]
      },
      {
        "id": "cafe_mancha_aureolada",
        "classeModelo": null,
        "nome": "Mancha aureolada",
        "agente": "Pseudomonas syringae pv. garcae",
        "tipoAgente": "bactéria",
        "gravidade": 3,
        "descricao": "Bacteriose de lavoura nova e de área de vento. As lesões nascem encharcadas, escurecem e ficam cercadas por um halo amarelo largo - a auréola. Avança pelo pecíolo até o ramo e mata o ponteiro. A porta de entrada é o ferimento: vento frio com chuva, granizo e até a passagem da colhedora abrem a lesão por onde a bactéria entra.",
        "sintomas": [
          {
            "id": "manchas_angulares_halo_amarelo",
            "peso": 1
          },
          {
            "id": "manchas_encharcadas",
            "peso": 0.8
          },
          {
            "id": "morte_de_ponteiro",
            "peso": 0.7
          },
          {
            "id": "borda_folha_queimada",
            "peso": 0.4
          }
        ],
        "condicoesFavoraveis": {
          "temperatura": "18 a 23 °C",
          "umidade": "Alta, com chuva carregada de vento",
          "observacao": "Lavoura nova, em formação e sem quebra-vento, é onde a doença mais castiga. Depois do granizo, a janela de infecção é de poucos dias."
        },
        "tratamentos": [
          {
            "tipo": "cultural",
            "descricao": "Implantar quebra-vento: reduz o ferimento mecânico, que é a via de entrada da bactéria."
          },
          {
            "tipo": "cultural",
            "descricao": "Evitar tratos culturais com a folhagem molhada e regular a colhedora para não ferir demais."
          },
          {
            "tipo": "cultural",
            "descricao": "Usar mudas sadias e não replantar em cima de foco antigo sem tratar a área."
          },
          {
            "tipo": "quimico",
            "descricao": "Cobre em pulverização preventiva, e antibiótico agrícola registrado logo após granizo ou vento frio com chuva."
          }
        ],
        "ingredientesAtivos": [
          {
            "nome": "Oxicloreto de cobre",
            "grupo": "Inorgânico",
            "acao": "bactericida"
          },
          {
            "nome": "Casugamicina",
            "grupo": "Antibiótico",
            "acao": "sistêmico"
          },
          {
            "nome": "Hidróxido de cobre",
            "grupo": "Inorgânico",
            "acao": "protetor"
          }
        ]
      },
      {
        "id": "cafe_phoma",
        "classeModelo": null,
        "nome": "Mancha de phoma (seca dos ponteiros)",
        "agente": "Phoma tarda",
        "tipoAgente": "fungo",
        "gravidade": 3,
        "descricao": "Doença de frio e vento. A lesão começa pela borda ou pela ponta da folha nova, com aspecto de queimadura, e progride para o ponteiro, que seca e morre. Perder o ponteiro custa mais que perder folha: é o ramo produtivo do ano seguinte que não se forma. Também queima botões florais, o que reduz a florada.",
        "sintomas": [
          {
            "id": "borda_folha_queimada",
            "peso": 1
          },
          {
            "id": "morte_de_ponteiro",
            "peso": 0.9
          },
          {
            "id": "folhas_deformadas",
            "peso": 0.4
          },
          {
            "id": "queda_de_frutos",
            "peso": 0.3
          }
        ],
        "condicoesFavoraveis": {
          "temperatura": "16 a 20 °C",
          "umidade": "Alta, com vento frio e chuva persistente",
          "observacao": "Regiões de altitude, no inverno e começo da primavera. Confunde-se com a mancha aureolada em campo: as duas matam ponteiro depois de tempo frio e ventoso. O halo amarelo largo é da bacteriose; a queimadura que entra pela borda da folha é da phoma."
        },
        "tratamentos": [
          {
            "tipo": "cultural",
            "descricao": "Quebra-vento nas faces expostas ao vento frio - a mesma medida que reduz a mancha aureolada."
          },
          {
            "tipo": "cultural",
            "descricao": "Evitar excesso de nitrogênio no fim do ciclo, que deixa o ponteiro tenro e suscetível."
          },
          {
            "tipo": "quimico",
            "descricao": "Aplicação preventiva de cobre ou de mistura triazol com estrobilurina antes da entrada do frio."
          }
        ],
        "ingredientesAtivos": [
          {
            "nome": "Oxicloreto de cobre",
            "grupo": "Inorgânico",
            "acao": "protetor"
          },
          {
            "nome": "Tebuconazol + Trifloxistrobina",
            "grupo": "Triazol + Estrobilurina",
            "acao": "sistêmico"
          },
          {
            "nome": "Mancozebe",
            "grupo": "Ditiocarbamato",
            "acao": "protetor (multissítio, anti-resistência)"
          }
        ]
      },
      {
        "id": "cafe_broca",
        "classeModelo": null,
        "nome": "Broca-do-café",
        "agente": "Hypothenemus hampei",
        "tipoAgente": "inseto",
        "gravidade": 4,
        "descricao": "Besouro minúsculo que perfura o fruto perto da coroa e se reproduz dentro do grão. O dano é duplo: perda de peso e, principalmente, perda de tipo na classificação da bebida, que é onde o prejuízo aparece no preço. Está dentro do fruto quase o tempo todo, então a janela de controle é curta e depende de monitorar a infestação, não de calendário.",
        "sintomas": [
          {
            "id": "perfuracao_no_fruto",
            "peso": 1
          },
          {
            "id": "queda_de_frutos",
            "peso": 0.5
          },
          {
            "id": "lesoes_no_fruto",
            "peso": 0.4
          }
        ],
        "condicoesFavoraveis": {
          "temperatura": "23 a 28 °C",
          "umidade": "Moderada a alta",
          "observacao": "A população da safra seguinte sai dos frutos que sobraram na planta e no chão depois da colheita. Repasse e catação malfeitos são o que mantêm a infestação alta, mais do que qualquer condição de clima."
        },
        "tratamentos": [
          {
            "tipo": "cultural",
            "descricao": "Colheita bem feita, com repasse e catação dos frutos caídos: corta o abrigo de entressafra do inseto."
          },
          {
            "tipo": "cultural",
            "descricao": "Monitorar a infestação com armadilhas e amostragem de frutos, e só tratar acima do nível de controle."
          },
          {
            "tipo": "biologico",
            "descricao": "Beauveria bassiana em pulverização, e liberação do parasitoide Prorops nasuta onde disponível."
          },
          {
            "tipo": "quimico",
            "descricao": "Inseticida registrado aplicado na janela em que a broca ainda está na superfície do fruto - depois que ela entra no grão, o produto não a alcança."
          }
        ],
        "ingredientesAtivos": [
          {
            "nome": "Beauveria bassiana",
            "grupo": "Biológico",
            "acao": "entomopatogênico"
          },
          {
            "nome": "Ciantraniliprole",
            "grupo": "Diamida",
            "acao": "sistêmico"
          },
          {
            "nome": "Clorantraniliprole",
            "grupo": "Diamida",
            "acao": "ingestão"
          }
        ]
      }
    ]
  },
  {
    "id": "Corn",
    "prefixoModelo": "Corn_(maize)",
    "nome": "Milho",
    "nomeCientifico": "Zea mays",
    "emoji": "🌽",
    "doencas": [
      {
        "id": "milho_cercosporiose",
        "classeModelo": "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot",
        "nome": "Cercosporiose (mancha-cinzenta)",
        "agente": "Cercospora zeae-maydis",
        "tipoAgente": "fungo",
        "gravidade": 4,
        "descricao": "Lesões retangulares e alongadas, com bordas retas porque param nas nervuras. Começam cinzentas e depois ficam pardas. Progridem das folhas baixeiras para as superiores e, quando alcançam a folha bandeira antes do enchimento de grãos, a perda é severa.",
        "sintomas": [
          {
            "id": "manchas_alongadas_entre_nervuras",
            "peso": 1
          },
          {
            "id": "desfolha_baixo_para_cima",
            "peso": 0.6
          },
          {
            "id": "manchas_amareladas",
            "peso": 0.4
          }
        ],
        "condicoesFavoraveis": {
          "temperatura": "22 a 30 °C",
          "umidade": "Alta, com orvalho prolongado",
          "observacao": "Muito favorecida por plantio direto com restos culturais de milho na superfície e por monocultura sucessiva. O formato retangular limitado pelas nervuras é o que a separa da helmintosporiose, cujas lesões atravessam as nervuras."
        },
        "tratamentos": [
          {
            "tipo": "cultural",
            "descricao": "Rotação de culturas com espécies não hospedeiras."
          },
          {
            "tipo": "cultural",
            "descricao": "Uso de híbridos com resistência - principal ferramenta de manejo."
          },
          {
            "tipo": "quimico",
            "descricao": "Fungicida no estádio V8-VT quando houver histórico da doença na área."
          }
        ],
        "ingredientesAtivos": [
          {
            "nome": "Azoxistrobina + Ciproconazol",
            "grupo": "Estrobilurina + Triazol",
            "acao": "sistêmico"
          },
          {
            "nome": "Piraclostrobina + Epoxiconazol",
            "grupo": "Estrobilurina + Triazol",
            "acao": "sistêmico"
          }
        ]
      },
      {
        "id": "milho_ferrugem_comum",
        "classeModelo": "Corn_(maize)___Common_rust_",
        "nome": "Ferrugem comum",
        "agente": "Puccinia sorghi",
        "tipoAgente": "fungo",
        "gravidade": 3,
        "descricao": "Forma pústulas alongadas cor de canela em ambas as faces da folha, que rompem a epiderme e soltam esporos ao toque. Em geral menos destrutiva que a ferrugem polissora, mas pode causar perdas relevantes em híbridos suscetíveis e em plantios de inverno.",
        "sintomas": [
          {
            "id": "pustulas_ferruginosas",
            "peso": 1
          },
          {
            "id": "manchas_amareladas",
            "peso": 0.4
          }
        ],
        "condicoesFavoraveis": {
          "temperatura": "16 a 23 °C",
          "umidade": "Alta, com orvalho frequente",
          "observacao": "Favorecida por temperaturas amenas. Comum na safrinha e em regiões de maior altitude. Temperaturas acima de 28 °C praticamente interrompem o ciclo."
        },
        "tratamentos": [
          {
            "tipo": "cultural",
            "descricao": "Escolha de híbridos resistentes e ajuste da época de semeadura."
          },
          {
            "tipo": "quimico",
            "descricao": "Fungicida sistêmico ao primeiro aparecimento das pústulas em área com histórico."
          }
        ],
        "ingredientesAtivos": [
          {
            "nome": "Tebuconazol",
            "grupo": "Triazol",
            "acao": "sistêmico"
          },
          {
            "nome": "Azoxistrobina + Ciproconazol",
            "grupo": "Estrobilurina + Triazol",
            "acao": "sistêmico"
          }
        ]
      },
      {
        "id": "milho_helmintosporiose",
        "classeModelo": "Corn_(maize)___Northern_Leaf_Blight",
        "nome": "Helmintosporiose (mancha-de-turcicum)",
        "agente": "Exserohilum turcicum",
        "tipoAgente": "fungo",
        "gravidade": 4,
        "descricao": "Produz lesões grandes, elípticas e alongadas, com aspecto de charuto, cinza-esverdeadas a pardas. Ao contrário da cercosporiose, as lesões atravessam as nervuras e podem passar de 15 cm. Poucas lesões na folha bandeira já bastam para reduzir bastante o enchimento de grãos.",
        "sintomas": [
          {
            "id": "lesoes_charuto",
            "peso": 1
          },
          {
            "id": "desfolha_baixo_para_cima",
            "peso": 0.6
          },
          {
            "id": "manchas_amareladas",
            "peso": 0.3
          }
        ],
        "condicoesFavoraveis": {
          "temperatura": "18 a 27 °C",
          "umidade": "Molhamento foliar de 6 a 18 h, com dias nublados",
          "observacao": "Prefere temperaturas mais amenas que a cercosporiose. Aparece primeiro nas folhas baixeiras e sobe. Restos culturais de milho na superfície são a fonte de inóculo."
        },
        "tratamentos": [
          {
            "tipo": "cultural",
            "descricao": "Híbridos resistentes - a resistência genética é a ferramenta principal e a mais barata."
          },
          {
            "tipo": "cultural",
            "descricao": "Rotação de culturas e manejo dos restos culturais."
          },
          {
            "tipo": "quimico",
            "descricao": "Fungicida em V8-VT em área com histórico, antes de a doença atingir o terço superior."
          }
        ],
        "ingredientesAtivos": [
          {
            "nome": "Azoxistrobina + Ciproconazol",
            "grupo": "Estrobilurina + Triazol",
            "acao": "sistêmico"
          },
          {
            "nome": "Piraclostrobina + Epoxiconazol",
            "grupo": "Estrobilurina + Triazol",
            "acao": "sistêmico"
          },
          {
            "nome": "Mancozebe",
            "grupo": "Ditiocarbamato",
            "acao": "protetor"
          }
        ]
      }
    ]
  },
  {
    "id": "Cotton",
    "prefixoModelo": null,
    "nome": "Algodão",
    "nomeCientifico": "Gossypium hirsutum",
    "emoji": "🧵",
    "doencas": [
      {
        "id": "algodao_ramularia",
        "classeModelo": null,
        "nome": "Mancha-de-ramulária",
        "agente": "Ramularia areola",
        "tipoAgente": "fungo",
        "gravidade": 5,
        "descricao": "A doença que define o calendário de fungicidas do algodão no cerrado. As lesões são angulares, limitadas pelas nervuras, e ganham na face inferior uma esporulação branco-acinzentada com aspecto de pó. Começa no baixeiro e sobe. A perda vem da desfolha antecipada em plena formação de capulho, e o fungo já acumula resistência a estrobilurinas e benzimidazóis em boa parte das áreas.",
        "sintomas": [
          {
            "id": "manchas_angulares_esbranquicadas",
            "peso": 1
          },
          {
            "id": "mofo_branco_face_inferior",
            "peso": 0.8
          },
          {
            "id": "desfolha_baixo_para_cima",
            "peso": 0.8
          },
          {
            "id": "manchas_amareladas",
            "peso": 0.4
          }
        ],
        "condicoesFavoraveis": {
          "temperatura": "25 a 30 °C",
          "umidade": "Alta, com molhamento foliar e dossel fechado",
          "observacao": "O fechamento do dossel cria o microclima úmido no baixeiro, que é onde a epidemia começa. Por isso o primeiro sintoma quase nunca está na altura dos olhos: quem só olha o terço superior chega atrasado."
        },
        "tratamentos": [
          {
            "tipo": "cultural",
            "descricao": "Respeitar o vazio sanitário do algodão e destruir a soqueira - o fungo sobrevive em restos culturais e em plantas tigueras."
          },
          {
            "tipo": "cultural",
            "descricao": "Ajustar população e espaçamento para não fechar o dossel cedo demais."
          },
          {
            "tipo": "cultural",
            "descricao": "Preferir cultivares com maior tolerância e monitorar o baixeiro desde o início do florescimento."
          },
          {
            "tipo": "quimico",
            "descricao": "Programa preventivo com rotação obrigatória de modos de ação e multissítio na mistura: há resistência documentada a estrobilurina e a benzimidazol."
          }
        ],
        "ingredientesAtivos": [
          {
            "nome": "Fluxapiroxade + Piraclostrobina",
            "grupo": "Carboxamida + Estrobilurina",
            "acao": "sistêmico"
          },
          {
            "nome": "Difenoconazol",
            "grupo": "Triazol",
            "acao": "sistêmico"
          },
          {
            "nome": "Mancozebe",
            "grupo": "Ditiocarbamato",
            "acao": "protetor (multissítio, anti-resistência)"
          }
        ]
      },
      {
        "id": "algodao_mancha_alvo",
        "classeModelo": null,
        "nome": "Mancha-alvo",
        "agente": "Corynespora cassiicola",
        "tipoAgente": "fungo",
        "gravidade": 4,
        "descricao": "Lesões pardas com anéis concêntricos, o desenho de alvo que dá nome à doença, muitas vezes cercadas por um halo amarelo. Como a ramulária, começa no baixeiro e desfolha de baixo para cima, e as duas ocorrem juntas na mesma lavoura - a diferença está no desenho da lesão e na esporulação da face inferior, que a mancha-alvo não tem.",
        "sintomas": [
          {
            "id": "manchas_escuras_aneis",
            "peso": 1
          },
          {
            "id": "desfolha_baixo_para_cima",
            "peso": 0.9
          },
          {
            "id": "manchas_amareladas",
            "peso": 0.5
          },
          {
            "id": "queda_precoce_folhas",
            "peso": 0.4
          }
        ],
        "condicoesFavoraveis": {
          "temperatura": "24 a 30 °C",
          "umidade": "Alta, com molhamento foliar prolongado",
          "observacao": "O mesmo fungo ataca soja, e a sucessão soja-algodão na mesma área mantém o inóculo alto de uma safra para a outra."
        },
        "tratamentos": [
          {
            "tipo": "cultural",
            "descricao": "Evitar sucessão soja-algodão sem rotação com gramínea, que quebra o ciclo do fungo."
          },
          {
            "tipo": "cultural",
            "descricao": "Destruir restos culturais e soqueira, onde o inóculo sobrevive."
          },
          {
            "tipo": "quimico",
            "descricao": "Fungicida em programa junto com o da ramulária, alternando modos de ação."
          }
        ],
        "ingredientesAtivos": [
          {
            "nome": "Benzovindiflupir + Azoxistrobina",
            "grupo": "Carboxamida + Estrobilurina",
            "acao": "sistêmico"
          },
          {
            "nome": "Protioconazol + Trifloxistrobina",
            "grupo": "Triazol + Estrobilurina",
            "acao": "sistêmico"
          },
          {
            "nome": "Clorotalonil",
            "grupo": "Isoftalonitrila",
            "acao": "protetor (multissítio, anti-resistência)"
          }
        ]
      },
      {
        "id": "algodao_ramulose",
        "classeModelo": null,
        "nome": "Ramulose",
        "agente": "Colletotrichum gossypii var. cephalosporioides",
        "tipoAgente": "fungo",
        "gravidade": 4,
        "descricao": "Ataca o ponteiro e desorganiza a arquitetura da planta. A folha nova mostra lesões de bordas rasgadas, em forma de estrela; o ponteiro morre e a planta responde emitindo muitos ramos curtos do mesmo ponto - o superbrotamento que dá nome à doença. O resultado é uma planta atarracada, com entrenós curtos e pouca estrutura para segurar capulho.",
        "sintomas": [
          {
            "id": "superbrotamento",
            "peso": 1
          },
          {
            "id": "lesoes_estreladas_folha",
            "peso": 0.9
          },
          {
            "id": "morte_de_ponteiro",
            "peso": 0.8
          },
          {
            "id": "folhas_deformadas",
            "peso": 0.6
          },
          {
            "id": "internodios_curtos",
            "peso": 0.5
          }
        ],
        "condicoesFavoraveis": {
          "temperatura": "25 a 30 °C",
          "umidade": "Muito alta, com chuvas frequentes na fase vegetativa",
          "observacao": "A semente infectada é a via de entrada principal, e é isso que faz o tratamento de semente valer mais que qualquer pulverização posterior."
        },
        "tratamentos": [
          {
            "tipo": "cultural",
            "descricao": "Semente sadia, de origem conhecida e com tratamento fungicida - é a medida decisiva nesta doença."
          },
          {
            "tipo": "cultural",
            "descricao": "Cultivares com resistência e destruição da soqueira."
          },
          {
            "tipo": "quimico",
            "descricao": "Pulverização na fase vegetativa quando houver histórico na área e chuva prolongada."
          }
        ],
        "ingredientesAtivos": [
          {
            "nome": "Carbendazim",
            "grupo": "Benzimidazol",
            "acao": "sistêmico"
          },
          {
            "nome": "Tiofanato-metílico",
            "grupo": "Benzimidazol",
            "acao": "sistêmico"
          },
          {
            "nome": "Difenoconazol",
            "grupo": "Triazol",
            "acao": "sistêmico (tratamento de semente)"
          }
        ]
      },
      {
        "id": "algodao_doenca_azul",
        "classeModelo": null,
        "nome": "Doença azul",
        "agente": "Cotton leafroll dwarf virus, transmitido pelo pulgão Aphis gossypii",
        "tipoAgente": "vírus",
        "gravidade": 4,
        "descricao": "Vira a planta num arbusto anão. As folhas ficam de um verde muito escuro, quase azulado, enrolam para baixo e endurecem; as nervuras amarelam e os entrenós encurtam. Não há defensivo que aja sobre o vírus: o manejo é todo contra o pulgão vetor e pela resistência da cultivar, que hoje é o que sustenta o algodão nas áreas de histórico.",
        "sintomas": [
          {
            "id": "folhas_verde_azulado",
            "peso": 1
          },
          {
            "id": "internodios_curtos",
            "peso": 0.9
          },
          {
            "id": "crescimento_reduzido",
            "peso": 0.8
          },
          {
            "id": "nervuras_amareladas",
            "peso": 0.7
          },
          {
            "id": "folhas_deformadas",
            "peso": 0.6
          }
        ],
        "condicoesFavoraveis": {
          "temperatura": "Qualquer temperatura que favoreça o pulgão vetor",
          "umidade": "Períodos secos e quentes, que aumentam a população de pulgão",
          "observacao": "A infecção precoce, ainda na fase vegetativa, é a que causa perda total da planta. Quanto mais tarde o pulgão chega, menor o dano - por isso o monitoramento do vetor no início do ciclo vale mais que no fim."
        },
        "tratamentos": [
          {
            "tipo": "cultural",
            "descricao": "Cultivares resistentes à doença azul - é a base do manejo, e não um complemento."
          },
          {
            "tipo": "cultural",
            "descricao": "Vazio sanitário e destruição de soqueira e plantas tigueras, que abrigam vírus e vetor na entressafra."
          },
          {
            "tipo": "biologico",
            "descricao": "Preservar joaninhas, crisopídeos e parasitoides do pulgão, evitando inseticida de largo espectro sem necessidade."
          },
          {
            "tipo": "quimico",
            "descricao": "Controle do pulgão vetor no início do ciclo, com rotação de modos de ação. Nenhum produto age sobre o vírus já instalado na planta."
          }
        ],
        "ingredientesAtivos": [
          {
            "nome": "Imidacloprido",
            "grupo": "Neonicotinoide",
            "acao": "inseticida sistêmico (vetor)"
          },
          {
            "nome": "Flonicamida",
            "grupo": "Piridinacarboxamida",
            "acao": "inseticida sistêmico (vetor)"
          },
          {
            "nome": "Sulfoxaflor",
            "grupo": "Sulfoximina",
            "acao": "inseticida sistêmico (vetor)"
          }
        ]
      },
      {
        "id": "algodao_mancha_angular",
        "classeModelo": null,
        "nome": "Mancha angular (bacteriose)",
        "agente": "Xanthomonas citri pv. malvacearum",
        "tipoAgente": "bactéria",
        "gravidade": 3,
        "descricao": "Lesões encharcadas e angulares, delimitadas pelas nervuras, que escurecem até quase pretas - vistas contra a luz parecem recortes geométricos na folha. Avança para a haste e para o capulho, onde apodrece a fibra e mancha a pluma. Entra pela semente e pelo respingo de chuva, o que a torna doença de safra chuvosa e de lavoura adensada.",
        "sintomas": [
          {
            "id": "manchas_angulares_escuras",
            "peso": 1
          },
          {
            "id": "manchas_encharcadas",
            "peso": 0.8
          },
          {
            "id": "lesoes_no_fruto",
            "peso": 0.5
          },
          {
            "id": "lesoes_no_caule",
            "peso": 0.4
          }
        ],
        "condicoesFavoraveis": {
          "temperatura": "28 a 35 °C",
          "umidade": "Muito alta, com chuva de vento que espalha respingo",
          "observacao": "Chuva com vento é o mecanismo de dispersão: o respingo carrega a bactéria de folha em folha. Tratos culturais com a lavoura molhada espalham o foco do mesmo jeito."
        },
        "tratamentos": [
          {
            "tipo": "cultural",
            "descricao": "Semente deslintada com ácido e tratada - corta a principal via de introdução na área."
          },
          {
            "tipo": "cultural",
            "descricao": "Cultivares resistentes, que existem e resolvem bem esta doença."
          },
          {
            "tipo": "cultural",
            "descricao": "Não entrar na lavoura com a folhagem molhada e destruir restos culturais."
          },
          {
            "tipo": "quimico",
            "descricao": "Cobre em pulverização tem efeito apenas parcial: nesta doença o controle é de semente e de cultivar."
          }
        ],
        "ingredientesAtivos": [
          {
            "nome": "Oxicloreto de cobre",
            "grupo": "Inorgânico",
            "acao": "bactericida"
          },
          {
            "nome": "Hidróxido de cobre",
            "grupo": "Inorgânico",
            "acao": "protetor"
          }
        ]
      }
    ]
  },
  {
    "id": "Grape",
    "prefixoModelo": "Grape",
    "nome": "Uva",
    "nomeCientifico": "Vitis vinifera",
    "emoji": "🍇",
    "doencas": [
      {
        "id": "uva_podridao_preta",
        "classeModelo": "Grape___Black_rot",
        "nome": "Podridão-preta da videira",
        "agente": "Guignardia bidwellii",
        "tipoAgente": "fungo",
        "gravidade": 4,
        "descricao": "Na folha faz manchas circulares pardas com borda escura, dentro das quais aparecem pontinhos pretos dispostos em anel - são os picnídios, e é o sinal mais confiável para identificar a doença. Nas bagas causa apodrecimento seguido de mumificação: a uva encolhe, endurece e fica presa ao cacho.",
        "sintomas": [
          {
            "id": "pontuacoes_pretas_na_lesao",
            "peso": 1
          },
          {
            "id": "manchas_pequenas_centro_claro",
            "peso": 0.9
          },
          {
            "id": "frutos_mumificados",
            "peso": 0.9
          },
          {
            "id": "lesoes_no_fruto",
            "peso": 0.6
          },
          {
            "id": "lesoes_no_caule",
            "peso": 0.3
          }
        ],
        "condicoesFavoraveis": {
          "temperatura": "20 a 27 °C",
          "umidade": "Chuva com molhamento de 6 h ou mais",
          "observacao": "As bagas só são suscetíveis do florescimento até cerca de 4 a 6 semanas depois; passada essa janela, a proteção química deixa de fazer diferença. As bagas mumificadas do ano anterior são o inóculo primário."
        },
        "tratamentos": [
          {
            "tipo": "cultural",
            "descricao": "Retirar do parreiral e do solo as bagas mumificadas e as gavinhas do ciclo anterior."
          },
          {
            "tipo": "cultural",
            "descricao": "Condução e poda verde que abram o dossel e sequem os cachos mais rápido."
          },
          {
            "tipo": "quimico",
            "descricao": "Programa preventivo do início da brotação até o fechamento dos cachos, cobrindo a janela de suscetibilidade das bagas."
          }
        ],
        "ingredientesAtivos": [
          {
            "nome": "Mancozebe",
            "grupo": "Ditiocarbamato",
            "acao": "protetor"
          },
          {
            "nome": "Difenoconazol",
            "grupo": "Triazol",
            "acao": "sistêmico"
          },
          {
            "nome": "Piraclostrobina",
            "grupo": "Estrobilurina",
            "acao": "sistêmico"
          },
          {
            "nome": "Miclobutanil",
            "grupo": "Triazol",
            "acao": "sistêmico"
          }
        ]
      },
      {
        "id": "uva_esca",
        "classeModelo": "Grape___Esca_(Black_Measles)",
        "nome": "Esca (sarampo-negro)",
        "agente": "Phaeomoniella chlamydospora e Phaeoacremonium minimum",
        "tipoAgente": "fungo",
        "gravidade": 4,
        "descricao": "Doença de madeira, não de folha. Os fungos colonizam o lenho e os sintomas foliares - faixas amareladas e secas entre as nervuras, com aspecto tigrado - são apenas o reflexo disso. Ao cortar um braço afetado a madeira aparece escurecida por dentro. Na forma apoplética a planta inteira murcha e morre em poucos dias, no meio do verão.",
        "sintomas": [
          {
            "id": "faixas_necroticas_entre_nervuras",
            "peso": 1
          },
          {
            "id": "madeira_escura_no_corte",
            "peso": 0.9
          },
          {
            "id": "morte_de_ramos",
            "peso": 0.8
          },
          {
            "id": "murcha",
            "peso": 0.4
          },
          {
            "id": "lesoes_no_fruto",
            "peso": 0.4
          }
        ],
        "condicoesFavoraveis": {
          "temperatura": "Infecção pelos ferimentos de poda no inverno; sintomas se expressam no verão",
          "umidade": "Chuva no período da poda, que dissemina os esporos até os cortes abertos",
          "observacao": "Não existe curativo: quando o sintoma aparece na folha, o lenho já está comprometido. Todo o manejo é evitar a infecção pelo ferimento de poda. Parreirais velhos são muito mais afetados, e a expressão dos sintomas dispara após verões de estresse hídrico."
        },
        "tratamentos": [
          {
            "tipo": "cultural",
            "descricao": "Podar em período seco e o mais tarde possível, quando a cicatrização é mais rápida."
          },
          {
            "tipo": "cultural",
            "descricao": "Proteger os cortes grandes imediatamente após a poda."
          },
          {
            "tipo": "cultural",
            "descricao": "Eliminar e queimar plantas mortas e braços com necrose; usar mudas de viveiro idôneo."
          },
          {
            "tipo": "biologico",
            "descricao": "Trichoderma aplicado nos cortes de poda coloniza o ferimento antes dos patógenos."
          },
          {
            "tipo": "quimico",
            "descricao": "Pasta protetora de ferimento de poda logo após o corte - a janela de proteção é de poucos dias."
          }
        ],
        "ingredientesAtivos": [
          {
            "nome": "Tiofanato-metílico",
            "grupo": "Benzimidazol",
            "acao": "protetor de ferimento de poda"
          },
          {
            "nome": "Trichoderma spp.",
            "grupo": "Biológico",
            "acao": "colonização preventiva do corte"
          }
        ]
      },
      {
        "id": "uva_mancha_das_folhas",
        "classeModelo": "Grape___Leaf_blight_(Isariopsis_Leaf_Spot)",
        "nome": "Mancha-das-folhas (mancha-de-isariopsis)",
        "agente": "Pseudocercospora vitis",
        "tipoAgente": "fungo",
        "gravidade": 3,
        "descricao": "Manchas angulares escuras, delimitadas pelas nervuras, que vão coalescendo até tomar grandes áreas do limbo. Aparece no fim do ciclo e provoca desfolha, o que compromete o acúmulo de reservas para a safra seguinte mais do que a safra corrente.",
        "sintomas": [
          {
            "id": "manchas_angulares_escuras",
            "peso": 1
          },
          {
            "id": "queda_precoce_folhas",
            "peso": 0.7
          },
          {
            "id": "manchas_amareladas",
            "peso": 0.4
          }
        ],
        "condicoesFavoraveis": {
          "temperatura": "20 a 30 °C",
          "umidade": "Alta, com chuvas frequentes no fim do ciclo",
          "observacao": "Mais severa em parreirais adensados, mal arejados e em plantas debilitadas por outras doenças ou por carga excessiva. O prejuízo real é a desfolha antecipada."
        },
        "tratamentos": [
          {
            "tipo": "cultural",
            "descricao": "Poda verde e desponte para arejar o dossel."
          },
          {
            "tipo": "cultural",
            "descricao": "Eliminar restos de folhas caídas, onde o fungo passa a entressafra."
          },
          {
            "tipo": "quimico",
            "descricao": "Protetores nas aplicações de fim de ciclo, junto ao programa das demais doenças foliares."
          }
        ],
        "ingredientesAtivos": [
          {
            "nome": "Mancozebe",
            "grupo": "Ditiocarbamato",
            "acao": "protetor"
          },
          {
            "nome": "Clorotalonil",
            "grupo": "Isoftalonitrila",
            "acao": "protetor"
          },
          {
            "nome": "Difenoconazol",
            "grupo": "Triazol",
            "acao": "sistêmico"
          }
        ]
      }
    ]
  },
  {
    "id": "Orange",
    "prefixoModelo": "Orange",
    "nome": "Laranja",
    "nomeCientifico": "Citrus sinensis",
    "emoji": "🍊",
    "doencas": [
      {
        "id": "laranja_greening",
        "classeModelo": "Orange___Haunglongbing_(Citrus_greening)",
        "nome": "Greening (huanglongbing, HLB)",
        "agente": "Candidatus Liberibacter asiaticus, transmitida pelo psilídeo Diaphorina citri",
        "tipoAgente": "bactéria",
        "gravidade": 5,
        "descricao": "A doença mais grave da citricultura mundial, e sem cura. O sinal característico é o mosqueado amarelo assimétrico: a mancha não se espelha nos dois lados da nervura central, o que a distingue de deficiência nutricional, onde o padrão é simétrico. Começa por um ramo isolado e toma a planta. Os frutos ficam pequenos, tortos, com sementes abortadas e sabor amargo, e caem antes de amadurecer.",
        "sintomas": [
          {
            "id": "mosqueado_assimetrico",
            "peso": 1
          },
          {
            "id": "amarelecimento_setorizado",
            "peso": 0.9
          },
          {
            "id": "frutos_pequenos_assimetricos",
            "peso": 0.9
          },
          {
            "id": "queda_de_frutos",
            "peso": 0.7
          },
          {
            "id": "nervuras_amareladas",
            "peso": 0.6
          },
          {
            "id": "crescimento_reduzido",
            "peso": 0.4
          },
          {
            "id": "insetos_face_inferior",
            "peso": 0.3
          }
        ],
        "condicoesFavoraveis": {
          "temperatura": "22 a 30 °C - faixa em que o psilídeo se multiplica nas brotações novas",
          "umidade": "Indiferente - a doença depende do vetor, não de clima úmido",
          "observacao": "Não existe cura: a planta infectada é fonte permanente de inóculo e não se recupera. O manejo é um tripé - mudas sadias, controle do psilídeo e erradicação imediata das plantas doentes. Pomar abandonado na vizinhança inviabiliza o controle de quem faz tudo certo, por isso o manejo tem de ser regional."
        },
        "tratamentos": [
          {
            "tipo": "cultural",
            "descricao": "Inspeção trimestral planta a planta e erradicação imediata das sintomáticas - manter a planta doente no pomar contamina as vizinhas."
          },
          {
            "tipo": "cultural",
            "descricao": "Mudas certificadas, produzidas em viveiro telado."
          },
          {
            "tipo": "cultural",
            "descricao": "Controle regional coordenado com os pomares vizinhos; ação isolada não sustenta o pomar."
          },
          {
            "tipo": "biologico",
            "descricao": "Preservar o parasitoide Tamarixia radiata, importante em áreas de mata e em pomares sem pulverização intensiva."
          },
          {
            "tipo": "quimico",
            "descricao": "Inseticidas contra o psilídeo, com atenção às bordaduras e às brotações, alternando modos de ação."
          }
        ],
        "ingredientesAtivos": [
          {
            "nome": "Imidacloprido",
            "grupo": "Neonicotinoide",
            "acao": "inseticida sistêmico (vetor)"
          },
          {
            "nome": "Tiametoxam",
            "grupo": "Neonicotinoide",
            "acao": "inseticida sistêmico (vetor)"
          },
          {
            "nome": "Bifentrina",
            "grupo": "Piretroide",
            "acao": "inseticida de contato (vetor)"
          }
        ]
      }
    ]
  },
  {
    "id": "Peach",
    "prefixoModelo": "Peach",
    "nome": "Pêssego",
    "nomeCientifico": "Prunus persica",
    "emoji": "🍑",
    "doencas": [
      {
        "id": "pessego_mancha_bacteriana",
        "classeModelo": "Peach___Bacterial_spot",
        "nome": "Mancha-bacteriana do pessegueiro",
        "agente": "Xanthomonas arboricola pv. pruni",
        "tipoAgente": "bactéria",
        "gravidade": 4,
        "descricao": "Manchas angulares encharcadas, limitadas pelas nervuras, que secam e cujo centro se desprende, deixando furos na folha - o aspecto de tiro de espingarda. A desfolha é intensa e enfraquece a planta para a safra seguinte. No fruto as lesões deprimidas rompem a casca e abrem porta para podridões.",
        "sintomas": [
          {
            "id": "furos_tiro_espingarda",
            "peso": 1
          },
          {
            "id": "manchas_angulares_halo_amarelo",
            "peso": 0.9
          },
          {
            "id": "queda_precoce_folhas",
            "peso": 0.8
          },
          {
            "id": "lesoes_no_fruto",
            "peso": 0.7
          },
          {
            "id": "crostas_no_fruto",
            "peso": 0.5
          }
        ],
        "condicoesFavoraveis": {
          "temperatura": "20 a 30 °C",
          "umidade": "Alta, com chuva acompanhada de vento",
          "observacao": "Vento com chuva é o fator crítico: a bactéria entra por ferimentos e aberturas naturais, e o vento faz as folhas se ferirem umas nas outras. Um quebra-vento reduz mais a doença do que qualquer pulverização."
        },
        "tratamentos": [
          {
            "tipo": "cultural",
            "descricao": "Implantar quebra-ventos - é a medida de maior efeito nesta doença."
          },
          {
            "tipo": "cultural",
            "descricao": "Escolher cultivares tolerantes; a diferença entre elas é grande."
          },
          {
            "tipo": "cultural",
            "descricao": "Evitar excesso de nitrogênio, que prolonga a fase de tecido jovem e suscetível."
          },
          {
            "tipo": "quimico",
            "descricao": "Cúpricos em dormência, em dose cheia, e doses reduzidas durante a estação - cobre em pessegueiro com folha é fitotóxico."
          }
        ],
        "ingredientesAtivos": [
          {
            "nome": "Oxicloreto de cobre",
            "grupo": "Cúprico",
            "acao": "protetor"
          },
          {
            "nome": "Hidróxido de cobre",
            "grupo": "Cúprico",
            "acao": "protetor"
          },
          {
            "nome": "Mancozebe",
            "grupo": "Ditiocarbamato",
            "acao": "protetor (em mistura com cobre)"
          }
        ]
      }
    ]
  },
  {
    "id": "Pepper",
    "prefixoModelo": "Pepper,_bell",
    "nome": "Pimentão",
    "nomeCientifico": "Capsicum annuum",
    "emoji": "🫑",
    "doencas": [
      {
        "id": "pimentao_mancha_bacteriana",
        "classeModelo": "Pepper,_bell___Bacterial_spot",
        "nome": "Mancha-bacteriana do pimentão",
        "agente": "Xanthomonas euvesicatoria",
        "tipoAgente": "bactéria",
        "gravidade": 4,
        "descricao": "Manchas angulares de aspecto encharcado, com halo amarelo, que depois secam e ficam pardas. A desfolha expõe os frutos ao sol e causa escaldadura. No fruto surgem manchas ásperas e salientes, tipo verruga, que inviabilizam a venda mesmo em ataques leves.",
        "sintomas": [
          {
            "id": "manchas_angulares_halo_amarelo",
            "peso": 1
          },
          {
            "id": "manchas_salientes_fruto",
            "peso": 0.9
          },
          {
            "id": "manchas_encharcadas",
            "peso": 0.8
          },
          {
            "id": "queda_precoce_folhas",
            "peso": 0.7
          },
          {
            "id": "manchas_amareladas",
            "peso": 0.3
          }
        ],
        "condicoesFavoraveis": {
          "temperatura": "24 a 30 °C",
          "umidade": "Muito alta, com chuva ou irrigação por aspersão",
          "observacao": "Semente e muda contaminadas são a principal porta de entrada. Depois de instalada, a bactéria se espalha em horas pelos respingos de chuva e pelo manuseio das plantas molhadas - por isso a regra de nunca entrar na lavoura com a folhagem úmida."
        },
        "tratamentos": [
          {
            "tipo": "cultural",
            "descricao": "Sementes certificadas ou tratadas termicamente; mudas de viveiro idôneo."
          },
          {
            "tipo": "cultural",
            "descricao": "Não manusear nem pulverizar com as plantas molhadas."
          },
          {
            "tipo": "cultural",
            "descricao": "Rotação de dois anos com não solanáceas e eliminação dos restos culturais."
          },
          {
            "tipo": "biologico",
            "descricao": "Bacillus subtilis em programa preventivo, como complemento aos cúpricos."
          },
          {
            "tipo": "quimico",
            "descricao": "Cúpricos preventivos, geralmente associados a mancozebe. Não existe curativo para bacteriose: o que se faz é proteger o tecido sadio."
          }
        ],
        "ingredientesAtivos": [
          {
            "nome": "Oxicloreto de cobre",
            "grupo": "Cúprico",
            "acao": "protetor"
          },
          {
            "nome": "Hidróxido de cobre",
            "grupo": "Cúprico",
            "acao": "protetor"
          },
          {
            "nome": "Casugamicina",
            "grupo": "Antibiótico agrícola",
            "acao": "bactericida"
          }
        ]
      }
    ]
  },
  {
    "id": "Potato",
    "prefixoModelo": "Potato",
    "nome": "Batata",
    "nomeCientifico": "Solanum tuberosum",
    "emoji": "🥔",
    "doencas": [
      {
        "id": "batata_pinta_preta",
        "classeModelo": "Potato___Early_blight",
        "nome": "Pinta-preta da batata",
        "agente": "Alternaria solani",
        "tipoAgente": "fungo",
        "gravidade": 4,
        "descricao": "Mesmo fungo da pinta-preta do tomate. Começa pelas folhas mais velhas, próximas ao solo, com lesões escuras de anéis concêntricos que lembram um alvo, e progride para cima. A desfolha reduz a área fotossintética justamente na fase de tuberização, cortando a produtividade.",
        "sintomas": [
          {
            "id": "manchas_escuras_aneis",
            "peso": 1
          },
          {
            "id": "desfolha_baixo_para_cima",
            "peso": 0.8
          },
          {
            "id": "manchas_amareladas",
            "peso": 0.4
          },
          {
            "id": "lesoes_no_caule",
            "peso": 0.3
          }
        ],
        "condicoesFavoraveis": {
          "temperatura": "24 a 29 °C",
          "umidade": "Orvalho ou molhamento foliar alternando com períodos secos",
          "observacao": "Ataca preferencialmente a planta debilitada, no fim do ciclo e sob deficiência de nitrogênio. Adubação equilibrada é uma medida de controle, não só de produtividade."
        },
        "tratamentos": [
          {
            "tipo": "cultural",
            "descricao": "Rotação de culturas evitando solanáceas (tomate, berinjela, pimentão)."
          },
          {
            "tipo": "cultural",
            "descricao": "Batata-semente sadia e eliminação de restos culturais e plantas voluntárias."
          },
          {
            "tipo": "cultural",
            "descricao": "Manter a nutrição equilibrada ao longo de todo o ciclo."
          },
          {
            "tipo": "quimico",
            "descricao": "Protetores em programa preventivo, alternando com sistêmicos para retardar resistência."
          }
        ],
        "ingredientesAtivos": [
          {
            "nome": "Mancozebe",
            "grupo": "Ditiocarbamato",
            "acao": "protetor"
          },
          {
            "nome": "Clorotalonil",
            "grupo": "Isoftalonitrila",
            "acao": "protetor"
          },
          {
            "nome": "Difenoconazol",
            "grupo": "Triazol",
            "acao": "sistêmico"
          },
          {
            "nome": "Azoxistrobina",
            "grupo": "Estrobilurina",
            "acao": "sistêmico"
          }
        ]
      },
      {
        "id": "batata_requeima",
        "classeModelo": "Potato___Late_blight",
        "nome": "Requeima da batata",
        "agente": "Phytophthora infestans",
        "tipoAgente": "oomiceto",
        "gravidade": 5,
        "descricao": "A doença mais destrutiva da batata. Lesões grandes de aspecto encharcado, verde-escuras a pardas, com mofo esbranquiçado na face inferior em manhãs úmidas. Em condições ideais o ciclo se fecha em quatro a cinco dias e a lavoura vai a zero em duas semanas.",
        "sintomas": [
          {
            "id": "manchas_encharcadas",
            "peso": 1
          },
          {
            "id": "mofo_branco_face_inferior",
            "peso": 0.9
          },
          {
            "id": "lesoes_no_caule",
            "peso": 0.6
          },
          {
            "id": "murcha",
            "peso": 0.3
          }
        ],
        "condicoesFavoraveis": {
          "temperatura": "12 a 20 °C (noites frias)",
          "umidade": "Acima de 90%, com neblina ou chuva frequente",
          "observacao": "É o patógeno que causou a Grande Fome Irlandesa e continua sendo a principal ameaça da cultura. Noite fria e úmida seguida de dia ameno é o cenário de epidemia explosiva. Controle curativo praticamente não existe: ou se protege antes, ou se perde."
        },
        "tratamentos": [
          {
            "tipo": "cultural",
            "descricao": "Batata-semente sadia e cultivares com resistência quando disponíveis."
          },
          {
            "tipo": "cultural",
            "descricao": "Amontoa bem-feita, que protege os tubérculos dos esporos que descem com a água."
          },
          {
            "tipo": "cultural",
            "descricao": "Eliminar montes de descarte e plantas voluntárias, que são a ponte entre safras."
          },
          {
            "tipo": "quimico",
            "descricao": "Programa estritamente preventivo, guiado por previsão climática e não por calendário."
          }
        ],
        "ingredientesAtivos": [
          {
            "nome": "Mancozebe",
            "grupo": "Ditiocarbamato",
            "acao": "protetor"
          },
          {
            "nome": "Cimoxanil",
            "grupo": "Cianoacetamida-oxima",
            "acao": "sistêmico"
          },
          {
            "nome": "Metalaxil-M",
            "grupo": "Acilalaninato",
            "acao": "sistêmico"
          },
          {
            "nome": "Fluazinam",
            "grupo": "Fenilpiridinilamina",
            "acao": "protetor"
          }
        ]
      }
    ]
  },
  {
    "id": "Raspberry",
    "prefixoModelo": "Raspberry",
    "nome": "Framboesa",
    "nomeCientifico": "Rubus idaeus",
    "emoji": "🍇",
    "doencas": []
  },
  {
    "id": "Soybean",
    "prefixoModelo": "Soybean",
    "nome": "Soja",
    "nomeCientifico": "Glycine max",
    "emoji": "🌱",
    "doencas": [
      {
        "id": "soja_ferrugem_asiatica",
        "classeModelo": null,
        "nome": "Ferrugem asiática",
        "agente": "Phakopsora pachyrhizi",
        "tipoAgente": "fungo",
        "gravidade": 5,
        "descricao": "Principal doença da soja no Brasil. Forma pústulas na face inferior das folhas que liberam esporos cor de ferrugem. Causa desfolha precoce e enchimento incompleto de grãos; sem controle, as perdas passam de 80%.",
        "sintomas": [
          {
            "id": "pustulas_ferruginosas",
            "peso": 1
          },
          {
            "id": "desfolha_baixo_para_cima",
            "peso": 0.8
          },
          {
            "id": "manchas_amareladas",
            "peso": 0.6
          }
        ],
        "condicoesFavoraveis": {
          "temperatura": "18 a 26 °C",
          "umidade": "Molhamento foliar de 6 h ou mais, com alta umidade relativa",
          "observacao": "Períodos chuvosos prolongados com temperatura amena. O vazio sanitário da soja existe justamente para quebrar o ciclo deste fungo na entressafra."
        },
        "tratamentos": [
          {
            "tipo": "cultural",
            "descricao": "Respeitar o vazio sanitário e o calendário de semeadura da região."
          },
          {
            "tipo": "cultural",
            "descricao": "Preferir cultivares de ciclo precoce e com resistência parcial."
          },
          {
            "tipo": "quimico",
            "descricao": "Programa preventivo com misturas de triazol, estrobilurina e carboxamida, sempre alternando modos de ação: o fungo tem alto risco de desenvolver resistência."
          }
        ],
        "ingredientesAtivos": [
          {
            "nome": "Trifloxistrobina + Protioconazol",
            "grupo": "Estrobilurina + Triazol",
            "acao": "sistêmico"
          },
          {
            "nome": "Azoxistrobina + Benzovindiflupir",
            "grupo": "Estrobilurina + Carboxamida",
            "acao": "sistêmico"
          },
          {
            "nome": "Mancozebe",
            "grupo": "Ditiocarbamato",
            "acao": "protetor (multissítio, anti-resistência)"
          }
        ]
      },
      {
        "id": "soja_mofo_branco",
        "classeModelo": null,
        "nome": "Mofo branco",
        "agente": "Sclerotinia sclerotiorum",
        "tipoAgente": "fungo",
        "gravidade": 4,
        "descricao": "Ataca principalmente o caule e as hastes, formando um micélio branco e cotonoso dentro do qual se formam escleródios - estruturas de resistência pretas e duras. A planta murcha e morre. Os escleródios sobrevivem anos no solo, o que torna a área historicamente problemática.",
        "sintomas": [
          {
            "id": "micelio_branco_no_caule",
            "peso": 1
          },
          {
            "id": "murcha",
            "peso": 0.9
          },
          {
            "id": "lesoes_no_caule",
            "peso": 0.7
          }
        ],
        "condicoesFavoraveis": {
          "temperatura": "15 a 24 °C",
          "umidade": "Muito alta, com dossel fechado e solo úmido",
          "observacao": "Regiões de altitude e alta densidade de plantio. O fator determinante é o dossel fechado, que impede a entrada de luz e de ventilação no nível do solo."
        },
        "tratamentos": [
          {
            "tipo": "cultural",
            "descricao": "Reduzir a densidade de semeadura para abrir o dossel."
          },
          {
            "tipo": "cultural",
            "descricao": "Rotação com gramíneas (milho, braquiária), que não são hospedeiras."
          },
          {
            "tipo": "cultural",
            "descricao": "Usar sementes livres de escleródios e limpar as máquinas ao trocar de talhão."
          },
          {
            "tipo": "biologico",
            "descricao": "Trichoderma harzianum aplicado no solo parasita os escleródios; é uma das medidas mais eficazes a longo prazo."
          },
          {
            "tipo": "quimico",
            "descricao": "Fungicidas específicos no início do florescimento, antes do fechamento do dossel."
          }
        ],
        "ingredientesAtivos": [
          {
            "nome": "Fluazinam",
            "grupo": "Fenilpiridinilamina",
            "acao": "protetor"
          },
          {
            "nome": "Procimidona",
            "grupo": "Dicarboximida",
            "acao": "protetor"
          },
          {
            "nome": "Trichoderma harzianum",
            "grupo": "Biológico",
            "acao": "controle biológico de solo"
          }
        ]
      }
    ]
  },
  {
    "id": "Squash",
    "prefixoModelo": "Squash",
    "nome": "Abóbora",
    "nomeCientifico": "Cucurbita spp.",
    "emoji": "🎃",
    "doencas": [
      {
        "id": "abobora_oidio",
        "classeModelo": "Squash___Powdery_mildew",
        "nome": "Oídio das cucurbitáceas",
        "agente": "Podosphaera xanthii",
        "tipoAgente": "fungo",
        "gravidade": 3,
        "descricao": "Cobre as duas faces da folha com um pó branco farináceo, começando pelas folhas mais velhas e sombreadas. A folha amarelece, seca pelas bordas e morre, expondo os frutos ao sol. Numa lavoura sem manejo, uma folha isolada vira uma lavoura tomada em duas semanas.",
        "sintomas": [
          {
            "id": "po_branco_superficie",
            "peso": 1
          },
          {
            "id": "manchas_amareladas",
            "peso": 0.6
          },
          {
            "id": "borda_folha_queimada",
            "peso": 0.5
          },
          {
            "id": "desfolha_baixo_para_cima",
            "peso": 0.5
          }
        ],
        "condicoesFavoraveis": {
          "temperatura": "20 a 30 °C",
          "umidade": "Moderada (50 a 70%) - não exige molhamento foliar",
          "observacao": "Como todo oídio, dispensa água livre na folha e por isso prospera no período seco. Folhas velhas e sombreadas são sempre as primeiras. A resistência a fungicidas nesta espécie aparece muito rápido, o que torna a alternância de grupos obrigatória."
        },
        "tratamentos": [
          {
            "tipo": "cultural",
            "descricao": "Cultivares resistentes e espaçamento que permita ventilação entre as plantas."
          },
          {
            "tipo": "cultural",
            "descricao": "Evitar excesso de nitrogênio, que deixa o tecido mais suscetível."
          },
          {
            "tipo": "biologico",
            "descricao": "Bacillus subtilis e Ampelomyces quisqualis, este último um hiperparasita do próprio oídio."
          },
          {
            "tipo": "quimico",
            "descricao": "Enxofre como base, alternando com triazóis e estrobilurinas - nunca repetir o mesmo grupo em sequência."
          }
        ],
        "ingredientesAtivos": [
          {
            "nome": "Enxofre",
            "grupo": "Inorgânico",
            "acao": "protetor"
          },
          {
            "nome": "Tebuconazol",
            "grupo": "Triazol",
            "acao": "sistêmico"
          },
          {
            "nome": "Azoxistrobina",
            "grupo": "Estrobilurina",
            "acao": "sistêmico"
          }
        ]
      }
    ]
  },
  {
    "id": "Strawberry",
    "prefixoModelo": "Strawberry",
    "nome": "Morango",
    "nomeCientifico": "Fragaria × ananassa",
    "emoji": "🍓",
    "doencas": [
      {
        "id": "morango_queima_das_folhas",
        "classeModelo": "Strawberry___Leaf_scorch",
        "nome": "Queima-das-folhas do morangueiro",
        "agente": "Diplocarpon earlianum",
        "tipoAgente": "fungo",
        "gravidade": 3,
        "descricao": "Manchas arroxeadas irregulares que se multiplicam e coalescem até a folha inteira ganhar aspecto chamuscado, como se tivesse sido queimada. Diferente da mancha-comum, aqui as lesões não desenvolvem centro claro: permanecem escuras. Reduz a área foliar e enfraquece a coroa da planta.",
        "sintomas": [
          {
            "id": "manchas_purpuras",
            "peso": 1
          },
          {
            "id": "borda_folha_queimada",
            "peso": 0.8
          },
          {
            "id": "pontuacoes_pretas_na_lesao",
            "peso": 0.5
          },
          {
            "id": "queda_precoce_folhas",
            "peso": 0.4
          }
        ],
        "condicoesFavoraveis": {
          "temperatura": "20 a 30 °C",
          "umidade": "Molhamento foliar prolongado, com irrigação por aspersão",
          "observacao": "Canteiros adensados e folhas velhas acumuladas mantêm o microclima úmido de que o fungo precisa. A troca de aspersão por gotejamento resolve boa parte do problema sozinha."
        },
        "tratamentos": [
          {
            "tipo": "cultural",
            "descricao": "Mudas sadias, de matrizeiro certificado."
          },
          {
            "tipo": "cultural",
            "descricao": "Mulching plástico e irrigação por gotejamento, para manter a folha seca."
          },
          {
            "tipo": "cultural",
            "descricao": "Retirar periodicamente as folhas velhas e doentes do canteiro."
          },
          {
            "tipo": "quimico",
            "descricao": "Protetores em programa preventivo, respeitando a carência - a colheita é contínua."
          }
        ],
        "ingredientesAtivos": [
          {
            "nome": "Captana",
            "grupo": "Ftalimida",
            "acao": "protetor"
          },
          {
            "nome": "Mancozebe",
            "grupo": "Ditiocarbamato",
            "acao": "protetor"
          },
          {
            "nome": "Difenoconazol",
            "grupo": "Triazol",
            "acao": "sistêmico"
          }
        ]
      }
    ]
  },
  {
    "id": "Sugarcane",
    "prefixoModelo": null,
    "nome": "Cana-de-açúcar",
    "nomeCientifico": "Saccharum officinarum",
    "emoji": "🌾",
    "doencas": [
      {
        "id": "cana_ferrugem_alaranjada",
        "classeModelo": null,
        "nome": "Ferrugem alaranjada",
        "agente": "Puccinia kuehnii",
        "tipoAgente": "fungo",
        "gravidade": 4,
        "descricao": "Pústulas alaranjadas, concentradas na face inferior da folha, que rompem a epiderme e liberam pó. Chegou ao Brasil em 2009 e derrubou de uma vez variedades que eram consideradas seguras, porque a resistência à ferrugem marrom não protege contra esta. O dano é de perda de área fotossintética em pleno crescimento do colmo, e aparece como queda de tonelagem, não como planta morta.",
        "sintomas": [
          {
            "id": "pustulas_alaranjadas_face_inferior",
            "peso": 1
          },
          {
            "id": "manchas_amareladas",
            "peso": 0.5
          },
          {
            "id": "pustulas_ferruginosas",
            "peso": 0.5
          },
          {
            "id": "desfolha_baixo_para_cima",
            "peso": 0.4
          }
        ],
        "condicoesFavoraveis": {
          "temperatura": "20 a 25 °C",
          "umidade": "Alta, com orvalho ou molhamento foliar noturno",
          "observacao": "O ataque é mais forte dos 4 aos 8 meses da cana. Confunde-se com a ferrugem marrom em campo, e a distinção importa: a variedade resistente a uma pode ser suscetível à outra. A cor da pústula e a face da folha onde ela se concentra são o que separa as duas."
        },
        "tratamentos": [
          {
            "tipo": "cultural",
            "descricao": "Variedade resistente é o controle real desta doença - fungicida em canavial é operação cara e de janela curta."
          },
          {
            "tipo": "cultural",
            "descricao": "Planejar o mosaico varietal do talhão para não concentrar material suscetível."
          },
          {
            "tipo": "quimico",
            "descricao": "Aplicação de mistura triazol com estrobilurina em viveiro e em cana planta de alto valor, quando a severidade justificar."
          }
        ],
        "ingredientesAtivos": [
          {
            "nome": "Azoxistrobina + Ciproconazol",
            "grupo": "Estrobilurina + Triazol",
            "acao": "sistêmico"
          },
          {
            "nome": "Piraclostrobina + Epoxiconazol",
            "grupo": "Estrobilurina + Triazol",
            "acao": "sistêmico"
          },
          {
            "nome": "Tebuconazol",
            "grupo": "Triazol",
            "acao": "sistêmico"
          }
        ]
      },
      {
        "id": "cana_ferrugem_marrom",
        "classeModelo": null,
        "nome": "Ferrugem marrom",
        "agente": "Puccinia melanocephala",
        "tipoAgente": "fungo",
        "gravidade": 3,
        "descricao": "A ferrugem mais antiga do canavial brasileiro, hoje contida pela resistência das variedades em boa parte das áreas. As pústulas são cor de canela a marrom, alongadas, e aparecem nas duas faces da folha, cercadas por um halo claro. Onde a variedade é suscetível, ainda causa perda relevante em cana planta.",
        "sintomas": [
          {
            "id": "pustulas_ferruginosas",
            "peso": 1
          },
          {
            "id": "manchas_amareladas",
            "peso": 0.6
          },
          {
            "id": "pustulas_alaranjadas_face_inferior",
            "peso": 0.4
          },
          {
            "id": "desfolha_baixo_para_cima",
            "peso": 0.3
          }
        ],
        "condicoesFavoraveis": {
          "temperatura": "18 a 24 °C",
          "umidade": "Alta, com molhamento foliar prolongado",
          "observacao": "Os perfilhos jovens são os mais atacados. Como a ferrugem alaranjada, é doença de variedade: identificar qual das duas está no talhão orienta a escolha do material na renovação."
        },
        "tratamentos": [
          {
            "tipo": "cultural",
            "descricao": "Variedades resistentes, que já cobrem a maior parte do parque varietal brasileiro."
          },
          {
            "tipo": "cultural",
            "descricao": "Mudas de viveiro sadio e monitoramento do talhão nos primeiros meses."
          },
          {
            "tipo": "quimico",
            "descricao": "Fungicida apenas em viveiro ou em situação de alta severidade em material suscetível."
          }
        ],
        "ingredientesAtivos": [
          {
            "nome": "Azoxistrobina + Ciproconazol",
            "grupo": "Estrobilurina + Triazol",
            "acao": "sistêmico"
          },
          {
            "nome": "Propiconazol",
            "grupo": "Triazol",
            "acao": "sistêmico"
          }
        ]
      },
      {
        "id": "cana_carvao",
        "classeModelo": null,
        "nome": "Carvão da cana",
        "agente": "Sporisorium scitamineum",
        "tipoAgente": "fungo",
        "gravidade": 4,
        "descricao": "O sintoma é inconfundível: um chicote preto e recurvado sai do topo da planta, coberto por bilhões de esporos que o vento carrega pelo talhão inteiro. A planta afetada fica atarracada, com perfilhos finos e entrenós curtos, e não forma colmo aproveitável. A muda infectada é a via de entrada principal, e o esporo sobrevive no solo e nos restos.",
        "sintomas": [
          {
            "id": "chicote_preto_no_apice",
            "peso": 1
          },
          {
            "id": "crescimento_reduzido",
            "peso": 0.7
          },
          {
            "id": "internodios_curtos",
            "peso": 0.5
          }
        ],
        "condicoesFavoraveis": {
          "temperatura": "25 a 30 °C",
          "umidade": "Baixa - períodos secos e quentes favorecem a doença",
          "observacao": "É a exceção entre as doenças fúngicas do canavial: a seca favorece, e não a chuva. Cortar e ensacar o chicote ANTES que ele abra evita a dispersão de todo o talhão; deixá-lo abrir contamina a área por anos."
        },
        "tratamentos": [
          {
            "tipo": "cultural",
            "descricao": "Variedades resistentes e mudas de viveiro sadio, com inspeção antes do plantio."
          },
          {
            "tipo": "cultural",
            "descricao": "Eliminar as touceiras com chicote ensacando antes de arrancar - abrir o chicote no talhão espalha o inóculo."
          },
          {
            "tipo": "cultural",
            "descricao": "Tratamento térmico da muda (água a cerca de 50 °C por 2 h), prática padrão de viveiro."
          },
          {
            "tipo": "quimico",
            "descricao": "Fungicida triazol no tratamento da muda, complementar ao térmico - nunca substituto da variedade resistente."
          }
        ],
        "ingredientesAtivos": [
          {
            "nome": "Triadimenol",
            "grupo": "Triazol",
            "acao": "sistêmico (tratamento de muda)"
          },
          {
            "nome": "Propiconazol",
            "grupo": "Triazol",
            "acao": "sistêmico"
          }
        ]
      },
      {
        "id": "cana_raquitismo_soqueira",
        "classeModelo": null,
        "nome": "Raquitismo da soqueira",
        "agente": "Leifsonia xyli subsp. xyli",
        "tipoAgente": "bactéria",
        "gravidade": 5,
        "descricao": "A doença que mais custa à cana no Brasil, e a que menos se vê. Não há sintoma externo confiável: o canavial apenas rende menos a cada corte, o que se atribui a solo, clima ou idade da soqueira. O único sinal visível é interno - ao cortar o colmo no sentido longitudinal, os nós mostram pontos ou traços avermelhados nos feixes vasculares. A confirmação é laboratorial.",
        "sintomas": [
          {
            "id": "nos_internos_avermelhados",
            "peso": 1
          },
          {
            "id": "crescimento_reduzido",
            "peso": 0.8
          },
          {
            "id": "internodios_curtos",
            "peso": 0.6
          }
        ],
        "condicoesFavoraveis": {
          "temperatura": "Sem faixa definida - a bactéria não depende de clima para infectar",
          "umidade": "A perda aparece nos períodos de déficit hídrico",
          "observacao": "A doença é invisível em ano bom e devastadora em ano de seca, porque compromete a absorção de água. A transmissão é mecânica: facão de corte e colhedora levam a bactéria de touceira em touceira, o que faz da própria colheita a principal via de disseminação."
        },
        "tratamentos": [
          {
            "tipo": "cultural",
            "descricao": "Muda de viveiro sadio, com origem rastreada - é a única medida realmente eficaz."
          },
          {
            "tipo": "cultural",
            "descricao": "Tratamento térmico da muda (água a cerca de 50,5 °C por 2 h) na formação do viveiro."
          },
          {
            "tipo": "cultural",
            "descricao": "Desinfetar facões e implementos de corte entre talhões, e priorizar a ordem de colheita das áreas sadias antes das suspeitas."
          },
          {
            "tipo": "cultural",
            "descricao": "Renovar o canavial com material de viveiro certificado quando a produtividade da soqueira cair sem causa aparente."
          }
        ],
        "ingredientesAtivos": []
      },
      {
        "id": "cana_mosaico",
        "classeModelo": null,
        "nome": "Mosaico da cana",
        "agente": "Sugarcane mosaic virus, transmitido por pulgões",
        "tipoAgente": "vírus",
        "gravidade": 3,
        "descricao": "Mosaico de verde claro e verde escuro nas folhas novas, mais nítido contra a luz e na base da folha. Reduz o perfilhamento e o peso do colmo. Como toda virose de planta, não tem controle curativo: o manejo é de muda sadia e de variedade tolerante, e o pulgão é apenas o carona que leva o vírus de um talhão a outro.",
        "sintomas": [
          {
            "id": "mosaico_verde_claro_escuro",
            "peso": 1
          },
          {
            "id": "crescimento_reduzido",
            "peso": 0.5
          },
          {
            "id": "manchas_amareladas",
            "peso": 0.4
          }
        ],
        "condicoesFavoraveis": {
          "temperatura": "Sem faixa definida - depende da atividade do pulgão vetor",
          "umidade": "Indiferente",
          "observacao": "A muda infectada carrega o vírus para o talhão novo já no plantio. Controlar o pulgão depois da infecção instalada não recupera a planta."
        },
        "tratamentos": [
          {
            "tipo": "cultural",
            "descricao": "Variedades tolerantes e mudas de viveiro sadio, inspecionadas visualmente antes do plantio."
          },
          {
            "tipo": "cultural",
            "descricao": "Eliminar as touceiras com mosaico do viveiro (roguing), para não multiplicar material infectado."
          },
          {
            "tipo": "cultural",
            "descricao": "Controlar hospedeiros alternativos, como sorgo e capins, na borda dos talhões."
          }
        ],
        "ingredientesAtivos": []
      }
    ]
  },
  {
    "id": "Tomato",
    "prefixoModelo": "Tomato",
    "nome": "Tomate",
    "nomeCientifico": "Solanum lycopersicum",
    "emoji": "🍅",
    "doencas": [
      {
        "id": "tomate_mancha_bacteriana",
        "classeModelo": "Tomato___Bacterial_spot",
        "nome": "Mancha-bacteriana do tomateiro",
        "agente": "Xanthomonas spp.",
        "tipoAgente": "bactéria",
        "gravidade": 4,
        "descricao": "Manchas pequenas, angulares e encharcadas, com halo amarelo, que depois secam e ficam pardas. Sob alta umidade avançam rápido e provocam desfolha, expondo os frutos à escaldadura. No fruto surgem manchas ásperas e salientes, tipo verruga, que derrubam a classificação da caixa.",
        "sintomas": [
          {
            "id": "manchas_angulares_halo_amarelo",
            "peso": 1
          },
          {
            "id": "manchas_encharcadas",
            "peso": 0.8
          },
          {
            "id": "manchas_salientes_fruto",
            "peso": 0.8
          },
          {
            "id": "queda_precoce_folhas",
            "peso": 0.5
          },
          {
            "id": "manchas_amareladas",
            "peso": 0.3
          }
        ],
        "condicoesFavoraveis": {
          "temperatura": "24 a 30 °C",
          "umidade": "Muito alta, com chuva ou irrigação por aspersão",
          "observacao": "Semente e muda contaminadas são a principal porta de entrada. Respingos de chuva e o manuseio das plantas molhadas espalham a bactéria pela lavoura em poucas horas."
        },
        "tratamentos": [
          {
            "tipo": "cultural",
            "descricao": "Sementes tratadas termicamente e mudas de viveiro idôneo."
          },
          {
            "tipo": "cultural",
            "descricao": "Não realizar desbrota, amarrio ou pulverização com as plantas molhadas."
          },
          {
            "tipo": "cultural",
            "descricao": "Rotação de dois anos com não solanáceas e eliminação dos restos culturais."
          },
          {
            "tipo": "biologico",
            "descricao": "Bacillus subtilis como complemento preventivo aos cúpricos."
          },
          {
            "tipo": "quimico",
            "descricao": "Cúpricos preventivos, em geral associados a mancozebe. Bacteriose não tem curativo: o que se faz é proteger o tecido ainda sadio."
          }
        ],
        "ingredientesAtivos": [
          {
            "nome": "Oxicloreto de cobre",
            "grupo": "Cúprico",
            "acao": "protetor"
          },
          {
            "nome": "Hidróxido de cobre",
            "grupo": "Cúprico",
            "acao": "protetor"
          },
          {
            "nome": "Casugamicina",
            "grupo": "Antibiótico agrícola",
            "acao": "bactericida"
          }
        ]
      },
      {
        "id": "tomate_pinta_preta",
        "classeModelo": "Tomato___Early_blight",
        "nome": "Pinta-preta (mancha-de-alternária)",
        "agente": "Alternaria solani",
        "tipoAgente": "fungo",
        "gravidade": 4,
        "descricao": "Doença foliar muito comum no tomateiro. Começa pelas folhas mais velhas, próximas ao solo, e progride para cima. As lesões são escuras e apresentam anéis concêntricos característicos, que lembram um alvo. Em ataques severos causa desfolha intensa, expondo os frutos ao sol e reduzindo drasticamente a produtividade.",
        "sintomas": [
          {
            "id": "manchas_escuras_aneis",
            "peso": 1
          },
          {
            "id": "desfolha_baixo_para_cima",
            "peso": 0.8
          },
          {
            "id": "manchas_amareladas",
            "peso": 0.4
          },
          {
            "id": "lesoes_no_caule",
            "peso": 0.4
          },
          {
            "id": "lesoes_no_fruto",
            "peso": 0.3
          }
        ],
        "condicoesFavoraveis": {
          "temperatura": "24 a 29 °C",
          "umidade": "Alta, com molhamento foliar prolongado (acima de 8 h)",
          "observacao": "Alternância de períodos úmidos e secos favorece o ciclo. Comum em lavouras com adubação nitrogenada deficiente e plantas debilitadas após a frutificação."
        },
        "tratamentos": [
          {
            "tipo": "cultural",
            "descricao": "Rotação de culturas por no mínimo 2 anos, evitando solanáceas (batata, berinjela, pimentão)."
          },
          {
            "tipo": "cultural",
            "descricao": "Eliminar restos culturais e plantas voluntárias, que são fonte de inóculo."
          },
          {
            "tipo": "cultural",
            "descricao": "Irrigação por gotejamento em vez de aspersão, para reduzir o molhamento foliar."
          },
          {
            "tipo": "cultural",
            "descricao": "Manter nutrição equilibrada; plantas bem nutridas toleram melhor a doença."
          },
          {
            "tipo": "quimico",
            "descricao": "Fungicidas protetores em aplicações preventivas, alternando com sistêmicos para evitar resistência."
          }
        ],
        "ingredientesAtivos": [
          {
            "nome": "Mancozebe",
            "grupo": "Ditiocarbamato",
            "acao": "protetor"
          },
          {
            "nome": "Clorotalonil",
            "grupo": "Isoftalonitrila",
            "acao": "protetor"
          },
          {
            "nome": "Azoxistrobina",
            "grupo": "Estrobilurina",
            "acao": "sistêmico"
          },
          {
            "nome": "Difenoconazol",
            "grupo": "Triazol",
            "acao": "sistêmico"
          }
        ]
      },
      {
        "id": "tomate_requeima",
        "classeModelo": "Tomato___Late_blight",
        "nome": "Requeima (míldio)",
        "agente": "Phytophthora infestans",
        "tipoAgente": "oomiceto",
        "gravidade": 5,
        "descricao": "A doença mais destrutiva do tomateiro. Em condições favoráveis pode destruir uma lavoura inteira em poucos dias. As lesões são grandes, de aspecto encharcado, com coloração verde-escura a marrom, e frequentemente apresentam um mofo branco acinzentado na face inferior da folha em manhãs úmidas.",
        "sintomas": [
          {
            "id": "manchas_encharcadas",
            "peso": 1
          },
          {
            "id": "mofo_branco_face_inferior",
            "peso": 0.9
          },
          {
            "id": "lesoes_no_caule",
            "peso": 0.6
          },
          {
            "id": "lesoes_no_fruto",
            "peso": 0.6
          },
          {
            "id": "murcha",
            "peso": 0.3
          }
        ],
        "condicoesFavoraveis": {
          "temperatura": "12 a 20 °C (noites frias)",
          "umidade": "Muito alta, acima de 90%, com neblina ou chuvas frequentes",
          "observacao": "Época clássica: outono e inverno em regiões serranas. A combinação de noite fria e úmida com dia ameno é o cenário ideal para epidemia explosiva."
        },
        "tratamentos": [
          {
            "tipo": "cultural",
            "descricao": "Usar mudas sadias e cultivares com resistência quando disponíveis."
          },
          {
            "tipo": "cultural",
            "descricao": "Aumentar espaçamento e melhorar a condução para ventilar o dossel."
          },
          {
            "tipo": "cultural",
            "descricao": "Eliminar e destruir plantas doentes imediatamente - não deixar no campo."
          },
          {
            "tipo": "quimico",
            "descricao": "Controle estritamente preventivo. O curativo raramente funciona: aplicar antes do período de risco climático."
          }
        ],
        "ingredientesAtivos": [
          {
            "nome": "Mancozebe",
            "grupo": "Ditiocarbamato",
            "acao": "protetor"
          },
          {
            "nome": "Cimoxanil",
            "grupo": "Cianoacetamida-oxima",
            "acao": "sistêmico"
          },
          {
            "nome": "Metalaxil-M",
            "grupo": "Acilalaninato",
            "acao": "sistêmico"
          },
          {
            "nome": "Fluazinam",
            "grupo": "Fenilpiridinilamina",
            "acao": "protetor"
          }
        ]
      },
      {
        "id": "tomate_mofo_de_folha",
        "classeModelo": "Tomato___Leaf_Mold",
        "nome": "Mofo-de-folha (cladosporiose)",
        "agente": "Passalora fulva (Fulvia fulva)",
        "tipoAgente": "fungo",
        "gravidade": 3,
        "descricao": "Manchas amarelas difusas, de contorno indefinido, na face superior da folha. Virando a folha, embaixo de cada mancha aparece um mofo aveludado verde-oliva a pardo - é esse contraste entre as duas faces que fecha o diagnóstico. Praticamente exclusiva de cultivo protegido.",
        "sintomas": [
          {
            "id": "mofo_oliva_face_inferior",
            "peso": 1
          },
          {
            "id": "manchas_amareladas",
            "peso": 0.9
          },
          {
            "id": "desfolha_baixo_para_cima",
            "peso": 0.5
          }
        ],
        "condicoesFavoraveis": {
          "temperatura": "20 a 25 °C",
          "umidade": "Acima de 85% - abaixo disso o fungo não esporula",
          "observacao": "Doença de estufa: em campo aberto raramente é problema. O gatilho é umidade relativa alta e constante, e ventilação noturna resolve mais que fungicida. Como o patógeno tem raças, cultivares com genes Cf perdem eficácia com o tempo."
        },
        "tratamentos": [
          {
            "tipo": "cultural",
            "descricao": "Ventilar e desumidificar a estufa, sobretudo no fim da tarde e à noite."
          },
          {
            "tipo": "cultural",
            "descricao": "Aumentar espaçamento e fazer desbrota para abrir o dossel."
          },
          {
            "tipo": "cultural",
            "descricao": "Cultivares com genes de resistência Cf, alternando os disponíveis."
          },
          {
            "tipo": "quimico",
            "descricao": "Protetores preventivos, alternando grupos por causa da variabilidade de raças."
          }
        ],
        "ingredientesAtivos": [
          {
            "nome": "Clorotalonil",
            "grupo": "Isoftalonitrila",
            "acao": "protetor"
          },
          {
            "nome": "Mancozebe",
            "grupo": "Ditiocarbamato",
            "acao": "protetor"
          },
          {
            "nome": "Difenoconazol",
            "grupo": "Triazol",
            "acao": "sistêmico"
          }
        ]
      },
      {
        "id": "tomate_septoriose",
        "classeModelo": "Tomato___Septoria_leaf_spot",
        "nome": "Septoriose (mancha-de-septória)",
        "agente": "Septoria lycopersici",
        "tipoAgente": "fungo",
        "gravidade": 3,
        "descricao": "Provoca grande número de manchas pequenas e circulares nas folhas, com centro acinzentado ou pálido e borda escura bem definida. Dentro do centro claro veem-se pontinhos pretos, os picnídios. É frequentemente confundida com a pinta-preta, mas as lesões são menores, muito mais numerosas e não apresentam anéis concêntricos.",
        "sintomas": [
          {
            "id": "manchas_pequenas_centro_claro",
            "peso": 1
          },
          {
            "id": "desfolha_baixo_para_cima",
            "peso": 0.7
          },
          {
            "id": "pontuacoes_pretas_na_lesao",
            "peso": 0.6
          },
          {
            "id": "manchas_amareladas",
            "peso": 0.4
          }
        ],
        "condicoesFavoraveis": {
          "temperatura": "20 a 25 °C",
          "umidade": "Alta, com chuvas frequentes e respingos de solo",
          "observacao": "Dissemina-se principalmente por respingos de água da chuva ou de irrigação por aspersão, que levam esporos do solo para as folhas baixeiras."
        },
        "tratamentos": [
          {
            "tipo": "cultural",
            "descricao": "Cobertura morta no solo para reduzir respingos."
          },
          {
            "tipo": "cultural",
            "descricao": "Rotação de culturas e eliminação de restos culturais."
          },
          {
            "tipo": "quimico",
            "descricao": "Fungicidas protetores em programa preventivo, iniciando antes do fechamento do dossel."
          }
        ],
        "ingredientesAtivos": [
          {
            "nome": "Clorotalonil",
            "grupo": "Isoftalonitrila",
            "acao": "protetor"
          },
          {
            "nome": "Mancozebe",
            "grupo": "Ditiocarbamato",
            "acao": "protetor"
          },
          {
            "nome": "Difenoconazol",
            "grupo": "Triazol",
            "acao": "sistêmico"
          }
        ]
      },
      {
        "id": "tomate_mancha_alvo",
        "classeModelo": "Tomato___Target_Spot",
        "nome": "Mancha-alvo",
        "agente": "Corynespora cassiicola",
        "tipoAgente": "fungo",
        "gravidade": 4,
        "descricao": "Lesões com anéis concêntricos, muito parecidas com as da pinta-preta. As diferenças práticas: aqui as lesões são menores e mais numerosas, aparecem cedo também no terço médio e superior da planta, e o ataque ao fruto é bem mais agressivo. Na dúvida entre as duas, olhe o fruto e a altura das primeiras lesões.",
        "sintomas": [
          {
            "id": "manchas_escuras_aneis",
            "peso": 1
          },
          {
            "id": "lesoes_no_fruto",
            "peso": 0.7
          },
          {
            "id": "manchas_pequenas_centro_claro",
            "peso": 0.6
          },
          {
            "id": "lesoes_no_caule",
            "peso": 0.5
          },
          {
            "id": "desfolha_baixo_para_cima",
            "peso": 0.5
          }
        ],
        "condicoesFavoraveis": {
          "temperatura": "22 a 28 °C",
          "umidade": "Alta, com molhamento foliar prolongado",
          "observacao": "Vem ganhando importância em tomate de mesa e industrial. Já existem relatos de resistência a estrobilurinas, então repetir o mesmo grupo é receita para perder a ferramenta."
        },
        "tratamentos": [
          {
            "tipo": "cultural",
            "descricao": "Rotação de culturas e destruição dos restos culturais."
          },
          {
            "tipo": "cultural",
            "descricao": "Condução e desbrota que arejem o dossel e encurtem o molhamento foliar."
          },
          {
            "tipo": "quimico",
            "descricao": "Protetores como base, associados a carboxamidas ou estrobilurinas, sempre alternando grupos."
          }
        ],
        "ingredientesAtivos": [
          {
            "nome": "Clorotalonil",
            "grupo": "Isoftalonitrila",
            "acao": "protetor"
          },
          {
            "nome": "Mancozebe",
            "grupo": "Ditiocarbamato",
            "acao": "protetor"
          },
          {
            "nome": "Boscalida",
            "grupo": "Carboxamida",
            "acao": "sistêmico"
          },
          {
            "nome": "Difenoconazol",
            "grupo": "Triazol",
            "acao": "sistêmico"
          }
        ]
      },
      {
        "id": "tomate_acaro_rajado",
        "classeModelo": "Tomato___Spider_mites Two-spotted_spider_mite",
        "nome": "Ácaro-rajado",
        "agente": "Tetranychus urticae",
        "tipoAgente": "ácaro",
        "gravidade": 3,
        "descricao": "Não é doença: é praga. O ácaro raspa a face inferior da folha e o dano aparece na face superior como pontuações finas e claras, do tamanho de picadas de agulha. Com a população alta a folha bronzeia, aparece uma teia fina entre folhas e hastes, e a planta seca de baixo para cima.",
        "sintomas": [
          {
            "id": "pontuacoes_finas_cloroticas",
            "peso": 1
          },
          {
            "id": "acaros_face_inferior",
            "peso": 0.9
          },
          {
            "id": "teia_fina",
            "peso": 0.8
          },
          {
            "id": "bronzeamento_folha",
            "peso": 0.7
          },
          {
            "id": "desfolha_baixo_para_cima",
            "peso": 0.3
          }
        ],
        "condicoesFavoraveis": {
          "temperatura": "27 a 35 °C",
          "umidade": "Baixa, abaixo de 60% - quanto mais seco e quente, mais rápido o ciclo",
          "observacao": "Surtos clássicos aparecem logo depois de aplicações de piretroides ou de inseticidas de largo espectro, que matam os ácaros predadores e liberam a população. Poeira de carreador também favorece. Aqui, pulverizar errado é o que cria o problema."
        },
        "tratamentos": [
          {
            "tipo": "cultural",
            "descricao": "Evitar poeira nos carreadores e manter a lavoura bem irrigada; planta com estresse hídrico agrava o ataque."
          },
          {
            "tipo": "cultural",
            "descricao": "Eliminar plantas daninhas hospedeiras nas bordaduras."
          },
          {
            "tipo": "biologico",
            "descricao": "Soltura de ácaros predadores (Neoseiulus californicus, Phytoseiulus persimilis) e uso de Beauveria bassiana."
          },
          {
            "tipo": "quimico",
            "descricao": "Acaricidas específicos, alternando grupos. Evitar piretroides de largo espectro, que agravam o surto ao eliminar os predadores."
          }
        ],
        "ingredientesAtivos": [
          {
            "nome": "Abamectina",
            "grupo": "Avermectina",
            "acao": "acaricida"
          },
          {
            "nome": "Espiromesifeno",
            "grupo": "Cetoenol",
            "acao": "acaricida"
          },
          {
            "nome": "Ciflumetofem",
            "grupo": "Benzoilacetonitrila",
            "acao": "acaricida"
          },
          {
            "nome": "Óleo mineral",
            "grupo": "Mineral",
            "acao": "acaricida de contato"
          }
        ]
      },
      {
        "id": "tomate_geminivirus",
        "classeModelo": "Tomato___Tomato_Yellow_Leaf_Curl_Virus",
        "nome": "Geminivirose (vírus do enrolamento amarelo)",
        "agente": "Begomovirus, transmitido pela mosca-branca (Bemisia tabaci)",
        "tipoAgente": "vírus",
        "gravidade": 5,
        "descricao": "Doença viral sem controle curativo. As folhas ficam reduzidas, enroladas para cima e amareladas entre as nervuras, e a planta apresenta forte nanismo. Plantas infectadas ainda jovens praticamente não produzem. O controle é feito exclusivamente sobre o inseto vetor, a mosca-branca.",
        "sintomas": [
          {
            "id": "folhas_deformadas",
            "peso": 1
          },
          {
            "id": "crescimento_reduzido",
            "peso": 0.9
          },
          {
            "id": "nervuras_amareladas",
            "peso": 0.8
          },
          {
            "id": "insetos_face_inferior",
            "peso": 0.8
          },
          {
            "id": "queda_de_frutos",
            "peso": 0.4
          }
        ],
        "condicoesFavoraveis": {
          "temperatura": "25 a 32 °C",
          "umidade": "Baixa a moderada - clima seco e quente favorece a mosca-branca",
          "observacao": "Epidemias acompanham a população do vetor. Proximidade de lavouras de soja, feijão ou algodão em fim de ciclo aumenta muito o risco, porque a mosca-branca migra em massa quando aquela cultura seca."
        },
        "tratamentos": [
          {
            "tipo": "cultural",
            "descricao": "Não há controle curativo. Arrancar e destruir as plantas infectadas para reduzir a fonte de vírus."
          },
          {
            "tipo": "cultural",
            "descricao": "Produção de mudas em ambiente protegido com tela antiafídeo."
          },
          {
            "tipo": "cultural",
            "descricao": "Vazio sanitário e evitar plantios escalonados próximos entre si."
          },
          {
            "tipo": "biologico",
            "descricao": "Preservar inimigos naturais da mosca-branca, como Encarsia formosa e fungos entomopatogênicos."
          },
          {
            "tipo": "quimico",
            "descricao": "Controle do vetor com inseticidas, alternando modos de ação para retardar a resistência."
          }
        ],
        "ingredientesAtivos": [
          {
            "nome": "Imidacloprido",
            "grupo": "Neonicotinoide",
            "acao": "inseticida sistêmico (vetor)"
          },
          {
            "nome": "Espiromesifeno",
            "grupo": "Cetoenol",
            "acao": "inseticida (vetor)"
          },
          {
            "nome": "Piriproxifem",
            "grupo": "Regulador de crescimento",
            "acao": "inseticida (vetor)"
          }
        ]
      },
      {
        "id": "tomate_mosaico",
        "classeModelo": "Tomato___Tomato_mosaic_virus",
        "nome": "Mosaico do tomateiro (ToMV)",
        "agente": "Tomato mosaic virus",
        "tipoAgente": "vírus",
        "gravidade": 4,
        "descricao": "Mosaico de verde claro e verde escuro nas folhas, muitas vezes acompanhado de folhas estreitas e filiformes, com aspecto de samambaia. Ao contrário da geminivirose, não tem inseto vetor: a transmissão é mecânica, pelas mãos e ferramentas de quem trabalha na lavoura, e por semente.",
        "sintomas": [
          {
            "id": "mosaico_verde_claro_escuro",
            "peso": 1
          },
          {
            "id": "folhas_filiformes",
            "peso": 0.7
          },
          {
            "id": "folhas_deformadas",
            "peso": 0.6
          },
          {
            "id": "crescimento_reduzido",
            "peso": 0.5
          },
          {
            "id": "lesoes_no_fruto",
            "peso": 0.3
          }
        ],
        "condicoesFavoraveis": {
          "temperatura": "Indiferente - o vírus não depende de clima",
          "umidade": "Indiferente",
          "observacao": "O vírus é extremamente estável: sobrevive meses em restos culturais secos e em fumo processado. Trabalhador que fuma e manuseia planta sem lavar as mãos é fonte documentada de contaminação. Como não há vetor, tudo se resolve com higiene e semente sadia."
        },
        "tratamentos": [
          {
            "tipo": "cultural",
            "descricao": "Sementes sadias e cultivares com o gene de resistência Tm-2²."
          },
          {
            "tipo": "cultural",
            "descricao": "Lavar as mãos e desinfetar ferramentas entre plantas; leite desnatado ou fosfato trissódico inativam o vírus."
          },
          {
            "tipo": "cultural",
            "descricao": "Proibir o uso de fumo dentro da lavoura e do viveiro."
          },
          {
            "tipo": "cultural",
            "descricao": "Arrancar e destruir as plantas doentes, sem sacudir a folhagem das vizinhas."
          },
          {
            "tipo": "quimico",
            "descricao": "Não existe: nenhum defensivo age sobre vírus de planta. Qualquer produto vendido com essa promessa é fraude."
          }
        ],
        "ingredientesAtivos": []
      },
      {
        "id": "tomate_oidio",
        "classeModelo": null,
        "nome": "Oídio do tomateiro",
        "agente": "Leveillula taurica (Oidiopsis taurica)",
        "tipoAgente": "fungo",
        "gravidade": 3,
        "descricao": "Caracteriza-se por manchas amareladas na face superior da folha e crescimento de um pó esbranquiçado, geralmente na face inferior. Diferente da maioria dos fungos foliares, o oídio se desenvolve bem em condições de baixa umidade relativa.",
        "sintomas": [
          {
            "id": "po_branco_superficie",
            "peso": 1
          },
          {
            "id": "manchas_amareladas",
            "peso": 0.7
          },
          {
            "id": "desfolha_baixo_para_cima",
            "peso": 0.4
          }
        ],
        "condicoesFavoraveis": {
          "temperatura": "20 a 27 °C",
          "umidade": "Moderada a baixa - não exige molhamento foliar",
          "observacao": "Comum em cultivo protegido e em períodos secos. É a exceção entre as doenças fúngicas: água livre na folha atrapalha a germinação dos esporos."
        },
        "tratamentos": [
          {
            "tipo": "cultural",
            "descricao": "Melhorar a ventilação, especialmente em estufas."
          },
          {
            "tipo": "biologico",
            "descricao": "Aplicações de Bacillus subtilis têm bom efeito preventivo."
          },
          {
            "tipo": "quimico",
            "descricao": "Fungicidas à base de enxofre ou triazóis em aplicações preventivas."
          }
        ],
        "ingredientesAtivos": [
          {
            "nome": "Enxofre",
            "grupo": "Inorgânico",
            "acao": "protetor"
          },
          {
            "nome": "Tebuconazol",
            "grupo": "Triazol",
            "acao": "sistêmico"
          },
          {
            "nome": "Azoxistrobina",
            "grupo": "Estrobilurina",
            "acao": "sistêmico"
          }
        ]
      }
    ]
  }
];

export const SAUDAVEIS: readonly ClasseSaudavel[] = [
  {
    "culturaId": "Apple",
    "classeModelo": "Apple___healthy"
  },
  {
    "culturaId": "Blueberry",
    "classeModelo": "Blueberry___healthy",
    "observacao": "O PlantVillage traz o mirtilo apenas como saudável. Nenhuma doença desta cultura foi treinada, e por isso ela nem aparece no fluxo por sintomas."
  },
  {
    "culturaId": "Cherry",
    "classeModelo": "Cherry_(including_sour)___healthy"
  },
  {
    "culturaId": "Corn",
    "classeModelo": "Corn_(maize)___healthy"
  },
  {
    "culturaId": "Grape",
    "classeModelo": "Grape___healthy"
  },
  {
    "culturaId": "Peach",
    "classeModelo": "Peach___healthy"
  },
  {
    "culturaId": "Pepper",
    "classeModelo": "Pepper,_bell___healthy"
  },
  {
    "culturaId": "Potato",
    "classeModelo": "Potato___healthy"
  },
  {
    "culturaId": "Raspberry",
    "classeModelo": "Raspberry___healthy",
    "observacao": "O PlantVillage traz a framboesa apenas como saudável. Nenhuma doença desta cultura foi treinada, e por isso ela nem aparece no fluxo por sintomas."
  },
  {
    "culturaId": "Soybean",
    "classeModelo": "Soybean___healthy",
    "observacao": "O dataset não traz doença nenhuma de soja. Ferrugem asiática e mofo branco, as duas principais no Brasil, vão cair nesta classe com confiança alta - é o ponto cego mais perigoso do modelo, e o motivo de a soja continuar no fluxo por sintomas."
  },
  {
    "culturaId": "Strawberry",
    "classeModelo": "Strawberry___healthy"
  },
  {
    "culturaId": "Tomato",
    "classeModelo": "Tomato___healthy",
    "observacao": "O modelo cobre 9 das 10 doenças de tomate desta base. O oídio do tomateiro não tem classe no dataset e cairia aqui."
  }
];

export const CULTURAS_SEM_CLASSE_SAUDAVEL: readonly CulturaSemClasseSaudavel[] = [
  {
    "culturaId": "Orange",
    "motivo": "O PlantVillage traz laranja só com greening. Não existe classe de laranja saudável, então o modelo nunca responde 'sem doença' para citros."
  },
  {
    "culturaId": "Squash",
    "motivo": "O PlantVillage traz abóbora só com oídio. Não existe classe de abóbora saudável, então o modelo nunca responde 'sem doença' para abóbora."
  }
];

export const CULTURAS_FORA_DO_MODELO: readonly CulturaForaDoModelo[] = [
  {
    "culturaId": "Sugarcane",
    "motivo": "Cana-de-açúcar não existe no PlantVillage, que é um dataset de horticultura e fruticultura de clima temperado. É a maior lavoura brasileira em área colhida, e deixá-la de fora da base por causa da origem do dataset seria deixar o dataset decidir o escopo do app. Só o fluxo por sintomas a alcança."
  },
  {
    "culturaId": "Coffee",
    "motivo": "Café não existe no PlantVillage. O Brasil é o maior produtor mundial, e a ferrugem do cafeeiro é uma das doenças mais caras da agricultura brasileira. Uma folha de café apontada à câmera é o exemplo canônico de imagem fora da distribuição - o modelo, quando existir, deve recusá-la, não classificá-la."
  },
  {
    "culturaId": "Cotton",
    "motivo": "Algodão não existe no PlantVillage. A mancha-de-ramulária define o calendário de fungicidas do cerrado, e nenhuma classe do dataset chega perto dela. Só o fluxo por sintomas a alcança."
  }
];
