// Dados simulados ate API

// Data a X minutos de agora (para a contagem decrescente dos leilões)
const daqui = (minutos) => new Date(Date.now() + minutos * 60 * 1000).toISOString();

// "Horta da Ribeira" -> "horta-da-ribeira" (usado no endereço /produtores/...)
export const idDoProdutor = (nome = '') =>
  nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/\s+/g, '-');

export const leiloes = [
  { _id: 'l1', lote: '200 kg de kiwi Hayward, calibre A', produtor: 'Horta da Ribeira', localidade: 'Ponte de Lima', biologico: true, valor: 312, participantes: 14, terminaEm: daqui(3) },
  { _id: 'l2', lote: '50 frascos de mel de urze (500 g)', produtor: 'Mel do Soajo', localidade: 'Arcos de Valdevez', biologico: false, valor: 180, participantes: 6, terminaEm: daqui(25) },
  { _id: 'l3', lote: '30 garrafas de Alvarinho 2025', produtor: 'Quinta da Lameira', localidade: 'Monção', biologico: false, valor: 245, participantes: 9, terminaEm: daqui(70) },
];

export const produtores = [
  { _id: 'horta-da-ribeira', nome: 'Horta da Ribeira', localidade: 'Ponte de Lima', lat: 41.767, lng: -8.583, desde: 2014, avaliacao: 4.8, numAvaliacoes: 126,
    descricao: 'Horta familiar nas margens do rio Lima. Fruta e hortícolas da época, colhidos na véspera da entrega.',
    metodos: ['Levantamento na quinta', 'Entrega ao domicílio'] },
  { _id: 'mel-do-soajo', nome: 'Mel do Soajo', localidade: 'Arcos de Valdevez', lat: 41.846, lng: -8.418, desde: 2009, avaliacao: 4.9, numAvaliacoes: 88,
    descricao: 'Apicultura de montanha no Parque Nacional da Peneda-Gerês. Mel de urze e de castanheiro.',
    metodos: ['Levantamento na quinta', 'Entrega ao domicílio'] },
  { _id: 'quinta-da-lameira', nome: 'Quinta da Lameira', localidade: 'Monção', lat: 42.076, lng: -8.481, desde: 1998, avaliacao: 4.7, numAvaliacoes: 64,
    descricao: 'Vinhas de Alvarinho na sub-região de Monção e Melgaço. Vinho engarrafado na própria quinta.',
    metodos: ['Levantamento na quinta'] },
  { _id: 'casal-do-vez', nome: 'Casal do Vez', localidade: 'Arcos de Valdevez', lat: 41.846, lng: -8.418, desde: 2017, avaliacao: 4.5, numAvaliacoes: 41,
    descricao: 'Hortícolas em modo de produção biológico, à beira do rio Vez.',
    metodos: ['Entrega ao domicílio'] },
  { _id: 'queijaria-da-peneda', nome: 'Queijaria da Peneda', localidade: 'Melgaço', lat: 42.113, lng: -8.260, desde: 2005, avaliacao: 4.9, numAvaliacoes: 57,
    descricao: 'Queijos artesanais de leite de cabra, curados na serra.',
    metodos: ['Levantamento na quinta', 'Entrega ao domicílio'] },
  { _id: 'forno-de-lanheses', nome: 'Forno de Lanheses', localidade: 'Viana do Castelo', lat: 41.693, lng: -8.832, desde: 1987, avaliacao: 4.8, numAvaliacoes: 203,
    descricao: 'Broa de milho e pão de centeio cozidos em forno de lenha todas as manhãs.',
    metodos: ['Levantamento na quinta'] },
  { _id: 'souto-da-serra', nome: 'Souto da Serra', localidade: 'Paredes de Coura', lat: 41.912, lng: -8.561, desde: 2011, avaliacao: 4.7, numAvaliacoes: 33,
    descricao: 'Soutos de castanheiro centenários. Castanha longal apanhada à mão.',
    metodos: ['Entrega ao domicílio'] },
];