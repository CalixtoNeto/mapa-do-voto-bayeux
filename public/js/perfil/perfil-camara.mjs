// A Câmara Municipal em números: presença, partidos, votos nominais, alinhamento com a maioria, gasto e folha.
import { nf, pct } from '../formato.mjs';
import { Aviso } from '../cartao.mjs';
import { CabecalhoDoPerfil } from './cabecalho-perfil.mjs';
import { presencaMedia } from './calculos-camara.mjs';
import { QuemAparece, OsVereadores } from './camara-presenca.mjs';
import { ComoVotam, QuemVotaComAMaioria } from './camara-votos.mjs';
import { GastoDaCamara } from './camara-gasto.mjs';
const { html } = window.htmPreact;

const indicadores = (c, ativos) => [
  { rotulo: 'Vereadores em exercício', valor: String(ativos), nota: `${c.legislatura.numero}ª legislatura` },
  { rotulo: 'Sessões', valor: nf.format(c.sessoes), nota: 'com presença ou voto registrado' },
  { rotulo: 'Votações nominais', valor: nf.format(c.votacoesNominais), nota: 'com voto de cada vereador' },
  { rotulo: 'Presença média', valor: presencaMedia(c.vereadores) == null ? null : pct(presencaMedia(c.vereadores), 0), nota: 'das sessões em que podiam estar' }];

export function PerfilCamara({ camara, anos }) {
  const ativos = camara?.vereadores.filter(v => v.emExercicio).length;
  return html`<article class="perfil">
    <${CabecalhoDoPerfil} pagina="camara" rotulo=${`Perfil do município · Legislatura ${camara?.legislatura.numero ?? ''}`} titulo="Câmara Municipal"
      lede=${camara ? `Presença nas sessões e votos nominais dos ${ativos} vereadores em exercício. Dados do SAPL da Câmara e do TCE-PB.` : 'Gasto e folha da Câmara, com dados do TCE-PB.'}
      indicadores=${camara && indicadores(camara, ativos)} />
    ${camara ? html`<${QuemAparece} vereadores=${camara.vereadores} /><${OsVereadores} vereadores=${camara.vereadores} />
      <${ComoVotam} vereadores=${camara.vereadores} votacoes=${camara.votacoesNominais} /><${QuemVotaComAMaioria} vereadores=${camara.vereadores} />`
      : html`<${Aviso}>Os dados da Câmara ainda não foram gerados.<//>`}
    <${GastoDaCamara} anos=${anos} />
    <p class="fonte">Fonte: SAPL da Câmara Municipal de Bayeux (sessões, presença e votos nominais da legislatura ${camara?.legislatura.numero ?? ''}) e TCE-PB (despesas e folha). Os pontos da dispersão têm o nome do vereador ao passar o cursor.</p>
  </article>`;
}
