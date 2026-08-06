# FlowCards: plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Um visual customizado do Power BI que desenha um cartão por valor de uma
categoria, na ordem que o modelo mandar, e filtra a página ao ser clicado.

**Architecture:** Três arquivos com responsabilidade separada, espelhando o
`modern-rankbars` do mesmo autor: `dataModel.ts` lê o dataview e devolve um modelo
tipado (puro, testável), `settings.ts` monta o painel de formatação, e `visual.ts`
desenha e trata seleção. O que é puro tem teste automatizado; o resto exige tela.

**Tech Stack:** TypeScript, pbiviz 7.1, API do Power BI 5.11,
`powerbi-visuals-utils-formattingmodel`, vitest, eslint com
`eslint-plugin-powerbi-visuals`, LESS.

**Spec:** `docs/superpowers/specs/2026-08-06-flowcards-design.md`

## Global Constraints

- **Pasta do projeto:** `M:\NIC\Projetos\flowcards`. Todo arquivo e todo contexto
  do Claude vivem aqui, por decisão do usuário.
- **Repositório:** `github.com/viniciusduartelage/flowcards`, **público desde o
  primeiro commit**. Nome já verificado como livre.
- **Licença:** `GPL-3.0-or-later`, igual ao `modern-rankbars`.
- **Git aqui é normal.** Este repositório NÃO segue a regra de fila do ScriptSQL
  nem o commit automático dos projetos PBIP. Commite direto, com mensagem
  descritiva.
- **Ferramentas instaladas e verificadas:** node 24.14.0, npm 11.16.0,
  pbiviz 7.1.0.
- **O visual não ordena nada.** Ele respeita a ordem em que o Power BI entrega as
  categorias, definida por `Sort by column` no modelo. Isso é decisão de desenho,
  não omissão.
- **Cartão sem `Valor 2`: o número some e o rótulo fica.** Sem traço e sem zero.
- **Seleção:** clique troca, `Ctrl` mais clique acumula, clicar no selecionado
  desmarca, `Tab` navega, `Enter` e `Espaço` acionam.
- **Textos do painel de formatação saem de `stringResources`**, em `en-US` e
  `pt-BR`, nunca embutidos no código.
- **Sem travessão e sem reticências** em texto visível ao usuário e em documentação.
- **Dependência do usuário:** habilitar o modo de desenvolvedor no Power BI Desktop
  uma vez, e conferir na tela nos pontos indicados. Nenhuma tarefa que dependa
  disso pode ser dada como concluída sem a confirmação dele.

## Ritmo das tarefas que exigem tela

Visual customizado quase não se manifesta fora do Power BI. Sempre que uma tarefa
tiver verificação visual:

```
1. npm start  (sobe o servidor de desenvolvimento em https://localhost:8080)
2. o usuario abre o relatorio e usa o visual em modo debug
3. o usuario olha e responde os itens da verificacao
4. so entao a tarefa fecha
```

## File Structure

| Arquivo | Responsabilidade | Ação |
|---|---|---|
| `pbiviz.json` | nome, guid, versão, autor, api | Criar |
| `capabilities.json` | campos, mapeamento do dataview, objetos de formatação | Criar |
| `package.json` | scripts e dependências | Criar |
| `src/dataModel.ts` | lê o dataview e devolve o modelo tipado. **Puro.** | Criar |
| `src/settings.ts` | modelo do painel de formatação | Criar |
| `src/visual.ts` | desenho, seleção, teclado | Criar |
| `style/visual.less` | estilos do cartão | Criar |
| `test/dataModel.test.ts` | testes do que é puro | Criar |
| `stringResources/{en-US,pt-BR}/resources.resjson` | rótulos do painel | Criar |
| `README.md`, `README.pt-BR.md`, `CHANGELOG.md`, `LICENSE`, `PRIVACY.md`, `SUPPORT.md` | documentação | Criar |
| Modelo Comercial: `SaudeBase.tmdl`, `EtapasCartao.tmdl`, `relationships.tmdl` | a tabela de ligação | Task 6 |

---

## Task 1: Esqueleto que renderiza e sobe ao GitHub

Prova a cadeia inteira antes de existir lógica: ferramenta, build, importação no
Power BI e repositório. Se algo aqui estiver quebrado, descobrir agora custa
minutos; descobrir na Task 5 custa horas de dúvida sobre a causa.

**Files:**
- Create: tudo do esqueleto em `M:\NIC\Projetos\flowcards`

- [ ] **Step 1: Gerar o esqueleto**

