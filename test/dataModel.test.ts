import { describe, it, expect } from "vitest";
import powerbi from "powerbi-visuals-api";
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

describe("construirModelo", () => {
  it("cria um cartao por categoria, na ordem recebida", () => {
    const m = construirModelo(dv(["Novos 30d", "Saudáveis", "Em Risco"], [873, 3121, 556]));
    expect(m.cards.map(c => c.categoria)).toEqual(["Novos 30d", "Saudáveis", "Em Risco"]);
    expect(m.cards.map(c => c.valor)).toEqual([873, 3121, 556]);
  });

  it("valor 2 ausente marca temValor2 como falso", () => {
    const m = construirModelo(dv(["A", "B"], [1, 2]));
    expect(m.temValor2).toBe(false);
  });

  it("valor 2 nulo num cartao devolve null, e nao zero", () => {
    const m = construirModelo(dv(["Saudáveis", "Nunca Compraram"], [3121, 54791],
                                 { valor2: [11300000, null] }));
    expect(m.temValor2).toBe(true);
    expect(m.cards[0].valor2).toBe(11300000);
    expect(m.cards[1].valor2).toBeNull();
  });

  it("categoria vazia nao quebra e vira texto vazio", () => {
    const m = construirModelo(dv([null as unknown as string], [10]));
    expect(m.cards[0].categoria).toBe("");
  });

  it("dataView sem categoria devolve modelo vazio em vez de estourar", () => {
    const m = construirModelo({} as powerbi.DataView);
    expect(m.cards).toEqual([]);
  });
});
