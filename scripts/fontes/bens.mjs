// Bens declarados pelos candidatos (TSE, bem_candidato). O arquivo não traz cargo nem número:
// os bens chegam ao candidato pelo sequencial (SQ_CANDIDATO) do cadastro.
import { CDN, baixar, lerCsvsDoZip } from '../lib/tse.mjs';
import { porRegistro, campo } from '../lib/csv.mjs';
import { reais } from '../lib/valores.mjs';
import { arquivosDaEleicao } from '../analises/escopo.mjs';
import { PASTA_DOWNLOADS } from '../eleicao/config.mjs';

// cargoDoSequencial: sequencial → cargo, dos candidatos do site. Devolve sequencial → total declarado.
export async function bensViaCsv(ano, cargoDoSequencial) {
  try {
    const zip = `${PASTA_DOWNLOADS}/bem-candidato-${ano}.zip`;
    if (!await baixar(`${CDN}/bem_candidato/bem_candidato_${ano}.zip`, zip)) return null;
    const bens = new Map();
    const alvos = arquivosDaEleicao('bem_candidato', ano).map(({ padrao, cargoAceito }) => ({ padrao,
      aoLinha: leitorDeBens({ ano, bens, sequencialAceito: sq => cargoAceito(cargoDoSequencial.get(sq) ?? '') }) }));
    await lerCsvsDoZip(zip, alvos);
    return bens;
  } catch (e) { console.warn(`  bens declarados indisponíveis (${e.message})`); return null; }
}

export function leitorDeBens({ ano, bens, sequencialAceito = () => true }) {
  return porRegistro({
    aoRegistro: (campos, colunas) => {
      const sq = campo(campos, colunas, 'SQ_CANDIDATO'), anoDoBem = campo(campos, colunas, 'ANO_ELEICAO');
      if ((anoDoBem && anoDoBem !== ano) || !sequencialAceito(sq)) return;
      bens.set(sq, (bens.get(sq) || 0) + reais(campo(campos, colunas, 'VR_BEM_CANDIDATO')));
    },
  });
}
