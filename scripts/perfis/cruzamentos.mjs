// Liga o mandato à eleição pelo nome completo (o SAPL não traz o CPF do vereador; homônimos são possíveis)
// e as campanhas aos credores do município pelo documento.
import { normalizarNome } from '../lib/texto.mjs';
import { documentoParaCruzar, chaveDeCruzamento } from '../lib/documento.mjs';

// MEI aparece com o CNPJ na frente ("58.909.863 FULANO") e pessoa física às vezes com o CPF no fim.
export const nomeDoCredor = nome => normalizarNome(nome).split(' ').filter(p => !/^\d+$/.test(p)).join(' ');

export function chaveNaEleicao(cands, nomeCompleto, cargos) {
  const alvo = normalizarNome(nomeCompleto);
  const c = cands.find(c => cargos.includes(c.cargo) && normalizarNome(c.nome) === alvo);
  return c ? `${c.cargo}|${c.nr}` : null;
}

// Órgãos públicos são credores sem que isso diga nada sobre a campanha (taxas, repasses); bancos, Correios e
// concessionárias de serviço público atendem todo mundo (tarifas, contas de luz e água).
const PODER_PUBLICO = /^(MUNICIPIO|PREFEITURA|CAMARA|FUNDO|INSTITUTO DE PREV|SECRETARIA|ESTADO|GOVERNO|UNIAO|RECEITA FEDERAL|INSS|TRIBUNAL|JUSTICA)\b/;
const SERVICO_DE_TODOS = /\b(BANCO|CAIXA ECONOMICA|CORREIOS|ENERGISA|CAGEPA|COMPANHIA DE AGUA|TELEFONICA|CLARO|TIM S|OI S|CODATA)\b/;
const semSentido = nome => PODER_PUBLICO.test(nome) || SERVICO_DE_TODOS.test(nome);

// Liga pelo documento (lib/documento.mjs): empresa pelo CNPJ; pessoa física pelos dígitos centrais do CPF e o nome
// completo. Sem documento de um dos lados não há ligação: o nome sozinho junta homônimos.
function ligacoesPorDocumento(campanhas) {
  const ligacoes = new Map();
  const ligar = (nome, documento, ligacao) => {
    const chave = chaveDeCruzamento(documento, nomeDoCredor(nome));
    if (!chave || !(ligacao[2] > 0)) return;
    if (!ligacoes.has(chave)) ligacoes.set(chave, []);
    ligacoes.get(chave).push(ligacao);
  };
  for (const c of campanhas) {
    for (const [nome, valor, documento] of c.doadores) ligar(nome, documento, [c.ano, c.chave, valor, 'doou', c.nome]);
    for (const [nome, valor, documento] of c.fornecedores) ligar(nome, documento, [c.ano, c.chave, valor, 'recebeu', c.nome]);
  }
  return ligacoes;
}

// credores: [[nome, doc, pago, vezes]] → [[nome, pago pela prefeitura, [[ano, candidato, valor, doou|recebeu, nome do candidato]]]]
export function credoresDasCampanhas(credores, campanhas) {
  const ligacoes = ligacoesPorDocumento(campanhas);
  return credores.filter(([nome]) => !semSentido(nomeDoCredor(nome)))
    .map(([nome, doc, pago]) => [nome, pago, ligacoes.get(chaveDeCruzamento(documentoParaCruzar(doc), nomeDoCredor(nome)))])
    .filter(([, , ligado]) => ligado).sort((a, b) => b[1] - a[1]);
}
