/*
 *  Power BI Visualizations
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
import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";

import FormattingSettingsSlice = formattingSettings.Slice;
import SimpleCard = formattingSettings.SimpleCard;
import Model = formattingSettings.Model;

// Controle de fonte reutilizavel (familia, tamanho, negrito, italico), copiado
// do modern-rankbars: e o controle padrao do Power BI para fonte, e foi pedido
// explicitamente pelo usuario ("controle de fonte com familia, tamanho e
// negrito"). O mesmo autor mantendo dois visuais ganha mais em serem
// parecidos por dentro do que em cada um ter a sua ideia.
function makeFont(sizeDefault: number, boldDefault: boolean): formattingSettings.FontControl {
    return new formattingSettings.FontControl({
        name: "font",
        fontFamily: new formattingSettings.FontPicker({ name: "fontFamily", displayName: "Font", displayNameKey: "Font_Family", value: "Segoe UI" }),
        fontSize: new formattingSettings.NumUpDown({ name: "fontSize", displayName: "Size", displayNameKey: "Font_Size", value: sizeDefault }),
        bold: new formattingSettings.ToggleSwitch({ name: "bold", displayName: "Bold", displayNameKey: "Font_Bold", value: boldDefault }),
        italic: new formattingSettings.ToggleSwitch({ name: "italic", displayName: "Italic", displayNameKey: "Font_Italic", value: false })
    });
}

// ---------------------------------------------------------------------------
class CartoesCard extends SimpleCard {
    larguraMaxima = new formattingSettings.NumUpDown({ name: "larguraMaxima", displayName: "Max width (px, 0 = no limit)", displayNameKey: "Prop_LarguraMaxima", value: 0 });
    alturaMinima  = new formattingSettings.NumUpDown({ name: "alturaMinima", displayName: "Min height (px)", displayNameKey: "Prop_AlturaMinima", value: 0 });
    raio          = new formattingSettings.NumUpDown({ name: "raio", displayName: "Corner radius (px)", displayNameKey: "Prop_Raio", value: 10 });
    espaco        = new formattingSettings.NumUpDown({ name: "espaco", displayName: "Gap (px)", displayNameKey: "Prop_Espaco", value: 9 });
    preenchimento = new formattingSettings.NumUpDown({ name: "preenchimento", displayName: "Inner padding (px)", displayNameKey: "Prop_Preenchimento", value: 13 });
    name: string = "cartoes";
    displayName: string = "Cards";
    displayNameKey: string = "Obj_Cartoes";
    slices: FormattingSettingsSlice[] = [this.larguraMaxima, this.alturaMinima, this.raio, this.espaco, this.preenchimento];
}

// ---------------------------------------------------------------------------
// Cor de fundo por categoria (dinamica): um seletor de cor por valor da
// categoria, na mesma mecanica do card "Data colors" dos visuais nativos do
// Power BI. As fatias sao adicionadas em tempo de execucao por
// populateColorSelector (chamado do visual.ts logo apos
// populateFormattingSettingsModel), porque o numero de categorias so e
// conhecido depois de ler o dataView; aqui o card comeca vazio.
class CategoriaColorCard extends SimpleCard {
    name: string = "categoria";
    displayName: string = "Category colors";
    displayNameKey: string = "Obj_Categoria";
    slices: FormattingSettingsSlice[] = [];
}

// ---------------------------------------------------------------------------
class TituloCard extends SimpleCard {
    font = makeFont(9.5, true);
    cor = new formattingSettings.ColorPicker({ name: "cor", displayName: "Color", displayNameKey: "Common_Color", value: { value: "rgba(255,255,255,0.64)" } });
    maiusculas = new formattingSettings.ToggleSwitch({ name: "maiusculas", displayName: "UPPERCASE", displayNameKey: "Prop_Maiusculas", value: true });
    espacamento = new formattingSettings.NumUpDown({ name: "espacamento", displayName: "Letter spacing (px)", displayNameKey: "Prop_Espacamento", value: 0.8 });
    name: string = "titulo";
    displayName: string = "Title";
    displayNameKey: string = "Obj_Titulo";
    slices: FormattingSettingsSlice[] = [this.font, this.cor, this.maiusculas, this.espacamento];
}

// ---------------------------------------------------------------------------
class ValorCard extends SimpleCard {
    font = makeFont(26, true);
    cor = new formattingSettings.ColorPicker({ name: "cor", displayName: "Color", displayNameKey: "Common_Color", value: { value: "#FFFFFF" } });
    decimais = new formattingSettings.NumUpDown({ name: "decimais", displayName: "Decimal places (-1 = auto)", displayNameKey: "Prop_Decimais", value: 1 });
    abreviar = new formattingSettings.ToggleSwitch({ name: "abreviar", displayName: "Abbreviate large numbers", displayNameKey: "Prop_Abreviar", value: true });
    name: string = "valor";
    displayName: string = "Value";
    displayNameKey: string = "Obj_Valor";
    slices: FormattingSettingsSlice[] = [this.font, this.cor, this.decimais, this.abreviar];
}

// ---------------------------------------------------------------------------
class Rotulo2Card extends SimpleCard {
    font = makeFont(8.5, true);
    cor = new formattingSettings.ColorPicker({ name: "cor", displayName: "Color", displayNameKey: "Common_Color", value: { value: "rgba(255,255,255,0.52)" } });
    name: string = "rotulo2";
    displayName: string = "Second value label";
    displayNameKey: string = "Obj_Rotulo2";
    slices: FormattingSettingsSlice[] = [this.font, this.cor];
}

// ---------------------------------------------------------------------------
class Valor2Card extends SimpleCard {
    font = makeFont(13.5, true);
    cor = new formattingSettings.ColorPicker({ name: "cor", displayName: "Color", displayNameKey: "Common_Color", value: { value: "rgba(255,255,255,0.88)" } });
    name: string = "valor2";
    displayName: string = "Second value";
    displayNameKey: string = "Obj_Valor2";
    slices: FormattingSettingsSlice[] = [this.font, this.cor];
}

// ---------------------------------------------------------------------------
class RodapeCard extends SimpleCard {
    mostrar = new formattingSettings.ToggleSwitch({ name: "mostrar", displayName: "Show", displayNameKey: "Common_Show", value: true });
    font = makeFont(10, false);
    cor = new formattingSettings.ColorPicker({ name: "cor", displayName: "Color", displayNameKey: "Common_Color", value: { value: "rgba(255,255,255,0.42)" } });
    name: string = "rodape";
    displayName: string = "Footnote";
    displayNameKey: string = "Obj_Rodape";
    topLevelSlice: formattingSettings.ToggleSwitch = this.mostrar;
    slices: FormattingSettingsSlice[] = [this.font, this.cor];
}

// ---------------------------------------------------------------------------
class SelecaoCard extends SimpleCard {
    multipla  = new formattingSettings.ToggleSwitch({ name: "multipla", displayName: "Allow multiple", displayNameKey: "Prop_Multipla", value: true });
    opacidade = new formattingSettings.NumUpDown({ name: "opacidade", displayName: "Dimmed opacity (%)", displayNameKey: "Prop_Opacidade", value: 38 });
    corBorda  = new formattingSettings.ColorPicker({ name: "corBorda", displayName: "Highlight border color", displayNameKey: "Prop_CorBorda", value: { value: "#FFD98A" } });
    espessura = new formattingSettings.NumUpDown({ name: "espessura", displayName: "Border thickness (px)", displayNameKey: "Prop_Espessura", value: 2 });
    name: string = "selecao";
    displayName: string = "Selection";
    displayNameKey: string = "Obj_Selecao";
    slices: FormattingSettingsSlice[] = [this.multipla, this.opacidade, this.corBorda, this.espessura];
}

/** Uma categoria e a cor a mostrar/persistir no ColorPicker que a representa. */
export interface CategoriaCorEntrada {
    nome: string;
    cor: string;
    selector?: powerbi.data.Selector;
}