```bash
cd "M:/NIC/Projetos"
pbiviz new flowcards --template default
cd flowcards
npm install
```

Se a pasta já existir com o `docs/` dentro, gere em `M:/NIC/Projetos/_tmp_flowcards`
e mova o conteúdo para dentro de `flowcards`, preservando `docs/`.

- [ ] **Step 2: Ajustar identidade em `pbiviz.json`**

```json
{
  "visual": {
    "name": "flowCards",
    "displayName": "FlowCards",
    "guid": "flowCards<GERAR32HEX>",
    "visualClassName": "Visual",
    "version": "1.0.0.0",
    "description": "Uma faixa de cartoes, um por categoria, na ordem do modelo. Clicar filtra a pagina.",
    "supportUrl": "https://github.com/viniciusduartelage/flowcards/issues",
    "gitHubUrl": "https://github.com/viniciusduartelage/flowcards"
  },
  "apiVersion": "5.11.0",
  "author": { "name": "Vinicius Duarte", "email": "viniciusduartelage@outlook.com" },
  "assets": { "icon": "assets/icon.png" }
}
```

O `guid` é o nome seguido de 32 caracteres hexadecimais, sem hífen. Gere com
`node -e "console.log('flowCards'+require('crypto').randomBytes(16).toString('hex').toUpperCase())"`.

- [ ] **Step 3: Licença e `package.json`**

Copiar o `LICENSE` do `modern-rankbars`
(`M:\NIC\Vinicius\Projetos\modern-rankbars\LICENSE`), que já é GPL-3.0.

No `package.json`: `"license": "GPL-3.0-or-later"`, e os scripts iguais aos do
irmão:

```json
"scripts": {
  "pbiviz": "pbiviz",
  "start": "pbiviz start",
  "package": "pbiviz package",
  "lint": "npx eslint .",
  "test": "vitest run"
}
```

Instalar as ferramentas de teste e lint:

```bash
npm install -D vitest typescript eslint @typescript-eslint/eslint-plugin eslint-plugin-powerbi-visuals
```

- [ ] **Step 4: Provar que empacota**

```bash
npm run package
```

Esperado: gera `dist/flowCards.1.0.0.0.pbiviz` sem erro. Se falhar, pare e
relate: nada adiante funciona sem isto.

- [ ] **Step 5: Criar o repositório público e subir**

```bash
cd "M:/NIC/Projetos/flowcards"
git init
git add -A
git commit -m "Esqueleto do FlowCards: um visual que desenha uma faixa de cartoes, um por categoria, e filtra a pagina ao ser clicado. Nasce do painel HTML da Saude da Base, que era bonito mas esbarrava em dois limites: o Power BI corta em 32.000 caracteres o texto entregue a um visual customizado, e o HTML Content nao consegue avisar a pagina que foi clicado. Publico e GPL-3.0 desde o primeiro commit, como o Modern RankBars."
gh repo create viniciusduartelage/flowcards --public --source=. --remote=origin --push
```

- [ ] **Step 6: Conferir na tela (precisa do usuário)**

O usuário habilita o modo de desenvolvedor no Power BI Desktop, roda `npm start`,
e insere o visual de desenvolvimento numa página do relatório Comercial.

Esperado: o visual padrão do esqueleto aparece e responde. **Não** precisa estar
bonito; precisa aparecer. Isso confirma que a cadeia inteira funciona.

---

## Task 2: `dataModel.ts`, a parte pura, com testes

**Files:**
- Create: `src/dataModel.ts`, `test/dataModel.test.ts`
- Modify: `capabilities.json`

**Interfaces:**
- Produces: `interface Card { categoria: string; valor: number | null; valorFormatado: string; valor2: number | null; valor2Formatado: string; rotulo2: string; rodape: string; cor: string | null; indice: number; }` e
  `interface Modelo { cards: Card[]; temValor2: boolean; }` e a função
  `construirModelo(dataView: powerbi.DataView, cores: (i: number, categoria: string) => string): Modelo`

- [ ] **Step 1: Declarar os campos em `capabilities.json`**

