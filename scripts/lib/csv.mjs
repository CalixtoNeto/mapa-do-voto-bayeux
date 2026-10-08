// Leitura dos CSVs do TSE: campos entre aspas, separados por ponto e vírgula.

export function camposDaLinha(linha) {
  const campos = [];
  let inicio = 0;
  while (inicio <= linha.length) {
    const campo = linha.charCodeAt(inicio) === ASPAS ? campoEntreAspas(linha, inicio) : campoSimples(linha, inicio);
    campos.push(campo.valor);
    inicio = campo.fim + 1;
  }
  return campos;
}

const ASPAS = 34;

function campoSimples(linha, inicio) {
  const separador = linha.indexOf(';', inicio);
  const fim = separador < 0 ? linha.length : separador;
  return { valor: linha.slice(inicio, fim), fim };
}

// Aspas duplicadas ("") dentro do campo representam uma aspa literal.
function campoEntreAspas(linha, abertura) {
  let valor = '', cursor = abertura + 1;
  for (;;) {
    const aspa = linha.indexOf('"', cursor);
    if (aspa < 0) return { valor: valor + linha.slice(cursor), fim: linha.length };
    valor += linha.slice(cursor, aspa);
    if (linha.charCodeAt(aspa + 1) !== ASPAS) return { valor, fim: aspa + 1 };
    valor += '"';
    cursor = aspa + 2;
  }
}

export function indiceDeColunas(cabecalho) {
  return Object.fromEntries(camposDaLinha(cabecalho).map((nome, i) => [nome.trim().toUpperCase(), i]));
}

export const inteiro = texto => parseInt(texto, 10) || 0;

// Adapta o formato de lerCsvsDoZip (linha, ehCabecalho) para quem quer cada registro já dividido em campos.
// `descartarRapido` evita dividir linhas que com certeza não interessam (arquivos nacionais têm milhões delas).
export function porRegistro({ aoCabecalho = () => {}, aoRegistro, descartarRapido = () => false }) {
  let colunas = null;
  return (linha, ehCabecalho) => {
    if (ehCabecalho) { colunas = indiceDeColunas(linha); aoCabecalho(colunas); return; }
    if (!descartarRapido(linha)) aoRegistro(camposDaLinha(linha), colunas);
  };
}

// Coluna que nem todo ano do TSE traz: vazio quando o arquivo não a tem.
export const campo = (campos, colunas, nome) => colunas[nome] != null ? campos[colunas[nome]] ?? '' : '';
