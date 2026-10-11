// "De onde veio e para onde foi": a origem das receitas em barra empilhada e as maiores categorias de despesa em ranking.
import { pct, dinheiro } from './formato.mjs';
import { Cartao } from './cartao.mjs';
import { Bloco } from './estrutura.mjs';
import { Pilha } from './graficos.mjs';
import { RankingDeBarras } from './ranking-barras.mjs';
import { somarCampanhas, categoriasDeGasto } from './calculos-campanha.mjs';
const { html, useMemo } = window.htmPreact;

const COR_DA_ORIGEM = { fefc: 'var(--s1)', doacoes: 'var(--s3)', outros: 'var(--s4)', partido: 'var(--s0)' };
const ORDEM = ['fefc', 'doacoes', 'outros', 'partido'];
const comParcela = (v, total) => html`${dinheiro(v)} <small>${pct(v / total, 1)}</small>`;

function OrigemDasReceitas({ soma, cargo }) {
  const partes = ORDEM.map(id => soma.grupos.find(g => g.id === id)).filter(g => g.v > 0)
    .map(g => ({ nome: g.nome, v: g.v, cor: COR_DA_ORIGEM[g.id], rotulo: comParcela(g.v, soma.recebido) }));
  return html`<${Cartao} tipo="Barra empilhada · composição" titulo="Origem das receitas" sub=${`${dinheiro(soma.recebido)}, todos os candidatos a ${cargo}`}
      nota="A barra inteira é o total das receitas declaradas; cada trecho, a parcela de uma origem.">
    <${Pilha} partes=${partes} descricao=${`Origem das receitas: ${partes.map(p => `${p.nome} ${dinheiro(p.v)}`).join(', ')}`} /><//>`;
}

function CategoriasDeGasto({ categorias }) {
  const itens = categorias.itens.map(i => ({ n: i.nome, v: i.v, rotulo: dinheiro(i.v), parcela: pct(i.v / categorias.total, 1) }));
  return html`<${Cartao} tipo="Barra horizontal · ranking" titulo="No que o dinheiro foi gasto" sub=${`As ${itens.length} maiores categorias de despesa. A barra compara o valor.`}
      nota=${categorias.demais > 0 ? `As demais categorias somam ${dinheiro(categorias.demais)} (${pct(categorias.demais / categorias.total, 1)}).` : ''}>
    <${RankingDeBarras} itens=${itens} descricao="Categorias de despesa, da maior para a menor" /><//>`;
}

export function DeOndeVeioEParaOndeFoi({ cands, financas, chaveDe }) {
  const soma = useMemo(() => somarCampanhas(cands, financas, chaveDe), [cands, financas]);
  const categorias = useMemo(() => categoriasDeGasto(cands, financas, chaveDe), [cands, financas]);
  if (!soma.recebido && !soma.gasto) return null;
  const cargo = String(cands[0].cargoNome || 'o cargo').toLowerCase();
  return html`<${Bloco} id="b-origem" titulo="De onde veio e para onde foi" colunas="um-terco"
      lede="Barra empilhada para a origem do dinheiro e ranking em barra para as categorias de gasto.">
    ${soma.recebido > 0 && html`<${OrigemDasReceitas} soma=${soma} cargo=${cargo} />`}
    ${categorias.itens.length > 0 && html`<${CategoriasDeGasto} categorias=${categorias} />`}<//>`;
}