// ---------------------------------------------------------------------------
// Root model — exported name MUST stay VisualFormattingSettingsModel
// (visual.ts imports this exact name)
// ---------------------------------------------------------------------------
export class VisualFormattingSettingsModel extends Model {
    cartoes   = new CartoesCard();
    categoria = new CategoriaColorCard();
    titulo    = new TituloCard();
    valor     = new ValorCard();
    rotulo2   = new Rotulo2Card();
    valor2    = new Valor2Card();
    rodape    = new RodapeCard();
    selecao   = new SelecaoCard();

    cards = [
        this.cartoes,
        this.categoria,
        this.titulo,
        this.valor,
        this.rotulo2,
        this.valor2,
        this.rodape,
        this.selecao
    ];

    /**
     * Preenche o card "categoria" com uma fatia de cor por categoria, cada
     * uma escopada pelo seu proprio selector (o mesmo selector do
     * selectionId da categoria). E a mesma mecanica do card "Data colors"
     * dos visuais nativos: o usuario ve uma linha por categoria e escolhe a
     * cor de cada uma. Chamado do visual.ts a cada update, depois de
     * populateFormattingSettingsModel, porque o numero de categorias so e
     * conhecido apos ler o dataView.
     */
    populateColorSelector(categorias: CategoriaCorEntrada[]): void {
        this.categoria.slices = categorias.map((c, i) =>
            new formattingSettings.ColorPicker({
                name: "cor",
                displayName: c.nome || `#${i + 1}`,
                value: { value: c.cor },
                selector: c.selector
            })
        );
    }
}
