// Acumula o dinheiro de campanha lido da prestação de contas: receitas por origem e por semana, gasto,
// repasses, categorias de despesa, despesas pagas, e quem doou e quem foi pago (com os candidatos de cada um).
// O formato que o site lê está em resumo-financas.mjs.
export { resumoDasFinancas } from './resumo-financas.mjs';

export const novasFinancas = () => ({ candidatos: new Map(), doadores: new Map(), fornecedores: new Map() });

function doCandidato(financas, chave) {
  if (!financas.candidatos.has(chave)) {
    financas.candidatos.set(chave, { r: {}, d: 0, rep: 0, pg: 0, dc: new Map(), rs: new Map() });
  }
  return financas.candidatos.get(chave);
}

const somarEm = (mapa, chave, valor) => mapa.set(chave, (mapa.get(chave) || 0) + valor);

export function somarReceita(financas, chave, { origem, valor, doador, data }) {
  const candidato = doCandidato(financas, chave);
  candidato.r[origem] = (candidato.r[origem] || 0) + valor;
  const semana = segundaFeiraDe(data);
  if (semana) somarEm(candidato.rs, semana, valor);
  if (doador) somarParticipante(financas.doadores, doador, chave, valor);
}

// Doadores e fornecedores: o total e quanto foi para cada candidato. id é o CPF/CNPJ, que não vai ao site.
function somarParticipante(participantes, { id, nome, tipo }, chave, valor) {
  if (!participantes.has(id)) participantes.set(id, { n: nome, t: tipo, v: 0, c: new Map() });
  const participante = participantes.get(id);
  participante.v += valor;
  somarEm(participante.c, chave, valor);
}

export function somarDespesa(financas, chave, { categoria, valor, repasse, fornecedor }) {
  const candidato = doCandidato(financas, chave);
  if (repasse) { candidato.rep += valor; return; }
  candidato.d += valor;
  somarEm(candidato.dc, categoria, valor);
  if (fornecedor) somarParticipante(financas.fornecedores, fornecedor, chave, valor);
}

export function somarDespesaPaga(financas, chave, valor) {
  doCandidato(financas, chave).pg += valor;
}

// O TSE escreve as datas como dd/mm/aaaa; a semana começa na segunda-feira, como no calendário eleitoral.
function segundaFeiraDe(data) {
  const [dia, mes, ano] = String(data || '').split('/').map(Number);
  if (!dia || !mes || !ano) return null;
  const quando = new Date(Date.UTC(ano, mes - 1, dia));
  quando.setUTCDate(quando.getUTCDate() - ((quando.getUTCDay() + 6) % 7));
  return quando.toISOString().slice(0, 10);
}
