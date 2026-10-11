// Emendas parlamentares destinadas a Bayeux (Portal da Transparência): quem mandou, quanto foi empenhado
// e quanto foi pago (inclusive restos a pagar de anos anteriores), e os convênios com o objeto de cada uma.
import { reais } from '../lib/valores.mjs';
import { somar, ordenado, centavos } from './somas.mjs';
import { novaArvore, somarNaArvore, arvorePodada } from './arvores.mjs';

export const IBGE_BAYEUX = '2501807';
const LOCAL_DO_CONVENIO = /^BAYEUX\s*-\s*PB$/i;

export const novasEmendas = () => ({ autores: {}, anos: {}, funcoes: {}, autorDoCodigo: new Map(), convenios: [],
  recebido: { autores: {}, favorecidos: {}, anos: {}, arvore: novaArvore(), pessoas: new Set() } });

// Muitas emendas (as de saúde, sobretudo) têm a Paraíba como local de aplicação: só o favorecido diz que o dinheiro
// chegou a Bayeux. Empresas daqui que venderam para outras cidades não contam.
const EMPRESA = /sociedade|empres|eireli/i;
// Sem natureza jurídica, o favorecido é pessoa física: entra somado, sem o nome.
const PESSOAS = 'PESSOAS FISICAS';
const ehPessoaFisica = natureza => !natureza || /^sem informa/i.test(natureza);

export function somarFavorecido(acc, ler) {
  if (ler('UF FAVORECIDO') !== 'PB' || !/^BAYEUX$/i.test(ler('MUNICÍPIO FAVORECIDO')) || EMPRESA.test(ler('NATUREZA JURÍDICA'))) return;
  const valor = reais(ler('VALOR RECEBIDO')), r = acc.recebido;
  const autor = (r.autores[ler('NOME DO AUTOR DA EMENDA')] ||= { v: 0, emendas: new Set() });
  autor.v += valor; autor.emendas.add(ler('CÓDIGO DA EMENDA'));
  const pessoa = ehPessoaFisica(ler('NATUREZA JURÍDICA'));
  if (pessoa) r.pessoas.add(ler('FAVORECIDO'));
  const nome = pessoa ? PESSOAS : ler('FAVORECIDO');
  const favorecido = (r.favorecidos[nome] ||= { natureza: pessoa ? 'Pessoa física' : ler('NATUREZA JURÍDICA'), v: 0 });
  favorecido.v += valor;
  somar(r.anos, ler('ANO/MÊS').slice(0, 4), valor);
  somarNaArvore(r.arvore, [ler('NOME DO AUTOR DA EMENDA'), nome, ler('ANO/MÊS').slice(0, 4)], valor);
}

export function somarEmenda(acc, ler) {
  if (ler('CÓDIGO MUNICÍPIO IBGE') !== IBGE_BAYEUX) return;
  const autor = ler('NOME DO AUTOR DA EMENDA'), ano = ler('ANO DA EMENDA');
  const empenhado = reais(ler('VALOR EMPENHADO')), pago = reais(ler('VALOR PAGO')) + reais(ler('VALOR RESTOS A PAGAR PAGOS'));
  acc.autorDoCodigo.set(ler('CÓDIGO DA EMENDA'), autor);
  const a = (acc.autores[autor] ||= { empenhado: 0, pago: 0, n: 0, anos: [] });
  a.empenhado += empenhado; a.pago += pago; a.n++; a.anos.push(ano);
  const porAno = (acc.anos[ano] ||= [0, 0]);
  porAno[0] += empenhado; porAno[1] += pago;
  somar(acc.funcoes, ler('NOME FUNÇÃO'), pago);
}

// O arquivo de convênios vem depois do de emendas no .zip, então o autor de cada código já é conhecido.
export function somarConvenio(acc, ler) {
  if (!LOCAL_DO_CONVENIO.test(ler('LOCALIDADE DO GASTO'))) return;
  const [dia, mes, ano] = ler('DATA PUBLICAÇÃO CONVÊNIO').split('/');
  acc.convenios.push([`${ano}-${mes}-${dia}`, acc.autorDoCodigo.get(ler('CÓDIGO DA EMENDA')) || '',
    ler('OBJETO CONVÊNIO'), reais(ler('VALOR CONVÊNIO')), ler('NOME FUNÇÃO')]);
}

export function resumoDasEmendas(acc) {
  const porAutor = Object.entries(acc.autores).sort((x, y) => y[1].empenhado - x[1].empenhado)
    .map(([autor, a]) => [autor, centavos(a.empenhado), centavos(a.pago), a.n, a.anos.sort()[0], a.anos[a.anos.length - 1]]);
  const porAno = Object.entries(acc.anos).sort().map(([ano, [e, p]]) => [ano, centavos(e), centavos(p)]);
  const convenios = acc.convenios.sort((a, b) => b[0].localeCompare(a[0])).slice(0, 30);
  return { porAutor, porAno, porFuncao: ordenado(acc.funcoes), convenios, recebido: resumoDoRecebido(acc.recebido) };
}

function resumoDoRecebido(r) {
  const rotulo = nome => nome === PESSOAS ? `Pessoas físicas (${r.pessoas.size})` : nome;
  const renomear = ramos => ramos.map(([nome, v, filhos]) => filhos ? [rotulo(nome), v, renomear(filhos)] : [rotulo(nome), v]);
  const porAutor = Object.entries(r.autores).sort((a, b) => b[1].v - a[1].v).map(([autor, a]) => [autor, centavos(a.v), a.emendas.size]);
  const porFavorecido = Object.entries(r.favorecidos).sort((a, b) => b[1].v - a[1].v).map(([nome, f]) => [rotulo(nome), f.natureza, centavos(f.v)]);
  // Árvore autor → quem recebeu → ano, com todos os ramos (sem "Outros").
  return { porAutor, porFavorecido, porAno: Object.entries(r.anos).sort().map(([ano, v]) => [ano, centavos(v)]), arvore: (a => ({ ...a, filhos: renomear(a.filhos) }))(arvorePodada(r.arvore, Infinity)) };
}
