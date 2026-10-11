// Maiores doadores e fornecedores do cargo: cada um abre nos candidatos do cargo que receberam dele ou o contrataram.
import { dinheiro } from './formato.mjs';
import { usarLimite } from './componentes.mjs';
import { Cartao } from './cartao.mjs';
import { ArvoreDoCargo } from './arvore-do-cargo.mjs';
import { arvoreDeParticipantes } from './calculos-arvores-dinheiro.mjs';
const { html, useMemo } = window.htmPreact;

const QUANTOS = 30;
const quantos = n => `${n} ${n === 1 ? 'candidato' : 'candidatos'}`;

// Só os candidatos do cargo entram; v é o que o participante deu ou recebeu deles.
function participantesDoCargo(participantes, porChave) {
  return (participantes || []).map(p => {
    const para = p.c.filter(([k]) => porChave.has(k)).map(([k, v]) => ({ cand: porChave.get(k), v })).sort((a, b) => b.v - a.v);
    return { ...p, para, v: para.reduce((s, x) => s + x.v, 0) };
  }).filter(p => p.para.length).sort((a, b) => b.v - a.v).slice(0, QUANTOS);
}

function CartaoDeParticipantes({ cfg, cands, participantes, onPick, ...texto }) {
  const porChave = useMemo(() => new Map(cands.map(c => [cfg.chaveDe(c), c])), [cands]);
  const lista = useMemo(() => participantesDoCargo(participantes, porChave), [participantes, porChave]);
  const [limite, botao] = usarLimite(lista.length);
  const arvore = useMemo(() => arvoreDeParticipantes(lista.slice(0, limite), { nota: p => quantos(p.para.length), de: texto.de }), [lista, limite]);
  if (!lista.length) return null;
  return html`<${Cartao} tipo=${texto.tipo} titulo=${texto.titulo} nota=${texto.nota}>
    <${ArvoreDoCargo} arvore=${arvore} formato=${dinheiro} onPick=${onPick} ordenar=${true} legenda=${texto.legenda} />${botao}<//>`;
}

export const Doadores = ({ financas, ...resto }) => html`<${CartaoDeParticipantes} ...${resto} participantes=${financas?.doadores}
  tipo="Árvore de barras · doadores" titulo="Maiores doadores" de="do que ele doou" legenda="Doador → candidato que recebeu · R$"
  nota=${`Doações de pessoas${financas?.doadores?.some(d => d.t === 'pj') ? ' e empresas' : ''} a candidatos deste cargo, somadas pelo CPF/CNPJ do doador (que o site não mostra). Toque num doador para ver quem recebeu dele.`} />`;

export const FornecedoresDoCargo = ({ financas, ...resto }) => html`<${CartaoDeParticipantes} ...${resto} participantes=${financas?.fornecedores}
  tipo="Árvore de barras · fornecedores" titulo="Maiores fornecedores" de="do que ele recebeu" legenda="Fornecedor → candidato que contratou · R$"
  nota="Despesas contratadas pelos candidatos deste cargo, somadas pelo CPF/CNPJ do fornecedor (que o site não mostra). Toque num fornecedor para ver quais candidatos o contrataram." />`;
