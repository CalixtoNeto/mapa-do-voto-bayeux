// Peças comuns às páginas de perfil.
import { nomeDeQuem } from '../formato.mjs';
import { usarLimite } from '../componentes.mjs';
import { agruparLigacoes } from './calculos-perfil.mjs';
import { arvoreDasLigacoes } from './arvores-prefeitura.mjs';
import { ArvoreComLegenda } from './arvore-legenda.mjs';
import { Aviso, ComoLer } from '../cartao.mjs';
const { html } = window.htmPreact;

export const ano = data => String(data || '').slice(0, 4);
export const nomeProprio = nome => nomeDeQuem(nome);

export function Voltar({ para = '#perfil/camara', texto = 'Câmara Municipal' }) {
  return html`<a class="voltar" href=${para}>← ${texto}</a>`;
}

export function Estatisticas({ itens }) {
  const visiveis = itens.filter(i => i && i.valor != null && i.valor !== '');
  return visiveis.length ? html`<dl class="stats">${visiveis.map(i => html`<div><dt>${i.rotulo}</dt><dd>${i.valor}</dd>${i.nota && html`<small>${i.nota}</small>`}</div>`)}</dl>` : null;
}

// Credores do poder público ligados a campanhas, um por linha: { ano, credor, pago, valor, papel, quem?, eleicao }.
// pagador diz quem pagou e onde está o dado: { dos: 'do município', pagou: 'o município', fonte: 'TCE-PB' }.
const PAGADOR_PADRAO = { dos: 'do município', pagou: 'o município', fonte: 'TCE-PB' };
export function Ligacoes({ ligacoes, comCandidato, pagador = PAGADOR_PADRAO }) {
  const grupos = agruparLigacoes(ligacoes), [limite, botao] = usarLimite(grupos.length);
  if (!grupos.length) return html`<p class="hint">Nenhum doador ou fornecedor desta campanha aparece, com o mesmo documento, entre os credores ${pagador.dos}.</p>`;
  const arvore = arvoreDasLigacoes(grupos.slice(0, limite), comCandidato);
  return html`<${ArvoreComLegenda} legenda=${`Credor (R$ pago ${pagador.dos}) → campanha (R$ doado ou recebido)`} arvore=${arvore} escala="maior" ordenarRaiz=${false} mostrarTotal=${false}
      rotulo=${nomeProprio} />${botao}
    <${Aviso}>Aparecer nas duas bases não indica relação entre a doação ou o serviço e o pagamento: pessoas e empresas atendem campanhas e órgãos públicos ao mesmo tempo por razões comuns (trabalho, comércio, serviço público).<//>
    <${ComoLer} titulo="Como o cruzamento é feito">Cruzamento automático entre a prestação de contas (TSE) e os pagamentos ${pagador.dos} (${pagador.fonte}) pelo documento: empresa pelo CNPJ; pessoa física pelos dígitos centrais do CPF (os que ${pagador.fonte} publica) e pelo nome completo. Cada credor mostra o que ${pagador.pagou} pagou; ao abrir, o valor de cada campanha.<//>`;
}
