// Câmara: como cada vereador votou nas votações nominais (barras empilhadas e rosca) e quem vota com a maioria.
import { nf, pct } from '../formato.mjs';
import { Bloco } from '../estrutura.mjs';
import { Cartao } from '../cartao.mjs';
import { Pilhas100 } from '../colunas-pilhas.mjs';
import { Rosca } from '../graficos.mjs';
import { Dispersao } from '../dispersao.mjs';
import { ArvoreComLegenda } from './arvore-legenda.mjs';
import { arvoreDeConcordancia } from './arvores-camara.mjs';
import { Legenda } from '../legenda.mjs';
import { votosPorVereador, totalDeVotos, alinhamentos, presencaXAlinhamento } from './calculos-camara.mjs';
const { html } = window.htmPreact;

const TIPOS = [['sim', 'Sim', 'var(--s1)'], ['nao', 'Não', 'var(--s2)'], ['abstencao', 'Abstenção', 'var(--s3)'], ['outros', 'Outros', 'var(--s4)'], ['semVoto', 'Sem voto registrado', 'var(--trilho)']];
const pct0 = v => pct(v, 0);

function VotosPorVereador({ linhas, total }) {
  const itens = linhas.map(l => ({ nome: l.nome, rotulo: `${l.sim} · ${l.nao} · ${l.abstencao}`,
    partes: TIPOS.map(([k, nome, cor]) => ({ nome, v: l[k], cor, texto: String(l[k]) })) }));
  const legenda = TIPOS.filter(([k]) => k !== 'outros' || linhas.some(l => l.outros));
  return html`<${Cartao} tipo="Barras empilhadas · votos por vereador" titulo="Sim, não e abstenção" sub=${html`<${Legenda} itens=${legenda.map(([, nome, cor]) => [nome, cor])} />`}
    nota=${`Cada barra tem as ${nf.format(total)} votações nominais; a parte clara é onde não houve voto registrado, por ausência ou por ainda não ter mandato. À direita: sim · não · abstenção.`}>
    <${Pilhas100} linhas=${itens} descricao="Votos de cada vereador nas votações nominais" /><//>`;
}

function TotalDeVotos({ t }) {
  const partes = TIPOS.slice(0, 4).filter(([k]) => t[k] > 0).map(([k, nome, cor]) => ({ nome, v: t[k], cor, rotulo: `${nf.format(t[k])} · ${pct(t[k] / t.total, 1)}` }));
  return html`<${Cartao} tipo="Rosca · total de votos" titulo="Soma de todos os votos" nota="Votos de todos os vereadores somados, sem contar quem não votou.">
    <${Rosca} partes=${partes} centro=${{ rotulo: 'Votos', valor: nf.format(t.total) }} descricao=${'Total de votos: ' + partes.map(p => `${p.nome} ${p.rotulo}`).join('; ')} /><//>`;
}

export function ComoVotam({ vereadores, votacoes }) {
  const linhas = votosPorVereador(vereadores, votacoes);
  return html`<${Bloco} id="cv" titulo="Como votam" colunas="dois-tercos"
    lede=${`Barras empilhadas mostram o que cada vereador fez nas ${nf.format(votacoes)} votações nominais. A parte clara é onde não houve voto registrado.`}>
    <${VotosPorVereador} linhas=${linhas} total=${votacoes} /><${TotalDeVotos} t=${totalDeVotos(linhas)} /><//>`;
}

function Alinhamento({ vereadores }) {
  const arvore = arvoreDeConcordancia(alinhamentos(vereadores).map(l => ({ nome: l.nome, parte: l.com, total: l.de })), ['Com a maioria', 'Contra a maioria']);
  return html`<${Cartao} tipo="Árvore expansível · ranking" titulo="Alinhamento com a maioria" sub="Não diz quem está certo: só quem votou junto com a maioria da Câmara."
    nota="Em cada vereador, a parte das votações em que a maioria se formou e ele votou: com a maioria e contra ela.">
    <${ArvoreComLegenda} legenda="Vereador → com e contra a maioria · % das votações" arvore=${arvore} formato=${pct0} escala="maior" mostrarTotal=${false} rotulo=${nome => nome} /><//>`;
}

function PresencaEAlinhamento({ vereadores }) {
  const pontos = presencaXAlinhamento(vereadores);
  if (pontos.length < 2) return null;
  return html`<${Cartao} tipo="Dispersão · presença × alinhamento" titulo="Presença e alinhamento juntos"
    nota="Cada ponto é um vereador: quanto mais à direita, mais presença; quanto mais alto, mais votos com a maioria. Passe o cursor para ver o nome.">
    <${Dispersao} pontos=${pontos} descricao="Presença nas sessões e alinhamento com a maioria, um ponto por vereador"
      eixos=${{ x: { titulo: 'Presença nas sessões', formato: pct0 }, y: { titulo: 'Alinhamento com a maioria', formato: pct0 } }} /><//>`;
}

export function QuemVotaComAMaioria({ vereadores }) {
  return html`<${Bloco} id="cm" titulo="Quem vota com a maioria" colunas="dois-tercos"
    lede="A conta é: votações em que o vereador votou como a maioria, sobre as votações em que a maioria se formou e ele votou.">
    <${Alinhamento} vereadores=${vereadores} /><${PresencaEAlinhamento} vereadores=${vereadores} /><//>`;
}
