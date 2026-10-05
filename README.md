Site: https://calixtoneto.github.io/mapa-do-voto-bayeux/

# Mapa do voto · Bayeux

Votos de candidatos a vereador, deputado federal, deputado estadual, senador e governador em cada bairro de Bayeux (PB), a partir dos resultados oficiais do TSE.

## Como usar

![Escolhendo a eleição de 2024 e buscando a vereadora Naymara Carneiro](docs/uso.gif)

Abra o site: ele lista todas as eleições disponíveis sozinho, sem precisar baixar nem enviar arquivos. Escolha a eleição (ano e turno), o cargo e o candidato. Clique num bairro para ver os votos em cada escola.

O partido vem dos votos de legenda do arquivo por seção e pode faltar quando o partido não teve voto de legenda em Bayeux. Presidente não aparece: o TSE o publica em outro arquivo.

## De onde vêm os dados

| | Onde fica | Como é gerado |
|---|---|---|
| **Histórico** (2012 a 2024) | `public/data/historico/ANO-tTURNO.json`, commitado | Uma vez, com `npm run historico`. Nunca mais muda. |
| **Ciclo atual** (2026) | `public/data/atual/`, **não** commitado | Pelo workflow, a cada publicação (push, de hora em hora e manualmente). Vai direto para o Pages. |

Os bairros precisam de votos por seção eleitoral, e a [API de resultados do TSE](https://resultados.tse.jus.br/) só entrega votos por município. Por isso o gerador usa primeiro o CSV por seção do Portal de Dados Abertos. Se o TSE ainda não o publicou (comum logo depois de uma eleição), usa a API e o site mostra só o total de Bayeux, com um aviso, até o CSV sair. Quem busca é o workflow, uma vez por execução, com cache. O navegador do visitante nunca chama o TSE.

Quando o ciclo atual terminar, mova-o para o histórico com `npm run historico -- ANO`.

## Como os votos chegam aos bairros

O TSE não publica votos por bairro. Cada seção eleitoral pertence a um local de votação (em geral uma escola), e a tabela "Eleitorado por local de votação" do TSE informa o bairro e as coordenadas de cada local. Os votos de cada seção são somados no bairro do local onde ela funciona.

Isso mostra **onde o voto foi depositado, não onde o eleitor mora**. O bairro vem do campo `NM_BAIRRO` do TSE, que às vezes difere do bairro citado no endereço.

## Desenvolvimento

```bash
npm install
npm run dados       # contorno (IBGE) e tabelas de locais de votação (TSE)
npm run historico   # gera o histórico que ainda não existe (use -- ANO para escolher; --forcar para refazer)
npm run atual       # gera o ciclo atual em public/data/atual
npm run dev         # http://localhost:5174
```

## Stack

Preact + htm e Canvas 2D. fflate só nos scripts. Sem etapa de build: a pasta `public/` é o site.

## Fontes

- TSE: API de resultados e Portal de Dados Abertos (votação por seção e eleitorado por local de votação).
- Contorno municipal: IBGE, API de malhas.
