// Passo 3: recurso /api/products (CRUD)
const router = require('express').Router();
const multer = require('multer');
const Product = require('../models/Product');
const auth = require('../middleware/auth');
const porFazer = require('./_naoImplementado');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// Campos que o produtor pode definir (o "produtor" vem sempre do token, nunca do pedido)
const CAMPOS = ['nome', 'categoria', 'preco', 'unidade', 'stock', 'biologico', 'epocas'];
const escolher = (corpo = {}) =>
  Object.fromEntries(CAMPOS.filter((c) => corpo[c] !== undefined).map((c) => [c, corpo[c]]));

// Ordenações aceites em ?ordem=
const ORDENACOES = {
  nome: { nome: 1 },
  preco: { preco: 1 },
  '-preco': { preco: -1 },
  recentes: { createdAt: -1 },
};

// Evita que caracteres especiais da pesquisa sejam lidos como expressão regular
const escapar = (texto) => String(texto).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// GET /api/products?q=&categoria=&precoMax=&bio=&epoca=&produtor=&ordem=  -> 200 [produtos]
router.get('/', async (req, res, next) => {
  try {
    const { q, categoria, precoMax, bio, epoca, produtor, ordem } = req.query;
    const filtro = {};
    if (q) filtro.nome = { $regex: escapar(q), $options: 'i' };
    if (categoria && categoria !== 'Todos') filtro.categoria = categoria;
    if (precoMax) filtro.preco = { $lte: Number(precoMax) };
    if (bio === 'true') filtro.biologico = true;
    if (epoca) filtro.epocas = { $in: String(epoca).split(',') }; // ex.: ?epoca=Outono,Inverno
    if (produtor) filtro.produtor = produtor;

    const lista = await Product.find(filtro)
      .sort(ORDENACOES[ordem] || ORDENACOES.nome)
      .populate('produtor', 'nome produtor.localidade');
    res.json(lista);
  } catch (err) { next(err); }
});

// GET /api/products/:id  -> 200 | 404
router.get('/:id', async (req, res, next) => {
  try {
    const produto = await Product.findById(req.params.id).populate('produtor', 'nome produtor.localidade');
    if (!produto) return res.status(404).json({ erro: 'Produto não encontrado' });
    res.json(produto);
  } catch (err) { next(err); }
});

// POST /api/products  (produtor)  -> 201 + Location
router.post('/', auth('produtor'), async (req, res, next) => {
  try {
    const produto = await Product.create({ ...escolher(req.body), produtor: req.user.id });
    res.status(201).location(`/api/products/${produto._id}`).json(produto);
  } catch (err) { next(err); }
});

// PUT /api/products/:id  (só o produtor dono)  -> 200 | 404
router.put('/:id', auth('produtor'), async (req, res, next) => {
  try {
    // O filtro inclui o produtor autenticado: um produtor não consegue alterar produtos de outro
    const produto = await Product.findOneAndUpdate(
      { _id: req.params.id, produtor: req.user.id },
      escolher(req.body),
      { new: true, runValidators: true },
    );
    if (!produto) return res.status(404).json({ erro: 'Produto não encontrado' });
    res.json(produto);
  } catch (err) { next(err); }
});

// DELETE /api/products/:id  (só o produtor dono)  -> 204 | 404
router.delete('/:id', auth('produtor'), async (req, res, next) => {
  try {
    const produto = await Product.findOneAndDelete({ _id: req.params.id, produtor: req.user.id });
    if (!produto) return res.status(404).json({ erro: 'Produto não encontrado' });
    res.status(204).end();
  } catch (err) { next(err); }
});

// POST /api/products/:id/imagem  (multipart, campo "imagem")  -> 200 { imagemUrl }
// Passo 8 (opcional): enviar req.file para o storage da Cloud com services/imagens.js
router.post('/:id/imagem', auth('produtor'), upload.single('imagem'), porFazer('Upload da imagem do produto'));

module.exports = router;