```json
{
  "dataRoles": [
    { "displayNameKey": "Role_Categoria", "name": "categoria", "kind": "Grouping" },
    { "displayNameKey": "Role_Valor",     "name": "valor",     "kind": "Measure" },
    { "displayNameKey": "Role_Valor2",    "name": "valor2",    "kind": "Measure" },
    { "displayNameKey": "Role_Rotulo2",   "name": "rotulo2",   "kind": "Measure" },
    { "displayNameKey": "Role_Rodape",    "name": "rodape",    "kind": "Measure" },
    { "displayNameKey": "Role_Cor",       "name": "cor",       "kind": "Measure" }
  ],
  "dataViewMappings": [{
    "conditions": [{ "categoria": { "max": 1 }, "valor": { "max": 1 }, "valor2": { "max": 1 },
                     "rotulo2": { "max": 1 }, "rodape": { "max": 1 }, "cor": { "max": 1 } }],
    "categorical": {
      "categories": { "for": { "in": "categoria" }, "dataReductionAlgorithm": { "top": { "count": 30 } } },
      "values": { "select": [ { "bind": { "to": "valor" } }, { "bind": { "to": "valor2" } },
                              { "bind": { "to": "rotulo2" } }, { "bind": { "to": "rodape" } },
                              { "bind": { "to": "cor" } } ] }
    }
  }],
  "supportsHighlight": false,
  "supportsKeyboardFocus": true,
  "privileges": []
}
```

O teto de 30 categorias é deliberado: uma faixa de cartões deixa de ser legível
muito antes disso, e sem limite um campo errado arrastado pelo usuário
congelaria o visual.

- [ ] **Step 2: Escrever o teste que falha**

```ts
// test/dataModel.test.ts
import { describe, it, expect } from "vitest";
import { construirModelo } from "../src/dataModel";

// dataView minimo, no formato que o Power BI entrega
function dv(categorias: string[], valores: (number|null)[], extras: Record<string, unknown[]> = {}) {
  const valueCols: unknown[] = [
    { source: { roles: { valor: true }, format: "#,##0" }, values: valores }
  ];
  for (const [papel, vals] of Object.entries(extras)) {
    valueCols.push({ source: { roles: { [papel]: true } }, values: vals });
  }
  return {
    categorical: {
      categories: [{ source: { roles: { categoria: true } }, values: categorias }],
      values: valueCols
    }
  } as unknown as powerbi.DataView;
}

const corFixa = () => "#1B6B3A";

describe("construirModelo", () => {
  it("cria um cartao por categoria, na ordem recebida", () => {
    const m = construirModelo(dv(["Novos 30d", "Saudáveis", "Em Risco"], [873, 3121, 556]), corFixa);
    expect(m.cards.map(c => c.categoria)).toEqual(["Novos 30d", "Saudáveis", "Em Risco"]);
    expect(m.cards.map(c => c.valor)).toEqual([873, 3121, 556]);
  });

  it("valor 2 ausente marca temValor2 como falso", () => {
    const m = construirModelo(dv(["A", "B"], [1, 2]), corFixa);
    expect(m.temValor2).toBe(false);
  });

  it("valor 2 nulo num cartao devolve null, e nao zero", () => {
    const m = construirModelo(dv(["Saudáveis", "Nunca Compraram"], [3121, 54791],
                                 { valor2: [11300000, null] }), corFixa);
    expect(m.temValor2).toBe(true);
    expect(m.cards[0].valor2).toBe(11300000);
    expect(m.cards[1].valor2).toBeNull();
  });

  it("categoria vazia nao quebra e vira texto vazio", () => {
    const m = construirModelo(dv([null as unknown as string], [10]), corFixa);
    expect(m.cards[0].categoria).toBe("");
  });

  it("dataView sem categoria devolve modelo vazio em vez de estourar", () => {
    const m = construirModelo({} as powerbi.DataView, corFixa);
    expect(m.cards).toEqual([]);
  });
});
```

- [ ] **Step 3: Rodar e ver falhar**

```bash
npm test
```

Esperado: falha com "Failed to resolve import ../src/dataModel" ou
"construirModelo is not a function". Se passar, o teste não está testando nada.

- [ ] **Step 4: Implementar `src/dataModel.ts`**

