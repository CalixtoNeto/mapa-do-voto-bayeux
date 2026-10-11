// Variação da abstenção por lugar desde a eleição anterior da mesma disputa: maiores altas e quedas, com ▲▼ e a régua antes → depois.
import { pct, pontos } from './formato.mjs';
import { variacaoDaAbstencao } from './calculos.mjs';
import { Cartao } from './cartao.mjs';
import { Haltere } from './graficos.mjs';
import { ListaDePosicoes } from './lista-posicoes.mjs';
const { html, useMemo } = window.htmPreact;

const MOSTRAR = 6;

export function criarAbstencaoPorLugar(cfg) {
  return function AbstencaoPorLugar({ ctx }) {
    const lista = useMemo(() => variacaoDaAbstencao(ctx.comparecimento, ctx.comparecimentoAnterior).sort((a, b) => b.diferenca - a.diferenca), [ctx]);
    if (lista.length < 4) return null;
    const teto = Math.max(...lista.flatMap(v => [v.antes, v.agora])), desde = ctx.ds.ano - 4;
    const item = v => [cfg.nomeDoLugar(v.lugar, ctx.ds), html`<span class=${'variacao ' + (v.diferenca > 0 ? 'up' : 'down')}>${pontos(v.diferenca)}</span>`, `${pct(v.antes)} → ${pct(v.agora)}`,
      html`<${Haltere} antes=${v.antes} depois=${v.agora} max=${teto} descricao=${`Abstenção de ${pct(v.antes)} para ${pct(v.agora)}`} />`];
    const altas = lista.filter(v => v.diferenca > 0).slice(0, MOSTRAR), quedas = lista.filter(v => v.diferenca < 0).slice(-MOSTRAR).reverse();
    const cartao = (titulo, itens) => itens.length > 0 && html`<${Cartao} tipo=${`Haltere · variação desde ${desde}`} titulo=${titulo}
        sub="Ponto cinza: antes. Ponto azul: depois." nota=${`Régua de 0 a ${pct(teto, 0)} de abstenção. ▲ subiu, ▼ caiu, em pontos percentuais.`}><${ListaDePosicoes} itens=${itens.map(item)} /><//>`;
    return html`${cartao(`Abstenção: maiores altas por ${cfg.lugarNome}`, altas)}${cartao(`Abstenção: maiores quedas por ${cfg.lugarNome}`, quedas)}`;
  };
}
