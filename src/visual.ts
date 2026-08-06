/*
*  Power BI Visual CLI
*
*  Copyright (c) Microsoft Corporation
*  All rights reserved.
*  MIT License
*
*  Permission is hereby granted, free of charge, to any person obtaining a copy
*  of this software and associated documentation files (the ""Software""), to deal
*  in the Software without restriction, including without limitation the rights
*  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
*  copies of the Software, and to permit persons to whom the Software is
*  furnished to do so, subject to the following conditions:
*
*  The above copyright notice and this permission notice shall be included in
*  all copies or substantial portions of the Software.
*
*  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
*  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
*  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
*  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
*  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
*  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
*  THE SOFTWARE.
*/
"use strict";

import powerbi from "powerbi-visuals-api";
import { FormattingSettingsService } from "powerbi-visuals-utils-formattingmodel";
import { valueFormatter } from "powerbi-visuals-utils-formattingutils";
import "./../style/visual.less";

import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import IVisualEventService = powerbi.extensibility.IVisualEventService;
import ISelectionManager = powerbi.extensibility.ISelectionManager;
import ISelectionId = powerbi.visuals.ISelectionId;
import DataView = powerbi.DataView;

import { VisualFormattingSettingsModel } from "./settings";
import { construirModelo, Modelo } from "./dataModel";

// Paleta padrao enquanto o painel de formatacao (Task 5) nao existe. O visual e
// generico e nao sabe o que e "Saudaveis" ou "Em Risco": a cor por posicao e
// apenas um valor razoavel de partida, substituivel por categoria via a coluna
// Cor (dado) ou, depois, via o painel de formatacao (configuracao).
const PALETA_PADRAO: string[] = [
    "#2C5F8A", "#8A5A2C", "#6B2C8A", "#2C8A6B",
    "#8A2C3D", "#4B4B52", "#2C3D8A", "#8A7A2C"
];

export class Visual implements IVisual {
    private events: IVisualEventService;
    private host: IVisualHost;
    private root: HTMLElement;
    private formattingSettings: VisualFormattingSettingsModel;
    private formattingSettingsService: FormattingSettingsService;
    private formatoValor: string | undefined;
    private formatoValor2: string | undefined;
    private selectionManager: ISelectionManager;
    private ids: ISelectionId[] = [];

    // Selecao com Ctrl/Cmd acumulando mais de um cartao. Vira opcao do painel
    // de formatacao (this.settings.selecao.multipla.value) na Task 5; o
    // grupo "selecao" ainda nao existe em settings.ts, entao por ora e uma
    // constante fixa.
    private readonly permiteMultipla = true;

    constructor(options: VisualConstructorOptions) {
        this.events = options.host.eventService;
        this.host = options.host;
        this.formattingSettingsService = new FormattingSettingsService();
        this.root = options.element;
        this.selectionManager = options.host.createSelectionManager();

        // Clicar fora de qualquer cartao limpa a selecao. Fica no elemento
        // raiz (que sobrevive a cada update) e nao dentro de desenhar(), que
        // recria a faixa a cada chamada; o clique no cartao chama
        // stopPropagation para nao borbulhar ate aqui e desfazer a propria
        // selecao que acabou de marcar.
        this.root.addEventListener("click", () => {
            this.selectionManager.clear().then(() => this.pintarSelecao());
        });
    }

    public update(options: VisualUpdateOptions) {
        this.events.renderingStarted(options);

        try {
            const dataView = options.dataViews && options.dataViews[0];
            this.formattingSettings = this.formattingSettingsService.populateFormattingSettingsModel(VisualFormattingSettingsModel, dataView);

            this.formatoValor = this.formatoDoPapel(dataView, "valor");
            this.formatoValor2 = this.formatoDoPapel(dataView, "valor2");

            const modelo = construirModelo(dataView);
            this.ids = this.idsDeSelecao(dataView);
            this.desenhar(modelo);

            this.events.renderingFinished(options);
        }
        catch (error) {
            console.log('Error in update method', error);
            this.events.renderingFailed(options, String(error))
        }
    }

    /**
     * Returns properties pane formatting model content hierarchies, properties and latest formatting values, Then populate properties pane.
     * This method is called once every time we open properties pane or when the user edit any format property.
     */
    public getFormattingModel(): powerbi.visuals.FormattingModel {
        return this.formattingSettingsService.buildFormattingModel(this.formattingSettings);
    }

