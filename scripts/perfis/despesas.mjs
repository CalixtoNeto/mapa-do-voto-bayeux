// Despesas do município (TCE-PB): quanto cada órgão pagou, em que área, em que mês e a quem.
// A Câmara aparece no mesmo arquivo como um órgão; o resumo dela vai à parte para o perfil dos vereadores.
import { reaisDoTce } from '../fontes/tce-pb.mjs';
import { somar, ordenado, somarRecebedor, recebedoresOrdenados, centavos } from './somas.mjs';
import { ehCompra } from './compras.mjs';
import { novaArvore, somarNaArvore, arvorePodada } from './arvores.mjs';
import { novosAlertas, somarParaAlertas } from './alertas.mjs';
import { origemDaEmenda } from './receitas.mjs';
import { nomeSemDocumento } from '../lib/documento.mjs';

const ehCamara = orgao => /c[aâ]mara/i.test(orgao);
const SEM_LICITACAO = /^sem licita/i;

export const novasDespesas = () => ({
  empenhado: {}, pago: {}, funcoes: {}, meses: {}, credores: {}, compras: 0, semLicitacao: 0, comprasPorElemento: {},
  camara: { pago: 0, compras: 0, semLicitacao: 0, credores: {}, elementos: {}, arvore: novaArvore() },
  arvores: { area: novaArvore(), secretaria: novaArvore(), fonte: novaArvore(), emendas: novaArvore() }, alertas: novosAlertas(),
});

export function somarDespesa(d, ler) {
  const orgao = ler('DESCRICAO_UNIDADE_GESTORA'), pago = reaisDoTce(ler('VALOR_PAGO'));
  const compra = ehCompra(ler('ELEMENTO_DESPESA')) ? pago : 0;
  const semLicitacao = compra && SEM_LICITACAO.test(ler('MODALIDADE_LICITACAO')) ? pago : 0;
  somar(d.empenhado, orgao, reaisDoTce(ler('VALOR_EMPENHADO')));
  somar(d.pago, orgao, pago);
  somar(d.funcoes, ler('FUNCAO'), pago);
  somar(d.meses, ler('MES').slice(0, 2), pago);
  somarRecebedor(d.credores, nomeSemDocumento(ler('NOME_CREDOR')), ler('CPF_CNPJ'), pago);
  d.compras += compra; d.semLicitacao += semLicitacao;
  if (compra) somar(d.comprasPorElemento, ler('ELEMENTO_DESPESA'), compra);
  somarNasArvores(d.arvores, ler, pago);
  somarParaAlertas(d.alertas, ler, pago);
  if (ehCamara(orgao)) somarDaCamara(d.camara, ler, { pago, compra, semLicitacao });
}

function somarDaCamara(camara, ler, { pago, compra, semLicitacao }) {
  camara.pago += pago; camara.compras += compra; camara.semLicitacao += semLicitacao;
  somarRecebedor(camara.credores, nomeSemDocumento(ler('NOME_CREDOR')), ler('CPF_CNPJ'), pago);
  somarNaArvore(camara.arvore, [ler('ELEMENTO_DESPESA'), nomeSemDocumento(ler('NOME_CREDOR'))], pago);
  somar(camara.elementos, ler('ELEMENTO_DESPESA'), pago);
}

// Área → tipo de despesa → fornecedor; secretaria ou fundo → tipo → fornecedor; fonte do dinheiro → área → fornecedor;
// e o dinheiro de emendas, pelo código de controle: origem → área → tipo → fornecedor.
function somarNasArvores(arvores, ler, pago) {
  const credor = nomeSemDocumento(ler('NOME_CREDOR')), elemento = ler('ELEMENTO_DESPESA'), funcao = ler('FUNCAO'), fonte = ler('DESCRICAO_FONTE_RECURSO');
  somarNaArvore(arvores.area, [funcao, elemento, credor], pago);
  somarNaArvore(arvores.secretaria, [ler('DESCRICAO_UNIDADE_ORCAMENTARIA'), elemento, credor], pago);
  somarNaArvore(arvores.fonte, [fonte, funcao, credor], pago);
  const origem = origemDaEmenda(ler('DESCRICAO_CO'), ler('CO'), fonte);
  if (origem) somarNaArvore(arvores.emendas, [origem, funcao, elemento, credor], pago);
}

export const arvoresDasDespesas = d => Object.fromEntries(Object.entries(d.arvores).map(([nome, a]) => [nome, arvorePodada(a)]));

export function resumoDasDespesas(d) {
  const orgaos = ordenado(d.pago).map(([orgao, pago]) => [orgao, centavos(d.empenhado[orgao]), pago]);
  const meses = Object.entries(d.meses).sort().map(([mes, v]) => [mes, centavos(v)]);
  const { camara } = d;
  return {
    orgaos, funcoes: ordenado(d.funcoes), meses, credores: recebedoresOrdenados(d.credores, 40), comprasPorElemento: ordenado(d.comprasPorElemento),
    compras: centavos(d.compras), semLicitacao: centavos(d.semLicitacao),
    camara: { pago: centavos(camara.pago), compras: centavos(camara.compras), semLicitacao: centavos(camara.semLicitacao),
      credores: recebedoresOrdenados(camara.credores, 20), elementos: ordenado(camara.elementos, 12), arvore: arvorePodada(camara.arvore, 30) },
  };
}

// Todos os credores, para cruzar com quem doou ou prestou serviço às campanhas.
export const todosOsCredores = d => recebedoresOrdenados(d.credores, Infinity);
