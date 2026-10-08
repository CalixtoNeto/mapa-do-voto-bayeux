// Detalhe do dinheiro de um candidato: posição entre os do cargo, para onde foi o gasto, quem doou e quem
// recebeu os pagamentos. Os doadores e fornecedores vêm limitados aos dez maiores no arquivo de finanças.
import { pct, sentence, titleCase, dinheiro } from './formato.mjs';
import { ListaDeBarras, usarLimite } from './componentes.mjs';
const { html } = window.htmPreact;

const ordinal = ({ posicao, de }) => posicao > 0 ? `${posicao}º de ${de}` : null;

export function PosicaoNoCargo({ posicoes, nomeDoCargo }) {
  const linhas = [
    ['Recebeu', ordinal(posicoes.recebido), 'maior valor', posicoes.mediana.recebido],
    ['Gastou', ordinal(posicoes.gasto), 'maior gasto', posicoes.mediana.gasto],
    ['Fundo eleitoral', ordinal(posicoes.fefc), 'maior fatia'],
  ].filter(([, pos]) => pos);
  if (!linhas.length) return null;
  return html`<h3>Comparado aos candidatos a ${nomeDoCargo}</h3>
    <ul class="posicoes">${linhas.map(([o, pos, qual, med]) => html`<li><span class="nm">${o}</span>
      <span class="vv">${pos}</span><small>${qual}${med ? ` · mediana do cargo: ${dinheiro(med)}` : ''}</small></li>`)}</ul>`;
}

export function DespesasDoCandidato({ categorias }) {
  const [limite, botao] = usarLimite(categorias.length);
  if (!categorias.length) return null;
  const total = categorias.reduce((s, [, v]) => s + v, 0);
  return html`<h3>Para onde foi o dinheiro</h3>
    <${ListaDeBarras} itens=${categorias.slice(0, limite).map(([n, v]) => ({ n: sentence(n), v, rotulo: `${dinheiro(v)} · ${pct(v / total, 0)}` }))} />${botao}`;
}

export function DoadoresDoCandidato({ doacoes, quantos, recebido }) {
  if (!doacoes?.length) return null;
  return html`<h3>Quem doou</h3>
    <${ListaDeBarras} itens=${doacoes.map(([n, t, v]) => ({ n: t === 'pj' ? html`${titleCase(n)} <small>(empresa)</small>` : titleCase(n), v,
      rotulo: recebido ? `${dinheiro(v)} · ${pct(v / recebido, 0)}` : dinheiro(v) }))} />
    <p class="hint">${quantos > doacoes.length ? `Os ${doacoes.length} maiores de ${quantos} doadores. ` : ''}Doações de pessoas e empresas, somadas pelo CPF/CNPJ (que o site não mostra); a porcentagem é sobre todo o dinheiro recebido.</p>`;
}

export function FornecedoresDoCandidato({ fornecedores, quantos, gasto }) {
  if (!fornecedores?.length) return null;
  return html`<h3>Quem recebeu os pagamentos</h3>
    <${ListaDeBarras} itens=${fornecedores.map(([n, v]) => ({ n: titleCase(n), v, rotulo: gasto ? `${dinheiro(v)} · ${pct(v / gasto, 0)}` : dinheiro(v) }))} />
    <p class="hint">${quantos > fornecedores.length ? `Os ${fornecedores.length} maiores de ${quantos} fornecedores. ` : ''}Despesas contratadas, pelo nome registrado na Receita Federal; a porcentagem é sobre o gasto declarado.</p>`;
}
