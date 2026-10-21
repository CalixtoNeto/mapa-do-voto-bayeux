// Grafos de fluxo dos perfis: Prefeitura (órgão → pago → função) e emendas (autor → favorecido).
import { grafoComMeio, grafoEmPares } from '../calculos-fluxo.mjs';
import { nomeDaFuncao } from './calculos-fatias.mjs';
import { nomeDeQuem } from '../formato.mjs';

const nomeDoOrgao = nome => nome.replace(/ Municipal de .+$/i, '').replace(/ de Bayeux$/i, '');

// a: um ano do perfil; o pago por órgão e por função somam o mesmo total.
export function grafoDaPrefeitura(a) {
  const d = a?.despesas;
  if (!d?.orgaos?.length || !d?.funcoes?.length) return null;
  return grafoComMeio({ origens: d.orgaos.map(o => ({ n: nomeDoOrgao(o[0]), v: o[2] })), meio: 'Pago',
    destinos: d.funcoes.map(f => ({ n: nomeDaFuncao(f[0]), v: f[1] })), limite: 8, rotulo: 'Outras funções', rotuloOrigens: 'Outros órgãos' });
}

// arvore: autor → favorecido → ano, como vem em emendas.json (recebido.arvore).
export function grafoDasEmendas(arvore) {
  const pares = (arvore?.filhos || []).flatMap(([autor, , favorecidos]) => (favorecidos || []).map(([favorecido, v]) => [nomeDeQuem(autor), nomeDeQuem(favorecido), v]));
  const grafo = grafoEmPares({ pares, limiteDe: 8, limitePara: 8 });
  return grafo.fluxos.length ? grafo : null;
}
