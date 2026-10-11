// "De onde veio e para onde foi": a origem das receitas em barra empilhada e as maiores categorias de despesa em ranking.
import { pct, dinheiro } from './formato.mjs';
import { Cartao } from './cartao.mjs';
import { Bloco } from './estrutura.mjs';
import { Pilha } from './graficos.mjs';
import { ArvoreDoCargo } from './arvore-do-cargo.mjs';
import { somarCampanhas } from './calculos-campanha.mjs';
import { arvoreDosGastosDoCargo } from './calculos-arvores-dinheiro.mjs';
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

function CategoriasDeGasto({ cands, financas, chaveDe, onPick }) {
  const arvore = useMemo(() => arvoreDosGastosDoCargo(cands, financas, chaveDe), [cands, financas]);
  return html`<${Cartao} tipo="Árvore de barras · ranking" titulo="No que o dinheiro foi gasto" sub=${`${dinheiro(arvore.v)} em ${arvore.filhos.length} categorias de despesa. A barra compara o valor.`}
      nota="Toque numa categoria para ver quem recebeu e, dentro de cada fornecedor, qual candidato o contratou. Os fornecedores pequenos de cada candidato ficam juntos em \"Outros\"; a porcentagem é sobre o nível aberto.">
    <${ArvoreDoCargo} arvore=${arvore} formato=${dinheiro} onPick=${onPick} ordenar=${true}
      legenda="Categoria de despesa → fornecedor → candidato · R$" /><//>`;
}

export function DeOndeVeioEParaOndeFoi({ cands, financas, chaveDe, onPick }) {
  const soma = useMemo(() => somarCampanhas(cands, financas, chaveDe), [cands, financas]);
  if (!soma.recebido && !soma.gasto) return null;
  const cargo = String(cands[0].cargoNome || 'o cargo').toLowerCase();
  return html`<${Bloco} id="b-origem" titulo="De onde veio e para onde foi" colunas="um-terco"
      lede="Barra empilhada para a origem do dinheiro e árvore de barras para as categorias de gasto.">
    ${soma.recebido > 0 && html`<${OrigemDasReceitas} soma=${soma} cargo=${cargo} />`}
    ${soma.gasto > 0 && html`<${CategoriasDeGasto} cands=${cands} financas=${financas} chaveDe=${chaveDe} onPick=${onPick} />`}<//>`;
}
