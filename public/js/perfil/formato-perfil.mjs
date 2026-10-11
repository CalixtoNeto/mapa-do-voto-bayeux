// Formatos dos gráficos do perfil: milhões sem unidade (a unidade vai no subtítulo do cartão) e participação no total.
import { pct } from '../formato.mjs';

export const milhoes = v => {
  if (!v || v < 5000) return '—';
  return (v / 1e6).toLocaleString('pt-BR', { minimumFractionDigits: v >= 1e6 ? 1 : 2, maximumFractionDigits: v >= 1e6 ? 1 : 2 });
};

export const participacao = (parte, total) => total ? pct(parte / total, 1) : '—';
