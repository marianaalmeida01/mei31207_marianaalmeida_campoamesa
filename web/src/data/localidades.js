// Coordenadas aproximadas das localidades do Alto Minho (para o mapa da página do produtor)
export const COORDENADAS = {
  'Arcos de Valdevez': { lat: 41.846, lng: -8.418 },
  'Caminha': { lat: 41.875, lng: -8.838 },
  'Melgaço': { lat: 42.113, lng: -8.260 },
  'Monção': { lat: 42.076, lng: -8.481 },
  'Paredes de Coura': { lat: 41.912, lng: -8.561 },
  'Ponte da Barca': { lat: 41.808, lng: -8.418 },
  'Ponte de Lima': { lat: 41.767, lng: -8.583 },
  'Valença': { lat: 42.028, lng: -8.644 },
  'Viana do Castelo': { lat: 41.693, lng: -8.832 },
  'Vila Nova de Cerveira': { lat: 41.940, lng: -8.743 },
};

// Endereço do mapa do OpenStreetMap (não precisa de chave). Sem coordenadas, usa o centro do Alto Minho.
export function urlMapa(localidade, localizacao) {
  const { lat, lng } = (localizacao?.lat && localizacao) || COORDENADAS[localidade] || { lat: 41.85, lng: -8.55 };
  return `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.06},${lat - 0.04},${lng + 0.06},${lat + 0.04}&layer=mapnik&marker=${lat},${lng}`;
}
