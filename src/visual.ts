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

            // Cor de fundo por categoria (dinamica): a cor mostrada/gravada em
            // cada ColorPicker do card "categoria" e a mesma cor usada para
            // pintar o cartao, lida de volta do dataView (objects[i]) quando o
            // usuario ja configurou, ou a cor padrao da paleta quando ainda nao.
            const cat = dataView && dataView.categorical && dataView.categorical.categories && dataView.categorical.categories[0];
            const coresCategoria = modelo.cards.map((c) => this.corCategoria(cat, c.indice, this.corDe(c.indice)));
            this.formattingSettings.populateColorSelector(modelo.cards.map((c) => ({
                nome: c.categoria,
                cor: coresCategoria[c.indice],
                selector: this.ids[c.indice] ? this.ids[c.indice].getSelector() : undefined
            })));

            this.aplicarVariaveis(this.formattingSettings);
            this.desenhar(modelo, coresCategoria);

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

    private desenhar(m: Modelo, coresCategoria: string[]): void {
        this.root.replaceChildren();
        const faixa = document.createElement("div");
        faixa.className = "flowcards";
        const s = this.formattingSettings;
        for (const c of m.cards) {
            const el = document.createElement("div");
            el.className = "card";
            // Precedencia: cor vinda da medida "Cor" > cor configurada por
            // categoria no painel > cor padrao da paleta por posicao.
            el.style.background = c.cor ?? coresCategoria[c.indice];
            el.setAttribute("role", "button");
            el.setAttribute("tabindex", "0");
            el.setAttribute("aria-label", `${c.categoria}: ${this.fmtValor(c.valor)}`);
            el.setAttribute("aria-pressed", "false");

            const titulo = s.titulo.maiusculas.value ? c.categoria.toUpperCase() : c.categoria;
            el.appendChild(this.span("lbl", titulo));
            el.appendChild(this.span("val", this.fmtValor(c.valor)));
            if (m.temValor2) {
                if (c.rotulo2) { el.appendChild(this.span("k", c.rotulo2)); }
                // valor 2 nulo: o rotulo fica, o numero some. Traco ou zero dariam a
                // impressao de valor nulo em vez de inexistente.
                if (c.valor2 !== null) { el.appendChild(this.span("v2", this.fmtValor2(c.valor2))); }
            }
            if (s.rodape.mostrar.value && c.rodape) { el.appendChild(this.span("foot", c.rodape)); }

            const acionar = (multi: boolean) => {
                this.selectionManager.select(this.ids[c.indice], multi).then(() => this.pintarSelecao());
            };
            el.addEventListener("click", (ev: MouseEvent) => {
                // Sem isto o clique sobe ate a raiz e o ouvinte de "clicar fora"
                // (constructor) limpa a selecao que acabou de ser feita aqui.
                ev.stopPropagation();
                acionar(s.selecao.multipla.value && (ev.ctrlKey || ev.metaKey));
            });
            el.addEventListener("keydown", (ev: KeyboardEvent) => {
                if (ev.key === "Enter" || ev.key === " ") {
                    ev.preventDefault();
                    acionar(s.selecao.multipla.value && (ev.ctrlKey || ev.metaKey));
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

    /**
     * Numero cru do Valor principal vira texto, respeitando as opcoes do
     * painel: casas decimais (-1 = automatico, deixa o formato da medida
     * decidir) e abreviar (liga a escala K/M/B do valueFormatter passando o
     * valor real como referencia de magnitude).
     */
    private fmtValor(valor: number | null): string {
        if (valor === null) { return ""; }
        const cfg = this.formattingSettings.valor;
        const abreviar = cfg.abreviar.value;
        const casas = cfg.decimais.value;
        return valueFormatter.create({
            format: this.formatoValor,
            value: abreviar ? valor : undefined,
            precision: casas >= 0 ? casas : undefined,
            formatSingleValues: true,
            allowFormatBeautification: abreviar,
            cultureSelector: this.host.locale
        }).format(valor);
    }

    /**
     * Numero cru do Valor 2 vira texto, com as MESMAS opcoes do Valor: casas
     * decimais e abreviar. Antes a abreviacao era fixa e ligada, o que dava
     * "R$ 0,4M" onde o usuario precisava ler "R$ 386.843": numero abreviado
     * serve para comparar magnitude, nao para trabalhar uma lista. Por isso o
     * padrao aqui nasce SEM abreviar, ao contrario do Valor.
     */
    private fmtValor2(valor: number | null): string {
        if (valor === null) { return ""; }
        const cfg = this.formattingSettings.valor2;
        const abreviar = cfg.abreviar.value;
        const casas = cfg.decimais.value;
        return valueFormatter.create({
            format: this.formatoValor2,
            value: abreviar ? valor : undefined,
            precision: casas >= 0 ? casas : undefined,
            formatSingleValues: true,
            allowFormatBeautification: abreviar,
            cultureSelector: this.host.locale
        }).format(valor);
    }

    /** Cor padrao por posicao do cartao, usada so quando a coluna Cor nao veio preenchida. */
    private corDe(indice: number): string {
        return PALETA_PADRAO[indice % PALETA_PADRAO.length];
    }

    /**
     * Cor configurada pelo usuario para uma categoria especifica, lida de
     * volta do dataView (a mesma mecanica do card "Data colors" dos visuais
     * nativos: o Power BI grava a escolha em cat.objects[indice], escopada
     * pelo selector daquela categoria). Sem configuracao, devolve o padrao.
     */
    private corCategoria(cat: powerbi.DataViewCategoryColumn | undefined, indice: number, padrao: string): string {
        const objs = cat && cat.objects && cat.objects[indice];
        const fill = objs && (objs["categoria"] as powerbi.DataViewObject | undefined);
        const cor = fill && (fill["cor"] as powerbi.Fill | undefined);
        return (cor && cor.solid && cor.solid.color) || padrao;
    }

    /** Converte hex (#RRGGBB ou #RGB) em rgba(...) com a transparencia pedida. */
    private rgba(hex: string, alpha: number): string {
        const h = (hex || "#000000").replace("#", "");
        const full = h.length === 3 ? h.split("").map(ch => ch + ch).join("") : h;
        const r = parseInt(full.substring(0, 2), 16) || 0;
        const g = parseInt(full.substring(2, 4), 16) || 0;
        const b = parseInt(full.substring(4, 6), 16) || 0;
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    /** Escreve cada opcao do painel de formatacao como variavel CSS no elemento raiz. */
    private aplicarVariaveis(s: VisualFormattingSettingsModel): void {
        const st = this.root.style;

        st.setProperty("--fc-gap", `${s.cartoes.espaco.value}px`);
        st.setProperty("--fc-radius", `${s.cartoes.raio.value}px`);
        st.setProperty("--fc-pad", `${s.cartoes.preenchimento.value}px`);
        st.setProperty("--fc-max-width", s.cartoes.larguraMaxima.value > 0 ? `${s.cartoes.larguraMaxima.value}px` : "none");
        st.setProperty("--fc-min-height", s.cartoes.alturaMinima.value > 0 ? `${s.cartoes.alturaMinima.value}px` : "0");

        const opacidade = Math.max(0, Math.min(100, s.selecao.opacidade.value));
        st.setProperty("--fc-dim", String(opacidade / 100));
        st.setProperty("--fc-accent", s.selecao.corBorda.value.value);
        st.setProperty("--fc-accent-shadow", this.rgba(s.selecao.corBorda.value.value, 0.32));
        st.setProperty("--fc-accent-width", `${s.selecao.espessura.value}px`);

        st.setProperty("--fc-lbl-family", s.titulo.font.fontFamily.value);
        st.setProperty("--fc-lbl-size", `${s.titulo.font.fontSize.value}px`);
        st.setProperty("--fc-lbl-weight", s.titulo.font.bold.value ? "700" : "400");
        st.setProperty("--fc-lbl-style", s.titulo.font.italic.value ? "italic" : "normal");
        st.setProperty("--fc-lbl-color", s.titulo.cor.value.value);
        st.setProperty("--fc-lbl-spacing", `${s.titulo.espacamento.value}px`);

        st.setProperty("--fc-val-family", s.valor.font.fontFamily.value);
        st.setProperty("--fc-val-size", `${s.valor.font.fontSize.value}px`);
        st.setProperty("--fc-val-weight", s.valor.font.bold.value ? "700" : "400");
        st.setProperty("--fc-val-style", s.valor.font.italic.value ? "italic" : "normal");
        st.setProperty("--fc-val-color", s.valor.cor.value.value);

        st.setProperty("--fc-k-family", s.rotulo2.font.fontFamily.value);
        st.setProperty("--fc-k-size", `${s.rotulo2.font.fontSize.value}px`);
        st.setProperty("--fc-k-weight", s.rotulo2.font.bold.value ? "700" : "400");
        st.setProperty("--fc-k-style", s.rotulo2.font.italic.value ? "italic" : "normal");
        st.setProperty("--fc-k-color", s.rotulo2.cor.value.value);

        st.setProperty("--fc-v2-family", s.valor2.font.fontFamily.value);
        st.setProperty("--fc-v2-size", `${s.valor2.font.fontSize.value}px`);
        st.setProperty("--fc-v2-weight", s.valor2.font.bold.value ? "700" : "400");
        st.setProperty("--fc-v2-style", s.valor2.font.italic.value ? "italic" : "normal");
        st.setProperty("--fc-v2-color", s.valor2.cor.value.value);

        st.setProperty("--fc-foot-family", s.rodape.font.fontFamily.value);
        st.setProperty("--fc-foot-size", `${s.rodape.font.fontSize.value}px`);
        st.setProperty("--fc-foot-weight", s.rodape.font.bold.value ? "700" : "400");
        st.setProperty("--fc-foot-style", s.rodape.font.italic.value ? "italic" : "normal");
        st.setProperty("--fc-foot-color", s.rodape.cor.value.value);
    }
}
