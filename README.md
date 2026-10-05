Site: https://calixtoneto.github.io/mapa-do-voto-bayeux/

# Mapa do voto · Bayeux

Votos de candidatos a vereador, deputado federal, deputado estadual, senador e governador em cada bairro de Bayeux (PB), a partir do arquivo oficial do TSE (votação por seção eleitoral).

## Como usar

1. Escolha o ano da eleição e baixe `votacao_secao_ANO_PB.zip` no Portal de Dados Abertos do TSE. Eleições gerais (2014, 2018, 2022, 2026) trazem governador, senador e deputados; municipais (2012, 2016, 2020, 2024) trazem vereador.
2. Abra o site e envie o .zip (ou só o CSV da PB). A leitura acontece no navegador.
3. Escolha a eleição (ano e turno), o cargo e o candidato. Dá para carregar vários anos e alternar entre eles. O partido vem dos votos de legenda do próprio arquivo e pode faltar quando o partido não teve voto de legenda em Bayeux.

Presidente não aparece: o TSE o publica em outro arquivo.

## Como os votos chegam aos bairros

O TSE não publica votos por bairro. Cada seção eleitoral pertence a um local de votação (em geral uma escola), e a tabela "Eleitorado por local de votação" do TSE informa o bairro e as coordenadas de cada local. Os votos de cada seção são somados no bairro do local onde ela funciona.

Isso mostra **onde o voto foi depositado, não onde o eleitor mora**. O bairro vem do campo `NM_BAIRRO` do TSE, que às vezes difere do bairro citado no endereço.

## Desenvolvimento

```bash
npm install
npm run dados   # regenera o contorno (IBGE) e as tabelas de locais de votação (TSE)
npm run dev     # http://localhost:5174
```

## Stack

Preact + htm, Canvas 2D e fflate para ler o .zip. Sem etapa de build: a pasta `public/` é o site.

## Fontes

- TSE, Portal de Dados Abertos: votação por seção eleitoral e eleitorado por local de votação.
- Contorno municipal: IBGE, API de malhas.
