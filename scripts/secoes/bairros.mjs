import { normalizarNome } from '../lib/texto.mjs';

// O mesmo bairro aparece com grafias diferentes ("CENTRO", "Centro"). Fica a grafia mais frequente;
// no empate, a que apareceu primeiro. Devolve o nome normalizado → grafia escolhida.
export function grafiasDosBairros(nomes) {
  const contagemPorBairro = new Map();
  for (const nome of nomes.map(n => n.trim())) {
    const bairro = normalizarNome(nome);
    if (!bairro) continue;
    const contagem = contagemPorBairro.get(bairro) || new Map();
    contagem.set(nome, (contagem.get(nome) || 0) + 1);
    contagemPorBairro.set(bairro, contagem);
  }
  return new Map([...contagemPorBairro].map(([bairro, contagem]) => [bairro, maisFrequente(contagem)]));
}

const maisFrequente = contagem => [...contagem].sort((a, b) => b[1] - a[1])[0][0];
