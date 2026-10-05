// Carrega os dados estáticos e inicia a aplicação.
const ANOS_DISPONIVEIS = ['2026', '2024', '2022', '2020', '2018', '2016', '2014', '2012'];
(async () => {
  const root = document.getElementById('root');
  try {
    const get = u => fetch(u).then(r => { if (!r.ok) throw new Error(u); return r.json(); });
    const [geo, ...tabs] = await Promise.all([get('data/bayeux.geo.json'), ...ANOS_DISPONIVEIS.map(a => get(`data/secoes-${a}.json`))]);
    const tabelas = Object.fromEntries(tabs.map(t => [String(t.ano), t]));
    root.textContent = '';
    startApp(geo, tabelas);
  } catch (e) {
    root.innerHTML = '<p style="padding:24px;font-family:system-ui">Não foi possível carregar os dados do mapa. Recarregue a página.</p>';
    console.error(e);
  }
})();
