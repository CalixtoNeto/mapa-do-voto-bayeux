// Topo de cada página de perfil: rótulo, título, lede, as três pílulas (Prefeitura, Câmara, Emendas) e os indicadores.
import { Cabecalho, Indicadores, Abas } from '../estrutura.mjs';
const { html } = window.htmPreact;

const PAGINAS = [['prefeitura', 'Prefeitura'], ['camara', 'Câmara'], ['emendas', 'Emendas']];
const irPara = id => { location.hash = 'perfil/' + id; };

// pagina: a pílula ativa (sem ela, não há pílulas, como na página de um vereador); foto: do vereador.
export function CabecalhoDoPerfil({ pagina, foto, rotulo, titulo, lede, indicadores, children }) {
  return html`<div class="cab-perfil">
    <div class=${'cab-linha' + (foto ? ' com-foto' : '')}>
      ${foto && html`<img src=${foto.replace(/^http:/, 'https:')} alt="" width="96" height="96" onError=${e => { e.target.hidden = true; }} />`}
      <${Cabecalho} rotulo=${rotulo} titulo=${titulo} lede=${lede}>
        ${pagina && html`<${Abas} itens=${PAGINAS} valor=${pagina} aoMudar=${irPara} rotulo="Páginas do perfil do município" estilo="pilula" />`}${children}<//>
    </div>
    ${indicadores && html`<${Indicadores} itens=${indicadores} />`}
  </div>`;
}
