# FlowCards: visual customizado do Power BI

Data: 2026-08-06
Pasta: `M:\NIC\Projetos\flowcards`
Repositório: `github.com/viniciusduartelage/flowcards` (público, nome já verificado como livre)
Origem: painel Saúde da Base do relatório Comercial Orthocrin

## 1. Por que este visual existe

O relatório Comercial tinha um painel HTML com uma faixa de cartões, um por etapa do
cliente, e clicar num cartão listava os clientes daquela etapa dentro do próprio
painel. O visual era bonito e a leitura da esquerda para a direita mostrava o
caminho do cliente: entra saudável, deixa de ser, vira em risco, depois inativo,
depois perdido.

Dois problemas o inviabilizaram:

**O teto de 32.000 caracteres.** O Power BI corta o texto que entrega a um visual
customizado nesse tamanho, e o painel gastava 30.057 deles. Para caber, ele
truncava a listagem por rateio proporcional entre as etapas, o que fazia um grupo
de 14 clientes aparecer com 9. O rodapé ainda imprimia o número truncado como se
fosse o total.

**O visual HTML Content não avisa a página que foi clicado.** Por isso a listagem
tinha de acontecer dentro dele mesmo, e por isso ela esbarrava no teto.

A listagem foi movida para uma tabela nativa, que não tem limite e exporta. Sobrou
a faixa de cartões, e nenhum visual nativo faz as três coisas ao mesmo tempo:
parecer aquilo, respeitar a ordem do fluxo, e filtrar a página ao ser clicado.
Foi testado: uma matriz nativa com formatação condicional foi descartada por
inspeção visual do usuário.

## 2. O que o FlowCards é

Um visual que desenha **um cartão por valor de uma categoria**, lado a lado, na
ordem que o modelo determinar, e **filtra a página ao ser clicado**.

Ele é genérico: não sabe o que é "Saudáveis". Serve para ciclo de vida de cliente,
funil de vendas, status de pedido, faixa de estoque, ou qualquer categoria com
poucos valores que se beneficie de leitura em sequência.

### 2.1 Campos

| Campo | Obrigatório | Papel |
|---|---|---|
| `Categoria` | sim | um cartão por valor distinto |
| `Valor` | sim | o número grande do cartão |
| `Valor 2` | não | métrica secundária, menor |
| `Rótulo do valor 2` | não | texto acima do valor 2 |
| `Rodapé` | não | legenda pequena no pé do cartão |
| `Cor` | não | sobrepõe a cor configurada da categoria |

**O rótulo e o rodapé são medidas, não texto fixo.** É isso que permite o texto
mudar por cartão sem o visual saber o porquê: "Potencial" nos Saudáveis e
"Recuperável mês" nos demais, "até 75 dias" num, "mais de 1 ano" noutro.

### 2.2 Ordem dos cartões

O visual **não ordena**. Ele respeita a ordem em que o Power BI entrega as
categorias, que é a ordem definida por `Sort by column` no modelo. Isso é
deliberado: manter a ordenação no modelo significa que ela vale igual em todo
visual do relatório, e não só neste.

### 2.3 Interação

- Clique simples troca a seleção
- `Ctrl` mais clique acumula
- Clicar no cartão já selecionado desmarca
- `Tab` navega, `Enter` ou `Espaço` aciona
- O cartão selecionado ganha borda de destaque; os demais reduzem a opacidade

Um interruptor no painel de formatação desliga a seleção múltipla, para quem
preferir travar em um por vez.

### 2.4 Cartão sem valor secundário

Se `Valor 2` vier vazio, **o número some e o rótulo fica**. Sem traço e sem zero,
que dariam a impressão de valor nulo em vez de inexistente. É o comportamento do
painel original, onde "Nunca Compraram" exibia "sem histórico" e nenhum número.

### 2.5 Painel de formatação

| Grupo | Opções |
|---|---|
| Cartões | cor por categoria, raio do canto, espaço entre cartões, altura mínima |
| Texto | tamanho e peso do título, do valor, do valor 2 e do rodapé |
| Conteúdo | mostrar ou esconder valor 2, rótulo e rodapé |
| Seleção | permitir múltipla, opacidade dos não selecionados, cor da borda de destaque |

## 3. O que o modelo consumidor precisa ter

Esta seção é sobre o relatório Comercial Orthocrin, não sobre o visual. O visual
não exige nada disso; é a forma como este caso o alimenta.

### 3.1 A ordem já existe

A tabela `SaudeBase` tem a coluna oculta `OrdemSegmento` e o `Segmento` está
marcado com `sortByColumn`. A ordem do fluxo já sai correta em qualquer visual.

### 3.2 "Novos 30d" é recorte, não etapa

Medido em 2026-08-06: **873 clientes** tiveram a primeira movimentação nos últimos
30 dias, e **os 873 estão em Saudáveis**. Nenhum caiu em outra etapa, o que é
esperado, já que quem comprou pela primeira vez há menos de 30 dias tem recência
abaixo de 75 por definição.

O usuário decidiu **manter a sobreposição**. O motivo é a pergunta que o número
serve para responder: se os representantes estão buscando cliente novo ou
acomodados na base existente. Tirar os novos de dentro de Saudáveis destruiria o
denominador dessa comparação.

Consequência: os cartões **não somam o total**, de propósito.