```ts
import powerbi from "powerbi-visuals-api";

export interface Card {
    categoria: string;
    valor: number | null;
    valor2: number | null;
    rotulo2: string;
    rodape: string;
    cor: string | null;
    indice: number;
}

export interface Modelo {
    cards: Card[];
    temValor2: boolean;
}

/** Devolve a coluna de valores cujo papel bate, ou undefined. */
function porPapel(valores: powerbi.DataViewValueColumns | undefined, papel: string) {
    if (!valores) { return undefined; }
    for (const col of valores) {
        if (col.source && col.source.roles && col.source.roles[papel]) { return col; }
    }
    return undefined;
}

function num(v: unknown): number | null {
    return typeof v === "number" && isFinite(v) ? v : null;
}

function txt(v: unknown): string {
    return v === null || v === undefined ? "" : String(v);
}

export function construirModelo(
    dataView: powerbi.DataView,
    corDe: (indice: number, categoria: string) => string
): Modelo {
    const cat = dataView?.categorical?.categories?.[0];
    if (!cat || !cat.values) { return { cards: [], temValor2: false }; }

    const valores  = dataView.categorical.values;
    const cValor   = porPapel(valores, "valor");
    const cValor2  = porPapel(valores, "valor2");
    const cRotulo2 = porPapel(valores, "rotulo2");
    const cRodape  = porPapel(valores, "rodape");
    const cCor     = porPapel(valores, "cor");

    const cards: Card[] = cat.values.map((v, i) => ({
        categoria: txt(v),
        valor:   cValor  ? num(cValor.values[i])  : null,
        valor2:  cValor2 ? num(cValor2.values[i]) : null,
        rotulo2: cRotulo2 ? txt(cRotulo2.values[i]) : "",
        rodape:  cRodape  ? txt(cRodape.values[i])  : "",
        cor:     cCor ? (txt(cCor.values[i]) || null) : null,
        indice:  i
    }));

    // O visual NAO ordena: a ordem vem do modelo, via Sort by column.
    return { cards, temValor2: !!cValor2 };
}
```

- [ ] **Step 5: Rodar e ver passar**

```bash
npm test
```

Esperado: 5 testes passando.

- [ ] **Step 6: Commit**

```bash
git add src/dataModel.ts test/dataModel.test.ts capabilities.json
git commit -m "dataModel: le o dataview e devolve um modelo tipado, com teste. A separacao existe porque quase nada de um visual customizado se manifesta fora do Power BI, e esta e a unica parte que da para provar sem abrir o Desktop. Tres decisoes ficam gravadas em teste: valor 2 ausente e diferente de valor 2 nulo (um esconde a linha inteira, o outro esconde so o numero e mantem o rotulo), categoria vazia vira texto vazio em vez de quebrar, e dataview incompleto devolve modelo vazio em vez de estourar. O visual nao ordena: a ordem vem do Sort by column do modelo, para valer igual em todo visual do relatorio."
```

---

## Task 3: Desenhar os cartões

**Files:**
- Modify: `src/visual.ts`
- Create: `style/visual.less`

**Interfaces:**
- Consumes: `construirModelo` da Task 2.
- Produces: `Visual.update(options)` desenhando uma faixa de cartões.

- [ ] **Step 1: Escrever `style/visual.less`**

```less
.flowcards {
  display: flex; gap: var(--fc-gap, 9px);
  width: 100%; height: 100%;
  font-family: "Segoe UI", system-ui, sans-serif;
  overflow: hidden;
}
.flowcards .card {
  flex: 1 1 0; min-width: 0;
  border-radius: var(--fc-radius, 10px);
  padding: 13px 14px; color: #fff;
  border: 2px solid transparent;
  display: flex; flex-direction: column;
  cursor: pointer; user-select: none;
  transition: opacity .18s ease, box-shadow .18s ease;
}
.flowcards .card:focus-visible { outline: 3px solid #FFD98A; outline-offset: 2px; }
.flowcards .card.apagado { opacity: var(--fc-dim, .38); }
.flowcards .card.aceso   { border-color: #FFD98A; box-shadow: 0 0 0 3px rgba(255,217,138,.32); }
.flowcards .lbl  { font-size: 9.5px; font-weight: 700; letter-spacing: .08em;
                   text-transform: uppercase; color: rgba(255,255,255,.64);
                   white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.flowcards .val  { font-size: var(--fc-val, 26px); font-weight: 700; line-height: 1.04;
                   margin: 4px 0 7px; font-variant-numeric: tabular-nums; }
.flowcards .k    { font-size: 8.5px; font-weight: 700; letter-spacing: .06em;
                   text-transform: uppercase; color: rgba(255,255,255,.52); }
.flowcards .v2   { font-size: 13.5px; font-weight: 600; color: rgba(255,255,255,.88);
                   font-variant-numeric: tabular-nums; }
.flowcards .foot { font-size: 10px; color: rgba(255,255,255,.42); margin-top: auto; padding-top: 6px; }
@media (prefers-reduced-motion: reduce) { .flowcards .card { transition: none; } }
```

- [ ] **Step 2: Desenhar em `src/visual.ts`**

