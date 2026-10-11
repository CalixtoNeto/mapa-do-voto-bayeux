// Árvore de decomposição em sanfona: cada ramo mostra o valor e uma barra com o peso; tocar abre os filhos logo abaixo,
// recuados e ligados ao pai por uma linha. Ramo: [nome, valor, filhos?, nota?, chave?]; a nota substitui o "% do total".
// Ramo com valor nulo é só um aviso (ex.: "Carregando…"). Serve ao dinheiro (R$, barra sobre o total) e aos votos (barra sobre o maior irmão, linha ativa e gancho ao abrir).
import { pct, dinheiro, sentence } from './formato.mjs';
const { html, useState } = window.htmPreact;

let proximoId = 0;
const emOrdem = filhos => [...(filhos || [])].sort((a, b) => b[1] - a[1]);

function Ramo({ ramo, base, nivel, op }) {
  const [nome, v, filhos, nota, chave] = ramo;
  if (v == null) return html`<li class=${'ramo folha aviso-ramo nivel-' + nivel}><div class="abre"><span class="seta" aria-hidden="true"></span><span class="ln">${nome}</span></div></li>`;
  const [aberto, setAberto] = useState(false), [id] = useState(() => `ramo-${++proximoId}`);
  const peso = nota ?? `${pct(v / op.total, v / op.total < 0.01 ? 1 : 0)} do total`;
  const conteudo = html`<span class="ln">${op.rotulo(nome, nivel)}</span><span class="lv">${op.formato(v)}</span>
    <span class="bar" aria-hidden="true"><i style=${`width:${Math.max(0.5, v / base * 100).toFixed(1)}%`}></i></span><small class="peso">${peso}</small>`;
  const ativa = op.ativo && chave != null && op.ativo(chave) ? ' ativa' : '';
  if (!filhos?.length) return html`<li class=${'ramo folha nivel-' + nivel + ativa}><div class="abre"><span class="seta" aria-hidden="true"></span>${conteudo}</div></li>`;
  const alternar = () => { if (!aberto && op.aoAbrir) op.aoAbrir(chave, ramo); setAberto(a => !a); };
  const irmaos = emOrdem(filhos), maior = op.escala === 'maior' ? irmaos[0][1] : op.total;
  return html`<li class=${'ramo nivel-' + nivel + (aberto ? ' aberto' : '') + ativa}>
    <button type="button" class="abre" aria-expanded=${aberto} aria-controls=${id} onClick=${alternar}><span class="seta" aria-hidden="true">›</span>${conteudo}</button>
    ${aberto && html`<ul class="filhos" id=${id}>${irmaos.map(f => html`<${Ramo} ramo=${f} base=${maior} nivel=${nivel + 1} op=${op} />`)}</ul>`}
  </li>`;
}

// rotulo(nome, nivel): como escrever cada ramo (nível 0 é o primeiro abaixo do total). escala 'maior': a barra compara com o maior
// irmão; 'total': com o total da árvore. ordenarRaiz=false mantém a ordem recebida no primeiro nível. ativo(chave): linha em destaque.
export function ArvoreDeBarras({ arvore, rotulo = nome => sentence(nome), formato = dinheiro, escala = 'total', ordenarRaiz = true, mostrarTotal = true, ativo, aoAbrir, rotuloDoTotal = 'Total' }) {
  const op = { rotulo, formato, escala, ativo, aoAbrir, total: arvore.v };
  const raiz = ordenarRaiz ? emOrdem(arvore.filhos) : arvore.filhos, base = escala === 'maior' ? Math.max(1e-9, ...raiz.map(r => r[1])) : arvore.v;
  return html`${mostrarTotal && html`<p class="arvore-total">${rotuloDoTotal} · <b>${formato(arvore.v)}</b></p>`}
    <ul class="sanfona">${raiz.map(r => html`<${Ramo} ramo=${r} base=${base} nivel=${0} op=${op} />`)}</ul>`;
}
