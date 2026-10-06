Site: https://calixtoneto.github.io/mapa-do-voto-bayeux/

# Mapa do voto · Bayeux

Votos de candidatos a vereador, deputado federal, deputado estadual, senador e governador em cada bairro de Bayeux (PB), a partir dos resultados oficiais do TSE.

## Como usar

![Escolhendo a eleição de 2024 e buscando a vereadora Naymara Carneiro](docs/uso.gif)

Abra o site: ele lista todas as eleições disponíveis sozinho, sem precisar baixar nem enviar arquivos. Escolha a eleição (ano e turno), o cargo e o candidato. Clique num bairro para ver os votos em cada escola.

O partido vem dos votos de legenda do arquivo por seção e pode faltar quando o partido não teve voto de legenda em Bayeux. Presidente não aparece: os bairros dependem de votos por seção, e o TSE publica o presidente em arquivo separado, só por município.

## De onde vêm os dados

Os resultados ficam no repositório, em `public/data/eleicoes/`: um `ANO-tTURNO.json` por eleição e turno e um `index.json` que o site lê para listar as eleições. A tabela de locais de votação de cada ano fica em `public/data/secoes-ANO.json`. O site é totalmente estático: o navegador do visitante nunca chama o TSE.

Os bairros precisam de votos por seção eleitoral, e a [API de resultados do TSE](https://resultados.tse.jus.br/) só entrega votos por município. Por isso o gerador (`scripts/gerar-dados.mjs`) usa, para cada ano:

1. **CSV por seção dos Dados Abertos do TSE**, que tem os bairros.
2. **API de resultados**, só se o CSV ainda não tiver sido publicado (comum logo depois de uma eleição). Nesse caso o site mostra só o total de Bayeux, com um aviso, até o CSV sair e os dados serem atualizados.

Eleições já geradas: 2012, 2014, 2016, 2018, 2020, 2022, 2024 e 2026.

## Nas próximas eleições

No GitHub, abra **Actions → Atualizar dados de uma eleição → Run workflow** e informe o ano. O workflow gera os arquivos, commita em `public/data/` e dispara a publicação do site. Rode de novo quando o CSV por seção sair, para trocar o total da cidade pelos bairros.

O mesmo pode ser feito localmente, e o workflow só repete esses passos:

```bash
npm install
npm run eleicoes -- 2030 --forcar   # gera public/data/eleicoes/2030-t*.json (e a tabela de locais do ano, se faltar)
git add public/data && git commit -m "dados: eleição 2030" && git push
```

## Como os votos chegam aos bairros

O TSE não publica votos por bairro. Cada seção eleitoral pertence a um local de votação (em geral uma escola), e a tabela "Eleitorado por local de votação" do TSE informa o bairro e as coordenadas de cada local. Os votos de cada seção são somados no bairro do local onde ela funciona.

Isso mostra **onde o voto foi depositado, não onde o eleitor mora**. O bairro vem do campo `NM_BAIRRO` do TSE, que às vezes difere do bairro citado no endereço.

## Desenvolvimento

```bash
npm install
npm run dados       # contorno (IBGE) e tabelas de locais de votação (TSE)
npm run eleicoes    # gera os anos que ainda não existem (use -- ANO para escolher; --forcar para refazer)
npm run dev         # http://localhost:5174
```

## Stack

Preact + htm e Canvas 2D. fflate só nos scripts. Sem etapa de build: a pasta `public/` é o site.

## Fontes

- TSE: Portal de Dados Abertos (votação por seção e eleitorado por local de votação) e API de resultados.
- Contorno municipal: IBGE, API de malhas.
