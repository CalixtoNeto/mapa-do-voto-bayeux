// Carrega os arquivos das análises (gerados por scripts/gerar-analises.mjs) só quando o site precisa deles.
// Um arquivo que não existe vira null: a análise correspondente mostra que o dado não está disponível.
const { useState, useEffect } = window.htmPreact;

const cache = new Map();
const lerJson = url => {
  if (!cache.has(url)) cache.set(url, fetch(url, { cache: 'no-cache' }).then(r => r.ok ? r.json() : null).catch(() => null));
  return cache.get(url);
};

export function usarIndiceDasAnalises(base) {
  const [indice, setIndice] = useState({ anos: {}, patrimonio: {} });
  useEffect(() => {
    Promise.all([lerJson(`${base}/analises.json`), lerJson(`${base}/patrimonio.json`)])
      .then(([analises, patrimonio]) => setIndice({ anos: analises?.anos || {}, patrimonio: patrimonio || {} }));
  }, [base]);
  return indice;
}

const VAZIO = { financas: null, perfis: null, comparecimento: null };

export function usarAnalisesDaEleicao(base, indice, ano, turno) {
  const [dados, setDados] = useState(VAZIO);
  const doAno = (ano && indice.anos[ano]) || {};
  const temComparecimento = (doAno.comparecimento || []).includes(turno);
  useEffect(() => {
    setDados(VAZIO);
    if (!ano) return;
    let vivo = true;
    Promise.all([
      doAno.financas ? lerJson(`${base}/${ano}-financas.json`) : null,
      doAno.candidatos ? lerJson(`${base}/${ano}-candidatos.json`) : null,
      temComparecimento ? lerJson(`${base}/${ano}-t${turno}-comparecimento.json`) : null,
    ]).then(([financas, perfis, comparecimento]) => { if (vivo) setDados({ financas, perfis, comparecimento }); });
    return () => { vivo = false; };
  }, [base, ano, turno, !!doAno.financas, !!doAno.candidatos, temComparecimento]);
  return dados;
}
