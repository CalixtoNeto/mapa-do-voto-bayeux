// Detalhe do dinheiro de um candidato: posição entre os do cargo, para onde foi o gasto, quem doou e quem
// recebeu (na árvore de gastos). Os doadores vêm limitados aos dez maiores no arquivo de finanças.
import { pct, sentence, titleCase, dinheiro } from './formato.mjs';
import { ArvoreDeBarras } from './arvore.mjs';
import { arvoreDoGasto } from './calculos-arvore.mjs';
import { ListaDeBarras } from './componentes.mjs';
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

// Categoria de gasto → quem recebeu, na mesma árvore do perfil da Prefeitura.
const quemRecebeu = (nome, nivel) => nivel === 1 && !/^(Outros \(|Sem fornecedor)/.test(nome) ? titleCase(nome) : sentence(nome);

export function DespesasDoCandidato({ categorias }) {
  if (!categorias.length) return null;
  const comQuem = categorias.some(c => c[2]);
  return html`<h3>Para onde foi o dinheiro</h3>
    ${comQuem && html`<p class="hint">Categoria de gasto → quem recebeu. Toque numa categoria para ver os fornecedores (os 5 maiores; o resto vai somado em “Outros”). Despesas contratadas, pelo nome registrado na Receita Federal; a porcentagem é sobre o nível aberto.</p>`}
    <div class="arvore"><${ArvoreDeBarras} arvore=${arvoreDoGasto(categorias)} rotulo=${quemRecebeu} /></div>`;
}

export function DoadoresDoCandidato({ doacoes, quantos, recebido }) {
  if (!doacoes?.length) return null;
  return html`<h3>Quem doou</h3>
    <${ListaDeBarras} itens=${doacoes.map(([n, t, v]) => ({ n: t === 'pj' ? html`${titleCase(n)} <small>(empresa)</small>` : titleCase(n), v,
      rotulo: recebido ? `${dinheiro(v)} · ${pct(v / recebido, 0)}` : dinheiro(v) }))} />
    <p class="hint">${quantos > doacoes.length ? `Os ${doacoes.length} maiores de ${quantos} doadores. ` : ''}Doações de pessoas e empresas, somadas pelo CPF/CNPJ (que o site não mostra); a porcentagem é sobre todo o dinheiro recebido.</p>`;
}
