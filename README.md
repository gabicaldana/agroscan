# AgroScan - diagnóstico de doenças em plantas

App web que o agrônomo abre no celular em campo, aponta a câmera para a planta
e recebe o diagnóstico na hora - com descrição, manejo, nível de gravidade e as
condições climáticas que favorecem o aparecimento.

**▶ [agroscan-blond.vercel.app](https://agroscan-blond.vercel.app)** - instalável
no celular e funcional em modo avião.

> **Status:** fases 1 a 3 concluídas e a 4 em andamento. O agrônomo já
> diagnostica de verdade, marcando sintomas, sem foto nenhuma e sem rede. Base
> de 29 doenças, motor em Python e TypeScript verificados um contra o outro, e
> as 38 saídas do futuro modelo já mapeadas, mascaradas por cultura e testadas
> - antes de existir modelo.

---

## Duas restrições que definem a arquitetura

**1. Campo tem sinal ruim ou nenhum.** Se a foto precisa subir para uma API, o
app falha exatamente onde deveria funcionar. A inferência principal roda **no
navegador**, offline, com o modelo em cache. Isso não é economia de servidor -
é requisito funcional.

**2. Classificador fechado mente.** Um modelo treinado em N culturas responde
*sempre* uma das N, com confiança alta, mesmo diante de uma espécie que nunca
viu. Aponte para uma mangueira e ele devolve uma doença de tomate. Para um
agrônomo isso é pior que inútil.

Daí as três camadas de resposta:

```
   Agrônomo ──> PWA instalável, offline-first
                     │
        ┌────────────▼────────────┐
        │  1. CNN local (ONNX)    │  38 classes · ~3 MB · offline · grátis
        │     + máscara/cultura   │
        └────────────┬────────────┘
                     │  confiança alta? ──sim──> laudo
                    não
        ┌────────────▼────────────┐
        │  2. Fluxo por sintomas  │  ✅ pronto · offline · sem foto
        └────────────┬────────────┘
                     │  cultura desconhecida (fora da distribuição)?
        ┌────────────▼────────────┐
        │  3. Route Handler       │  exige rede · qualquer planta
        │     → modelo de visão   │  custa por chamada
        └────────────┬────────────┘
                     │
        ┌────────────▼────────────┐
        │  base de conhecimento   │  ✅ 29 doenças · curada à mão
        └─────────────────────────┘  embutida no bundle
                     │
      descrição · manejo · gravidade · clima · aviso legal
```

### Decisões que sustentam o projeto

**Máscara por cultura.** O PlantVillage empacota cultura e doença na mesma
classe (`Tomato___Early_blight`), mas o agrônomo *sabe* o que plantou. Ao
selecionar a cultura, as classes das outras 13 são zeradas e o softmax é
renormalizado - o modelo perde a chance de confundir pinta-preta de tomate com
requeima de batata. Já está implementado e testado em
[`web/lib/modelo.ts`](web/lib/modelo.ts), sobre vetores sintéticos, antes de
existir modelo.

**Recusa antes de responder.** O app decide se a imagem pertence ao domínio
treinado antes de arriscar um palpite. Sem isso, a camada 3 seria inútil:
nunca saberíamos quando escalar.

**Python e TypeScript com papéis separados.** Python fica com treino, export
ONNX e validação da base. TypeScript fica com a aplicação. O motor de sintomas
em Python permanece como *implementação de referência*, e o porte em TS é
testado contra ele com fixtures compartilhadas - ver
[Dois motores, um resultado](#dois-motores-um-resultado).

**A base valida antes de carregar.** O JSON é curado à mão, e um id de sintoma
com erro de digitação sumiria do perfil da doença em silêncio: o diagnóstico
ficaria errado sem ninguém notar. `python -m app.db` recusa a carga e lista
todos os problemas de uma vez - referência quebrada, peso fora da faixa,
doença sem sintoma clássico, sintoma órfão no catálogo.

---

## Rodando

### App web

```bash
cd web
npm install
npm run dev        # http://localhost:3000
npm run build      # build de produção
npm test           # motor TS contra as fixtures do Python
npm run base       # regera lib/base-conhecimento.ts a partir do JSON curado
npm run icones     # regenera os ícones do PWA a partir do código
```

`npm test` usa o runner nativo do Node (`node --test`), que roda TypeScript
direto: nenhuma dependência de teste, nenhum passo de build.

### Motor de diagnóstico (Python)

Sem dependências externas - só a biblioteca padrão.

```bash
python -m app.db          # valida o JSON e gera data/agroscan.db
python -m app.cli         # diagnóstico interativo no terminal
python -m app.fixtures    # regera as fixtures compartilhadas com o TS
python -m app.modelo      # regera o contrato das 38 classes do modelo
python -m unittest discover -s tests -t .
```

### Depois de mexer na base de conhecimento

```bash
python -m app.db && python -m app.fixtures && python -m app.modelo
cd web && npm run base && npm test
```

São cinco artefatos gerados e versionados - as fixtures, o contrato do modelo,
os dois módulos TypeScript e o banco. Todos têm teste de frescor, e o CI roda
exatamente esta sequência: nenhum deles pode envelhecer em silêncio.

---

## Como a pontuação por sintomas funciona

Cada doença tem um perfil de sintomas com **pesos** de 0 a 1: `1.0` para o
sintoma clássico (anéis concêntricos na pinta-preta), `0.3` para o ocasional.

```
                          acertos
compatibilidade = ─────────────────────────────────
                  acertos + faltantes + ruído × 0.5
```

- **acertos** - soma dos pesos dos sintomas marcados que a doença explica
- **faltantes** - soma dos pesos dos sintomas típicos que o usuário não marcou
- **ruído** - quantidade de sintomas marcados que a doença não explica

É uma variante ponderada do índice de Tversky. O denominador penaliza os dois
erros possíveis: quadro incompleto e quadro contaminado.

**Isto não é uma probabilidade.** Não existe modelo probabilístico por trás, e
a interface diz "compatibilidade", nunca "92% de confiança". Quando o modelo de
imagem entrar, ele produzirá uma confiança de verdade - e os dois sinais vão
conviver rotulados de forma distinta.

### A pergunta de desempate

Ter os pesos permite fazer algo que contar sintomas não permitiria: dizer ao
agrônomo **o que ir olhar em seguida**.

Entre os sintomas que a hipótese líder espera e que ainda não foram marcados,
o motor escolhe o de maior `peso na líder − peso na segunda`. Essa diferença é
exatamente o quanto a resposta afasta as duas: se o sintoma estiver presente,
ambas ganham, mas a líder ganha a mais justamente essa diferença.

Pegar simplesmente o de maior peso não funciona - o sintoma mais
característico da líder costuma ser característico da concorrente também, que
é justamente por que as duas empataram. Anéis concêntricos não separam
pinta-preta de mancha-alvo: as duas os fazem. A lesão no fruto separa.

A tela só promete "afasta X" quando a segunda hipótese não espera aquele
sintoma de forma alguma. Quando as duas o esperam, ela diz que a observação
confirma mas não desempata - o motor não deixa a interface prometer mais do
que ele sabe.

---

## Dois motores, um resultado

O motor existe duas vezes: em Python (`app/diagnostico.py`, a referência) e em
TypeScript (`web/lib/diagnostico.ts`, o que roda no celular). Duas
implementações da mesma regra divergem sozinhas - basta um arredondamento
diferente.

O contrato é um arquivo de fixtures gerado pelo Python e versionado:

```
data/base_conhecimento.json          fonte da verdade, curada à mão
        │
        ├─ python -m app.fixtures ──> tests/fixtures/casos_diagnostico.json
        │                                  │            76 casos
        │                                  ├──> teste Python: o motor ainda
        │                                  │    produz exatamente este arquivo
        │                                  └──> teste TS: o porte reproduz
        │                                       cada campo de cada caso
        └─ npm run base ───────────> web/lib/base-conhecimento.ts
```

Os 76 casos incluem o perfil completo e o sintoma isolado de cada uma das 29
doenças, além dos casos escolhidos a mão para ruído, ambiguidade, desempate e
limiar. Mudar um peso na base sem regerar as fixtures quebra os dois lados -
que é o objetivo.

Três armadilhas de portabilidade apareceram e estão tratadas no código:

| Armadilha | Sintoma | Solução |
|---|---|---|
| `sum()` do CPython usa soma compensada de Neumaier; `reduce` do JS soma ingenuamente | `0.7+0.6+0.5+0.3` dá 2.1 num lado e 2.0999999999999996 no outro | o porte replica a compensação |
| `round()` do Python arredonda meio para o par; `Math.round` arredonda meio para cima | 12.5% vira 12% num lado e 13% no outro | o porte replica o meio-para-o-par |
| Ordenar strings por código de caractere joga acento para depois do `z` | "Pêssego" depois de "Pimentão"; "Ácaros" no fim da lista | os dois removem diacríticos (NFD) antes de comparar |

Nenhuma delas mudaria um número na tela - erram na décima-sexta casa decimal
ou em um ponto percentual isolado. Mas comparar com tolerância deixaria passar
justamente as divergências reais que o teste existe para pegar, então a
igualdade é exata.

Também são comparados o catálogo de sintomas de cada cultura e as 29 fichas
completas: **126 testes**, cobrindo toda a base.

---

## A base de conhecimento

29 doenças em 12 culturas, com descrição, condições favoráveis, manejo
integrado e ingredientes ativos de referência. É trabalho de curadoria
agronômica, não de programação - e é o gargalo real do projeto.

**26 delas são exatamente as doenças do PlantVillage.** O dataset tem 38
classes: 26 de doença e 12 de planta saudável. Cada uma das 26 já tem conteúdo
pronto aqui, ligado à classe do modelo pelo campo `classe_modelo` - quando a
CNN entrar na fase 4, não haverá classe sem laudo.

**As outras 3 não têm classe no modelo** e trazem `classe_modelo: null`:
ferrugem asiática e mofo branco da soja, e oídio do tomateiro. O PlantVillage
não cobre nenhuma doença de soja, e um app brasileiro sem ferrugem asiática
seria estranho. Elas são alcançadas só pelo fluxo por sintomas, e o laudo diz
isso na cara: *"o modelo de imagem não cobre esta doença"*.

Mirtilo e framboesa ficam de fora do fluxo por sintomas: o dataset só as
conhece como saudáveis, e oferecê-las seria um beco sem saída.

**As 12 classes saudáveis também são dado**, na chave `saudaveis`, fora de
`culturas[].doencas`. Planta saudável não tem perfil de sintomas, e colocá-la
entre as doenças a faria aparecer como hipótese no fluxo por sintomas. Elas
existem só para o modelo ter para onde apontar quando não reconhece doença
nenhuma.

Laranja e abóbora **não têm** classe saudável - o PlantVillage só traz citros
com greening e abóbora com oídio. Isso está declarado em
`culturas_sem_classe_saudavel`, com motivo, porque uma ausência silenciosa
pareceria esquecimento de curadoria. Na prática: o modelo nunca consegue
responder "sem doença" para essas duas.

O catálogo tem 47 sintomas, agrupados pela parte da planta e filtrados por
cultura - cada cultura usa entre 2 e 20 deles. Mostrar os 47 numa tela de
celular sob sol seria um formulário ilegível.

Os pesos codificam agronomia, não intuição. Onde duas doenças são
genuinamente confundíveis no campo, a base não força uma separação artificial:
pinta-preta e mancha-alvo do tomate empatam nos anéis concêntricos porque as
duas realmente os fazem, e a descrição da mancha-alvo diz onde olhar para
separar as duas. Fingir certeza aqui seria pior que a dúvida.

---

## O contrato das 38 classes

O modelo devolve um vetor de 38 números. Sozinho ele não diz nada: é preciso
saber que o índice 29 é `Tomato___Early_blight` e que essa classe abre a ficha
`tomate_pinta_preta`. Esse mapeamento é derivado da base curada por
`python -m app.modelo` e gravado em `data/contrato_modelo.json`.

Ele existe **antes** do modelo, de propósito. Se a ordem usada no treino
divergir dela em uma posição, a falha é silenciosa e plausível: uma foto de
tomate vira `Leaf_Mold` em vez de `Late_blight`. Continua sendo doença de
tomate, a tela continua correta, e o agrônomo recebe o manejo errado. Nenhum
teste de interface pega isso. Então a ordem é decidida aqui, e o notebook de
treino passa a conferir contra ela em vez de decidir por conta.

### A ordem é `sorted()`, e isso tem armadilhas

É o que o `ImageFolder` do torchvision produz ao varrer os diretórios do
dataset: ordenação por **ponto de código**, não alfabética. Duas consequências
que parecem erro de digitação e não são:

```
35 Tomato___Tomato_Yellow_Leaf_Curl_Virus
36 Tomato___Tomato_mosaic_virus     ← depois, porque 'Y' (89) < 'm' (109)
37 Tomato___healthy                 ← sempre no fim do bloco da cultura
```

E os rótulos carregam os defeitos do dataset original, que precisam sobreviver
intactos: `Corn_(maize)___Common_rust_` termina em sublinhado, duas classes têm
**espaço** no meio, `Pepper,_bell` tem vírgula, e `Haunglongbing` está escrito
errado - mantemos o erro, porque é o nome do diretório.

Cuidado relacionado: **o `id` da cultura não é o prefixo da classe** em três dos
catorze casos. `Cherry` é `Cherry_(including_sour)`, `Corn` é `Corn_(maize)` e
`Pepper` é `Pepper,_bell`. Concatenar o id funcionaria por acidente nos outros
onze. Por isso cada cultura carrega `prefixo_modelo` explícito, e a validação
exige que toda `classe_modelo` comece pelo prefixo da cultura que a hospeda.

### Quatro camadas contra uma ordem errada

| # | Onde | O que pega |
|---|---|---|
| 1 | `tests/test_modelo.py` | as 38 strings estão **escritas à mão** no teste e comparadas com a lista gerada. Quebra o círculo de gerador e verificação serem a mesma coisa: um `sorted(key=str.lower)` acidental derruba o build |
| 2 | notebook, antes de treinar | `assert dataset.classes == contrato` - pega espelho do PlantVillage que "conserta" o sublinhado final |
| 3 | volta do Colab | `metricas.json` carrega `classes_do_treino`; teste afirma igualdade |
| 4 | no navegador | lista embutida no ONNX; o carregador recusa rodar se não bater. É a única que pega service worker servindo modelo antigo com bundle novo |

A camada 1 já existe. As outras três estão especificadas em
`contrato_de_treino`, dentro do próprio contrato, para o notebook não as
inventar.

### O que já funciona sem modelo

`web/lib/modelo.ts` recebe um vetor de 38 probabilidades e devolve a resposta
mascarada pela cultura, com a ficha a abrir. Está testado sobre vetores
sintéticos: um pico em `Potato___Late_blight` mascarado por tomate desaparece;
uma cultura sem massa nenhuma devolve `null` em vez de espalhar `NaN` pela
tela; laranja e abóbora não têm classe saudável e o código não assume que têm.

Quando o modelo chegar, a fase 5 liga o ONNX na entrada disso.

> **Uma armadilha registrada para a fase 5:** a máscara **destrói** a confiança
> como sinal de fora-da-distribuição. Renormalizar sobre as dez classes de
> tomate faz qualquer imagem - inclusive uma mangueira - sair com confiança
> alta. A recusa tem que ser calculada sobre os logits crus, antes da máscara.
> É por isso que o contrato exige que o modelo exporte **logits, nunca
> softmax**.

---

## Sistema de design - "ferramenta de campo"

O contexto de uso dita o visual: sol a pino, mão suja, talvez luva, pressa.

| Decisão | Razão |
|---|---|
| Fundo branco puro | máximo brilho reflexivo sob sol direto |
| Texto `#1C1917` - contraste 17.9:1 | muito acima do mínimo AAA |
| Bordas sólidas de 2px, sem sombras | sombra desaparece na luz do sol |
| Corpo de 18px | acima do padrão web de 16px |
| Alvo de toque de 56px | acima dos 44px de guideline, por causa de luva |
| Tema claro fixo | um app de campo não herda o modo escuro do sistema |

Gravidade nunca depende só de cor: barra preenchida + escala cromática +
rótulo textual, para continuar legível por quem não distingue as cores.

---

## Roteiro

| Fase | Entrega | Status |
|------|---------|--------|
| 1 | Base de conhecimento + motor de sintomas + CLI | ✅ |
| 2 | PWA instalável, sistema de design, telas navegáveis | ✅ |
| 3 | Base de 29 doenças, motor portado para TS, tela de sintomas | ✅ |
| 4a | Contrato das 38 classes, máscara por cultura, laudo saudável | ✅ |
| 4b | Modelo em Colab + validação honesta em campo | ⬜ |
| 5 | Câmera e inferência local com máscara e recusa | ⬜ |
| 6 | Escalonamento para qualquer planta | ⬜ |
| 7 | Caderno de campo (IndexedDB, GPS, exportação) | ⬜ |

### Nota sobre as fases 4 e 5

O dataset padrão da área, o **PlantVillage** (54 mil imagens, 38 classes), é
fotografado em laboratório com fundo uniforme. Modelos treinados nele atingem
~99% no conjunto de teste e degradam muito em fotos reais de campo.

O plano é treinar no PlantVillage e **reportar honestamente** a acurácia numa
validação externa com imagens de campo (PlantDoc, e imagens brasileiras do
Digipathos/Embrapa). A queda medida faz parte do resultado, não é algo a
esconder.

---

## Aviso legal

Sistema **educativo**. Não substitui a avaliação de um engenheiro agrônomo.

No Brasil, a aquisição e a aplicação de defensivos agrícolas exigem
**receituário agronômico**. Os ingredientes ativos citados são referência
técnica; o registro válido para cada combinação de cultura, praga e região deve
ser conferido no **AGROFIT/MAPA**.

---

## Estrutura

```
data/base_conhecimento.json         fonte da verdade - conteúdo agronômico curado
data/contrato_modelo.json           gerado - índice do modelo → classe → ficha
app/                                Python: motor de referência + tooling de dados
  db.py                             schema, validação e carga no SQLite
  diagnostico.py                    motor de referência
  fixtures.py                       gera o contrato compartilhado com o TS
  modelo.py                         deriva a ordem canônica das 38 classes
tests/
  test_diagnostico.py               testes do motor de referência
  test_modelo.py                    as 38 classes escritas à mão + validações
  fixtures/                         entrada + saída esperada, versionadas
web/                                Next.js 16 · TypeScript · Tailwind 4 · PWA
  app/                              rotas (App Router)
  components/                       UI do sistema de design
  lib/
    diagnostico.ts                  porte do motor - roda no navegador
    diagnostico.test.ts             paridade com o Python, via fixtures
    modelo.ts                       máscara por cultura sobre a saída do modelo
    modelo.test.ts                  testado com vetores sintéticos
    base-conhecimento.ts            gerado do JSON por `npm run base`
    contrato-modelo.ts              gerado - a ordem é copiada, nunca recalculada
  public/sw.js                      service worker escrito à mão
  scripts/gerar-base.mjs            JSON curados → módulos TS embutidos no bundle
  scripts/gerar-icones.mjs          ícones do PWA reprodutíveis por código
```
