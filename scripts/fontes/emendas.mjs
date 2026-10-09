// Emendas parlamentares do Portal da Transparência (CGU): um só .zip com as emendas de todo o país desde 2014,
// em Windows-1252. Lê a lista de emendas e a de convênios; a de favorecidos (a maior) não é usada.
import { baixar, lerCsvsDoZip } from '../lib/tse.mjs';
import { leitorPorColuna } from './por-coluna.mjs';
import { novasEmendas, somarEmenda, somarConvenio, resumoDasEmendas } from '../perfis/emendas.mjs';
import { PASTA_DOWNLOADS } from '../eleicao/config.mjs';

const URL = 'https://portaldatransparencia.gov.br/download-de-dados/emendas-parlamentares/UNICO';

export async function emendasViaCsv() {
  const zip = `${PASTA_DOWNLOADS}/emendas-parlamentares.zip`;
  if (!await baixar(URL, zip)) return null;
  const acc = novasEmendas();
  await lerCsvsDoZip(zip, [
    { padrao: /^EmendasParlamentares\.csv$/i, aoLinha: leitorPorColuna(ler => somarEmenda(acc, ler)) },
    { padrao: /_Convenios\.csv$/i, aoLinha: leitorPorColuna(ler => somarConvenio(acc, ler)) },
  ]);
  return resumoDasEmendas(acc);
}
