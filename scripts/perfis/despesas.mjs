// Despesas do município (TCE-PB): quanto cada órgão pagou, em que área, em que mês e a quem.
// A Câmara aparece no mesmo arquivo como um órgão; o resumo dela vai à parte para o perfil dos vereadores.
import { reaisDoTce } from '../fontes/tce-pb.mjs';
import { somar, ordenado, somarRecebedor, recebedoresOrdenados, centavos } from './somas.mjs';

const ehCamara = orgao => /c[aâ]mara/i.test(orgao);
const SEM_LICITACAO = /^sem licita/i;

export const novasDespesas = () => ({
  empenhado: {}, pago: {}, funcoes: {}, meses: {}, credores: {}, semLicitacao: 0,
  camara: { pago: 0, semLicitacao: 0, credores: {}, elementos: {} },
});

export function somarDespesa(d, ler) {
  const orgao = ler('DESCRICAO_UNIDADE_GESTORA'), pago = reaisDoTce(ler('VALOR_PAGO'));
  const semLicitacao = SEM_LICITACAO.test(ler('MODALIDADE_LICITACAO')) ? pago : 0;
  somar(d.empenhado, orgao, reaisDoTce(ler('VALOR_EMPENHADO')));
  somar(d.pago, orgao, pago);
  somar(d.funcoes, ler('FUNCAO'), pago);
  somar(d.meses, ler('MES').slice(0, 2), pago);
  somarRecebedor(d.credores, ler('NOME_CREDOR'), ler('CPF_CNPJ'), pago);
  d.semLicitacao += semLicitacao;
  if (ehCamara(orgao)) somarDaCamara(d.camara, ler, pago, semLicitacao);
}

function somarDaCamara(camara, ler, pago, semLicitacao) {
  camara.pago += pago;
  camara.semLicitacao += semLicitacao;
  somarRecebedor(camara.credores, ler('NOME_CREDOR'), ler('CPF_CNPJ'), pago);
  somar(camara.elementos, ler('ELEMENTO_DESPESA'), pago);
}

export function resumoDasDespesas(d) {
  const orgaos = ordenado(d.pago).map(([orgao, pago]) => [orgao, centavos(d.empenhado[orgao]), pago]);
  const meses = Object.entries(d.meses).sort().map(([mes, v]) => [mes, centavos(v)]);
  const { camara } = d;
  return {
    orgaos, funcoes: ordenado(d.funcoes), meses, credores: recebedoresOrdenados(d.credores, 40),
    semLicitacao: centavos(d.semLicitacao),
    camara: { pago: centavos(camara.pago), semLicitacao: centavos(camara.semLicitacao),
      credores: recebedoresOrdenados(camara.credores, 20), elementos: ordenado(camara.elementos, 12) },
  };
}

// Todos os credores, para cruzar com quem doou ou prestou serviço às campanhas.
export const todosOsCredores = d => recebedoresOrdenados(d.credores, Infinity);
