// Série dos dois primeiros colocados do cargo majoritário (prefeito, governador): o que o primeiro teve contra o segundo, a cada eleição.
import { pct } from './formato.mjs';
import { nomeDe } from './componentes.mjs';
import { Cartao } from './cartao.mjs';
import { LinhaDoTempo } from './linha-do-tempo.mjs';
import { usarColocados } from './dados-series.mjs';
import { cargoDosColocados } from './series-carregar.mjs';
const { html } = window.htmPreact;

const serieDe = (dados, pos, nome, cor) => ({ nome, cor, formato: v => pct(v, 1),
  pontos: dados.map(d => d.colocados[pos] ? [+d.ano, d.colocados[pos].parcela] : null) });

export function SerieDosColocados({ cfg }) {
  const dados = usarColocados(cfg);
  if (!dados || dados.length < 2) return null;
  const cargo = String(cfg.nomeDoCargo[cargoDosColocados(cfg)] || 'cargo').toLowerCase(), anos = dados.map(d => d.ano), series = [serieDe(dados, 0, '1º lugar', 'var(--r5)'), serieDe(dados, 1, '2º lugar', 'var(--antes)')];
  const mais = dados.map(d => `${nomeDe(d.colocados[0].cand)} (${d.ano})`).join(', ');
  return html`<${Cartao} classe="larga" tipo="Série temporal · linha" titulo=${`1º e 2º colocados para ${cargo}, ${anos[0]} a ${anos[anos.length - 1]}`}
      sub=${`% dos votos válidos. ${dados.length} eleições de ${cargo}.`}
      nota=${`Mais votados no 1º turno: ${mais}. Cada ponto traz o valor; as pontas levam rótulo direto, sem legenda separada. O eixo começa em zero.`}>
    <${LinhaDoTempo} series=${series} rotulosX=${anos.map(a => [+a, a])} formatoEixo=${v => pct(v, 0)}
      descricao=${`Parcela dos votos válidos do 1º e do 2º colocados para ${cargo}: ${dados.map(d => `${d.ano}, ${pct(d.colocados[0].parcela, 1)} e ${d.colocados[1] ? pct(d.colocados[1].parcela, 1) : 'sem 2º'}`).join('; ')}`} /><//>`;
}
