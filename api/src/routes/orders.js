// Passo 3: recurso /api/orders (encomendas)
const router = require('express').Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const auth = require('../middleware/auth');

const POPULAR = [
  { path: 'comprador', select: 'nome email' },
  { path: 'produtor', select: 'nome produtor.localidade' },
];

// Erro com código HTTP (o errorHandler usa err.status)
const erro = (status, mensagem) => Object.assign(new Error(mensagem), { status });

// Quem pode ver uma encomenda: o comprador, o produtor dela ou o administrador
const podeVer = (encomenda, user) =>
  user.papel === 'admin' ||
  String(encomenda.comprador._id || encomenda.comprador) === user.id ||
  String(encomenda.produtor._id || encomenda.produtor) === user.id;

// POST /api/orders  (comprador)  -> 201 [encomendas]  (uma encomenda por produtor)
// Corpo: { linhas: [{ produto, quantidade }], entrega: { tipo, morada } }
router.post('/', auth('comprador'), async (req, res, next) => {
  const reservados = []; // stock já descontado (para repor se algo falhar)
  try {
    const { linhas, entrega = {} } = req.body;
    if (!Array.isArray(linhas) || linhas.length === 0) {
      throw erro(400, 'A encomenda tem de ter pelo menos uma linha');
    }
    if (entrega.tipo === 'entrega' && !entrega.morada) {
      throw erro(400, 'Indique a morada para entrega ao domicílio');
    }

    // Lê os produtos pedidos de uma só vez
    const ids = linhas.map((l) => l.produto);
    const produtos = await Product.find({ _id: { $in: ids } });
    const porId = new Map(produtos.map((p) => [String(p._id), p]));

    // Valida cada linha e agrupa por produtor
    const porProdutor = new Map();
    for (const { produto: id, quantidade } of linhas) {
      const produto = porId.get(String(id));
      const qtd = Number(quantidade);
      if (!produto) throw erro(400, `Produto ${id} não existe`);
      if (!Number.isInteger(qtd) || qtd < 1) throw erro(400, `Quantidade inválida para ${produto.nome}`);

      const chave = String(produto.produtor);
      if (!porProdutor.has(chave)) porProdutor.set(chave, []);
      porProdutor.get(chave).push({ produto: produto._id, nome: produto.nome, precoUnit: produto.preco, quantidade: qtd });
    }

    // Desconta o stock de forma ATÓMICA: só desconta se ainda houver stock suficiente.
    // Se dois compradores encomendarem o último kg ao mesmo tempo, só um consegue.
    for (const linhasDoProdutor of porProdutor.values()) {
      for (const l of linhasDoProdutor) {
        const r = await Product.updateOne(
          { _id: l.produto, stock: { $gte: l.quantidade } },
          { $inc: { stock: -l.quantidade } },
        );
        if (r.modifiedCount === 0) throw erro(409, `Stock insuficiente para ${l.nome}`);
        reservados.push(l);
      }
    }

    // Cria uma encomenda por produtor
    const encomendas = await Order.create([...porProdutor].map(([produtor, itens]) => ({
      comprador: req.user.id,
      produtor,
      linhas: itens,
      total: Math.round(itens.reduce((s, l) => s + l.precoUnit * l.quantidade, 0) * 100) / 100,
      entrega: { tipo: entrega.tipo || 'levantamento', morada: entrega.morada },
      historico: [{ estado: 'pendente' }],
    })));

    res.status(201).json(encomendas);
  } catch (err) {
    // Se algo falhou a meio, devolve ao stock o que já tinha sido descontado
    await Promise.all(reservados.map((l) => Product.updateOne({ _id: l.produto }, { $inc: { stock: l.quantidade } })));
    next(err);
  }
});

// GET /api/orders  -> 200 [encomendas do utilizador: como comprador ou como produtor]
router.get('/', auth(), async (req, res, next) => {
  try {
    const filtro = {};
    if (req.user.papel === 'comprador') filtro.comprador = req.user.id;
    if (req.user.papel === 'produtor') filtro.produtor = req.user.id;
    const lista = await Order.find(filtro).sort({ createdAt: -1 }).populate(POPULAR);
    res.json(lista);
  } catch (err) { next(err); }
});

// GET /api/orders/:id  -> 200 | 404
router.get('/:id', auth(), async (req, res, next) => {
  try {
    const encomenda = await Order.findById(req.params.id).populate(POPULAR);
    // 404 também quando a encomenda é de outra pessoa (não revela que existe)
    if (!encomenda || !podeVer(encomenda, req.user)) {
      return res.status(404).json({ erro: 'Encomenda não encontrada' });
    }
    res.json(encomenda);
  } catch (err) { next(err); }
});

// PATCH /api/orders/:id/estado  (produtor)  { estado }  -> 200
router.patch('/:id/estado', auth('produtor'), async (req, res, next) => {
  try {
    const { estado } = req.body;
    if (!Order.ESTADOS.includes(estado)) {
      return res.status(400).json({ erro: `Estado inválido. Use: ${Order.ESTADOS.join(', ')}` });
    }

    const encomenda = await Order.findOne({ _id: req.params.id, produtor: req.user.id });
    if (!encomenda) return res.status(404).json({ erro: 'Encomenda não encontrada' });

    // Regra de negócio: o estado só avança (pendente -> confirmada -> pronta -> entregue)
    if (Order.ESTADOS.indexOf(estado) <= Order.ESTADOS.indexOf(encomenda.estado)) {
      return res.status(400).json({ erro: `A encomenda já está "${encomenda.estado}"; o estado só pode avançar` });
    }

    encomenda.estado = estado;
    encomenda.historico.push({ estado });
    await encomenda.save();

    // Passo 7: avisa o comprador em tempo real (sala pessoal do Socket.io)
    req.app.get('io')?.to(`user:${encomenda.comprador}`)
      .emit('encomenda-atualizada', { id: encomenda._id, estado: encomenda.estado });

    res.json(encomenda);
  } catch (err) { next(err); }
});

module.exports = router;