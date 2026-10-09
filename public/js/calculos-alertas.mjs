// Comportamentos fora da curva numa campanha, comparada com as dos outros candidatos ao mesmo cargo
// na mesma eleição. Não indicam irregularidade: mostram o que destoa e merece um olhar mais atento.
import { resumoFinanceiro, custoPorVoto, mediana } from './calculos-dinheiro.mjs';
import { NORM } from './formato.mjs';

const VEZES = 3, MINIMO_POR_CATEGORIA = 5000, MINIMO_DA_CAMPANHA = 10000, COMPARAVEIS = 5;
const MAIORIA = 0.5, SEM_PAGAR = 0.3, MINIMO_SEM_PAGAR = 5000, CATEGORIAS_MOSTRADAS = 5;

function outrasCampanhas(cand, ctx) {
  const chave = ctx.chaveDe(cand);
  return ctx.cands.filter(c => ctx.chaveDe(c) !== chave).map(c => ({ c, f: ctx.financas?.c?.[ctx.chaveDe(c)] })).filter(o => o.f);
}

// [categoria, valor, mediana de quem também gastou nela, quantos gastaram], as que mais destoam primeiro.
function categorias(f, outras) {
  return (f.dc || []).flatMap(([nome, v]) => {
    const deles = outras.map(o => (o.f.dc || []).find(c => c[0] === nome)?.[1]).filter(x => x > 0);
    if (deles.length < COMPARAVEIS || v < MINIMO_POR_CATEGORIA) return [];
    const m = mediana(deles);
    return v >= VEZES * m ? [['categoria', nome, v, m, deles.length]] : [];
  }).sort((a, b) => b[2] / b[3] - a[2] / a[3]).slice(0, CATEGORIAS_MOSTRADAS);
}

function custo(cand, r, outras) {
  const meu = custoPorVoto(r.gasto, cand.total);
  const deles = outras.map(o => custoPorVoto(resumoFinanceiro(o.f).gasto, o.c.total)).filter(x => x != null);
  if (meu == null || r.gasto < MINIMO_DA_CAMPANHA || deles.length < COMPARAVEIS) return [];
  const m = mediana(deles);
  return meu >= VEZES * m ? [['custo', Math.round(meu * 100) / 100, Math.round(m * 100) / 100]] : [];
}

// Pôr na campanha mais dinheiro próprio do que os bens declarados ao TSE.
const proprios = (r, perfil) => perfil?.b != null && r.proprios >= MINIMO_POR_CATEGORIA && r.proprios > perfil.b ? [['proprios', r.proprios, perfil.b]] : [];

function concentracao(f, r) {
  const [doador, doou] = f.doa?.[0] ? [f.doa[0][0], f.doa[0][2]] : [];
  const [fornecedor, recebeu] = f.fo?.[0] || [];
  return [
    doou && r.recebido >= MINIMO_DA_CAMPANHA && doou / r.recebido >= MAIORIA && ['doador', doador, doou, r.recebido],
    recebeu && r.gasto >= MINIMO_DA_CAMPANHA && recebeu / r.gasto >= MAIORIA && ['fornecedor', fornecedor, recebeu, r.gasto],
  ].filter(Boolean);
}

// A mesma pessoa ou empresa que doou à campanha e recebeu dela.
function doouERecebeu(f) {
  const recebeu = new Map((f.fo || []).map(([nome, v]) => [NORM(nome), v]));
  return (f.doa || []).filter(([nome]) => recebeu.has(NORM(nome))).map(([nome, , v]) => ['doadorFornecedor', nome, v, recebeu.get(NORM(nome))]);
}

function semPagar(f, r) {
  if (f.pg == null || r.gasto < MINIMO_DA_CAMPANHA) return [];
  const divida = r.gasto - f.pg;
  return divida >= MINIMO_SEM_PAGAR && divida / r.gasto >= SEM_PAGAR ? [['naoPago', divida, r.gasto]] : [];
}

export function alertasDaCampanha(cand, ctx) {
  const f = ctx?.financas?.c?.[ctx.chaveDe(cand)];
  if (!f) return [];
  const r = resumoFinanceiro(f), outras = outrasCampanhas(cand, ctx);
  return [...categorias(f, outras), ...custo(cand, r, outras), ...proprios(r, ctx.perfis?.c?.[ctx.chaveDe(cand)]),
    ...concentracao(f, r), ...doouERecebeu(f), ...semPagar(f, r)];
}
