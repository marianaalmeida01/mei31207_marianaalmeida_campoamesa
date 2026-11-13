// Painel do administrador (todas as rotas exigem papel "admin")
const router = require('express').Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Order = require('../models/Order');
const Auction = require('../models/Auction');
const Review = require('../models/Review');

router.use(auth('admin'));

// GET /api/admin/estatisticas  -> 200 { utilizadores, produtores, pendentes, encomendasHoje, leiloesAtivos, vendasTotal }
router.get('/estatisticas', async (req, res, next) => {
  try {
    const agora = new Date();
    const inicioDoDia = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());

    // Todas as contagens correm em paralelo
    const [utilizadores, produtores, pendentes, encomendasHoje, leiloesAtivos, [vendas]] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ papel: 'produtor', 'produtor.validado': true }),
      User.countDocuments({ papel: 'produtor', 'produtor.validado': false }),
      Order.countDocuments({ createdAt: { $gte: inicioDoDia } }),
      Auction.countDocuments({ iniciaEm: { $lte: agora }, terminaEm: { $gt: agora } }),
      Order.aggregate([{ $group: { _id: null, total: { $sum: '$total' } } }]),
    ]);

    res.json({ utilizadores, produtores, pendentes, encomendasHoje, leiloesAtivos, vendasTotal: vendas?.total || 0 });
  } catch (err) { next(err); }
});

// GET /api/admin/produtores/pendentes  -> 200 [produtores por validar]
router.get('/produtores/pendentes', async (req, res, next) => {
  try {
    const lista = await User.find({ papel: 'produtor', 'produtor.validado': false })
      .select('nome email produtor createdAt').sort({ createdAt: 1 });
    res.json(lista);
  } catch (err) { next(err); }
});

// PATCH /api/admin/produtores/:id/validacao  { aprovado: true|false }  -> 200
// Aprovar: o produtor passa a ser público. Rejeitar: o registo é removido.
router.patch('/produtores/:id/validacao', async (req, res, next) => {
  try {
    const filtro = { _id: req.params.id, papel: 'produtor' };
    if (req.body.aprovado === true) {
      const produtor = await User.findOneAndUpdate(filtro, { 'produtor.validado': true }, { new: true });
      if (!produtor) return res.status(404).json({ erro: 'Produtor não encontrado' });
      return res.json({ id: produtor._id, validado: true });
    }
    if (req.body.aprovado === false) {
      const removido = await User.findOneAndDelete({ ...filtro, 'produtor.validado': false });
      if (!removido) return res.status(404).json({ erro: 'Produtor pendente não encontrado' });
      return res.json({ id: removido._id, removido: true });
    }
    res.status(400).json({ erro: 'Indique { "aprovado": true } ou { "aprovado": false }' });
  } catch (err) { next(err); }
});

// GET /api/admin/reviews/denunciadas  -> 200 [avaliações visíveis com denúncias]
router.get('/reviews/denunciadas', async (req, res, next) => {
  try {
    const lista = await Review.find({ denuncias: { $gt: 0 }, visivel: true })
      .sort({ denuncias: -1 })
      .populate('autor', 'nome')
      .populate('produtor', 'nome');
    res.json(lista);
  } catch (err) { next(err); }
});

// PATCH /api/admin/reviews/:id  { visivel: false } -> oculta | { visivel: true } -> mantém e limpa as denúncias
router.patch('/reviews/:id', async (req, res, next) => {
  try {
    const alteracao = req.body.visivel === false ? { visivel: false } : { visivel: true, denuncias: 0 };
    const review = await Review.findByIdAndUpdate(req.params.id, alteracao, { new: true });
    if (!review) return res.status(404).json({ erro: 'Avaliação não encontrada' });
    res.json(review);
  } catch (err) { next(err); }
});

module.exports = router;
