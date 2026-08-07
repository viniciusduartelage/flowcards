# Changelog

Convenção a partir daqui: esta é a primeira publicação, por isso a versão é
1.0.0 apesar das várias mudanças durante o desenvolvimento. Não havia versão
anterior da qual diferir. Da primeira publicação em diante, toda mudança sobe o
número, porque a partir de agora passa a existir gente com a versão instalada.

## 1.0.0 - 2026-08-07

Primeira versão pública.

**O que o visual faz**

- Desenha um cartão por valor de uma categoria, lado a lado
- Clicar num cartão filtra a página. `Ctrl` mais clique acumula, clicar no
  selecionado desmarca, `Tab` navega e `Enter` ou `Espaço` aciona
- Cada cartão empilha título, número grande, rótulo do valor secundário, valor
  secundário e rodapé
- Rótulo e rodapé são medidas, não texto fixo, para o texto poder mudar por
  cartão sem o visual saber o porquê

**Ordenação**

- O visual não ordena. Ele respeita a ordem que o Power BI entrega, definida
  pelo "Classificar por coluna" no modelo, para a ordem valer igual em todo
  visual do relatório e não só neste

**Formatação, em 8 grupos**

- Cartões: largura máxima, altura mínima, raio do canto, espaço, preenchimento
- Cores por categoria, uma cor por valor, com sobreposição opcional por medida
- Título, Valor, Rótulo do valor 2, Valor 2 e Rodapé: cada um com controle de
  fonte completo (família, tamanho, negrito, itálico), cor e transparência
- Valor e Valor 2 ainda com unidades de exibição (Automático, Nenhum, Milhares,
  Milhões, Bilhões, Trilhões), casas decimais e "mostrar em branco como"
- Seleção: permitir múltipla, opacidade dos não selecionados, cor e espessura da
  borda de destaque

**Comportamentos deliberados**

- Cartão sem valor secundário mostra o rótulo e esconde o número, sem traço e
  sem zero, porque qualquer um dos dois daria a impressão de valor nulo em vez
  de inexistente. Configurável em "mostrar em branco como"
- A unidade de exibição é escolhida, não adivinhada. O padrão do Valor é
  automático, porque o número grande é para ler de relance; o do Valor 2 é
  nenhum, porque costuma ser o número que se vai perseguir numa lista
- A transparência multiplica a opacidade que a cor já tinha, em vez de
  substituir, para mexer no controle não jogar o texto para opaco de repente

**Privacidade**

- Sem acesso a rede e sem armazenamento. O `privileges` do `capabilities.json`
  é uma lista vazia
