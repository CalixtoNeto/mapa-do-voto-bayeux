// Câmara: gasto e folha ano a ano e em que a Câmara gastou no ano mais recente.
import { dinheiro, sentence, nf } from '../formato.mjs';
import { Bloco } from '../estrutura.mjs';
import { Cartao } from '../cartao.mjs';
import { LinhaDoTempo } from '../linha-do-tempo.mjs';
import { ArvoreDeBarras } from '../arvore.mjs';
import { Ranking } from '../ranking.mjs';
import { serieDaCamara } from './calculos-camara.mjs';
import { pontosDeDestaque, rotulosEspacados } from './calculos-fatias.mjs';
import { nomeProprio } from './pecas.mjs';
const { html } = window.htmPreact;

const mi = v => v == null ? null : v / 1e6;
const formato = v => v.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
const folhaDo = a => a.servidores?.orgaos.find(([orgao]) => /c[aâ]mara/i.test(orgao));

function AnoAAno({ anos }) {
  const dados = serieDaCamara(anos), ultimo = dados[dados.length - 1];
  const serie = (nome, cor, campo) => ({ nome, cor, parcial: ultimo.parcial, formato, pontos: dados.map(d => d[campo] == null ? null : [Number(d.ano), mi(d[campo])]) });
  const comRotulos = s => ({ ...s, rotulos: s.nome === 'Pago' ? pontosDeDestaque(s.pontos) : false });
  return html`<${Cartao} classe="largo" tipo="Série temporal · linhas e área" titulo="Gasto e folha da Câmara em cada ano" sub=${`R$ milhões.${ultimo.parcial ? ` Tracejado: ${ultimo.ano}, parcial.` : ''}`}
    nota="A folha de pessoal faz parte do que a Câmara pagou no ano.">
    <${LinhaDoTempo} area series=${[serie('Pago', 'var(--r5)', 'pago'), serie('Folha', 'var(--antes)', 'folha')].map(comRotulos)}
      rotulosX=${rotulosEspacados(dados.map(d => [Number(d.ano), d.ano]))} descricao="Pago e folha de pessoal da Câmara em cada ano" /><//>`;
}

const rotulo = (nome, nivel) => nivel === 1 && !/^Outros \(/.test(nome) ? nomeProprio(nome) : sentence(nome);

function EmQueGastou({ recente }) {
  const c = recente.despesas.camara, itens = lista => lista.map(([n, , v]) => ({ n: nomeProprio(n), v, rotulo: dinheiro(v) }));
  return html`<${Cartao} classe="largo" tipo=${c.arvore?.v > 0 ? 'Árvore expansível' : 'Barra horizontal · ranking'} titulo=${`Em que a Câmara gastou em ${recente.ano}`}
    sub=${c.arvore?.v > 0 ? 'Tipo de despesa → quem recebeu. Toque num item para abrir.' : 'Tipos de despesa e quem mais recebeu'}
    nota=${c.compras > 0 ? `Compras e serviços sem licitação: ${dinheiro(c.semLicitacao)} de ${dinheiro(c.compras)}.` : null}>
    ${c.arvore?.v > 0 ? html`<div class="arvore"><${ArvoreDeBarras} arvore=${c.arvore} rotulo=${rotulo} /></div>`
      : html`<${Ranking} descricao="Gasto da Câmara por tipo" itens=${c.elementos.map(([n, v]) => ({ n: sentence(n), v, rotulo: dinheiro(v) }))} />
        <${Ranking} descricao="Quem mais recebeu da Câmara" itens=${itens(c.credores)} />`}<//>`;
}

export function GastoDaCamara({ anos }) {
  const recente = anos.find(a => a.despesas?.camara?.pago), folha = recente && folhaDo(recente);
  if (!recente) return null;
  return html`<${Bloco} id="ca" titulo="Gasto e folha da Câmara"
    lede=${`Em ${recente.ano}, a Câmara pagou ${dinheiro(recente.despesas.camara.pago)}${folha ? ` e a folha de pessoal foi de ${dinheiro(folha[2])}, com ${nf.format(folha[1])} pessoas no último mês` : ''}.`}>
    <${AnoAAno} anos=${anos} /><${EmQueGastou} recente=${recente} /><//>`;
}