Trocar o corpo do `update` por: limpar o container, construir o modelo, e para
cada card criar um elemento com título, valor, rótulo, valor 2 e rodapé.

Regra que vem do spec e não pode ser esquecida: **se `valor2` for nulo, o número
some e o rótulo fica**. Se o campo `Valor 2` nem foi arrastado (`temValor2`
falso), some a linha inteira.

```ts
private desenhar(m: Modelo): void {
    this.root.innerHTML = "";
    const faixa = document.createElement("div");
    faixa.className = "flowcards";
    for (const c of m.cards) {
        const el = document.createElement("div");
        el.className = "card";
        el.style.background = c.cor ?? this.corDe(c.indice, c.categoria);
        el.setAttribute("role", "button");
        el.setAttribute("tabindex", "0");
        el.setAttribute("aria-label", `${c.categoria}: ${this.fmt(c.valor)}`);

        el.appendChild(this.span("lbl", c.categoria));
        el.appendChild(this.span("val", this.fmt(c.valor)));
        if (m.temValor2) {
            if (c.rotulo2) { el.appendChild(this.span("k", c.rotulo2)); }
            // valor 2 nulo: o rotulo fica, o numero some. Traco ou zero dariam a
            // impressao de valor nulo em vez de inexistente.
            if (c.valor2 !== null) { el.appendChild(this.span("v2", this.fmt(c.valor2))); }
        }
        if (c.rodape) { el.appendChild(this.span("foot", c.rodape)); }
        faixa.appendChild(el);
    }
    this.root.appendChild(faixa);
}

private span(cls: string, texto: string): HTMLElement {
    const e = document.createElement("div");
    e.className = cls;
    e.textContent = texto;
    return e;
}
```

Use `textContent` e nunca `innerHTML` para o conteúdo: os textos vêm de medidas
do usuário e podem conter qualquer coisa.

- [ ] **Step 3: Conferir na tela (precisa do usuário)**

`npm start`, e no relatório Comercial arrastar:

| Campo | Medida |
|---|---|
| Categoria | `SaudeBase[Segmento]` |
| Valor | `[Base - Clientes]` |
| Valor 2 | `[Base - Ritmo Mensal]` |

Esperado, e este é o momento de verdade do projeto: **a faixa se parece com o
painel antigo.** Se não parecer, pare e mostre ao usuário antes de investir no
resto. Números esperados hoje: Saudáveis 3.121, Em Risco 556, Inativos 9.130,
Perdidos 5.635, Nunca Compraram 54.791.

Confira também que a ordem sai pelo fluxo, e não em ordem alfabética, o que prova
que o `Sort by column` do modelo está sendo respeitado.

- [ ] **Step 4: Commit**

```bash
git add src style
git commit -m "Desenha a faixa de cartoes. O conteudo entra por textContent e nunca por innerHTML, porque titulo, rotulo e rodape vem de medidas escritas pelo usuario e podem conter qualquer coisa. Cartao sem valor 2 mostra o rotulo e esconde o numero: traco ou zero diriam que o valor e nulo, quando ele e inexistente, e essa diferenca importa no cartao de quem nunca comprou."
```

---

## Task 4: Seleção

É a funcionalidade que motivou construir o visual: nenhum visual nativo faz isto
com esta aparência.

**Files:**
- Modify: `src/visual.ts`, `capabilities.json`

- [ ] **Step 1: Guardar o `selectionId` de cada categoria**

No `construirModelo` não entra: `selectionId` depende do `host`, que é impuro.
Monte-o no `visual.ts`, em paralelo aos cards:

```ts
private idsDeSelecao(dataView: powerbi.DataView): powerbi.visuals.ISelectionId[] {
    const cat = dataView?.categorical?.categories?.[0];
    if (!cat) { return []; }
    return cat.values.map((_, i) =>
        this.host.createSelectionIdBuilder().withCategory(cat, i).createSelectionId());
}
```

- [ ] **Step 2: Ligar clique e teclado**

```ts
const acionar = (i: number, multi: boolean) => {
    this.selectionManager.select(this.ids[i], multi).then(() => this.pintarSelecao());
};
el.addEventListener("click", (ev: MouseEvent) => {
    ev.stopPropagation();
    acionar(c.indice, this.settings.selecao.multipla.value && (ev.ctrlKey || ev.metaKey));
});
el.addEventListener("keydown", (ev: KeyboardEvent) => {
    if (ev.key === "Enter" || ev.key === " ") {
        ev.preventDefault();
        acionar(c.indice, this.settings.selecao.multipla.value && (ev.ctrlKey || ev.metaKey));
    }
});
```

