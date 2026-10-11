// Cargo majoritário (prefeito): como cada campanha foi financiada (barras 100%) e quanto custou cada voto.
import { nf, pct, dinheiro, centavos } from './formato.mjs';
import { nomeDe } from './componentes.mjs';
import { Cartao, Aviso } from './cartao.mjs';
import { Bloco } from './estrutura.mjs';
import { Pilhas100 } from './colunas-pilhas.mjs';
import { ArvoreDoCargo } from './arvore-do-cargo.mjs';
import { composicaoDasCampanhas, custoPorVotoEmOrdem } from './calculos-campanha.mjs';
import { arvoreDosCandidatosPeloDinheiro } from './calculos-arvores-dinheiro.mjs';
const { html, useMemo } = window.htmPreact;

const COR = { fefc: 'var(--s1)', doacoes: 'var(--s3)', outros: 'var(--s4)', partido: 'var(--s0)' };
const MAXIMO = 12;

function ComposicaoPorCampanha({ campanhas }) {
  const usadas = ['fefc', 'doacoes', 'outros', 'partido'].map(id => campanhas.flatMap(c => c.partes).find(p => p.id === id && p.v > 0)).filter(Boolean);
  const linhas = campanhas.map(c => ({ nome: nomeDe(c.cand), rotulo: dinheiro(c.recebido),
    partes: c.partes.map(p => ({ ...p, cor: COR[p.id], texto: `${dinheiro(p.v)} (${pct(p.v / c.recebido, 0)})` })) }));
  return html`<${Cartao} tipo="Barras 100% empilhadas · composição por candidato" titulo="De onde veio o dinheiro de cada campanha"
      nota="Todas as barras têm o mesmo comprimento: o que muda é a proporção de cada origem. O valor à direita é o total recebido.">
    <ul class="legenda-linha">${usadas.map(p => html`<li><i style=${`background:${COR[p.id]}`}></i>${p.nome}</li>`)}</ul>
    <${Pilhas100} linhas=${linhas} descricao="Origem do dinheiro de cada campanha, em proporção do total recebido" /><//>`;
}

function CustoPorVoto({ linhas, financas, chaveDe, local, onPick }) {
  const arvore = useMemo(() => arvoreDosCandidatosPeloDinheiro(custoPorVotoEmOrdem(linhas).slice(0, MAXIMO), financas, chaveDe,
    { nomeDe, valorDe: l => l.custo, porVoto: true, ficha: true, nota: l => `${dinheiro(l.gasto)} · ${nf.format(l.cand.total)} votos` }), [linhas, financas]);
  if (!arvore.filhos.length) return null;
  return html`<${Cartao} tipo="Árvore de barras · custo por voto" titulo="Quanto custou cada voto" sub=${`Gasto dividido pelos votos${local ? ` ${local}` : ''}, em reais por voto`}
      nota="Toque num candidato para ver em que categoria e para quem foi o gasto dele, também em reais por voto. Ao lado do candidato estão o gasto e os votos; dentro dele, a porcentagem é sobre o gasto dele.">
    <${ArvoreDoCargo} arvore=${arvore} formato=${centavos} onPick=${onPick}
      legenda="Candidato → categoria de gasto → fornecedor · R$ por voto" />
    <${Aviso}>Custo por voto é gasto dividido por votos: uma conta do site, não um julgamento sobre as campanhas.<//><//>`;
}

export function CampanhasDoMajoritario({ cands, financas, linhas, chaveDe, local, onPick }) {
  const campanhas = useMemo(() => composicaoDasCampanhas(cands, financas, chaveDe), [cands, financas]);
  if (!campanhas.length) return null;
  return html`<${Bloco} id="b-campanhas" titulo=${cands[0].cargoNome || 'Candidatos'} colunas="metade"
      lede="Barra em 100% mostra como cada campanha foi financiada; a árvore de barras compara o custo de cada voto.">
    <${ComposicaoPorCampanha} campanhas=${campanhas} /><${CustoPorVoto} linhas=${linhas} financas=${financas} chaveDe=${chaveDe} local=${local} onPick=${onPick} /><//>`;
}
