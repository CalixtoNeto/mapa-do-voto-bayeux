// Página Dinheiro do panorama: de onde veio e para onde foi, o dinheiro elege?, campanhas do cargo majoritário e quem financiou.
import { linhasFinanceiras, ehEleito } from './calculos.mjs';
import { Aviso } from './cartao.mjs';
import { Bloco } from './estrutura.mjs';
import { DeOndeVeioEParaOndeFoi } from './panorama-receitas.mjs';
import { DinheiroElege } from './panorama-elege.mjs';
import { CampanhasDoMajoritario } from './panorama-campanhas.mjs';
import { RankingFinanceiro } from './panorama-ranking-financeiro.mjs';
import { FundoPorPartido } from './panorama-partidos.mjs';
import { ConcentracaoDoFundo } from './panorama-concentracao.mjs';
import { Doadores, FornecedoresDoCargo } from './panorama-financiadores.mjs';
const { html, useMemo } = window.htmPreact;

const semDados = ano => +ano < 2018 ? 'O TSE publica a prestação de contas dos candidatos neste formato a partir de 2018.' : 'A prestação de contas desta eleição ainda não foi gerada para o site.';
const Vazio = ({ texto }) => html`<${Bloco} id="b-sem-dinheiro" titulo="Dinheiro de campanha"><${Aviso}>${texto}<//><//>`;

export function criarDinheiro(cfg) {
  return function Dinheiro({ cands, ano, financas, perfis, selecionado, onPick, ctx }) {
    const eleito = ctx?.eleito || (c => ehEleito(c.sit || perfis?.c?.[cfg.chaveDe(c)]?.s));
    const linhas = useMemo(() => financas ? linhasFinanceiras(cands, financas, cfg.chaveDe) : [], [cands, financas]);
    const fora = cands[0] ? cfg.foraDasFinancas(cands[0]) : '';
    if (fora) return html`<${Vazio} texto=${fora} />`;
    if (!financas || !Object.keys(financas.c || {}).length) return html`<${Vazio} texto=${semDados(ano)} />`;
    const painel = ctx || { cands, eleito, perfis, chaveDe: cfg.chaveDe };
    return html`${!financas.final && html`<${Aviso}>Prestação de contas parcial: a final é entregue até 30 dias depois da eleição e os números ainda vão mudar.<//>`}
      <${DeOndeVeioEParaOndeFoi} cands=${cands} financas=${financas} chaveDe=${cfg.chaveDe} onPick=${onPick} />
      ${cfg.ehMajoritario(cands[0]) && html`<${CampanhasDoMajoritario} cands=${cands} financas=${financas} linhas=${linhas} chaveDe=${cfg.chaveDe} local=${cfg.regiao} onPick=${onPick} />`}
      <${DinheiroElege} linhas=${linhas} ctx=${painel} selecionado=${selecionado} onPick=${onPick} />
      <${Bloco} id="b-quem-pagou" titulo="Quem financiou e quem recebeu" colunas="metade"
          lede="Fundo eleitoral por partido, concentração, maiores doadores e maiores fornecedores do cargo.">
        ${perfis && html`<${FundoPorPartido} cfg=${cfg} cands=${cands} financas=${financas} perfis=${perfis} onPick=${onPick} />`}
        <${ConcentracaoDoFundo} linhas=${linhas} ctx=${painel} />
        <${Doadores} cfg=${cfg} cands=${cands} financas=${financas} onPick=${onPick} />
        <${FornecedoresDoCargo} cfg=${cfg} cands=${cands} financas=${financas} onPick=${onPick} /><//>
      <${Bloco} id="b-candidato-a-candidato" titulo="Candidato por candidato">
        <${RankingFinanceiro} cfg=${cfg} linhas=${linhas} financas=${financas} selecionado=${selecionado} onPick=${onPick} /><//>`;
  };
}
