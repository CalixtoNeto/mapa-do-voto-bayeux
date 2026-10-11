// Onde estão os eleitores: mapa de calor lugar × ano e haltere da variação entre a primeira e a última eleição da série.
import { nf } from './formato.mjs';
import { Cartao } from './cartao.mjs';
import { Bloco } from './estrutura.mjs';
import { MapaDeCalor } from './mapa-de-calor.mjs';
import { Haltere } from './graficos.mjs';
import { tabelaDeEleitores, variacaoDosEleitores } from './calculos-eleitorado.mjs';
const { html, useMemo } = window.htmPreact;

const sinal = d => `${d > 0 ? '+' : '−'}${nf.format(Math.abs(d))}`;

function notaDoCadastro(suspeitos, nomes) {
  if (!suspeitos.length) return 'Cor mais escura, mais eleitores. O cadastro de locais de votação muda de uma eleição para outra e pode mexer na contagem de um lugar.';
  const exemplo = suspeitos.slice(0, 2).map(s => `${nomes[s.lugar]} vai de ${nf.format(s.de)} para ${nf.format(s.ate)} eleitores`).join('; ');
  return `${exemplo}. Pode ser mudança no cadastro de locais de votação e não uma perda real de moradores: o site não permite afirmar. Cor mais escura, mais eleitores.`;
}

function LinhaDoHaltere({ v, nomes, teto, anos }) {
  return html`<li><span class="nm">${nomes[v.lugar]}</span><b class=${'variacao ' + (v.diferenca >= 0 ? 'up' : 'down')}>${sinal(v.diferenca)}</b>
    <${Haltere} antes=${v.de} depois=${v.ate} max=${teto} descricao=${`${nomes[v.lugar]}: ${nf.format(v.de)} eleitores em ${anos[0]} e ${nf.format(v.ate)} em ${anos[anos.length - 1]}`} />
    <small>${nf.format(v.de)} → ${nf.format(v.ate)}</small></li>`;
}

export function EleitoradoPorLugar({ cfg, serie, anos }) {
  const tabela = useMemo(() => serie && anos.length > 1 ? tabelaDeEleitores(serie.porAno, anos) : null, [serie, anos]);
  const variacao = useMemo(() => tabela ? variacaoDosEleitores(tabela) : [], [tabela]);
  if (!tabela || tabela.lugares.length < 3) return null;
  const confiaveis = variacao.filter(v => !v.suspeito), ganhos = confiaveis.filter(v => v.diferenca > 0).slice(0, 6);
  const quedas = confiaveis.filter(v => v.diferenca < 0).slice(-3).reverse(), mostradas = [...ganhos, ...quedas];
  const teto = Math.max(1, ...mostradas.flatMap(v => [v.de, v.ate])), [de, ate] = [anos[0], anos[anos.length - 1]];
  return html`<${Bloco} id="b-eleitorado" titulo=${`Onde os eleitores votam, por ${cfg.lugarNome}`} colunas="dois-tercos"
      lede=${`Mapa de calor por ${cfg.lugarNome} e ano, e haltere para ver quanto cada um mudou entre ${de} e ${ate}. Cor mais escura, mais eleitores.`}>
    <${Cartao} tipo=${`Mapa de calor · ${cfg.lugarNome} × ano`} titulo="Eleitores por lugar de votação" nota=${notaDoCadastro(variacao.filter(v => v.suspeito), serie.nomes)}>
      <${MapaDeCalor} linhas=${tabela.lugares.map(l => serie.nomes[l])} colunas=${anos} valores=${tabela.valores} formato=${nf.format.bind(nf)}
        legenda=${`Eleitores aptos por ${cfg.lugarNome} em ${anos.join(', ')}`} /><//>
    <${Cartao} tipo=${`Haltere · variação ${de} → ${ate}`} titulo="Quem mais ganhou e perdeu eleitores" sub=${`Ponto cinza: ${de}. Ponto azul: ${ate}.`}
        nota=${`Os ${ganhos.length} maiores ganhos e as ${quedas.length} maiores quedas em número de eleitores, de ${de} a ${ate}. Lugares com salto no cadastro ficam de fora (veja a nota do mapa de calor).`}>
      <ul class="halteres">${mostradas.map(v => html`<${LinhaDoHaltere} v=${v} nomes=${serie.nomes} teto=${teto} anos=${anos} />`)}</ul><//><//>`;
}
