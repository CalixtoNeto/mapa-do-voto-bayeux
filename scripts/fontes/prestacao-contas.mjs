// Prestação de contas dos candidatos (Dados Abertos do TSE): receitas e despesas contratadas.
// O mesmo .zip traz um arquivo por UF; só o da UF interessa. Existe de 2018 em diante neste formato.
import { CDN, baixar, lerCsvsDoZip } from '../lib/tse.mjs';
import { porRegistro, campo } from '../lib/csv.mjs';
import { reais } from '../lib/valores.mjs';
import { informado } from '../lib/texto.mjs';
import { origemDaReceita, ehRepasse } from '../analises/receitas.mjs';
import { novasFinancas, somarReceita, somarDespesa, somarDespesaPaga } from '../analises/financas.mjs';
import { identificacao, ehDoAno } from '../analises/identificacao.mjs';
import { candidatoDasFinancas, chaveDoCandidato } from '../analises/escopo.mjs';
import { UF, PASTA_DOWNLOADS } from '../eleicao/config.mjs';

export async function financasViaCsv(ano) {
  const zip = `${PASTA_DOWNLOADS}/prestacao-contas-${ano}.zip`;
  if (!await baixar(`${CDN}/prestacao_contas/prestacao_de_contas_eleitorais_candidatos_${ano}.zip`, zip)) return null;
  const financas = novasFinancas();
  const [temReceitas] = await lerCsvsDoZip(zip, [
    { padrao: new RegExp(`^receitas_candidatos_${ano}_${UF}\\.csv$`, 'i'), aoLinha: leitorDeReceitas({ ano, financas }) },
    { padrao: new RegExp(`^despesas_contratadas_candidatos_${ano}_${UF}\\.csv$`, 'i'), aoLinha: leitorDeDespesas({ ano, financas }) },
    { padrao: new RegExp(`^despesas_pagas_candidatos_${ano}_${UF}\\.csv$`, 'i'), aoLinha: leitorDeDespesasPagas({ ano, financas }) },
  ]);
  if (!temReceitas) throw new Error(`o .zip não tem receitas_candidatos_${ano}_${UF}.csv`);
  return financas;
}

function leitorDoCandidato(ano, aoCandidato) {
  return porRegistro({
    aoRegistro: (campos, colunas) => {
      const candidato = identificacao(campos, colunas);
      if (ehDoAno(candidato, ano) && candidatoDasFinancas(candidato)) aoCandidato(chaveDoCandidato(candidato), campos, colunas);
    },
  });
}

export function leitorDeReceitas({ ano, financas }) {
  return leitorDoCandidato(ano, (chave, campos, colunas) => {
    const valor = nome => campo(campos, colunas, nome);
    const origem = origemDaReceita(valor('DS_FONTE_RECEITA'), valor('DS_ORIGEM_RECEITA'));
    const doador = origem === 'pf' || origem === 'pj' ? doadorDaReceita(valor, origem) : null;
    somarReceita(financas, chave, { origem, valor: reais(valor('VR_RECEITA')), doador, data: valor('DT_RECEITA') });
  });
}

// O nome registrado na Receita Federal é o mais confiável; o CPF/CNPJ só serve para juntar as doações.
function doadorDaReceita(valor, tipo) {
  const nome = informado(valor('NM_DOADOR_RFB')) || informado(valor('NM_DOADOR'));
  return { id: informado(valor('NR_CPF_CNPJ_DOADOR')) || nome, nome, tipo };
}

export function leitorDeDespesas({ ano, financas }) {
  return leitorDoCandidato(ano, (chave, campos, colunas) => {
    const valor = nome => campo(campos, colunas, nome);
    const categoria = informado(valor('DS_ORIGEM_DESPESA')) || 'Outras';
    somarDespesa(financas, chave, {
      categoria, valor: reais(valor('VR_DESPESA_CONTRATADA')), repasse: ehRepasse(categoria), fornecedor: fornecedorDaDespesa(valor),
    });
  });
}

function fornecedorDaDespesa(valor) {
  const nome = informado(valor('NM_FORNECEDOR_RFB')) || informado(valor('NM_FORNECEDOR'));
  return nome ? { id: informado(valor('NR_CPF_CNPJ_FORNECEDOR')) || nome, nome } : null;
}

// Despesa contratada e não paga até a prestação de contas vira dívida de campanha.
export function leitorDeDespesasPagas({ ano, financas }) {
  return leitorDoCandidato(ano, (chave, campos, colunas) => {
    if (ehRepasse(campo(campos, colunas, 'DS_ORIGEM_DESPESA'))) return;
    somarDespesaPaga(financas, chave, reais(campo(campos, colunas, 'VR_PAGTO_DESPESA')));
  });
}
