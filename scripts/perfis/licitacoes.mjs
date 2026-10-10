// Licitações do município (TCE-PB): uma linha por proposta. Conta as licitações por modalidade
// e soma o valor das propostas vencedoras.
import { reaisDoTce } from '../fontes/tce-pb.mjs';
import { somarRecebedor, recebedoresOrdenados, centavos } from './somas.mjs';
import { novaArvore, somarNaArvore, arvorePodada } from './arvores.mjs';
import { nomeSemDocumento } from '../lib/documento.mjs';

export const novasLicitacoes = () => ({ modalidades: {}, vencedores: {}, arvore: novaArvore() });

// "Pregão (Lei Nº 14.133/2021)" → "Pregão": a lei só diz sob qual regra foi feita.
const nomeDaModalidade = texto => texto.replace(/\s*\(.*\)\s*$/, '') || 'Não informada';

export function somarProposta(l, ler) {
  const m = (l.modalidades[nomeDaModalidade(ler('MODALIDADE'))] ||= { licitacoes: new Set(), v: 0 });
  m.licitacoes.add(`${ler('DESCRICAO_UNIDADE_GESTORA')}|${ler('NUMERO_LICITACAO')}`);
  if (!/^vencedora/i.test(ler('SITUACAO_PROPOSTA'))) return;
  const valor = reaisDoTce(ler('VALOR_OFERTADO'));
  m.v += valor;
  somarNaArvore(l.arvore, [nomeDaModalidade(ler('MODALIDADE')), nomeSemDocumento(ler('NOME_PROPONENTE'))], valor);
  somarRecebedor(l.vencedores, nomeSemDocumento(ler('NOME_PROPONENTE')), ler('CPF_CNPJ_PROPONENTE'), valor);
}

export function resumoDasLicitacoes(l) {
  const modalidades = Object.entries(l.modalidades)
    .map(([nome, m]) => [nome, m.licitacoes.size, centavos(m.v)]).sort((a, b) => b[2] - a[2]);
  return { modalidades, vencedores: recebedoresOrdenados(l.vencedores, 20) };
}

// Árvore do valor das propostas vencedoras: modalidade → vencedor.
export const arvoreDasLicitacoes = l => arvorePodada(l.arvore);
