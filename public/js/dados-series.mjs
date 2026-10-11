// Ganchos das séries de várias eleições. undefined enquanto carrega; null quando os arquivos não existem.
import { carregarComparecimentos, carregarColocados, carregarEleitoradoPorLugar } from './series-carregar.mjs';
const { useState, useEffect } = window.htmPreact;

const cache = new Map();
const unica = (chave, carregar) => {
  if (!cache.has(chave)) cache.set(chave, carregar().catch(() => null));
  return cache.get(chave);
};

function usarSerie(chave, carregar) {
  const [dados, setDados] = useState(undefined);
  useEffect(() => {
    let vivo = true;
    unica(chave, carregar).then(d => { if (vivo) setDados(d); });
    return () => { vivo = false; };
  }, [chave]);
  return dados;
}

export const usarComparecimentos = cfg => usarSerie('comparecimento', () => carregarComparecimentos(cfg));
export const usarColocados = cfg => usarSerie('colocados', () => carregarColocados(cfg));
export const usarEleitoradoPorLugar = cfg => usarSerie('eleitorado', () => carregarEleitoradoPorLugar(cfg));
