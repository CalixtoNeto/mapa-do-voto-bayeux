// Abertura de cada página do panorama: rótulo, título, frase, as três pílulas (children) e os indicadores do que a página mostra.
import { nf, pct, titleCase, dinheiro } from './formato.mjs';
import { somaDoComparecimento } from './calculos.mjs';
import { somarCampanhas } from './calculos-campanha.mjs';
import { menorAbstencao, crescimentoDosAptos, tipoDaEleicao } from './calculos-series.mjs';
import { Cabecalho, Indicadores } from './estrutura.mjs';
import { usarComparecimentos } from './dados-series.mjs';
const { html } = window.htmPreact;

const TURNO = ds => `${ds.turno}º turno`;

function AberturaDeVotos({ ds, cands, ctx, cidade, majoritario, children }) {
  const s = ctx?.comparecimento ? somaDoComparecimento(ctx.comparecimento) : null, total = cands.reduce((x, c) => x + c.total, 0), topo = cands[0];
  const maisVotado = topo && (majoritario ? { rotulo: 'Mais votado', valor: pct(topo.total / total, 1), nota: titleCase(topo.nome) }
    : { rotulo: 'Mais votado', valor: nf.format(topo.total), nota: `votos · ${titleCase(topo.nome)}` });
  return html`<${Cabecalho} rotulo=${`Panorama · ${ds.ano} · ${TURNO(ds)}`} titulo=${titleCase(cands[0]?.cargoNome || '')}
        lede=${`${cands.length} candidatos com voto em ${cidade}. Os números abaixo são do arquivo de votação por seção eleitoral do TSE.`}>${children}<//>
    <${Indicadores} itens=${s ? [{ rotulo: 'Eleitores aptos', valor: nf.format(s.aptos) },
      { rotulo: 'Compareceram', valor: nf.format(s.comparecimento), nota: `${pct(s.comparecimento / s.aptos, 1)} dos aptos` },
      { rotulo: 'Abstenção', valor: pct(s.abstencao / s.aptos, 1), nota: `${nf.format(s.abstencao)} eleitores` }, maisVotado] : [maisVotado]} />`;
}

function AberturaDeDinheiro({ ds, cands, financas, ctx, cfg, children }) {
  const soma = financas && cands.length ? somarCampanhas(cands, financas, cfg.chaveDe) : null, maior = soma?.maiorGasto;
  const itens = soma?.recebido ? [{ rotulo: 'Receitas declaradas', valor: dinheiro(soma.recebido), nota: `${soma.candidaturas} candidaturas` },
    { rotulo: 'Despesas contratadas', valor: dinheiro(soma.gasto), nota: 'declaradas ao TSE' },
    { rotulo: 'Do fundo eleitoral', valor: pct(soma.grupos[0].v / soma.recebido, 1), nota: dinheiro(soma.grupos[0].v) },
    maior && { rotulo: 'Maior gasto individual', valor: dinheiro(maior.gasto), nota: `${nf.format(maior.cand.total)} votos, ${ctx?.eleito(maior.cand) ? 'eleito' : 'não eleito'}` }] : [];
  return html`<${Cabecalho} rotulo=${`Panorama · ${ds.ano} · Dinheiro de campanha`} titulo=${titleCase(cands[0]?.cargoNome || '')}
        lede="De onde veio e para onde foi o dinheiro das campanhas, e o que ele tem a ver com os votos. Prestação de contas ao TSE.">${children}<//>
    <${Indicadores} itens=${itens} />`;
}

function AberturaDeComparecimento({ ds, ctx, cidade, cfg, children }) {
  const eleicoes = usarComparecimentos(cfg), tipo = tipoDaEleicao(ds.cargos || []);
  const s = ctx?.comparecimento ? somaDoComparecimento(ctx.comparecimento) : null;
  const menor = eleicoes && menorAbstencao(eleicoes, tipo), cresc = eleicoes && crescimentoDosAptos(eleicoes, tipo);
  const anos = [...new Set((eleicoes || []).map(e => e.ano))].sort();
  const itens = s ? [{ rotulo: `Eleitores aptos em ${ds.ano}`, valor: nf.format(s.aptos), nota: cresc && cresc.ate.ano === ds.ano ? `${cresc.variacao >= 0 ? '▲ +' : '▼ −'}${pct(Math.abs(cresc.variacao), 1)} desde ${cresc.de.ano}` : '' },
    { rotulo: `Abstenção em ${ds.ano}`, valor: pct(s.abstencao / s.aptos, 1), nota: `${nf.format(s.abstencao)} eleitores` },
    menor && { rotulo: 'Menor abstenção', valor: pct(menor.taxa, 1), nota: `${tipo === 'municipal' ? 'prefeito' : 'governador'}, ${menor.ano}` },
    { rotulo: `Brancos e nulos em ${ds.ano}`, valor: nf.format(s.brancos + s.nulos), nota: `${pct((s.brancos + s.nulos) / s.aptos, 1)} dos aptos` }] : [];
  return html`<${Cabecalho} rotulo="Panorama · Eleitorado" titulo="Comparecimento e eleitorado"
        lede=${`Quantos eleitores ${cidade} tem, quantos vão votar e onde eles votam.${anos.length > 1 ? ` ${anos.length} eleições, de ${anos[0]} a ${anos[anos.length - 1]}.` : ''}`}>${children}<//>
    <${Indicadores} itens=${itens} />`;
}

export function criarAbertura(cfg) {
  return function Abertura({ sub, ds, cands, ctx, financas, cidade, children }) {
    const majoritario = cands[0] ? cfg.ehMajoritario(cands[0]) : false;
    if (sub === 'dinheiro') return html`<${AberturaDeDinheiro} ds=${ds} cands=${cands} financas=${financas} ctx=${ctx} cfg=${cfg}>${children}<//>`;
    if (sub === 'comparecimento') return html`<${AberturaDeComparecimento} ds=${ds} ctx=${ctx} cidade=${cidade} cfg=${cfg}>${children}<//>`;
    return html`<${AberturaDeVotos} ds=${ds} cands=${cands} ctx=${ctx} cidade=${cidade} majoritario=${majoritario}>${children}<//>`;
  };
}
