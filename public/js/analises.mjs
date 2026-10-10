// Ponto de entrada das análises no site: main.js importa este módulo e o entrega a startApp.
export { usarIndiceDasAnalises, usarAnalisesDaEleicao } from './dados-analises.mjs';
export { criarPainelDoCandidato } from './painel-candidato.mjs';
export { criarPanorama } from './panorama.mjs';
export { vencedores, coresDosVencedores, camadaDoComparecimento, somaDoComparecimento, ehEleito } from './calculos.mjs';
export { linhasFinanceiras } from './calculos.mjs';
export { contextoDasAnalises } from './contexto.mjs';
export { Rosca, Waffle, Haltere, Colunas, Pilha } from './graficos.mjs';
