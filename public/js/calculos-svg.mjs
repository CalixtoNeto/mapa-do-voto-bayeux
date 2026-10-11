// Contas dos gráficos desenhados em SVG (sem DOM): treemap, eixos e linhas do tempo, faixas e mapa de calor.
const soma = (lista, f) => lista.reduce((s, x) => s + f(x), 0);

// Treemap em faixas (squarified): cada bloco tem área proporcional ao valor e fica o mais próximo possível de um quadrado.
const pior = (faixa, lado) => {
  const total = soma(faixa, i => i.area), maior = Math.max(...faixa.map(i => i.area)), menor = Math.min(...faixa.map(i => i.area));
  return Math.max(lado * lado * maior / (total * total), total * total / (lado * lado * menor));
};

function tamanhoDaFaixa(itens, lado) {
  let n = 1;
  while (n < itens.length && pior(itens.slice(0, n + 1), lado) <= pior(itens.slice(0, n), lado)) n++;
  return n;
}

function colocarFaixa(faixa, caixa, saida) {
  const total = soma(faixa, i => i.area), deitada = caixa.w >= caixa.h;
  const espessura = total / (deitada ? caixa.h : caixa.w);
  let cursor = deitada ? caixa.y : caixa.x;
  for (const { area, ...item } of faixa) {
    const comprimento = area / espessura;
    saida.push(deitada ? { ...item, x: caixa.x, y: cursor, w: espessura, h: comprimento } : { ...item, x: cursor, y: caixa.y, w: comprimento, h: espessura });
    cursor += comprimento;
  }
  return deitada ? { ...caixa, x: caixa.x + espessura, w: caixa.w - espessura } : { ...caixa, y: caixa.y + espessura, h: caixa.h - espessura };
}

// itens: [{ n, v, ... }]; devolve os mesmos itens, do maior ao menor, com x, y, w e h dentro de largura × altura.
export function treemap(itens, largura, altura) {
  const validos = itens.filter(i => i.v > 0).sort((a, b) => b.v - a.v), total = soma(validos, i => i.v);
  if (!total) return [];
  let restante = validos.map(i => ({ ...i, area: i.v * largura * altura / total })), caixa = { x: 0, y: 0, w: largura, h: altura };
  const saida = [];
  while (restante.length) {
    const n = tamanhoDaFaixa(restante, Math.min(caixa.w, caixa.h));
    caixa = colocarFaixa(restante.slice(0, n), caixa, saida);
    restante = restante.slice(n);
  }
  return saida;
}

// Marcas redondas do eixo, de zero até cobrir o maior valor: 386 → 0, 100, 200, 300, 400.
export function marcasDoEixo(maximo, quantas = 4) {
  if (!(maximo > 0)) return [0, 1];
  const bruto = maximo / quantas, base = 10 ** Math.floor(Math.log10(bruto));
  const passo = [1, 2, 2.5, 5, 10].map(f => f * base).find(p => p >= bruto);
  const marcas = [];
  for (let k = 0; (k - 1) * passo < maximo - 1e-9; k++) marcas.push(Math.round(k * passo * 1e9) / 1e9);
  return marcas;
}

export const escalaLinear = ([d0, d1], [r0, r1]) => v => d1 === d0 ? r0 : r0 + (v - d0) / (d1 - d0) * (r1 - r0);

const ponto = ([x, y]) => `${Math.round(x * 100) / 100},${Math.round(y * 100) / 100}`;

// pontos: [[x, y] | null]; um ponto ausente abre uma quebra na linha.
export function caminhoDaLinha(pontos) {
  let abrir = true, caminho = '';
  for (const p of pontos) {
    if (!p) { abrir = true; continue; }
    caminho += `${abrir ? 'M' : 'L'}${ponto(p)}`; abrir = false;
  }
  return caminho;
}

export function pontosDaArea(pontos, base) {
  if (!pontos.length) return '';
  const [primeiro, ultimo] = [pontos[0], pontos[pontos.length - 1]];
  return `M${ponto([primeiro[0], base])}${pontos.map(p => 'L' + ponto(p)).join('')}L${ponto([ultimo[0], base])}Z`;
}

// Quantos valores caem em cada faixa definida pelos cortes: [10, 50] → 0–9, 10–49, 50+.
export function contarPorFaixa(valores, cortes) {
  const milhar = new Intl.NumberFormat('pt-BR');
  const limites = [0, ...cortes];
  return limites.map((de, i) => {
    const ate = limites[i + 1];
    const rotulo = ate == null ? `${milhar.format(de)}+` : `${milhar.format(de)}–${milhar.format(ate - 1)}`;
    return { rotulo, n: valores.filter(v => v >= de && (ate == null || v < ate)).length };
  });
}

// Classe (0 = mais clara) de um valor entre o menor e o maior da tabela; vazio devolve -1.
export function classeDoCalor(valor, minimo, maximo, classes = 6) {
  if (valor == null) return -1;
  if (maximo <= minimo) return classes - 1;
  return Math.min(classes - 1, Math.floor((valor - minimo) / (maximo - minimo) * classes));
}

// Posições verticais dos rótulos das pontas: o que ficar a menos de `minimo` do rótulo de cima desce até a distância mínima.
export function separarRotulos(ys, minimo = 13) {
  const ordem = ys.map((y, i) => i).sort((a, b) => ys[a] - ys[b]), saida = [...ys];
  ordem.forEach((i, k) => { if (k && ys[i] - saida[ordem[k - 1]] < minimo) saida[i] = saida[ordem[k - 1]] + minimo; });
  return saida;
}