    /** Devolve o formato (source.format) da coluna de valores cujo papel bate, ou undefined. */
    private formatoDoPapel(dataView: DataView | undefined, papel: string): string | undefined {
        const valores = dataView?.categorical?.values;
        if (!valores) { return undefined; }
        for (const col of valores) {
            if (col.source && col.source.roles && col.source.roles[papel]) { return col.source.format; }
        }
        return undefined;
    }

    private desenhar(m: Modelo): void {
        this.root.replaceChildren();
        const faixa = document.createElement("div");
        faixa.className = "flowcards";
        for (const c of m.cards) {
            const el = document.createElement("div");
            el.className = "card";
            el.style.background = c.cor ?? this.corDe(c.indice);
            el.setAttribute("role", "button");
            el.setAttribute("tabindex", "0");
            el.setAttribute("aria-label", `${c.categoria}: ${this.fmt(c.valor, this.formatoValor)}`);
            el.setAttribute("aria-pressed", "false");

            el.appendChild(this.span("lbl", c.categoria));
            el.appendChild(this.span("val", this.fmt(c.valor, this.formatoValor)));
            if (m.temValor2) {
                if (c.rotulo2) { el.appendChild(this.span("k", c.rotulo2)); }
                // valor 2 nulo: o rotulo fica, o numero some. Traco ou zero dariam a
                // impressao de valor nulo em vez de inexistente.
                if (c.valor2 !== null) { el.appendChild(this.span("v2", this.fmt(c.valor2, this.formatoValor2))); }
            }
            if (c.rodape) { el.appendChild(this.span("foot", c.rodape)); }

            const acionar = (multi: boolean) => {
                this.selectionManager.select(this.ids[c.indice], multi).then(() => this.pintarSelecao());
            };
            el.addEventListener("click", (ev: MouseEvent) => {
                // Sem isto o clique sobe ate a raiz e o ouvinte de "clicar fora"
                // (constructor) limpa a selecao que acabou de ser feita aqui.
                ev.stopPropagation();
                acionar(this.permiteMultipla && (ev.ctrlKey || ev.metaKey));
            });
            el.addEventListener("keydown", (ev: KeyboardEvent) => {
                if (ev.key === "Enter" || ev.key === " ") {
                    ev.preventDefault();
                    acionar(this.permiteMultipla && (ev.ctrlKey || ev.metaKey));
                }
            });

            faixa.appendChild(el);
        }
        this.root.appendChild(faixa);
        this.pintarSelecao();
    }

    /** Monta o selectionId de cada categoria, na mesma ordem/indice dos cartoes. */
    private idsDeSelecao(dataView: DataView): ISelectionId[] {
        const cat = dataView?.categorical?.categories?.[0];
        if (!cat) { return []; }
        return cat.values.map((_, i) =>
            this.host.createSelectionIdBuilder().withCategory(cat, i).createSelectionId());
    }

    /** Reflete a selecao atual nos cartoes: aceso/apagado, e aria-pressed para leitor de tela. */
    private pintarSelecao(): void {
        // getSelectionIds() devolve powerbi.extensibility.ISelectionId, uma interface
        // vazia sem "equals" nesta versao do pacote de tipos. O objeto em tempo de
        // execucao e o mesmo criado por createSelectionIdBuilder() (powerbi.visuals.ISelectionId,
        // que tem "equals"); o cast so corrige o tipo declarado.
        const sel = this.selectionManager.getSelectionIds() as unknown as ISelectionId[];
        const temSelecao = sel.length > 0;
        this.root.querySelectorAll<HTMLElement>(".card").forEach((el, i) => {
            const escolhido = temSelecao && sel.some(s => s.equals(this.ids[i]));
            el.classList.toggle("aceso", escolhido);
            el.classList.toggle("apagado", temSelecao && !escolhido);
            el.setAttribute("aria-pressed", String(escolhido));
        });
    }

    private span(cls: string, texto: string): HTMLElement {
        const e = document.createElement("div");
        e.className = cls;
        e.textContent = texto;
        return e;
    }

    /** Numero cru vira texto no formato da medida (milhar, moeda, abreviacao). */
    private fmt(valor: number | null, formato: string | undefined): string {
        if (valor === null) { return ""; }
        return valueFormatter.create({
            format: formato,
            value: valor,
            precision: 1,
            formatSingleValues: true,
            allowFormatBeautification: true,
            cultureSelector: this.host.locale
        }).format(valor);
    }

    /** Cor padrao por posicao do cartao, usada so quando a coluna Cor nao veio preenchida. */
    private corDe(indice: number): string {
        return PALETA_PADRAO[indice % PALETA_PADRAO.length];
    }
}
