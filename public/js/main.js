// Carrega o contorno da cidade e inicia a aplicação. Os resultados e a tabela de locais de votação
// de cada ano são carregados pelo próprio app, quando a eleição é escolhida.
// É um módulo para importar as análises; app.js continua um script comum, carregado antes.
import * as analises from './analises.mjs';
import * as perfis from './perfil/pagina-perfis.mjs';

const root = document.getElementById('root');
try {
  const geo = await fetch('data/bayeux.geo.json').then(r => { if (!r.ok) throw new Error('contorno'); return r.json(); });
  root.textContent = '';
  startApp(geo, {}, analises, perfis);
} catch (e) {
  root.innerHTML = '<p style="padding:24px;font-family:system-ui">Não foi possível carregar o mapa. Recarregue a página.</p>';
  console.error(e);
}
