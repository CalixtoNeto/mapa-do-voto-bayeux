// Cálculos das análises do voto, feitos no navegador sobre os JSON já publicados. Sem DOM: os testes os importam.
// O dinheiro de campanha e o perfil dos candidatos estão em calculos-dinheiro.mjs.
// "Lugar" é o município (Paraíba) ou o local de votação/bairro (Bayeux).
import { ehEleito, ehNegro, ehMulher } from './regras.mjs';
export { ehEleito, ehNegro, ehMulher };

// Quantos lugares somam metade dos votos e o "número efetivo" de lugares (inverso do índice de
// Herfindahl): 1 quando todo o voto está num lugar só, N quando está igualmente espalhado por N.
export function concentracao(votosPorLugar) {
  const votos = Object.values(votosPorLugar).filter(v => v > 0).sort((a, b) => b - a);
  const total = votos.reduce((a, b) => a + b, 0);
  if (!total) return { lugares: 0, metade: 0, efetivo: 0 };
  let acumulado = 0, metade = 0;
  while (acumulado * 2 < total) acumulado += votos[metade++];
  const somaDosQuadrados = votos.reduce((soma, v) => soma + (v / total) ** 2, 0);
  return { lugares: votos.length, metade, efetivo: 1 / somaDosQuadrados };
}

export function correlacao(a, b) {
  const n = a.length, media = x => x.reduce((s, v) => s + v, 0) / n;
  const ma = media(a), mb = media(b);
  let cov = 0, va = 0, vb = 0;
  for (let i = 0; i < n; i++) { cov += (a[i] - ma) * (b[i] - mb); va += (a[i] - ma) ** 2; vb += (b[i] - mb) ** 2; }
  return va && vb ? cov / Math.sqrt(va * vb) : 0;
}

// Dobradinhas: candidatos cuja parcela de votos sobe e desce nos mesmos lugares que a do alvo.
// parcela(cand, lugar) é a fração dos votos do cargo do candidato naquele lugar. Quem teve menos de
// `minimo` votos fica de fora: com tão poucos votos, a correlação é ruído.
export function parceirosDeVoto(alvo, candidatos, { lugares, parcela, quantos = 8, minimo = 0 }) {
  const doAlvo = lugares.map(l => parcela(alvo, l));
  return candidatos.filter(c => c.key !== alvo.key && c.total >= minimo)
    .map(cand => ({ cand, r: correlacao(doAlvo, lugares.map(l => parcela(cand, l))) }))
    .sort((a, b) => b.r - a.r).slice(0, quantos);
}

export function vencedores(candidatos, votos) {
  const melhor = {}, porLugar = {};
  for (const cand of candidatos) {
    for (const [lugar, v] of Object.entries(votos(cand))) {
      if (v > 0 && !(melhor[lugar] >= v)) { melhor[lugar] = v; porLugar[lugar] = cand.key; }
    }
  }
  const contagem = {};
  for (const key of Object.values(porLugar)) contagem[key] = (contagem[key] || 0) + 1;
  return { porLugar, contagem: Object.entries(contagem).sort((a, b) => b[1] - a[1]) };
}

export function somaDoComparecimento(porLugar) {
  const s = { aptos: 0, comparecimento: 0, abstencao: 0, brancos: 0, nulos: 0 };
  for (const [aptos, comparecimento, brancos, nulos] of Object.values(porLugar || {})) {
    s.aptos += aptos; s.comparecimento += comparecimento; s.brancos += brancos; s.nulos += nulos;
  }
  s.abstencao = s.aptos - s.comparecimento;
  return s;
}

// Camadas do mapa do panorama: [valor, base] por lugar. A abstenção é medida sobre os aptos;
// brancos e nulos, sobre quem compareceu.
const CAMADAS_DO_COMPARECIMENTO = {
  abstencao: ([aptos, comparecimento]) => [aptos - comparecimento, aptos],
  brancos: ([, comparecimento, brancos]) => [brancos, comparecimento],
  nulos: ([, comparecimento, , nulos]) => [nulos, comparecimento],
};

export function camadaDoComparecimento(camada, porLugar) {
  const medir = CAMADAS_DO_COMPARECIMENTO[camada];
  return Object.fromEntries(Object.entries(porLugar || {}).map(([lugar, numeros]) => [lugar, medir(numeros)]));
}

// Num mapa, só três cores categóricas se distinguem com segurança (inclusive para daltônicos);
// do quarto em diante, todos ficam na cor de "outros" (0).
export function coresDosVencedores(contagem) {
  return Object.fromEntries(contagem.map(([key], i) => [key, i < 3 ? i + 1 : 0]));
}

export * from './calculos-dinheiro.mjs';
export * from './calculos-candidato.mjs';
export * from './calculos-cargo.mjs';
export * from './calculos-lugares.mjs';
