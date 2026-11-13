// Leilões (a parte REST; as licitações em direto são feitas por Socket.io)
const router = require('express').Router();
const Auction = require('../models/Auction');
const Bid = require('../models/Bid');
const auth = require('../middleware/auth');

const POPULAR = [
  { path: 'produtor', select: 'nome produtor.localidade' },
  { path: 'licitacaoAtual.comprador', select: 'nome' },
];

// GET /api/auctions?estado=ativo|agendado|terminado&produtor=  -> 200 [leilões]
// O estado é calculado pelas datas, para estar sempre certo
router.get('/', async (req, res, next) => {
  try {
    const agora = new Date();
    const filtro = {};
    if (req.query.estado === 'ativo') Object.assign(filtro, { iniciaEm: { $lte: agora }, terminaEm: { $gt: agora } });
    if (req.query.estado === 'agendado') filtro.iniciaEm = { $gt: agora };
    if (req.query.estado === 'terminado') filtro.terminaEm = { $lte: agora };
    if (req.query.produtor) filtro.produtor = req.query.produtor;

    const lista = await Auction.find(filtro).sort({ terminaEm: 1 }).populate(POPULAR);
    res.json(lista);
  } catch (err) { next(err); }
});

// GET /api/auctions/:id  -> 200 { leilao, licitacoes } | 404
router.get('/:id', async (req, res, next) => {
  try {
    const leilao = await Auction.findById(req.params.id).populate(POPULAR);
    if (!leilao) return res.status(404).json({ erro: 'Leilão não encontrado' });
    const licitacoes = await Bid.find({ leilao: leilao._id }).sort({ createdAt: -1 }).limit(20).populate('comprador', 'nome');
    res.json({ leilao, licitacoes });
  } catch (err) { next(err); }
});

// POST /api/auctions  (produtor)  { lote, quantidade, precoBase, incremento, duracaoMin, iniciaEm? }  -> 201
router.post('/', auth('produtor'), async (req, res, next) => {
  try {
    const { lote, quantidade, precoBase, incremento = 5, duracaoMin = 10, iniciaEm } = req.body;
    const duracao = Number(duracaoMin);
    if (!lote || precoBase == null) return res.status(400).json({ erro: 'Lote e preço base são obrigatórios' });
    if (!Number.isFinite(duracao) || duracao < 1 || duracao > 1440) {
      return res.status(400).json({ erro: 'A duração tem de estar entre 1 e 1440 minutos' });
    }

    const inicio = iniciaEm ? new Date(iniciaEm) : new Date();
    const leilao = await Auction.create({
      produtor: req.user.id,
      lote,
      quantidade,
      precoBase: Number(precoBase),
      incremento: Number(incremento),
      // Começa no preço base; a 1.ª licitação tem de ser >= preço base + incremento
      licitacaoAtual: { valor: Number(precoBase) },
      iniciaEm: inicio,
      terminaEm: new Date(inicio.getTime() + duracao * 60 * 1000),
      estado: inicio <= new Date() ? 'ativo' : 'agendado',
    });
    res.status(201).location(`/api/auctions/${leilao._id}`).json(leilao);
  } catch (err) { next(err); }
});

// GET /api/auctions/:id/bids  -> 200 [licitações, da mais recente para a mais antiga]
router.get('/:id/bids', async (req, res, next) => {
  try {
    const lista = await Bid.find({ leilao: req.params.id }).sort({ createdAt: -1 }).populate('comprador', 'nome');
    res.json(lista);
  } catch (err) { next(err); }
});

module.exports = router;
