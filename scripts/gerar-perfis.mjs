// Gera os perfis dos políticos de Bayeux em public/data/perfis/:
//   node scripts/gerar-perfis.mjs [ano ...]
// Prefeitura e Câmara pelo TCE-PB (sem anos: do primeiro mandato com prestação de contas no site até o ano atual),
// vereadores pelo SAPL da Câmara e emendas pelo Portal da Transparência. Cada fonte é independente.
import { getJson } from './lib/tse.mjs';
import { dadosDaCamara } from './fontes/sapl.mjs';
import { emendasViaCsv } from './fontes/emendas.mjs';
import { resumoDaCamara } from './perfis/camara.mjs';
import { anoDoMunicipio, resumoDoAno, detalheDoAno } from './perfis/municipio.mjs';
import { remuneracaoDe } from './perfis/folha.mjs';
import { chaveNaEleicao } from './perfis/cruzamentos.mjs';
import { campanhasDaEleicao, eleicaoDoMandato, eleitoNaEleicao, lerDaEleicao, nomesDosCandidatos } from './perfis/campanhas.mjs';
import { escreverPerfil, indexarPerfis } from './saida/perfis.mjs';

const PRIMEIRO_ANO = 2017, ELEICOES_MUNICIPAIS = ['2016', '2020', '2024'];
const CARGOS = { PREFEITO: '11', VEREADOR: '13' };
const agora = new Date(), hoje = agora.toISOString().slice(0, 10), atualizadoEm = agora.toISOString();

async function tentar(descricao, fazer) {
  try { return await fazer(); } catch (e) { console.warn(`  ${descricao} falhou (${e.message})`); return null; }
}

async function campanhasMunicipais() {
  const campanhas = [];
  for (const ano of ELEICOES_MUNICIPAIS) {
    const nomes = nomesDosCandidatos(await lerDaEleicao(ano, 't1'));
    campanhas.push(...campanhasDaEleicao(ano, await lerDaEleicao(ano, 'financas'), Object.values(CARGOS), nomes));
  }
  return campanhas;
}

async function prefeitoDoMandato(ano) {
  const eleicao = eleicaoDoMandato(ano);
  const [t1, perfis] = [await lerDaEleicao(eleicao, 't1'), await lerDaEleicao(eleicao, 'candidatos')];
  return t1 && perfis ? eleitoNaEleicao(t1, perfis, CARGOS.PREFEITO) : null;
}

// Devolve as folhas lidas, para a remuneração dos vereadores.
async function gerarMunicipio(anos) {
  const campanhas = await campanhasMunicipais(), folhas = {};
  for (const ano of anos) {
    console.log(`Prefeitura e Câmara em ${ano}:`);
    const dados = await tentar('TCE-PB', () => anoDoMunicipio(ano));
    if (!dados) { console.log('  nada publicado pelo TCE-PB'); continue; }
    if (dados.servidores) folhas[ano] = dados.servidores;
    await escreverPerfil(`prefeitura-${ano}`, resumoDoAno(ano, dados, { campanhas, prefeito: await prefeitoDoMandato(ano), atualizadoEm }));
    const detalhe = detalheDoAno(ano, dados);
    if (detalhe) await escreverPerfil(`prefeitura-${ano}-detalhe`, detalhe);
  }
  return folhas;
}

async function gerarCamara(folhas) {
  console.log('Câmara Municipal (SAPL):');
  const dados = await tentar('SAPL', () => dadosDaCamara(getJson));
  if (!dados) return;
  const camara = resumoDaCamara(dados, hoje);
  const eleicao = eleicaoDoMandato(Number(camara.legislatura.inicio.slice(0, 4)));
  const t1 = await lerDaEleicao(eleicao, 't1');
  const anosDoMandato = Object.keys(folhas).filter(ano => ano >= camara.legislatura.inicio.slice(0, 4));
  for (const v of camara.vereadores) {
    v.chave = t1 ? chaveNaEleicao(t1.cands, v.completo, [CARGOS.VEREADOR]) : null;
    v.remuneracao = anosDoMandato.flatMap(ano => remuneracaoDe(folhas[ano], v.completo));
  }
  await escreverPerfil('camara', { ...camara, eleicao, atualizadoEm });
}

const anosPedidos = process.argv.slice(2).filter(a => /^\d{4}$/.test(a)).map(Number);
const anoAtual = agora.getFullYear();
const anos = anosPedidos.length ? anosPedidos : Array.from({ length: anoAtual - PRIMEIRO_ANO + 1 }, (_, i) => PRIMEIRO_ANO + i);
await gerarCamara(await gerarMunicipio(anos));
console.log('Emendas parlamentares (Portal da Transparência):');
const emendas = await tentar('Portal da Transparência', emendasViaCsv);
if (emendas) await escreverPerfil('emendas', { ...emendas, atualizadoEm });
await indexarPerfis(atualizadoEm);
