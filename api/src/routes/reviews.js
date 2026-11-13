// Avaliações: só o comprador de uma encomenda ENTREGUE pode avaliar, e só uma vez por encomenda.
// Ficam numa coleção própria (e não embebidas no produtor) porque podem ser muitas,
// são moderadas uma a uma pelo administrador e a média é calculada por agregação.
const router = require('express').Router();
const auth = require('../middleware/auth');
const Review = require('../models/Review');
const Order = require('../models/Order');

// POST /api/reviews  (comprador)  { encomenda, classificacao, comentario }  -> 201
router.post('/', auth('comprador'), async (req, res, next) => {
  try {
    const { encomenda: encomendaId, classificacao, comentario } = req.body;
    const nota = Number(classificacao);
    if (!Number.isInteger(nota) || nota < 1 || nota > 5) {
      return res.status(400).json({ erro: 'A classificação tem de ser de 1 a 5' });
    }

    const encomenda = await Order.findOne({ _id: encomendaId, comprador: req.user.id });
    if (!encomenda) return res.status(404).json({ erro: 'Encomenda não encontrada' });
    if (encomenda.estado !== 'entregue') {
      return res.status(400).json({ erro: 'Só pode avaliar encomendas entregues' });
    }
    if (await Review.exists({ encomenda: encomenda._id })) {
      return res.status(409).json({ erro: 'Esta encomenda já foi avaliada' });
    }

    const review = await Review.create({
      autor: req.user.id,
      produtor: encomenda.produtor,
      encomenda: encomenda._id,
      classificacao: nota,
      comentario: comentario?.trim(),
    });
    res.status(201).json(review);
  } catch (err) { next(err); }
});

// GET /api/reviews?produtor=&produto=  -> 200 [avaliações visíveis]
router.get('/', async (req, res, next) => {
  try {
    const filtro = { visivel: true };
    if (req.query.produtor) filtro.produtor = req.query.produtor;
    if (req.query.produto) filtro.produto = req.query.produto;
    const lista = await Review.find(filtro).sort({ createdAt: -1 }).limit(50).populate('autor', 'nome');
    res.json(lista);
  } catch (err) { next(err); }
});

// POST /api/reviews/:id/denuncia  (qualquer utilizador autenticado)  -> 204
router.post('/:id/denuncia', auth(), async (req, res, next) => {
  try {
    const review = await Review.findByIdAndUpdate(req.params.id, { $inc: { denuncias: 1 } });
    if (!review) return res.status(404).json({ erro: 'Avaliação não encontrada' });
    res.status(204).end();
  } catch (err) { next(err); }
});

module.exports = router;
