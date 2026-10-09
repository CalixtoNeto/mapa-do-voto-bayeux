// Liga o mandato à eleição. O SAPL e a folha do TCE não trazem o CPF do vereador, e o TCE não diz
// quem doou a campanhas: o nome completo é o único campo em comum, e homônimos são possíveis.
import { normalizarNome } from '../lib/texto.mjs';

// MEI aparece com o CNPJ na frente ("58.909.863 FULANO") e pessoa física às vezes com o CPF no fim.
export const nomeDoCredor = nome => normalizarNome(nome).split(' ').filter(p => !/^\d+$/.test(p)).join(' ');

export function chaveNaEleicao(cands, nomeCompleto, cargos) {
  const alvo = normalizarNome(nomeCompleto);
  const c = cands.find(c => cargos.includes(c.cargo) && normalizarNome(c.nome) === alvo);
  return c ? `${c.cargo}|${c.nr}` : null;
}

// Nomes de uma palavra só ("JOSE") ligariam pessoas diferentes; e campanhas pagam taxas ao próprio município,
// que também é credor dele mesmo (repasses), sem que isso diga nada.
const PODER_PUBLICO = /^(MUNICIPIO|PREFEITURA|CAMARA|FUNDO|INSTITUTO DE PREV|SECRETARIA|ESTADO|GOVERNO|UNIAO|RECEITA FEDERAL|INSS|TRIBUNAL|JUSTICA)\b/;
const ligavel = nome => nome.split(' ').length >= 2 && !PODER_PUBLICO.test(nome);

function ligacoesPorNome(campanhas) {
  const ligacoes = new Map();
  const ligar = (nome, ligacao) => {
    const chave = nomeDoCredor(nome);
    if (!ligavel(chave)) return;
    if (!ligacoes.has(chave)) ligacoes.set(chave, []);
    ligacoes.get(chave).push(ligacao);
  };
  for (const c of campanhas) {
    for (const [nome, valor] of c.doadores) ligar(nome, [c.ano, c.chave, valor, 'doou', c.nome]);
    for (const [nome, valor] of c.fornecedores) ligar(nome, [c.ano, c.chave, valor, 'recebeu', c.nome]);
  }
  return ligacoes;
}

// credores: [[nome, doc, pago, vezes]] → [[nome, pago pela prefeitura, [[ano, candidato, valor, doou|recebeu, nome do candidato]]]]
export function credoresDasCampanhas(credores, campanhas) {
  const ligacoes = ligacoesPorNome(campanhas);
  return credores.map(([nome, , pago]) => [nome, pago, ligacoes.get(nomeDoCredor(nome))])
    .filter(([, , ligado]) => ligado).sort((a, b) => b[1] - a[1]);
}
