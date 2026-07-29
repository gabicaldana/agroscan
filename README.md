# AgroScan - diagnóstico de doenças em plantas

App web que o agrônomo abre no celular em campo, aponta a câmera para a planta
e recebe o diagnóstico na hora - com descrição, manejo, nível de gravidade e as
condições climáticas que favorecem o aparecimento.

**▶ [agroscan-blond.vercel.app](https://agroscan-blond.vercel.app)** - instalável
no celular e funcional em modo avião.

> **Status:** fases 1 e 2 concluídas - motor de diagnóstico por sintomas
> (Python, testado) e PWA instalável com o sistema de design completo.

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
        │  2. Fluxo por sintomas  │  motor da fase 1 · offline
        └────────────┬────────────┘
                     │  cultura desconhecida (fora da distribuição)?
        ┌────────────▼────────────┐
        │  3. Route Handler       │  exige rede · qualquer planta
        │     → modelo de visão   │  custa por chamada
        └────────────┬────────────┘
                     │
        ┌────────────▼────────────┐
        │  base de conhecimento   │  JSON curado à mão · embutido no app
        └─────────────────────────┘
                     │
      descrição · manejo · gravidade · clima · aviso legal
```

### Decisões que sustentam o projeto

**Máscara por cultura.** O PlantVillage empacota cultura e doença na mesma
classe (`Tomato___Early_blight`), mas o agrônomo *sabe* o que plantou. Ao
selecionar a cultura, as classes das outras 13 são zeradas e o softmax é
renormalizado - o modelo perde a chance de confundir pinta-preta de tomate com
requeima de batata.

**Recusa antes de responder.** O app decide se a imagem pertence ao domínio
treinado antes de arriscar um palpite. Sem isso, a camada 3 seria inútil:
nunca saberíamos quando escalar.

**Python e TypeScript com papéis separados.** Python fica com treino, export
ONNX e validação da base. TypeScript fica com a aplicação. O motor de sintomas
em Python permanece como *implementação de referência*, e o porte em TS é
testado contra ele com fixtures compartilhadas.

---

## Rodando

### App web

```bash
cd web
npm install
npm run dev        # http://localhost:3000
npm run build      # build de produção
npm run icones     # regenera os ícones do PWA a partir do código
```

### Motor de diagnóstico (Python)

Sem dependências externas - só a biblioteca padrão.

```bash
python -m app.db      # gera data/agroscan.db a partir do JSON
python -m app.cli     # diagnóstico interativo no terminal
python -m unittest discover -s tests -t .
```

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

Efeito colateral útil: o sintoma faltante de maior peso é, por construção, a
**melhor pergunta de desempate**. É ele que o sistema sugere verificar, e é ele
que o app perguntará quando a CNN devolver confiança baixa.

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
| 3 | Base expandida para 26 doenças + motor portado para TS | ⬜ |
| 4 | Modelo em Colab + validação honesta em campo | ⬜ |
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
data/base_conhecimento.json   fonte da verdade - conteúdo agronômico curado
app/                          Python: motor de referência + tooling de dados
tests/                        testes do motor
web/                          Next.js 16 · TypeScript · Tailwind 4 · PWA
  app/                        rotas (App Router)
  components/                 UI do sistema de design
  lib/                        domínio (culturas, diagnóstico, modelo)
  public/sw.js                service worker escrito à mão
  scripts/gerar-icones.mjs    ícones do PWA reprodutíveis por código
```
