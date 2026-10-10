// A Câmara Municipal em números: sessões, votações, gasto e folha em cada ano, quem mais recebeu e em quê.
import { nf, pct, dinheiro, sentence } from '../formato.mjs';
import { ArvoreDeBarras } from '../arvore.mjs';
import { ListaDeBarras } from '../componentes.mjs';
import { Colunas } from '../graficos.mjs';
import { serieAnual, taxa, slug } from './calculos-perfil.mjs';
import { Voltar, Topo, Estatisticas, Secao, nomeProprio, ano } from './pecas.mjs';
const { html } = window.htmPreact;

const folhaDaCamara = a => a.servidores?.orgaos.find(([orgao]) => /c[aâ]mara/i.test(orgao));
const serie = lista => lista.map(([a, v]) => ({ n: a, v, rotulo: dinheiro(v) }));
const Anual = ({ lista, nome }) => html`<${Colunas} itens=${serie(lista)} descricao=${`${nome} em cada ano: ` + serie(lista).map(i => `${i.n}, ${i.rotulo}`).join('; ')} />`;

function Presencas({ vereadores }) {
  const itens = vereadores.filter(v => v.presenca[1]).sort((a, b) => taxa(b.presenca) - taxa(a.presenca))
    .map(v => ({ n: html`<a href=${'#perfil/' + slug(v.nome)}>${v.nome}</a>`, v: taxa(v.presenca), rotulo: `${pct(taxa(v.presenca), 0)} · ${v.presenca[0]}/${v.presenca[1]}` }));
  return html`<${ListaDeBarras} itens=${itens} />`;
}

export function PerfilCamara({ camara, anos }) {
  const recente = anos.find(a => a.despesas?.camara?.pago), folha = recente && folhaDaCamara(recente);
  return html`<article class="perfil">
    <${Voltar} />
    <${Topo} titulo="Câmara Municipal de Bayeux" linhas=${camara && [`${camara.legislatura.numero}ª legislatura · ${ano(camara.legislatura.inicio)}–${ano(camara.legislatura.fim)}`]} />
    <${Estatisticas} itens=${[camara && { rotulo: 'Sessões realizadas (com presença ou voto registrado)', valor: nf.format(camara.sessoes) },
      camara && { rotulo: 'Votações nominais', valor: nf.format(camara.votacoesNominais) },
      recente && { rotulo: `Pago em ${recente.ano}`, valor: dinheiro(recente.despesas.camara.pago) },
      folha && { rotulo: `Folha em ${recente.ano}`, valor: dinheiro(folha[2]), nota: `${nf.format(folha[1])} pessoas no último mês` }]} />
    ${camara && html`<${Secao} id="cp" titulo="Presença nas sessões"><${Presencas} vereadores=${camara.vereadores} /><//>`}
    <${Secao} id="ca" titulo="Gasto e folha da Câmara em cada ano">
      <h3>Pago</h3><${Anual} nome="Pago" lista=${serieAnual(anos, a => a.despesas?.camara?.pago || null)} />
      <h3>Folha de pessoal</h3><${Anual} nome="Folha de pessoal" lista=${serieAnual(anos, a => folhaDaCamara(a)?.[2] ?? null)} /><//>
    ${recente && html`<${Secao} id="cr" titulo=${`Em que a Câmara gastou em ${recente.ano}`}>
      ${recente.despesas.camara.arvore?.v > 0
        ? html`<p class="hint">Tipo de despesa → quem recebeu. Toque num item para abrir.</p>
          <div class="arvore"><${ArvoreDeBarras} arvore=${recente.despesas.camara.arvore} rotulo=${(nome, nivel) => nivel === 1 && !/^Outros \(/.test(nome) ? nomeProprio(nome) : sentence(nome)} /></div>`
        : html`<${ListaDeBarras} itens=${serie(recente.despesas.camara.elementos)} />
          <h3>Quem mais recebeu</h3><${ListaDeBarras} itens=${recente.despesas.camara.credores.map(([n, , v]) => ({ n: nomeProprio(n), v, rotulo: dinheiro(v) }))} />`}
      ${recente.despesas.camara.compras > 0 && html`<p class="hint">Compras e serviços sem licitação: ${dinheiro(recente.despesas.camara.semLicitacao)} de ${dinheiro(recente.despesas.camara.compras)}.</p>`}<//>`}
    <p class="hint">Fontes: SAPL da Câmara Municipal (sessões, presença e votos) e TCE-PB (despesas e folha).</p>
  </article>`;
}