Clicar no cartão já selecionado desmarca: o `selectionManager` faz isso sozinho
quando o mesmo id é selecionado de novo sem `multi`. Confirme no Step 4; se não
fizer, compare o id atual com `getSelectionIds()` antes de chamar.

- [ ] **Step 3: Pintar o estado**

```ts
private pintarSelecao(): void {
    const sel = this.selectionManager.getSelectionIds();
    const temSelecao = sel.length > 0;
    this.root.querySelectorAll<HTMLElement>(".card").forEach((el, i) => {
        const escolhido = temSelecao && sel.some(s => s.equals(this.ids[i]));
        el.classList.toggle("aceso", escolhido);
        el.classList.toggle("apagado", temSelecao && !escolhido);
        el.setAttribute("aria-pressed", String(escolhido));
    });
}
```

Clicar fora limpa: registre `this.root.addEventListener("click", () => { this.selectionManager.clear().then(() => this.pintarSelecao()); })`.

- [ ] **Step 4: Conferir na tela (precisa do usuário)**

| # | Verificação | Esperado |
|---|---|---|
| 1 | Clicar em "Em Risco" | o cartão acende, os outros apagam, a tabela nativa ao lado passa a listar 556 |
| 2 | Clicar de novo no mesmo | desmarca, todos voltam ao normal, a tabela volta ao total |
| 3 | `Ctrl` e clique em Inativos e Perdidos | os dois acesos, a tabela lista os dois somados |
| 4 | `Tab` até um cartão e `Enter` | mesmo efeito do clique, com contorno de foco visível |
| 5 | Clicar no espaço vazio do visual | limpa a seleção |

- [ ] **Step 5: Commit**

```bash
git add src capabilities.json
git commit -m "Selecao: clicar num cartao filtra a pagina. E a razao de este visual existir, porque o HTML Content, que fazia o painel antigo, nao consegue avisar a pagina que foi clicado, e por isso a listagem tinha de acontecer dentro dele mesmo, onde esbarrava no teto de 32.000 caracteres. Ctrl acumula, clicar de novo desmarca, Tab e Enter funcionam. O selectionId e montado no visual e nao no dataModel porque depende do host, que e impuro, e misturar os dois tiraria o teste da parte que da para testar."
```

---

## Task 5: Painel de formatação

**Files:**
- Modify: `src/settings.ts`, `capabilities.json`
- Create: `stringResources/en-US/resources.resjson`, `stringResources/pt-BR/resources.resjson`

- [ ] **Step 1: Declarar os objetos em `capabilities.json`**

```json
"objects": {
  "cartoes": {
    "properties": {
      "raio":      { "type": { "numeric": true } },
      "espaco":    { "type": { "numeric": true } },
      "corPadrao": { "type": { "fill": { "solid": { "color": true } } } }
    }
  },
  "categoria": {
    "properties": { "cor": { "type": { "fill": { "solid": { "color": true } } } } }
  },
  "texto": {
    "properties": {
      "tamanhoValor":  { "type": { "numeric": true } },
      "tamanhoTitulo": { "type": { "numeric": true } }
    }
  },
  "conteudo": {
    "properties": {
      "mostrarValor2": { "type": { "bool": true } },
      "mostrarRodape": { "type": { "bool": true } }
    }
  },
  "selecao": {
    "properties": {
      "multipla":  { "type": { "bool": true } },
      "opacidade": { "type": { "numeric": true } }
    }
  }
}
```

`categoria.cor` sai por categoria via `selector` de `dataViewObjects`, do mesmo
jeito que o `modern-rankbars` faz em `rankColors`. Copie o padrão de lá em vez de
inventar.

- [ ] **Step 2: Montar o `FormattingModel` em `src/settings.ts`**

Seguir o padrão de `powerbi-visuals-utils-formattingmodel`, com uma
`formattingSettings.Card` por grupo declarado acima. Todo `displayNameKey` aponta
para uma chave de `resources.resjson`; nenhum texto fica no código.

- [ ] **Step 3: Escrever os `resources.resjson`**

`en-US`:

