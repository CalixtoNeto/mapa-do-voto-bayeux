// Carrega os perfis (data/perfis/) uma vez por visita: índice, Câmara, emendas e todos os anos da Prefeitura.
// O endereço da página fica no hash (#perfis, #perfil/prefeitura, #perfil/nome-do-vereador) para ser compartilhado.
const { useState, useEffect } = window.htmPreact;
const BASE = 'data/perfis';

const lerJson = url => fetch(url, { cache: 'no-cache' }).then(r => r.ok ? r.json() : null).catch(() => null);
let carregamento = null;

async function carregar() {
  const indice = await lerJson(`${BASE}/index.json`);
  if (!indice) return { vazio: true };
  const [camara, emendas, ...anos] = await Promise.all([
    indice.camara ? lerJson(`${BASE}/camara.json`) : null, indice.emendas ? lerJson(`${BASE}/emendas.json`) : null,
    ...indice.anos.map(ano => lerJson(`${BASE}/prefeitura-${ano}.json`))]);
  return { indice, camara, emendas, anos: anos.filter(Boolean) };
}

export function usarPerfis() {
  const [dados, setDados] = useState(null);
  useEffect(() => { (carregamento ||= carregar()).then(setDados); }, []);
  return dados;
}

const rotaAtual = () => decodeURIComponent(location.hash.replace(/^#\/?/, ''));
export const ehRotaDePerfil = () => /^perf(is|il\/)/.test(rotaAtual());

export function usarRota() {
  const [rota, setRota] = useState(rotaAtual());
  useEffect(() => {
    const aoMudar = () => { setRota(rotaAtual()); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', aoMudar);
    return () => window.removeEventListener('hashchange', aoMudar);
  }, []);
  return rota;
}
