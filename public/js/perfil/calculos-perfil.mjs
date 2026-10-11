// Cálculos da página de perfis (sem DOM): endereços, taxas, remuneração, afinidade e cruzamentos.
const NORM = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export const slug = nome => NORM(nome).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export const taxa = ([parte, total]) => total ? parte / total : null;

// 202502 → 02/2025
export const mesAno = anoMes => `${String(anoMes).slice(4, 6)}/${String(anoMes).slice(0, 4)}`;

export function resumoDaRemuneracao(remuneracao) {
  if (!remuneracao?.length) return null;
  const ultimo = remuneracao.reduce((a, b) => b[0] > a[0] ? b : a);
  const total = remuneracao.reduce((s, r) => s + r[1], 0);
  return { mes: ultimo[0], valor: ultimo[1], cargo: ultimo[2], total: Math.round(total * 100) / 100, meses: new Set(remuneracao.map(r => r[0])).size };
}

// afinidade: [[vereador, iguais, comuns]], do mais parecido ao menos.
export function extremosDaAfinidade(afinidade, n = 3) {
  const mais = afinidade.slice(0, n);
  const menos = afinidade.slice(n).slice(-n).reverse();
  return { mais, menos };
}

// Credores da prefeitura que doaram ou prestaram serviço à campanha deste candidato, a partir de uma eleição.
export function ligacoesDoCandidato(anos, chave, desdeEleicao) {
  const ligacoes = [];
  for (const a of anos) {
    for (const [credor, pago, campanhas] of a.campanhas || []) {
      for (const [ano, candidato, valor, papel] of campanhas) {
        if (candidato === chave && ano >= desdeEleicao) ligacoes.push({ ano: a.ano, credor, pago, valor, papel, eleicao: ano });
      }
    }
  }
  return ligacoes.sort((x, y) => x.ano.localeCompare(y.ano) || y.pago - x.pago);
}

export const vereadoresEmOrdem = vereadores => [...vereadores]
  .sort((a, b) => (b.emExercicio - a.emExercicio) || a.nome.localeCompare(b.nome, 'pt-BR'));

// [[ano, valor]] em ordem de ano, sem os anos em que o valor não existe.
export const serieAnual = (anos, valorDe) => anos.map(a => [a.ano, valorDe(a)])
  .filter(([, v]) => v != null).sort((a, b) => a[0].localeCompare(b[0]));

// Todos os credores de um ano ligados a alguma campanha municipal, um por campanha.
export function ligacoesDoAno(a) {
  return (a?.campanhas || []).flatMap(([credor, pago, campanhas]) => campanhas
    .map(([eleicao, , valor, papel, quem]) => ({ ano: a.ano, credor, pago, valor, papel, quem, eleicao })))
    .sort((x, y) => y.pago - x.pago || y.valor - x.valor);
}

// Um credor por linha: total pago pelo município nos anos listados e as campanhas a que está ligado.
export function agruparLigacoes(ligacoes) {
  const grupos = new Map();
  for (const l of ligacoes) {
    const g = grupos.get(l.credor) || { credor: l.credor, pagoPorAno: new Map(), campanhas: new Map() };
    g.pagoPorAno.set(l.ano, l.pago);
    g.campanhas.set(`${l.eleicao}|${l.quem}|${l.papel}`, { papel: l.papel, valor: l.valor, quem: l.quem, eleicao: l.eleicao });
    grupos.set(l.credor, g);
  }
  return [...grupos.values()].map(g => ({ credor: g.credor, pago: [...g.pagoPorAno.values()].reduce((s, v) => s + v, 0),
    anos: [...g.pagoPorAno.keys()].sort(), campanhas: [...g.campanhas.values()] })).sort((a, b) => b.pago - a.pago);
}

const comAnoCompleto = a => a?.despesas?.meses?.length === 12;
// Tipos de compra que pelo menos dobraram de um ano completo para o seguinte e cresceram R$ 1 milhão ou mais.
export function comprasQueDobraram(anos, ano) {
  const atual = anos.find(a => a.ano === ano), anterior = anos.find(a => Number(a.ano) === Number(ano) - 1);
  if (!comAnoCompleto(atual) || !comAnoCompleto(anterior)) return [];
  const antes = new Map(anterior.despesas.comprasPorElemento || []);
  return (atual.despesas.comprasPorElemento || []).map(([elemento, depois]) => [elemento, antes.get(elemento) || 0, depois])
    .filter(([, a, d]) => a > 0 && d >= 2 * a && d - a >= 1e6).sort((x, y) => (y[2] - y[1]) - (x[2] - x[1]));
}

// Variação de comissionados e temporários entre janeiro e junho de ano de eleição municipal, só como dado
// descritivo: o site não verifica as regras eleitorais de contratação. [tipo, pessoas em janeiro, em junho]
const CONTRATACAO = /comissionad|excepcional|tempor/i;
export function contratacoesEmAnoDeEleicao(a) {
  if (Number(a?.ano) % 4 !== 0 || !a.servidores?.tiposPorMes) return [];
  return Object.entries(a.servidores.tiposPorMes).filter(([tipo]) => CONTRATACAO.test(tipo)).flatMap(([tipo, meses]) => {
    const no = mes => meses.find(m => m[0] === `${a.ano}${mes}`)?.[1];
    const [jan, jun] = [no('01'), no('06')];
    return jan && jun && jun - jan >= 50 && jun / jan >= 1.2 ? [[tipo, jan, jun]] : [];
  });
}
