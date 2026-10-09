// API do SAPL (sistema legislativo do Interlegis) da Câmara Municipal de Bayeux: vereadores, mandatos,
// partidos, sessões, presença, votos nominais e matérias. Coleções paginadas, lidas inteiras.
export const SAPL = 'https://sapl.bayeux.pb.leg.br/api';

const COLECOES = {
  legislaturas: 'parlamentares/legislatura', parlamentares: 'parlamentares/parlamentar', mandatos: 'parlamentares/mandato',
  partidos: 'parlamentares/partido', filiacoes: 'parlamentares/filiacao', sessoes: 'sessao/sessaoplenaria',
  presencas: 'sessao/sessaoplenariapresenca', votos: 'sessao/votoparlamentar', autores: 'base/autor',
  autorias: 'materia/autoria', materias: 'materia/materialegislativa', tipos: 'materia/tipomaterialegislativa',
};

export async function lerColecao(buscarJson, caminho) {
  const itens = [];
  for (let pagina = 1; ; pagina++) {
    const resposta = await buscarJson(`${SAPL}/${caminho}/?page=${pagina}&page_size=100`);
    if (!resposta) return itens;
    itens.push(...resposta.results);
    if (!resposta.pagination?.next_page) return itens;
  }
}

// Uma coleção por vez, para não sobrecarregar o servidor da Câmara.
export async function dadosDaCamara(buscarJson) {
  const dados = {};
  for (const [nome, caminho] of Object.entries(COLECOES)) dados[nome] = await lerColecao(buscarJson, caminho);
  return dados;
}
