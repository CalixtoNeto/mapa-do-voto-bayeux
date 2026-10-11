// Detalhe do dinheiro de um candidato: posição entre os do cargo, para onde foi o gasto (categoria → todos os
// fornecedores) e quem doou (os dez maiores no arquivo de finanças, com as outras campanhas que cada um financiou).
import { sentence, dinheiro, nomeDeQuem } from './formato.mjs';
import { ArvoreDeBarras } from './arvore.mjs';
import { arvoreDoGasto } from './calculos-arvore.mjs';
import { redeDoCandidato } from './calculos.mjs';
import { ArvoreDoCargo } from './arvore-do-cargo.mjs';
import { arvoreDeDoadores } from './calculos-arvores-ficha.mjs';
const { html, useMemo } = window.htmPreact;

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
const quemRecebeu = (nome, nivel) => nivel === 1 && !/^(Outros \(|Sem fornecedor)/.test(nome) ? nomeDeQuem(nome) : sentence(nome);

export function DespesasDoCandidato({ categorias }) {
  if (!categorias.length) return null;
  const comQuem = categorias.some(c => c[2]);
  return html`<h3>Para onde foi o dinheiro</h3>
    ${comQuem && html`<p class="hint">Categoria de gasto → quem recebeu. Toque numa categoria para ver todos os fornecedores; a porcentagem é sobre o nível aberto.</p>`}
    <div class="arvore"><${ArvoreDeBarras} arvore=${arvoreDoGasto(categorias)} rotulo=${quemRecebeu} /></div>`;
}

export function DoadoresDoCandidato({ f, chave, ctx, recebido, onPick }) {
  const doacoes = f.doa, quantos = f.nd;
  const rede = useMemo(() => ctx ? redeDoCandidato(doacoes, ctx.financas.doadores, chave, ctx.candPorChave) : [], [f, ctx]);
  const arvore = useMemo(() => doacoes?.length ? arvoreDeDoadores(doacoes, rede, recebido) : null, [doacoes, rede, recebido]);
  if (!arvore) return null;
  return html`<h3>Quem doou</h3>
    <${ArvoreDoCargo} arvore=${arvore} formato=${dinheiro} onPick=${onPick} ordenar=${true} legenda="Doador → outras campanhas que ele também financiou · R$" />
    <p class="hint">${quantos > doacoes.length ? `Os ${doacoes.length} maiores de ${quantos} doadores. ` : ''}Doações de pessoas e empresas, somadas pelo CPF/CNPJ (que o site não mostra); a porcentagem é sobre todo o dinheiro recebido. Toque num doador que também financiou outras campanhas para vê-las.</p>`;
}
