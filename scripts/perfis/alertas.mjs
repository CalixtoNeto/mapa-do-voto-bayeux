// Gastos fora do padrão nas despesas do ano. Não apontam irregularidade: dizem onde vale olhar com mais cuidado.
//   fracionamento: um fornecedor recebeu, sem licitação ou por dispensa, mais que o limite de dispensa por valor
//                  no mesmo objeto (subelemento de despesa) ao longo do ano;
//   pico:          um mês com mais de 3 vezes a mediana mensal do mesmo tipo de despesa;
//   concentracao:  um fornecedor ficou com 70% ou mais de um tipo de despesa de R$ 1 milhão ou mais.
import { ehCompra } from './compras.mjs';
import { centavos } from './somas.mjs';

// Limites de dispensa por valor da Lei 14.133 (art. 75, I e II), atualizados por decreto a cada ano.
// Antes de 2024 valia também a Lei 8.666, com outros limites, então não há comparação justa.
const LIMITES = { 2024: [119812.02, 59906.02], 2025: [125451.15, 62725.59] };
const ULTIMO_ANO = Math.max(...Object.keys(LIMITES).map(Number));
export function limiteDeDispensa(ano, objeto) {
  if (Number(ano) < 2024) return null;
  const [obras, compras] = LIMITES[Math.min(Number(ano), ULTIMO_ANO)];
  return /obra|engenharia/i.test(objeto) ? obras : compras;
}

const SEM_DISPUTA = /^(sem licita|dispensa)/i;
// Energia, água, telefone e tarifas só têm um fornecedor possível: não há o que licitar.
const SERVICO_PUBLICO = /energia|[aá]gua|esgoto|telecomunica|telefon|banc[aá]ri|correio|tarifa|taxa/i;
const PICO = 3, PICO_MINIMO = 300000, MESES_MINIMOS = 6, CONCENTRACAO = 0.7, CONCENTRACAO_MINIMA = 1e6, MOSTRADOS = 15;

export const novosAlertas = () => ({ semDisputa: {}, mensal: {}, porElemento: {} });

export function somarParaAlertas(acc, ler, pago) {
  const elemento = ler('ELEMENTO_DESPESA');
  if (!pago || !ehCompra(elemento)) return;
  const credor = ler('NOME_CREDOR'), objeto = ler('CODIGO_SUBELEMENTO_EXIBICAO') || elemento;
  if (SEM_DISPUTA.test(ler('MODALIDADE_LICITACAO')) && !SERVICO_PUBLICO.test(objeto)) {
    const s = (acc.semDisputa[`${credor}|${objeto}`] ||= { credor, objeto, v: 0, n: 0 });
    s.v += pago; s.n++;
  }
  const mes = ler('MES').slice(0, 2), mensal = (acc.mensal[elemento] ||= {});
  mensal[mes] = (mensal[mes] || 0) + pago;
  const e = (acc.porElemento[elemento] ||= { v: 0, credores: {} });
  e.v += pago; e.credores[credor] = (e.credores[credor] || 0) + pago;
}

const mediana = valores => { const v = [...valores].sort((a, b) => a - b), m = v.length >> 1; return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2; };
const maiores = (lista, i) => lista.sort((a, b) => b[i] - a[i]).slice(0, MOSTRADOS);

function fracionamentos(acc, ano) {
  return maiores(Object.values(acc.semDisputa).filter(s => s.n > 1 && limiteDeDispensa(ano, s.objeto) && s.v > limiteDeDispensa(ano, s.objeto))
    .map(s => ['fracionamento', s.credor, s.objeto, centavos(s.v), s.n, limiteDeDispensa(ano, s.objeto)]), 3);
}

function picos(acc) {
  return maiores(Object.entries(acc.mensal).flatMap(([elemento, meses]) => {
    const valores = Object.values(meses);
    if (valores.length < MESES_MINIMOS) return [];
    const m = mediana(valores);
    return Object.entries(meses).filter(([, v]) => v >= PICO_MINIMO && v > PICO * m).map(([mes, v]) => ['pico', elemento, mes, centavos(v), centavos(m)]);
  }), 3);
}

function concentracoes(acc) {
  return maiores(Object.entries(acc.porElemento).filter(([, e]) => e.v >= CONCENTRACAO_MINIMA).flatMap(([elemento, e]) => {
    const [credor, v] = Object.entries(e.credores).sort((a, b) => b[1] - a[1])[0];
    return v / e.v >= CONCENTRACAO ? [['concentracao', elemento, credor, centavos(v), centavos(e.v)]] : [];
  }), 4);
}

export const alertasDoAno = (acc, ano) => [...fracionamentos(acc, ano), ...picos(acc), ...concentracoes(acc)];
