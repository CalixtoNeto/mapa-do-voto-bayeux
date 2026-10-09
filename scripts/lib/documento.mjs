// Documento usado para cruzar bases (TSE × TCE-PB) sem publicar CPF: CNPJ inteiro e, do CPF, só os 6 dígitos
// centrais, o mesmo trecho que o próprio TCE-PB deixa visível ("***.406.724-**").
import { normalizarNome, informado } from './texto.mjs';

export function documentoParaCruzar(doc) {
  const texto = informado(doc);
  const mascarado = texto.match(/^\*{3}\.?(\d{3})\.?(\d{3})-?\*{2}$/);
  if (mascarado) return `cpf:${mascarado[1]}${mascarado[2]}`;
  const digitos = texto.replace(/\D/g, '');
  if (digitos.length === 14) return `cnpj:${digitos}`;
  if (digitos.length === 11) return `cpf:${digitos.slice(3, 9)}`;
  return null;
}

// Empresa: o CNPJ basta. Pessoa física: os dígitos centrais do CPF se repetem entre pessoas, então entram junto com o nome.
export function chaveDeCruzamento(documento, nome) {
  if (!documento) return null;
  return documento.startsWith('cpf:') ? `${documento}|${normalizarNome(nome)}` : documento;
}
