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

## Análises

- `scripts/gerar-analises.mjs` gera `ANO-candidatos.json`, `ANO-financas.json`, `ANO-tTURNO-comparecimento.json`,
  `ANO-eleitorado.json`, `analises.json`, `patrimonio.json` e `dinheiro.json`; o golden master dele é
  `test/caracterizacao-analises.test.mjs`.
- `scripts/analises/escopo.mjs` é o que muda entre os dois repositórios (quem entra e qual é a chave do candidato).
  O resto de `scripts/analises/`, `scripts/fontes/{candidatos,bens,prestacao-contas,eleitorado}.mjs`, `scripts/saida/analises.mjs`
  e os módulos `public/js/*.mjs` são iguais nos dois; uma correção num vale para o outro.
- Os cálculos do site ficam em `public/js/calculos*.mjs`, sem DOM, testados em `test/unidade/calculos*.test.mjs`.
  O que cada site faz diferente (lugares, chave do candidato) entra pelo `CFG` de `app.js` (`agrupar`, `nomeDoLugar`…).
- Nomes curtos das análises que o site lê: `c`, `r`, `d`, `rep`, `pg`, `dc`, `rs`, `doa`, `nd`, `fo`, `nf`, `doadores` e
  `fornecedores` (`n`, `t`, `v`, `c`) em finanças; `g`, `r`, `i`, `e`, `o`, `re`, `s`, `p`, `b`, `bt` no perfil;
  `[aptos, comparecimento, brancos, nulos, legenda?]` no comparecimento; `[eleitores, mulheres, jovens, idosos,
  superior, pouco estudo]` no eleitorado. Em `doa` e `fo`, o último número é o índice na lista do arquivo.

## Perfis (só neste repositório)

- `scripts/gerar-perfis.mjs` gera `public/data/perfis/` a partir do TCE-PB (`scripts/fontes/tce-pb.mjs`), do SAPL da Câmara
  (`scripts/fontes/sapl.mjs`) e do Portal da Transparência (`scripts/fontes/emendas.mjs`); as regras ficam em `scripts/perfis/`,
  testadas em `test/unidade/{tce-pb,sapl,emendas,cruzamentos}.test.mjs`.
- O Sagres escreve milhar sem decimais com ponto ("2.100" = 2100): use `reaisDoTce`, não `reais`.
- As árvores de decomposição (`scripts/perfis/arvores.mjs`) vão para `prefeitura-ANO-detalhe.json`, lido só quando o ano é
  aberto; os alertas (`scripts/perfis/alertas.mjs`) vão no `prefeitura-ANO.json`. Todo alerta aparece com a ressalva de que
  não indica irregularidade. Todo ano, inclua em `LIMITES` o limite de dispensa do decreto que atualiza a Lei 14.133.
- O site lê os perfis em `public/js/perfil/` (cálculos em `calculos-perfil.mjs`, testados em `test/unidade/calculos-perfil.test.mjs`);
  não há perfis no repositório da Paraíba, então essa pasta não precisa ficar igual lá.

## Como o código está organizado

- Uma responsabilidade por arquivo, arquivos com menos de 100 linhas e funções com menos de 20.
- Cada fonte em `scripts/fontes/` exporta um `leitorDe…` (trata uma linha, sem I/O) e uma função que lê o .zip.
  A montagem da tabela de seções (`scripts/secoes/tabela.mjs`) também é pura.
- Dependências que tocam a rede entram por parâmetro (`buscarJson`, `localDaSecao`) para os testes trocarem por falsas.
  `lerCsvsDoZip` lê Windows-1252 (TSE, Portal da Transparência) ou outra codificação pedida (o TCE-PB é UTF-8).
- Os nomes curtos dentro dos JSON (`cands`, `tot`, `esp`, `loc`, `nr`) são o formato que `public/js/app.js` lê;
  não renomeie.
- `scripts/lib/` é igual ao do repositório mapa-do-voto-pb; uma correção lá vale aqui também.
- Nomes de funções e variáveis em português, dizendo o que são. Comentário só para o porquê (uma regra do TSE,
  um formato estranho), nunca para repetir o código.
