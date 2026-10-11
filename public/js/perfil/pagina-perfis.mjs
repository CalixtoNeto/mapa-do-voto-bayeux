// Página de perfis: a Prefeitura (#perfis e #perfil/prefeitura), a Câmara (#perfil/camara), as emendas (#perfil/emendas)
// e cada vereador (#perfil/nome-do-vereador). Só existe no site de Bayeux.
import { usarPerfis, usarRota } from './dados-perfil.mjs';
import { slug } from './calculos-perfil.mjs';
import { PerfilVereador } from './perfil-vereador.mjs';
import { PerfilPrefeitura } from './perfil-prefeitura.mjs';
import { PerfilCamara } from './perfil-camara.mjs';
import { PerfilEmendas } from './perfil-emendas.mjs';
export { ehRotaDePerfil } from './dados-perfil.mjs';
const { html } = window.htmPreact;

export function PaginaDePerfis({ aoVerNoMapa }) {
  const dados = usarPerfis(), rota = usarRota();
  if (!dados) return html`<p class="hint">Carregando os perfis…</p>`;
  if (dados.vazio) return html`<p class="hint">Os perfis ainda não foram gerados.</p>`;
  const alvo = rota.replace(/^perfil\//, '');
  if (alvo === 'camara') return html`<${PerfilCamara} camara=${dados.camara} anos=${dados.anos} />`;
  if (alvo === 'emendas') return html`<${PerfilEmendas} emendas=${dados.emendas} anos=${dados.anos} />`;
  const v = dados.camara?.vereadores.find(x => slug(x.nome) === alvo);
  if (v) return html`<${PerfilVereador} v=${v} camara=${dados.camara} anos=${dados.anos} aoVerNoMapa=${aoVerNoMapa} />`;
  return html`<${PerfilPrefeitura} anos=${dados.anos} aoVerNoMapa=${aoVerNoMapa} />`;
}
