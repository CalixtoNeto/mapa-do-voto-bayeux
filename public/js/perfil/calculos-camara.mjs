// Cálculos do perfil da Câmara (sem DOM): presença, partidos, votos e alinhamento com a maioria dos vereadores em exercício.
import { anoParcial } from './calculos-municipio.mjs';
const emExercicio = vereadores => vereadores.filter(v => v.emExercicio);
const porNome = (a, b) => a.nome.localeCompare(b.nome, 'pt-BR');
const fracao = (parte, total) => total ? parte / total : null;

export function presencaMedia(vereadores) {
  const lista = emExercicio(vereadores), total = lista.reduce((s, v) => s + v.presenca[1], 0);
  return total ? lista.reduce((s, v) => s + v.presenca[0], 0) / total : null;
}

export const presencasEmOrdem = vereadores => emExercicio(vereadores).filter(v => v.presenca[1])
  .map(v => ({ nome: v.nome, fracao: v.presenca[0] / v.presenca[1], parte: v.presenca[0], total: v.presenca[1] }))
  .sort((a, b) => b.fracao - a.fracao || b.total - a.total || porNome(a, b));

export function partidosEmExercicio(vereadores) {
  const contagem = new Map();
  emExercicio(vereadores).forEach(v => contagem.set(v.partido || 'Não informado', (contagem.get(v.partido || 'Não informado') || 0) + 1));
  return [...contagem].map(([nome, v]) => ({ nome, v })).sort((a, b) => b.v - a.v || a.nome.localeCompare(b.nome, 'pt-BR'));
}

export function votosPorVereador(vereadores, totalDeVotacoes) {
  return emExercicio(vereadores).map(({ nome, votacoes: t }) => ({ nome, sim: t.sim, nao: t.nao, abstencao: t.abstencao, outros: t.outros,
    semVoto: Math.max(0, totalDeVotacoes - t.sim - t.nao - t.abstencao - t.outros) })).sort(porNome);
}

export function totalDeVotos(linhas) {
  const t = { sim: 0, nao: 0, abstencao: 0, outros: 0 };
  linhas.forEach(l => Object.keys(t).forEach(k => { t[k] += l[k]; }));
  return { ...t, total: t.sim + t.nao + t.abstencao + t.outros };
}

export const alinhamentos = vereadores => emExercicio(vereadores).filter(v => v.votacoes.comMaioriaDe > 0)
  .map(v => ({ nome: v.nome, fracao: v.votacoes.comMaioria / v.votacoes.comMaioriaDe, com: v.votacoes.comMaioria, de: v.votacoes.comMaioriaDe }))
  .sort((a, b) => b.fracao - a.fracao || b.de - a.de || porNome(a, b));

export const presencaXAlinhamento = vereadores => emExercicio(vereadores)
  .filter(v => v.presenca[1] && v.votacoes.comMaioriaDe)
  .map(v => ({ n: v.nome, x: fracao(...v.presenca), y: fracao(v.votacoes.comMaioria, v.votacoes.comMaioriaDe) }));

// Partidos [{ nome, v }] com uma cor cada; o excesso soma em "Outros (n)" e "Não informado" fica na cor neutra.
export function partesDosPartidos(partidos, cores, neutra) {
  const nomeados = partidos.filter(p => p.nome !== 'Não informado'), semNome = partidos.filter(p => p.nome === 'Não informado');
  const [com, resto] = [nomeados.slice(0, cores.length), nomeados.slice(cores.length)];
  const partes = com.map((p, i) => ({ nome: p.nome, v: p.v, cor: cores[i] }));
  const neutros = [...semNome.map(p => ({ nome: p.nome, v: p.v, cor: neutra }))];
  if (resto.length === 1) neutros.push({ nome: resto[0].nome, v: resto[0].v, cor: neutra });
  else if (resto.length) neutros.push({ nome: `Outros (${resto.length})`, v: resto.reduce((s, p) => s + p.v, 0), cor: neutra });
  return [...partes, ...neutros];
}

const folhaDaCamara = a => a.servidores?.orgaos.find(([orgao]) => /c[aâ]mara/i.test(orgao))?.[2] ?? null;
// [{ ano, pago, folha, parcial }] dos anos em que a Câmara teve despesa paga.
export const serieDaCamara = anos => anos.filter(a => a.despesas?.camara?.pago)
  .map(a => ({ ano: a.ano, pago: a.despesas.camara.pago, folha: folhaDaCamara(a), parcial: anoParcial(a) }))
  .sort((x, y) => x.ano.localeCompare(y.ano));
