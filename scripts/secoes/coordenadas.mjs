// A partir de 2026 o TSE publica as coordenadas com vírgula decimal.
export const lerCoordenada = texto => parseFloat(String(texto).replace(',', '.'));

// Coordenada fora do retângulo do município (com uma folga) é erro de cadastro e fica de fora do mapa.
const FOLGA_EM_GRAUS = 0.02;

export function caixaDoContorno(geojson) {
  const { type, coordinates } = geojson.features[0].geometry;
  const pontos = coordinates.flat(type === 'Polygon' ? 1 : 2);
  const longitudes = pontos.map(p => p[0]), latitudes = pontos.map(p => p[1]);
  return {
    oeste: Math.min(...longitudes) - FOLGA_EM_GRAUS, sul: Math.min(...latitudes) - FOLGA_EM_GRAUS,
    leste: Math.max(...longitudes) + FOLGA_EM_GRAUS, norte: Math.max(...latitudes) + FOLGA_EM_GRAUS,
  };
}

export function estaNaCaixa(caixa, lon, lat) {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return false;
  return lon >= caixa.oeste && lon <= caixa.leste && lat >= caixa.sul && lat <= caixa.norte;
}
