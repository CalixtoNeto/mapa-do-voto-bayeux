// Os quatro números do topo da Prefeitura: pago, receitas e compras, com e sem licitação.
import { dinheiro, pct } from '../formato.mjs';
import { pagoDoAno, anoParcial, ultimoMesComDado } from './calculos-municipio.mjs';
import { mesAno } from './calculos-perfil.mjs';

export function indicadoresDoAno(a) {
  const d = a.despesas, mes = ultimoMesComDado(a);
  return [
    { rotulo: `Pago em ${a.ano}`, valor: d ? dinheiro(pagoDoAno(a)) : null, nota: anoParcial(a) && mes ? `até ${mesAno(a.ano + String(mes).padStart(2, '0'))}` : 'no ano inteiro' },
    { rotulo: `Receitas em ${a.ano}`, valor: a.receitas?.total ? dinheiro(a.receitas.total) : null, nota: a.receitas?.emendas ? `${dinheiro(a.receitas.emendas)} de emendas` : null },
    { rotulo: 'Compras e serviços', valor: d?.compras ? dinheiro(d.compras) : null, nota: 'pagos no ano' },
    { rotulo: 'Compras sem licitação', valor: d?.compras ? dinheiro(d.semLicitacao) : null, nota: d?.compras ? `${pct(d.semLicitacao / d.compras, 1)} das compras` : null },
  ];
}
