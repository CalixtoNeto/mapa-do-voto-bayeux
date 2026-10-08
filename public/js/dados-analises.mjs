// Carrega os arquivos das análises (gerados por scripts/gerar-analises.mjs) só quando o site precisa deles.
// Um arquivo que não existe vira null: a análise correspondente mostra que o dado não está disponível.
const { useState, useEffect } = window.htmPreact;

const cache = new Map();
const lerJson = url => {
  if (!cache.has(url)) cache.set(url, fetch(url, { cache: 'no-cache' }).then(r => r.ok ? r.json() : null).catch(() => null));
  return cache.get(url);
};

export function usarIndiceDasAnalises(base) {
  const [indice, setIndice] = useState({ anos: {}, patrimonio: {}, dinheiro: {} });
  useEffect(() => {
    Promise.all([lerJson(`${base}/analises.json`), lerJson(`${base}/patrimonio.json`), lerJson(`${base}/dinheiro.json`)])
      .then(([analises, patrimonio, dinheiro]) => setIndice({ anos: analises?.anos || {}, patrimonio: patrimonio || {}, dinheiro: dinheiro || {} }));
  }, [base]);
  return indice;
}

const VAZIO = { financas: null, perfis: null, comparecimento: null, comparecimentoAnterior: null, eleitorado: null, anoAnterior: null };

// O comparecimento de 4 anos antes é o da mesma disputa (o calendário alterna municipais e gerais).
// prepararAno deixa o site carregar o que precisa para ler os lugares daquele ano (em Bayeux, os bairros).
function arquivosDoAno(base, indice, ano, turno) {
  const doAno = indice.anos[ano] || {}, anoAnterior = String(ano - 4), anterior = indice.anos[anoAnterior] || {};
  const ler = (tem, arquivo) => tem ? lerJson(`${base}/${arquivo}`) : null;
  return { anoAnterior, pedidos: [
    ler(doAno.financas, `${ano}-financas.json`), ler(doAno.candidatos, `${ano}-candidatos.json`),
    ler((doAno.comparecimento || []).includes(turno), `${ano}-t${turno}-comparecimento.json`),
    ler((anterior.comparecimento || []).includes(turno), `${anoAnterior}-t${turno}-comparecimento.json`),
    ler(doAno.eleitorado, `${ano}-eleitorado.json`),
  ] };
}

export function usarAnalisesDaEleicao(base, indice, ano, turno, prepararAno = async () => {}) {
  const [dados, setDados] = useState(VAZIO);
  useEffect(() => {
    setDados(VAZIO);
    if (!ano) return;
    let vivo = true;
    const { anoAnterior, pedidos } = arquivosDoAno(base, indice, ano, turno);
    Promise.all([...pedidos, prepararAno(anoAnterior)]).then(([financas, perfis, comparecimento, comparecimentoAnterior, eleitorado]) => {
      if (vivo) setDados({ financas, perfis, comparecimento, comparecimentoAnterior, eleitorado, anoAnterior });
    });
    return () => { vivo = false; };
  }, [base, ano, turno, indice]);
  return dados;
}
