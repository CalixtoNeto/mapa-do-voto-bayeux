// Um ano da Prefeitura e da Câmara pelos quatro conjuntos do TCE-PB, e o resumo que vai para o site.
import { lerConjuntoDoTce } from '../fontes/tce-pb.mjs';
import { novasDespesas, somarDespesa, resumoDasDespesas, todosOsCredores, arvoresDasDespesas } from './despesas.mjs';
import { alertasDoAno } from './alertas.mjs';
import { novaFolha, somarServidor, resumoDaFolha, remuneracaoDe, arvoreDaFolha } from './folha.mjs';
import { novasReceitas, somarReceita, resumoDasReceitas } from './receitas.mjs';
import { novasLicitacoes, somarProposta, resumoDasLicitacoes, arvoreDasLicitacoes } from './licitacoes.mjs';
import { credoresDasCampanhas } from './cruzamentos.mjs';

const CONJUNTOS = {
  despesas: [novasDespesas, somarDespesa, resumoDasDespesas], servidores: [novaFolha, somarServidor, resumoDaFolha],
  receitas: [novasReceitas, somarReceita, resumoDasReceitas], licitacoes: [novasLicitacoes, somarProposta, resumoDasLicitacoes],
};

// { conjunto: acumulador } só com o que o TCE já publicou para o ano; null se não houver nada.
export async function anoDoMunicipio(ano) {
  const dados = {};
  for (const [conjunto, [novo, somar]] of Object.entries(CONJUNTOS)) {
    const acumulador = novo();
    if (await lerConjuntoDoTce(conjunto, ano, ler => somar(acumulador, ler))) dados[conjunto] = acumulador;
  }
  return Object.keys(dados).length ? dados : null;
}

export function resumoDoAno(ano, dados, { campanhas, prefeito, atualizadoEm }) {
  const resumo = { ano: String(ano), atualizadoEm };
  for (const [conjunto, [, , resumir]] of Object.entries(CONJUNTOS)) resumo[conjunto] = dados[conjunto] ? resumir(dados[conjunto]) : null;
  resumo.campanhas = dados.despesas ? credoresDasCampanhas(todosOsCredores(dados.despesas), campanhas) : [];
  resumo.alertas = dados.despesas ? alertasDoAno(dados.despesas.alertas, String(ano)) : [];
  resumo.prefeito = prefeito && { ...prefeito, remuneracao: dados.servidores ? remuneracaoDe(dados.servidores, prefeito.nome) : [] };
  return resumo;
}

// As árvores de decomposição ficam num arquivo à parte, lido só quando o ano é aberto no site.
export function detalheDoAno(ano, dados) {
  const arvores = {
    ...(dados.despesas ? arvoresDasDespesas(dados.despesas) : {}),
    ...(dados.servidores ? { folha: arvoreDaFolha(dados.servidores) } : {}),
    ...(dados.licitacoes ? { licitacoes: arvoreDasLicitacoes(dados.licitacoes) } : {}),
  };
  return Object.keys(arvores).length ? { ano: String(ano), arvores } : null;
}
