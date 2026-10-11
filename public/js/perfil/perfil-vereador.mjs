// Perfil de um vereador: mandato, presença, votos nominais, com quem vota junto, matérias, partidos,
// remuneração e credores do município ligados à campanha dele.
import { pct, nf } from '../formato.mjs';
import { Bloco } from '../estrutura.mjs';
import { Cartao } from '../cartao.mjs';
import { taxa, ligacoesDoCandidato } from './calculos-perfil.mjs';
import { CabecalhoDoPerfil } from './cabecalho-perfil.mjs';
import { Voltar, Ligacoes, ano, nomeProprio } from './pecas.mjs';
import { Materias, Votacoes, Partidos, Remuneracao, remuneracaoDe } from './vereador-secoes.mjs';
const { html } = window.htmPreact;

const indicadores = (v, camara) => [
  { rotulo: 'Presença nas sessões', valor: taxa(v.presenca) == null ? null : pct(taxa(v.presenca), 0), nota: `${v.presenca[0]} de ${v.presenca[1]} sessões` },
  { rotulo: 'Matérias apresentadas', valor: nf.format(v.materias.total) },
  { rotulo: `Votos em ${camara.eleicao}`, valor: v.eleicao == null ? null : nf.format(v.eleicao) }];

export function PerfilVereador({ v, camara, anos, aoVerNoMapa }) {
  const nomes = new Map(camara.vereadores.map(x => [x.id, x.nome]));
  const mandato = `Vereador(a) · ${v.partido || 'sem partido'} · ${ano(v.inicio)}–${ano(v.fim)}${v.titular ? '' : ' · suplente'}`;
  return html`<article class="perfil">
    <${Voltar} />
    <${CabecalhoDoPerfil} foto=${v.foto} rotulo=${`Perfil do município · ${mandato}`} titulo=${v.nome} indicadores=${indicadores(v, camara)}
      lede=${[nomeProprio(v.completo), !v.emExercicio && `Fora do mandato desde ${v.fim.split('-').reverse().join('/')}`].filter(Boolean).join(' · ')}>
      ${v.chave && html`<button type="button" class="link" onClick=${() => aoVerNoMapa(camara.eleicao, v.chave)}>Ver os votos de ${camara.eleicao} no mapa</button>`}<//>
    <${Bloco} id="vv" titulo="Votos nominais" colunas="metade" lede="O que o vereador votou nas votações nominais e com quem mais vota junto.">
      <${Cartao} tipo="Barra empilhada · votos" titulo="Sim, não e abstenção"><${Votacoes} v=${v} nomes=${nomes} /><//>
      <${Cartao} tipo="Lista · matérias" titulo="Matérias de autoria"><${Materias} m=${v.materias} /><//><//>
    <${Bloco} id="vr" titulo="Remuneração e partido" colunas="metade">
      <${Cartao} tipo="Folha da Câmara" titulo="Remuneração"><${Remuneracao} rem=${remuneracaoDe(v)} meses=${v.remuneracao} /><//>
      <${Cartao} tipo="Filiação" titulo="Partido"><${Partidos} v=${v} /><//><//>
    ${v.chave && html`<${Bloco} id="vc" titulo="Campanha e pagamentos do município">
      <${Cartao} classe="largo" tipo="Lista · campanha" titulo="Doadores e fornecedores da campanha" sub="Que também receberam do município">
        <${Ligacoes} ligacoes=${ligacoesDoCandidato(anos, v.chave, camara.eleicao)} /><//><//>`}
    <p class="fonte">Fontes: SAPL da Câmara Municipal de Bayeux (legislatura ${camara.legislatura.numero}, desde ${ano(camara.legislatura.inicio)}), TCE-PB (folha e despesas) e TSE.</p>
  </article>`;
}
