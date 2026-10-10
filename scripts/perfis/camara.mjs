// Monta o perfil de cada vereador da legislatura atual a partir das coleções do SAPL (sem I/O).
import { votosPorVotacao, resumoDosVotos, afinidades } from './votacoes.mjs';
import { tipoDeAutorParlamentar, indiceDeMaterias, materiasDoVereador } from './autorias.mjs';

const legislaturaAtual = (legislaturas, hoje) =>
  legislaturas.find(l => l.data_inicio <= hoje && hoje <= l.data_fim) || [...legislaturas].sort((a, b) => b.numero - a.numero)[0];

// Sessões que de fato aconteceram: as que têm alguém presente (as futuras já ficam cadastradas). O registro de
// presença do SAPL às vezes falha (na Assembleia, o presidente quase nunca aparece): quem votou Sim, Não ou
// Abstenção numa sessão do mesmo dia também conta como presente.
const VOTOU = /^(sim|n[aã]o|absten[cç][aã]o)$/i;
function presencasPorSessao(sessoes, presencas, votos = []) {
  const presentes = new Map();
  const marcar = (sessao, parlamentar) => {
    if (!presentes.has(sessao)) presentes.set(sessao, new Set());
    presentes.get(sessao).add(parlamentar);
  };
  for (const p of presencas) marcar(p.sessao_plenaria, p.parlamentar);
  const sessoesDoDia = new Map();
  for (const s of sessoes) sessoesDoDia.set(s.data_inicio, [...(sessoesDoDia.get(s.data_inicio) || []), s.id]);
  for (const v of votos) {
    if (!VOTOU.test(String(v.voto || '').trim())) continue;
    for (const sessao of sessoesDoDia.get(String(v.data_hora || '').slice(0, 10)) || []) marcar(sessao, v.parlamentar);
  }
  return sessoes.filter(s => presentes.has(s.id)).map(s => ({ data: s.data_inicio, presentes: presentes.get(s.id) }));
}

// No SAPL o afastamento (licença, secretaria) continua registrado no mandato depois que o vereador volta;
// quem esteve em alguma das últimas sessões está em exercício.
const ULTIMAS_SESSOES = 5;
function emExercicio(mandato, realizadas, hoje) {
  if (mandato.data_fim_mandato < hoje) return false;
  if (!mandato.tipo_afastamento) return true;
  const ultimas = realizadas.filter(s => s.data <= hoje).sort((a, b) => a.data.localeCompare(b.data)).slice(-ULTIMAS_SESSOES);
  return ultimas.some(s => s.presentes.has(mandato.parlamentar));
}

function presenca(mandato, realizadas, hoje) {
  const fim = mandato.data_fim_mandato < hoje ? mandato.data_fim_mandato : hoje;
  const doMandato = realizadas.filter(s => s.data >= mandato.data_inicio_mandato && s.data <= fim);
  return [doMandato.filter(s => s.presentes.has(mandato.parlamentar)).length, doMandato.length];
}

function partidosDe(id, { filiacoes, partidos }) {
  const sigla = new Map(partidos.map(p => [p.id, p.sigla]));
  return filiacoes.filter(f => f.parlamentar === id).sort((a, b) => a.data.localeCompare(b.data))
    .map(f => [sigla.get(f.partido) || '?', f.data, f.data_desfiliacao || null]);
}

export function resumoDaCamara(d, hoje) {
  const leg = legislaturaAtual(d.legislaturas, hoje);
  const realizadas = presencasPorSessao(d.sessoes, d.presencas, d.votos);
  const porVotacao = votosPorVotacao(d.votos);
  const materias = indiceDeMaterias(d, tipoDeAutorParlamentar(d.autores, d.parlamentares));
  const parlamentar = new Map(d.parlamentares.map(p => [p.id, p]));
  const vereadores = d.mandatos.filter(m => m.legislatura === leg.id && parlamentar.has(m.parlamentar))
    .map(m => vereador(m, parlamentar.get(m.parlamentar), { d, realizadas, porVotacao, materias, hoje }));
  return { legislatura: { numero: leg.numero, inicio: leg.data_inicio, fim: leg.data_fim },
    sessoes: realizadas.length, votacoesNominais: porVotacao.size, vereadores };
}

function vereador(m, p, { d, realizadas, porVotacao, materias, hoje }) {
  const partidos = partidosDe(p.id, d);
  const atual = partidos.find(([, , ate]) => !ate);
  return {
    id: p.id, nome: p.nome_parlamentar, completo: p.nome_completo, foto: p.fotografia || null,
    partido: atual ? atual[0] : null, partidos, eleicao: m.votos_recebidos ?? null, titular: !!m.titular,
    inicio: m.data_inicio_mandato, fim: m.data_fim_mandato, emExercicio: emExercicio(m, realizadas, hoje),
    presenca: presenca(m, realizadas, hoje), votacoes: resumoDosVotos(p.id, porVotacao),
    afinidade: afinidades(p.id, porVotacao), materias: materiasDoVereador(materias.get(p.id)),
  };
}
