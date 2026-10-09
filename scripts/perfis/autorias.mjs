// Matérias apresentadas por um vereador (SAPL): quantas de cada tipo e as mais recentes.
// No SAPL o autor é um cadastro à parte, ligado ao vereador pelo tipo de conteúdo e pelo id.
const sentenca = s => { s = String(s || '').toLowerCase(); return s.charAt(0).toUpperCase() + s.slice(1); };
const RECENTES = 6;

// O tipo de conteúdo "parlamentar" não tem número fixo entre instalações do SAPL: é o dos autores
// que têm o nome de algum vereador.
export function tipoDeAutorParlamentar(autores, parlamentares) {
  const nomes = new Set(parlamentares.map(p => p.nome_parlamentar));
  const contagem = {};
  for (const a of autores) if (nomes.has(a.nome)) contagem[a.content_type] = (contagem[a.content_type] || 0) + 1;
  return Number(Object.entries(contagem).sort((a, b) => b[1] - a[1])[0]?.[0]);
}

export function indiceDeMaterias({ autores, autorias, materias, tipos }, tipoParlamentar) {
  const autorDoVereador = new Map(autores.filter(a => a.content_type === tipoParlamentar).map(a => [a.id, a.object_id]));
  const materiaPorId = new Map(materias.map(m => [m.id, m]));
  const tipoPorId = new Map(tipos.map(t => [t.id, sentenca(t.descricao)]));
  const porVereador = new Map();
  for (const a of autorias) {
    const vereador = autorDoVereador.get(a.autor), materia = materiaPorId.get(a.materia);
    if (vereador == null || !materia) continue;
    if (!porVereador.has(vereador)) porVereador.set(vereador, []);
    porVereador.get(vereador).push({ ...materia, nomeDoTipo: tipoPorId.get(materia.tipo) || '' });
  }
  return porVereador;
}

export function materiasDoVereador(materias = []) {
  const contagem = {};
  for (const m of materias) contagem[m.nomeDoTipo] = (contagem[m.nomeDoTipo] || 0) + 1;
  const porTipo = Object.entries(contagem).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const recentes = [...materias].sort((a, b) => String(b.data_apresentacao).localeCompare(String(a.data_apresentacao)))
    .slice(0, RECENTES).map(m => [m.id, m.nomeDoTipo, m.numero, m.ano, m.ementa, m.data_apresentacao]);
  return { total: materias.length, porTipo, recentes };
}
