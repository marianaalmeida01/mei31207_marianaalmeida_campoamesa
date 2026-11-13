// Páginas públicas dos produtores
const router = require('express').Router();
const mongoose = require('mongoose');
const User = require('../models/User');
const Product = require('../models/Product');
const Review = require('../models/Review');

// GET /api/producers?localidade=  -> 200 [produtores validados]
router.get('/', async (req, res, next) => {
  try {
    const filtro = { papel: 'produtor', 'produtor.validado': true };
    if (req.query.localidade) filtro['produtor.localidade'] = req.query.localidade;
    const lista = await User.find(filtro).select('nome produtor').sort({ nome: 1 });
    res.json(lista);
  } catch (err) { next(err); }
});

// GET /api/producers/:id  -> 200 { produtor, produtos, avaliacaoMedia, numAvaliacoes } | 404
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ erro: 'Identificador inválido' });

    const produtor = await User.findOne({ _id: id, papel: 'produtor', 'produtor.validado': true }).select('nome produtor');
    if (!produtor) return res.status(404).json({ erro: 'Produtor não encontrado' });

    // As duas consultas correm ao mesmo tempo
    const [produtos, [estatisticas]] = await Promise.all([
      Product.find({ produtor: id }).sort({ nome: 1 }),
      // Agregação: média e número de avaliações visíveis deste produtor
      Review.aggregate([
        { $match: { produtor: new mongoose.Types.ObjectId(id), visivel: true } },
        { $group: { _id: null, media: { $avg: '$classificacao' }, total: { $sum: 1 } } },
      ]),
    ]);

    res.json({
      produtor,
      produtos,
      avaliacaoMedia: estatisticas ? Math.round(estatisticas.media * 10) / 10 : null,
      numAvaliacoes: estatisticas?.total || 0,
    });
  } catch (err) { next(err); }
});

module.exports = router;