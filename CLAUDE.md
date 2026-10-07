# Mapa do voto · Bayeux

Site estático (`public/`) com dados gerados por `scripts/gerar-secoes.mjs` (tabela seção → local → bairro)
e `scripts/gerar-dados.mjs` (votos), a partir do TSE.

## Antes de dar uma mudança por pronta

- Rode `npm test`. Roda offline e em menos de um segundo; não há outro passo de verificação.
- O teste `test/caracterizacao.test.mjs` compara a saída dos geradores com `test/fixtures/esperado/`.
  Se ele falhar, a saída mudou: corrija o código. Só regrave (`ATUALIZAR_ESPERADO=1 npm test`) quando
  a mudança na saída for o objetivo da tarefa, e diga no resumo o que mudou nos arquivos esperados.
- Regra nova ou caso novo dos dados do TSE: escreva primeiro o teste em `test/unidade/`, veja falhar, depois o código.
- Não rode os geradores contra o TSE para testar; os arquivos em `public/data/` são o que o site publica.

## Como o código está organizado

- Uma responsabilidade por arquivo, arquivos com menos de 100 linhas e funções com menos de 20.
- Cada fonte em `scripts/fontes/` exporta um `leitorDe…` (trata uma linha, sem I/O) e uma função que lê o .zip.
  A montagem da tabela de seções (`scripts/secoes/tabela.mjs`) também é pura.
- Dependências que tocam a rede entram por parâmetro (`buscarJson`, `localDaSecao`) para os testes trocarem por falsas.
- Os nomes curtos dentro dos JSON (`cands`, `tot`, `esp`, `loc`, `nr`) são o formato que `public/js/app.js` lê;
  não renomeie.
- `scripts/lib/` é igual ao do repositório mapa-do-voto-pb; uma correção lá vale aqui também.
- Nomes de funções e variáveis em português, dizendo o que são. Comentário só para o porquê (uma regra do TSE,
  um formato estranho), nunca para repetir o código.
