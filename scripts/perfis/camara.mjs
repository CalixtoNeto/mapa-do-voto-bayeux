// Monta o perfil de cada vereador da legislatura atual a partir das coleções do SAPL (sem I/O).
import { votosPorVotacao, resumoDosVotos, afinidades } from './votacoes.mjs';
import { tipoDeAutorParlamentar, indiceDeMaterias, materiasDoVereador } from './autorias.mjs';

const legislaturaAtual = (legislaturas, hoje) =>
  legislaturas.find(l => l.data_inicio <= hoje && hoje <= l.data_fim) || [...legislaturas].sort((a, b) => b.numero - a.numero)[0];

// Sessões que de fato aconteceram: as que têm alguém presente (as futuras já ficam cadastradas).
function presencasPorSessao(sessoes, presencas) {
  const presentes = new Map();
  for (const p of presencas) {
    if (!presentes.has(p.sessao_plenaria)) presentes.set(p.sessao_plenaria, new Set());
    presentes.get(p.sessao_plenaria).add(p.parlamentar);
  }
  return sessoes.filter(s => presentes.has(s.id)).map(s => ({ data: s.data_inicio, presentes: presentes.get(s.id) }));
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
  const realizadas = presencasPorSessao(d.sessoes, d.presencas);
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
    inicio: m.data_inicio_mandato, fim: m.data_fim_mandato, emExercicio: m.data_fim_mandato >= hoje && !m.tipo_afastamento,
    presenca: presenca(m, realizadas, hoje), votacoes: resumoDosVotos(p.id, porVotacao),
    afinidade: afinidades(p.id, porVotacao), materias: materiasDoVereador(materias.get(p.id)),
  };
}