```json
{
  "Role_Categoria": "Category", "Role_Valor": "Value", "Role_Valor2": "Second value",
  "Role_Rotulo2": "Second value label", "Role_Rodape": "Footnote", "Role_Cor": "Color",
  "Obj_Cartoes": "Cards", "Prop_Raio": "Corner radius", "Prop_Espaco": "Gap",
  "Obj_Categoria": "Category colors", "Obj_Texto": "Text",
  "Prop_TamanhoValor": "Value size", "Prop_TamanhoTitulo": "Title size",
  "Obj_Conteudo": "Content", "Prop_MostrarValor2": "Show second value",
  "Prop_MostrarRodape": "Show footnote",
  "Obj_Selecao": "Selection", "Prop_Multipla": "Allow multiple", "Prop_Opacidade": "Dimmed opacity"
}
```

`pt-BR`: mesmas chaves, com Categoria, Valor, Segundo valor, Rótulo do segundo
valor, Rodapé, Cor, Cartões, Raio do canto, Espaço, Cores por categoria, Texto,
Tamanho do valor, Tamanho do título, Conteúdo, Mostrar segundo valor, Mostrar
rodapé, Seleção, Permitir múltipla, Opacidade dos apagados.

- [ ] **Step 4: Conferir na tela (precisa do usuário)**

Abrir o painel de formatação e mexer em **cada** opção, confirmando que ela faz o
que promete. Uma opção que não faz nada é pior que opção nenhuma, porque o usuário
perde tempo procurando o efeito.

Confirmar também que os rótulos saem em português.

- [ ] **Step 5: Commit**

```bash
git add src capabilities.json stringResources
git commit -m "Painel de formatacao, com os rotulos em stringResources e nao no codigo, para o visual sair traduzido em portugues e ingles. A cor por categoria segue o padrao do Modern RankBars em vez de uma solucao propria: o mesmo autor mantendo dois visuais ganha mais em serem parecidos por dentro do que em cada um ter a sua ideia."
```

---

## Task 6: A tabela de ligação, no modelo Comercial

Esta tarefa é no PBIP `M:\NIC\Power Bi\PROJETO TESTE`, não no repositório do
visual. **Exige o Power BI Desktop FECHADO** e segue as regras daquele projeto:
UTF-8 sem BOM, TMDL com TAB, e nada apagado.

**Files:**
- Modify: `...SemanticModel/definition/tables/SaudeBase.tmdl` (coluna `ChaveCliente`)
- Create: `...SemanticModel/definition/tables/EtapasCartao.tmdl`
- Modify: `...SemanticModel/definition/model.tmdl`, `relationships.tmdl`

- [ ] **Step 1: `ChaveCliente` na `SaudeBase`**

Nas DUAS metades do `UNION`, na mesma posição, como toda coluna de lá:

```dax
"ChaveCliente", [@matriz] & "|" & [@ger]
```

- [ ] **Step 2: Criar `EtapasCartao`**

```dax
VAR Base = SaudeBase
VAR Linhas =
    SELECTCOLUMNS( Base,
        "ChaveCliente", SaudeBase[ChaveCliente],
        "Etapa",        SaudeBase[Segmento],
        "OrdemEtapa",   SaudeBase[OrdemSegmento] + 1 )
// Cliente novo aparece TAMBEM como "Novos 30d". A sobreposicao e proposital: o
// numero serve para saber se o representante busca cliente novo ou fica na base,
// e tirar os novos de dentro de Saudaveis destruiria o denominador dessa conta.
VAR Novos =
    SELECTCOLUMNS(
        FILTER( Base, NOT ISBLANK( SaudeBase[PrimeiraCompra] )
                      && SaudeBase[PrimeiraCompra] >= TODAY() - 30 ),
        "ChaveCliente", SaudeBase[ChaveCliente],
        "Etapa",        "Novos 30d",
        "OrdemEtapa",   1 )
RETURN UNION( Novos, Linhas )
```

`OrdemSegmento + 1` abre a posição 1 para os Novos, empurrando Saudáveis para 2 e
os demais na sequência, terminando em Nunca Compraram.

Declarar a coluna `Etapa` com `sortByColumn: OrdemEtapa`.

- [ ] **Step 3: Criar o relacionamento**

Em `relationships.tmdl`:

```
relationship EtapasCartao-SaudeBase
	fromColumn: EtapasCartao.ChaveCliente
	toColumn: SaudeBase.ChaveCliente
	crossFilteringBehavior: bothDirections
```

Bidirecional é seguro aqui: a `SaudeBase` é folha e não se conecta a mais nada,
então não existe caminho alternativo e não há ambiguidade a criar. Isso é
diferente do relacionamento com `Clientes`, que foi recusado no projeto
justamente por esse risco.

- [ ] **Step 4: Validar por consulta (precisa do Desktop aberto)**

