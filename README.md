# AgroScan - diagnóstico de doenças em plantas

App web que o agrônomo abre no celular em campo, aponta a câmera para a planta
e recebe o diagnóstico na hora - com descrição, manejo, nível de gravidade e as
condições climáticas que favorecem o aparecimento.

**▶ [agroscan-blond.vercel.app](https://agroscan-blond.vercel.app)** - instalável
no celular e funcional em modo avião.

> **Status:** fases 1 a 3 concluídas; 4 e 5 em andamento. O agrônomo já
> diagnostica de verdade, marcando sintomas, sem foto nenhuma e sem rede. A
> câmera abre, captura e pré-processa; as 38 saídas do futuro modelo já estão
> mapeadas, mascaradas por cultura e testadas. **Falta o modelo** - e até ele
> chegar, o app diz isso em vez de chutar.
>
> A base cobre **44 doenças em 17 culturas**, incluindo cana-de-açúcar, café e
> algodão - que o dataset de imagem não contém e o app declara abertamente.

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
        │  1. CNN local (ONNX)    │  38 classes · 14 culturas · ~3 MB
        │     + máscara/cultura   │  ⬜ falta o modelo; o resto do caminho
        └────────────┬────────────┘     (câmera, preproc, máscara, recusa) ✅
                     │  cultura fora do dataset? ──> corta aqui, e diz por quê
                     │  confiança alta? ──sim──> laudo
                    não
        ┌────────────▼────────────┐
        │  2. Fluxo por sintomas  │  ✅ pronto · offline · sem foto
        └────────────┬────────────┘     cobre as 17 culturas da base
                     │  cultura desconhecida (fora da distribuição)?
        ┌────────────▼────────────┐
        │  3. Route Handler       │  exige rede · qualquer planta
        │     → modelo de visão   │  custa por chamada
        └────────────┬────────────┘
                     │
        ┌────────────▼────────────┐
        │  base de conhecimento   │  ✅ 44 doenças · curada à mão
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

**O dataset não decide o escopo do app.** O PlantVillage é norte-americano, de
horticultura e fruticultura de clima temperado. Restringir a base a ele deixaria
de fora cana-de-açúcar, café e algodão - e um app agronômico brasileiro sem as
três é uma lacuna que nenhuma limitação de dataset justifica. Elas estão na base,
com as doenças que importam aqui, alcançáveis pelo fluxo por sintomas. O que o
app **não** faz é fingir que o modelo de imagem as enxerga: a cultura é declarada
fora do modelo, e a tela da câmera diz isso antes de pedir a foto.

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
python -m app.preprocessamento   # regera as fixtures de pixel
python -m unittest discover -s tests -t .
```

### Depois de mexer na base ou no pré-processamento

```bash
python -m app.db && python -m app.fixtures && python -m app.modelo && python -m app.preprocessamento
cd web && npm run base && npm test
```

São seis artefatos gerados e versionados - as fixtures do motor, as de pixel, o
contrato do modelo, os dois módulos TypeScript e o banco. Todos têm teste de
frescor, e o CI roda exatamente esta sequência e falha se sobrar diferença:
nenhum deles pode envelhecer em silêncio.

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
        │                                  │            106 casos
        │                                  ├──> teste Python: o motor ainda
        │                                  │    produz exatamente este arquivo
        │                                  └──> teste TS: o porte reproduz
        │                                       cada campo de cada caso
        └─ npm run base ───────────> web/lib/base-conhecimento.ts
```

Os 106 casos incluem o perfil completo e o sintoma isolado de cada uma das 44
doenças, além dos casos escolhidos a mão para ruído, ambiguidade, desempate e
limiar. A varredura é automática sobre a base: as 15 doenças de cana, café e
algodão entraram nas fixtures sozinhas, sem que ninguém escrevesse um caso à
mão. Mudar um peso na base sem regerar as fixtures quebra os dois lados - que é
o objetivo.

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

Também são comparados o catálogo de sintomas de cada cultura e as 44 fichas
completas: **175 testes**, cobrindo toda a base.

---

## A base de conhecimento

44 doenças em 15 culturas, com descrição, condições favoráveis, manejo
integrado e ingredientes ativos de referência. É trabalho de curadoria
agronômica, não de programação - e é o gargalo real do projeto.

**26 delas são exatamente as doenças do PlantVillage.** O dataset tem 38
classes: 26 de doença e 12 de planta saudável. Cada uma das 26 já tem conteúdo
pronto aqui, ligado à classe do modelo pelo campo `classe_modelo` - quando a
CNN entrar na fase 4, não haverá classe sem laudo.

**As outras 18 trazem `classe_modelo: null`**, e se dividem em dois casos que
o app trata de formas diferentes.

*Três estão em culturas que o modelo cobre:* ferrugem asiática e mofo branco da
soja, e oídio do tomateiro. Este é o caso perigoso. O modelo conhece soja
**apenas saudável**, então uma folha com ferrugem asiática cai na classe
saudável com confiança alta - e o laudo precisa dizer isso em voz alta:
*"o modelo de imagem não cobre esta doença"*.

*Quinze estão em culturas que o dataset não contém de forma alguma:*
cana-de-açúcar, café e algodão, com cinco doenças cada. Aqui não há resposta
errada a temer, porque não há resposta: o app corta o fluxo da câmera antes da
foto e explica o motivo, que vem da própria base em
`culturas_fora_do_modelo`.

| | laranja e abóbora | soja e tomate | cana, café e algodão |
|---|---|---|---|
| onde está declarado | `culturas_sem_classe_saudavel` | `classe_modelo: null` | `culturas_fora_do_modelo` |
| o dataset tem a cultura? | sim | sim | **não** |
| o modelo responde? | sim, mas nunca "saudável" | sim, e pode errar feio | não responde |
| o que o app faz | avisa no laudo saudável | avisa no laudo saudável | corta antes da foto |

As três lavouras novas entraram porque o AgroScan é um app brasileiro e cana,
café e algodão estão entre as maiores lavouras do país. O PlantVillage não as
tem porque é um dataset de clima temperado - e isso é uma limitação do dataset,
não um recorte de escopo do projeto. A base registra a diferença em vez de
herdá-la.

Mirtilo e framboesa ficam de fora do fluxo por sintomas: o dataset só as
conhece como saudáveis, e oferecê-las seria um beco sem saída. É o inverso de
cana, café e algodão, que ficam de fora da **câmera** e inteiras dentro do
fluxo por sintomas.

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

O catálogo tem 58 sintomas, agrupados pela parte da planta e filtrados por
cultura - cada cultura usa entre 4 e 26 deles. Mostrar os 58 numa tela de
celular sob sol seria um formulário ilegível. Onze entraram com as lavouras
novas, e vários deles são compartilhados: as pústulas alaranjadas na face
inferior servem à ferrugem do cafeeiro e à ferrugem alaranjada da cana, que é
o tipo de reuso que o catálogo existe para permitir.

Os pesos codificam agronomia, não intuição. Onde duas doenças são
genuinamente confundíveis no campo, a base não força uma separação artificial:
pinta-preta e mancha-alvo do tomate empatam nos anéis concêntricos porque as
duas realmente os fazem, e a descrição da mancha-alvo diz onde olhar para
separar as duas. Fingir certeza aqui seria pior que a dúvida.

As lavouras novas trouxeram três pares assim, de propósito:

- **ferrugem alaranjada × ferrugem marrom da cana.** Cada uma tem a sua pústula
  com peso 1.0 e a da outra com peso 0.4-0.5. A distinção importa em dinheiro:
  a variedade resistente a uma pode ser suscetível à outra.
- **mancha-de-ramulária × mancha-alvo do algodão.** As duas desfolham de baixo
  para cima na mesma lavoura. Marcar só a desfolha deixa as duas empatadas, e a
  pergunta que o motor devolve é justamente a que as separa - os anéis
  concêntricos, que a ramulária não faz.
- **mancha aureolada × mancha de phoma no café.** As duas matam ponteiro depois
  de vento frio com chuva. Aqui o motor **não** promete descartar a segunda,
  porque as duas esperam bordas de folha queimadas - e a interface repete o que
  o motor afirma, sem arredondar para cima.

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

Cana, café e algodão carregam `prefixo_modelo: null`, porque não têm prefixo
nenhum no dataset. O nulo sozinho seria ambíguo - poderia ser cadastro pela
metade - então a validação exige que ele venha acompanhado de uma entrada em
`culturas_fora_do_modelo`, com motivo. As duas metades têm que andar juntas: um
prefixo numa cultura declarada fora, ou um nulo sem declaração, é erro de carga.

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

Uma sutileza que virou teste: `POR_CULTURA` **não contém** cana, café e
algodão - e não as contém com lista vazia, o que seria diferente. Uma lista
vazia é indistinguível de cultura inexistente, e as duas situações pedem
respostas opostas: cultura inexistente é bug, cultura fora do modelo é um fato
a comunicar. Por isso a checagem certa é `foraDoModelo(id)`, e nunca
`indicesDaCultura(id).length === 0`. O teste que trava isso compara os dois
casos lado a lado.

Quando o modelo chegar, a fase 5 liga o ONNX na entrada disso.

> **Uma armadilha registrada para a fase 5:** a máscara **destrói** a confiança
> como sinal de fora-da-distribuição. Renormalizar sobre as dez classes de
> tomate faz qualquer imagem - inclusive uma mangueira - sair com confiança
> alta. A recusa tem que ser calculada sobre os logits crus, antes da máscara.
> É por isso que o contrato exige que o modelo exporte **logits, nunca
> softmax**.

---

## A foto, do sensor ao laudo

```
câmera (1280×1280)
  → preprocessamento.ts   redimensiona e normaliza IGUAL ao treino
  → classificador.ts      logits crus                        ⬜ falta o modelo
  → recusa.ts             decide sobre os LOGITS CRUS
  → modelo.ts             máscara por cultura, e só então a resposta
  → laudo
```

Tudo isso já roda, menos a caixa marcada. Medido no aparelho: **16 a 28 ms**
da captura até a resposta, num quadro 1280×1280 - o redimensionamento escrito à
mão não é gargalo.

### Pré-processamento é código do projeto, não `transforms.Resize`

O tensor que o modelo recebe no campo tem que ser **idêntico** ao que ele viu
no treino. Se o app redimensiona de um jeito e o treino de outro, o modelo
responde com a mesma confiança de sempre sobre uma imagem que nunca viu - e a
perda de acurácia some dentro de um número que continua parecendo bom.

O `drawImage` do navegador não serve: ele não redimensiona igual ao PIL nem
igual a si mesmo entre navegadores. Havia duas saídas - reproduzir o PIL bit a
bit em TypeScript, ou definir o algoritmo aqui e mandar o treino usar este. A
primeira acorrentaria o projeto a detalhes internos do PIL (ele calcula os
coeficientes em ponto fixo de 22 bits). Escolhemos a segunda.

Então o algoritmo mora em `app/preprocessamento.py`, é portado em
`web/lib/preprocessamento.ts`, e os dois são comparados por **digest SHA-256 do
tensor float32** sobre imagens geradas por fórmula - nenhuma imagem binária no
repositório. Sete casos, cobrindo ampliação, redução, retrato, paisagem e
tamanhos ímpares. Um único valor diferente no último bit muda o digest.

É um filtro triangular com suporte escalado - o mesmo algoritmo do PIL, em
ponto flutuante. Quando a imagem diminui, a janela do filtro cresce junto: é
isso que impede que reduzir uma folha com nervuras finas produza faixas de
moiré que não existem na planta, e que o modelo classificaria como textura.
Os testes provam os dois lados disso: listras de 1 px reduzidas viram cinza
(desvio 0,06), e as mesmas listras ampliadas mantêm o contraste (1,26).

> O notebook da fase 4b tem que usar esta transformação na avaliação e no
> export. É por isso que ela está pronta antes do treino.

### A recusa vai sobre os logits crus, e isso não é detalhe

A máscara por cultura **destrói** a confiança como sinal de fora-da-distribuição.

Renormalizar sobre as dez classes de tomate dá à líder um piso de 10% por pior
que seja a foto - e esse piso mede como o modelo divide a cultura, não o quanto
ele reconheceu a imagem. Para laranja, que tem uma classe só, o piso é
**100%**: qualquer imagem apontada como laranja sai com confiança total,
inclusive uma folha de café.

Por isso `recusa.ts` recebe os logits crus, antes da máscara, e calcula três
pontuações que falham de formas diferentes: MSP (satura em modelos confiantes),
energia livre (não satura) e margem entre o primeiro e o segundo (pega hesitação
entre classes plausíveis, que é diferente de não reconhecer nada). E por isso o
contrato exige que o modelo exporte **logits, nunca softmax** - com o softmax
dentro do grafo, temperatura e energia ficam impossíveis de calcular no cliente.

**Os limiares estão nulos**, de propósito. Eles saem da curva risco-cobertura
medida na fase 4b; chutar um número daria ao agrônomo uma recusa que não
significa nada. Até lá o app calcula as pontuações e declara que não está
calibrado.

### O modelo é um buraco com forma

`classificador.ts` é uma interface, não um runtime. Hoje devolve `null`, o app
diz o que falta e oferece o fluxo por sintomas - não é erro, é o estado
previsto do produto nesta fase.

O que já está pronto e testado é a defesa que a fase 5b vai precisar:
`conferirClasses` compara a lista gravada dentro do ONNX com a do contrato e
recusa rodar se divergir. O cenário que ela pega é o provável neste app -
service worker servindo um modelo antigo junto de um bundle novo: os dois
carregam, a inferência roda, cada índice aponta para a doença errada, e nenhuma
tela quebra.

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
| 5a | Câmera, pré-processamento com paridade de pixel, recusa | ✅ |
| 3b | Cana, café e algodão na base: 44 doenças, 58 sintomas, cultura fora do modelo | ✅ |
| 4b | Modelo em Colab + validação honesta em campo | ⬜ |
| 5b | Ligar o ONNX e calibrar os limiares de recusa | ⬜ |
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

### Questão em aberto: trocar o PlantVillage pelo Digipathos

O **Digipathos**, da Embrapa Informática Agropecuária, é um repositório
brasileiro de imagens de doenças de plantas, com fotos de campo e cobertura de
lavouras que interessam aqui - café e soja entre elas. A pergunta óbvia é por
que não treinar nele desde já, e ela é legítima. Três coisas pesam contra a
troca simples, e nenhuma delas é definitiva:

1. **Tamanho por classe.** O PlantVillage tem ~1.400 imagens por classe, bem
   distribuídas. Repositórios de campo costumam ser bem menores e muito
   desbalanceados - várias classes com poucas dezenas de imagens. Treinar
   direto num conjunto assim dá acurácia baixa e instável, e o problema não é
   de arquitetura, é de dado.
2. **A validação externa some.** Hoje o Digipathos é o conjunto de
   **validação honesta** do projeto: é ele que mede a queda laboratório →
   campo. Se virar treino, essa medição deixa de existir, e seria preciso
   separar um novo conjunto de campo só para isso.
3. **Duas mudanças ao mesmo tempo.** Trocar de dataset junto com a primeira
   medição de acurácia mistura dois efeitos - a queda lab→campo e a mudança de
   domínio - e depois não há como saber qual causou o quê.

O caminho que faz mais sentido é **os dois, em ordem**: fechar a fase 4b com o
PlantVillage e a validação externa que já está planejada, e então usar o
Digipathos para *fine-tuning* nas culturas brasileiras, medindo o ganho contra
uma linha de base que já existe. Antes de qualquer decisão é preciso levantar o
inventário real de classes e imagens do repositório, e conferir os termos de
uso - nada disso está verificado neste README.

**O que já está pronto para essa troca:** a base de conhecimento é a fonte da
verdade, e o contrato das classes é *gerado* a partir dela. No dia em que
existir um modelo que reconheça ferrugem do cafeeiro, a mudança é preencher
`classe_modelo` nas fichas de café e tirar `Coffee` de `culturas_fora_do_modelo`
- o resto do caminho (câmera, pré-processamento, máscara, recusa, laudo) já
está escrito e testado.

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
  preprocessamento.py               referência de pixel: resize, crop, normalize
tests/
  test_diagnostico.py               testes do motor de referência
  test_modelo.py                    as 38 classes escritas à mão + validações
  test_preprocessamento.py          filtro, antisserrilhamento, contrato de pixel
  fixtures/                         entrada + saída esperada, versionadas
web/                                Next.js 16 · TypeScript · Tailwind 4 · PWA
  app/                              rotas (App Router)
  components/                       UI do sistema de design
  lib/
    diagnostico.ts                  porte do motor - roda no navegador
    diagnostico.test.ts             paridade com o Python, via fixtures
    modelo.ts                       máscara por cultura + quais o modelo não cobre
    preprocessamento.ts             porte do resize/normalize, paridade por digest
    recusa.ts                       MSP, energia e margem sobre os logits crus
    classificador.ts                a costura do ONNX - hoje devolve null
    diagnostico-por-imagem.ts       orquestra foto → laudo
    base-conhecimento.ts            gerado do JSON por `npm run base`
    contrato-modelo.ts              gerado - a ordem é copiada, nunca recalculada
  components/Camera.tsx             getUserMedia, visor e captura em resolução nativa
  public/sw.js                      service worker escrito à mão
  scripts/gerar-base.mjs            JSON curados → módulos TS embutidos no bundle
  scripts/gerar-icones.mjs          ícones do PWA reprodutíveis por código
```
