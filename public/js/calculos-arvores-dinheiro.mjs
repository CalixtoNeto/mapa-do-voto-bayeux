// Árvores do dinheiro de campanha: gasto do cargo (categoria → fornecedor → candidato), candidato → categoria → fornecedor,
// fundo eleitoral (partido → candidato) e doador ou fornecedor → candidatos. Ramo: [nome, valor, filhos, nota, chave].
import { sentence, nomeDeQuem, pct } from './formato.mjs';
import { linkParaFicha } from './calculos-arvores-votos.mjs';

export const parcelaDe = f => pct(f, f < 0.01 ? 1 : 0);
const soma = ramos => ramos.reduce((s, r) => s + r[1], 0);
const OUTROS = /^Outros \((\d+)\)$/;
const comFilhos = filhos => filhos.length ? filhos : null;

// O arquivo de finanças resume os fornecedores pequenos em "Outros (n)"; ao somar candidatos, os n se somam também.
function nomeDoFornecedor(nome) {
  return OUTROS.test(nome) ? 'Outros fornecedores' : nomeDeQuem(nome);
}

function juntarFornecedores(categorias) {
  const porCategoria = new Map();
  for (const { cand, dc } of categorias) {
    for (const [categoria, v, fornecedores] of dc) {
      const cat = porCategoria.get(categoria) || { v: 0, quem: new Map() };
      cat.v += v; porCategoria.set(categoria, cat);
      for (const [nome, fv] of fornecedores || []) somarFornecedor(cat.quem, nome, fv, cand);
    }
  }
  return porCategoria;
}

function somarFornecedor(quem, nome, v, cand) {
  const chave = nomeDoFornecedor(nome), item = quem.get(chave) || { v: 0, n: 0, cands: new Map() };
  item.v += v; item.n += +(OUTROS.exec(nome)?.[1] || 0);
  item.cands.set(cand, (item.cands.get(cand) || 0) + v);
  quem.set(chave, item);
}

const ramoDoFornecedor = (nome, f, totalDaCategoria) => [f.n ? `${nome} (${f.n})` : nome, f.v,
  comFilhos([...f.cands].map(([cand, v]) => [{ cand }, v, null, `${parcelaDe(v / f.v)} do fornecedor`]).sort((a, b) => b[1] - a[1])), `${parcelaDe(f.v / totalDaCategoria)} da categoria`];

// Os maiores fornecedores da categoria; o resto vira um ramo só, para a lista não ter centenas de linhas.
function fornecedoresDaCategoria(c, limite) {
  const todos = [...c.quem].map(([q, f]) => ramoDoFornecedor(q, f, c.v)).sort((a, b) => b[1] - a[1]), resto = todos.slice(limite);
  if (resto.length) todos.splice(limite, resto.length, [`Demais fornecedores (${resto.length})`, soma(resto), null, `${parcelaDe(soma(resto) / c.v)} da categoria`]);
  return comFilhos(todos);
}

export function arvoreDosGastosDoCargo(cands, financas, chaveDe, { limite = 20 } = {}) {
  const categorias = cands.map(cand => ({ cand, dc: financas?.c?.[chaveDe(cand)]?.dc || [] }));
  const porCategoria = juntarFornecedores(categorias);
  const total = [...porCategoria.values()].reduce((s, c) => s + c.v, 0);
  const filhos = [...porCategoria].map(([nome, c]) => [sentence(nome), c.v, fornecedoresDaCategoria(c, limite), `${parcelaDe(c.v / total)} do gasto`]);
  return { v: total, filhos };
}

const quemRecebeu = nome => /^(Outros \(|Sem fornecedor)/.test(nome) ? sentence(nome) : nomeDeQuem(nome);

// Categorias de um candidato como ramos; porVoto divide os valores pelos votos (custo por voto de cada categoria).
function ramosDoGasto(dc, divisor) {
  const gasto = dc.reduce((s, c) => s + c[1], 0);
  return dc.map(([categoria, v, fornecedores]) => [sentence(categoria), v / divisor,
    comFilhos((fornecedores || []).map(([nome, fv]) => [quemRecebeu(nome), fv / divisor, null, `${parcelaDe(fv / v)} da categoria`])),
    `${parcelaDe(v / gasto)} do gasto`]);
}

// linhas: [{ cand, ... }] já na ordem; valorDe(linha) é o valor do candidato e nota(linha) o que vai ao lado dele.
export function arvoreDosCandidatosPeloDinheiro(linhas, financas, chaveDe, { nomeDe, valorDe, porVoto, nota, ficha }) {
  const filhos = linhas.map(l => {
    const dc = financas?.c?.[chaveDe(l.cand)]?.dc || [], extra = ficha ? [linkParaFicha(l.cand)] : [];
    return [nomeDe(l.cand), valorDe(l), [...ramosDoGasto(dc, porVoto ? l.cand.total || 1 : 1), ...extra], nota(l), l.cand.key];
  });
  return { v: soma(filhos), filhos };
}

const fefcDe = (cand, financas, chaveDe) => financas?.c?.[chaveDe(cand)]?.r?.fefc || 0;

// partidos: saída de cotaPorPartido; partidoDe(cand) precisa dar o mesmo nome que ela usou.
export function arvoreDoFundo(partidos, cands, financas, chaveDe, { nomeDe, nota, partidoDe = c => c.partido || '?' }) {
  const filhos = partidos.filter(p => p.fefc > 0).map(p => {
    const dele = cands.filter(c => partidoDe(c) === p.partido).map(c => ({ cand: c, v: fefcDe(c, financas, chaveDe) })).filter(x => x.v > 0).sort((a, b) => b.v - a.v);
    return [p.partido, p.fefc, dele.map(x => [{ cand: x.cand }, x.v, null, `${parcelaDe(x.v / p.fefc)} do partido`]), nota(p), p.partido];
  });
  return { v: soma(filhos), filhos };
}

// lista: [{ n, v, para: [{ cand, v }] }] (doadores ou fornecedores); de: "do total", "do que ele deu"...
export function arvoreDeParticipantes(lista, { nota, de = 'do total' }) {
  const filhos = lista.filter(i => i.para.length).map(i => [nomeDeQuem(i.n), i.v,
    i.para.map(p => [{ cand: p.cand }, p.v, null, `${parcelaDe(p.v / i.v)} ${de}`]), nota(i)]);
  return { v: soma(filhos), filhos };
}