```dax
EVALUATE
GROUPBY( EtapasCartao, EtapasCartao[Etapa], EtapasCartao[OrdemEtapa],
         "Qtd", COUNTX( CURRENTGROUP(), 1 ) )
ORDER BY EtapasCartao[OrdemEtapa]
```

Esperado hoje: Novos 30d 873, Saudáveis 3.121, Em Risco 556, Inativos 9.130,
Perdidos 5.635, Nunca Compraram 54.791. **Os 873 têm de estar também dentro dos
3.121**, e não somados por fora.

- [ ] **Step 5: Conferir na tela (precisa do usuário)**

Clicar em "Novos 30d" no FlowCards. A tabela nativa deve listar 873 clientes, e
cada um com o status **Saudáveis**, nunca "Novos 30d". Foi pedido explicitamente:
no painel antigo o mesmo cliente aparecia com dois rótulos e confundia.

- [ ] **Step 6: Commit no repositório do PBIP**

Mensagem descritiva, e commitar logo após editar: o `monitor_backup.py` varre
aquele repositório de 5 em 5 minutos e transforma em "auto:" o que estiver
pendente.

---

## Task 7: Documentação e primeira Release

**Files:**
- Create/Modify: `README.md`, `README.pt-BR.md`, `CHANGELOG.md`, `PRIVACY.md`, `SUPPORT.md`, `assets/icon.png`

- [ ] **Step 1: README em inglês e português**

Cada um com: o que o visual faz, uma imagem da faixa de cartões, a tabela de
campos, as opções de formatação, como instalar o `.pbiviz`, e a nota de que o
visual **não ordena** e respeita o `Sort by column` do modelo, que é a dúvida
número um que alguém terá.

- [ ] **Step 2: `PRIVACY.md` e `SUPPORT.md`**

Copiar a estrutura do `modern-rankbars`. O `privileges` do
`capabilities.json` é `[]`: o visual não acessa rede nem armazenamento, e o
`PRIVACY.md` deve dizer isso explicitamente.

- [ ] **Step 3: `CHANGELOG.md`**

```markdown
# Changelog

## 1.0.0 - 2026-08-XX
Primeira versao publica.
- Uma faixa de cartoes, um por categoria, na ordem definida pelo modelo
- Clicar filtra a pagina; Ctrl acumula; teclado navega e aciona
- Valor secundario com rotulo por medida, e rodape por medida
- Cor por categoria, com sobreposicao opcional por medida
```

- [ ] **Step 4: Empacotar e publicar a Release**

```bash
npm run package
gh release create v1.0.0 "dist/flowCards.1.0.0.0.pbiviz" --title "FlowCards 1.0.0" --notes-file CHANGELOG.md
```

- [ ] **Step 5: Conferir a instalação limpa (precisa do usuário)**

Baixar o `.pbiviz` da Release, importar no Power BI Desktop por "Importar visual
de um arquivo", e confirmar que funciona **sem** o servidor de desenvolvimento
rodando. É o único teste que prova o que o usuário final vai receber.

---

## Self-Review

**Cobertura do spec:**

| Seção do spec | Tarefa |
|---|---|
| 2.1 Campos | Task 2, Step 1 |
| 2.2 Ordem pelo modelo | Task 2, Step 4 (comentado) e Task 3, Step 3 (conferido) |
| 2.3 Interação | Task 4 |
| 2.4 Cartão sem valor secundário | Task 2 (teste) e Task 3 (desenho) |
| 2.5 Painel de formatação | Task 5 |
| 3.1 a 3.4 Tabela de ligação e Novos 30d | Task 6 |
| 4. Repositório e licença | Task 1, Steps 3 e 5 |
| 5. Validação V1 a V9 | distribuída: V1 e V2 na Task 3, V3 a V5 e V7 na Task 4, V6 na Task 3, V8 na Task 5, V9 na Task 3 |
| 7. Risco "não ficar bom" | Task 3, Step 3, deliberadamente cedo |

**Riscos que o plano assume:**

1. `pbiviz new` da versão 7.1 pode gerar estrutura diferente da que o
   `modern-rankbars` tem, que é de uma versão anterior. Por isso a Task 1 termina
   provando que empacota, antes de qualquer lógica.
2. O comportamento de desmarcar ao clicar de novo depende do `selectionManager`.
   A Task 4, Step 2 já traz a alternativa caso ele não faça sozinho.
3. A Task 6 mexe num modelo em produção. Ela vem depois de o visual estar pronto,
   para não deixar o modelo alterado esperando por um visual que talvez mudasse.