### 3.3 A tabela de ligação

Uma tabela calculada `EtapasCartao`, com uma linha por par cliente e etapa. Um
cliente comum gera uma linha; um cliente novo gera duas.

| Coluna | Papel |
|---|---|
| `ChaveCliente` | `CodigoMatriz & "|" & Gerente`, a chave do grão da `SaudeBase` |
| `Etapa` | o valor que vira cartão |
| `OrdemEtapa` | 1 Novos 30d, 2 Saudáveis, 3 Em Risco, 4 Inativos, 5 Perdidos, 6 Nunca Compraram |

Relacionamento `EtapasCartao[ChaveCliente]` (muitos) para `SaudeBase[ChaveCliente]`
(um), com filtro cruzando nos dois sentidos.

**Sobre o relacionamento bidirecional:** o projeto tinha decidido não criar
relacionamento para a `SaudeBase`. Aquela recusa era sobre ligá-la a `Clientes`,
que é o centro do modelo e recebe relacionamento de VENDA, FATURAMENTO, CARTEIRA e
outras, com risco real de caminho ambíguo. Este caso é diferente: a `SaudeBase` é
folha e não se conecta a mais nada, então não existe caminho alternativo e não há
ambiguidade a criar.

A `SaudeBase` ganha a coluna `ChaveCliente` para servir de destino.

### 3.4 Comportamento esperado

| Ação | Resultado |
|---|---|
| Nada selecionado | Saudáveis 3.121, Novos 873, Em Risco 556, Inativos 9.130, Perdidos 5.635 |
| Clicar em Saudáveis | tabela lista 3.121, incluindo os novos |
| Clicar em Novos 30d | tabela lista 873, e cada um deles com o status **Saudáveis** |

O status continuar "Saudáveis" ao clicar em Novos foi pedido explicitamente. No
painel HTML antigo o mesmo cliente aparecia com dois rótulos diferentes, "1ª mov."
e "recente", e isso confundia.

### 3.5 A janela de 30 dias

Fixa em 30, num único ponto da expressão. Não vira parâmetro agora: é peça a mais
para manter e o usuário ainda não sentiu falta. Se surgir a necessidade de
comparar 30 contra 60 dias para avaliar representantes, vira parâmetro depois.

## 4. Repositório

Mesmo molde do `modern-rankbars`, que já está maduro e é do mesmo autor.

| Item | Decisão |
|---|---|
| Licença | GPL-3.0-or-later, igual ao irmão: livre e aberto, e derivados também precisam ser |
| Visibilidade | público desde o primeiro commit |
| Documentação | README em inglês e português, CHANGELOG, PRIVACY, SUPPORT |
| Distribuição | Release do GitHub com o `.pbiviz` anexado. Sem AppSource, pela burocracia |
| Ferramentas | pbiviz 7.1, API 5.11, TypeScript, `powerbi-visuals-utils-formattingmodel` |
| Rótulos | via `stringResources`, para o painel de formatação sair traduzido |

## 5. Como será validado

Visual customizado tem uma armadilha conhecida: quase nada se manifesta fora do
Power BI. O ciclo é `pbiviz start` com o servidor de desenvolvimento, o visual em
modo debug no relatório real, e conferência na tela.

| # | Verificação | Como |
|---|---|---|
| V1 | Um cartão por categoria, na ordem do modelo | olho, contra a `OrdemSegmento` |
| V2 | Números batem com a tabela nativa ao lado | olho e consulta DAX |
| V3 | Clique filtra a tabela | olho |
| V4 | `Ctrl` mais clique acumula, clicar de novo desmarca | olho |
| V5 | Clicar em Novos 30d lista 873 com status Saudáveis | olho |
| V6 | Cartão sem valor 2 mostra só o rótulo | olho, no Nunca Compraram |
| V7 | Teclado navega e aciona | `Tab` e `Enter` |
| V8 | Formatação altera o que promete | olho, opção por opção |
| V9 | Redimensionar não quebra o layout | olho |

Testes automatizados cobrem só o que é puro: leitura do dataview, formatação de
números e a montagem do modelo de formatação. O resto exige tela.

**Dependência do usuário:** habilitar o modo de desenvolvedor no Power BI Desktop,
uma vez, e olhar a tela nos pontos indicados.

## 6. Fora de escopo

- Listagem de clientes dentro do visual. Ela vive na tabela nativa, e foi
  justamente o que causou o problema do teto no painel antigo.
- Publicação no AppSource.
- Animação de transição entre estados. Pode entrar depois, se fizer falta.
- Tema pronto de ciclo de vida. A alternativa C foi descartada: acrescenta
  superfície para manter e o ganho é só na primeira configuração.

## 7. Riscos

| Risco | Mitigação |
|---|---|
| O visual não ficar tão bom quanto o HTML, que é o motivo de existir | Conferência na tela cedo, no primeiro cartão renderizado, antes de investir no resto |
| Seleção não propagar como esperado no Serviço, e não só no Desktop | Testar publicado antes de considerar pronto |
| A tabela de ligação dobrar a contagem se alguém somar os cartões | Documentar que a sobreposição é intencional; o número de cada cartão é uma contagem distinta de clientes |
| `pbiviz` desatualizar e quebrar o build meses depois | Fixar versões no `package-lock.json`, como o irmão faz |
