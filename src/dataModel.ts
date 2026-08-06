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

export function construirModelo(dataView: powerbi.DataView): Modelo {
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
