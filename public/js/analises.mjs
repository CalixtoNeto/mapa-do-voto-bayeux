// Ponto de entrada das análises no site: main.js importa este módulo e o entrega a startApp.
export { usarIndiceDasAnalises, usarAnalisesDaEleicao } from './dados-analises.mjs';
export { criarPainelDoCandidato } from './painel-candidato.mjs';
export { criarPanorama } from './panorama.mjs';
export { vencedores, coresDosVencedores, camadaDoComparecimento, somaDoComparecimento, ehEleito } from './calculos.mjs';
export { linhasFinanceiras } from './calculos.mjs';
export { contextoDasAnalises } from './contexto.mjs';
export { Rosca, Waffle, Haltere, Colunas, Pilha } from './graficos.mjs';
export { Cartao, ComoLer, Aviso } from './cartao.mjs';
export { Cabecalho, Indicadores, Abas, Bloco } from './estrutura.mjs';
export { Treemap } from './treemap.mjs';
export { LinhaDoTempo } from './linha-do-tempo.mjs';
export { MapaDeCalor } from './mapa-de-calor.mjs';
export { BarrasComMeta } from './barras-meta.mjs';
export { ColunasSobrepostas, Pilhas100 } from './colunas-pilhas.mjs';
export { Sparkline } from './sparkline.mjs';
export { Dispersao } from './dispersao.mjs';
