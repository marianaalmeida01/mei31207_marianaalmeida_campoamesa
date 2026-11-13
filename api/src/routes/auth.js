// Passo 6: registo e login
const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Cria o token JWT com o id e o papel (é isto que o middleware auth lê em cada pedido)
function criarToken(user) {
  return jwt.sign({ id: user._id, papel: user.papel }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '2h',
  });
}

// Dados que podem sair da API (nunca o passwordHash)
const publico = (u) => ({
  _id: u._id,
  nome: u.nome,
  email: u.email,
  papel: u.papel,
  produtor: u.papel === 'produtor' ? u.produtor : undefined,
});

// POST /api/auth/registo  -> 201 { id }
router.post('/registo', async (req, res, next) => {
  try {
    const { nome, email, password, papel = 'comprador', produtor } = req.body;

    if (!nome || !email || !password) {
      return res.status(400).json({ erro: 'Nome, email e password são obrigatórios' });
    }
    if (String(password).length < 8) {
      return res.status(400).json({ erro: 'A password deve ter pelo menos 8 caracteres' });
    }
    if (!['comprador', 'produtor'].includes(papel)) {
      return res.status(400).json({ erro: 'Papel inválido (comprador ou produtor)' });
    }
    if (await User.exists({ email: String(email).toLowerCase().trim() })) {
      return res.status(409).json({ erro: 'Já existe uma conta com este email' });
    }

    // bcrypt com custo 12: guarda só o "hash", nunca a password
    const passwordHash = await bcrypt.hash(String(password), 12);
    const novo = await User.create({
      nome,
      email,
      passwordHash,
      papel,
      // Um produtor fica por validar até o administrador aprovar
      produtor: papel === 'produtor' ? { ...produtor, validado: false } : undefined,
    });

    res.status(201).json({ id: novo._id });
  } catch (err) { next(err); }
});

// POST /api/auth/login  -> 200 { token, utilizador } | 401
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ erro: 'Email e password são obrigatórios' });
    }

    // O passwordHash está escondido por omissão (select: false); aqui pedimo-lo
    const user = await User.findOne({ email: String(email).toLowerCase().trim() }).select('+passwordHash');

    // A mesma mensagem nos dois casos, para não revelar se o email existe
    if (!user || !(await bcrypt.compare(String(password), user.passwordHash))) {
      return res.status(401).json({ erro: 'Email ou password incorretos' });
    }

    res.json({ token: criarToken(user), utilizador: publico(user) });
  } catch (err) { next(err); }
});

// GET /api/auth/eu  -> 200 dados do utilizador autenticado
router.get('/eu', auth(), async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ erro: 'Utilizador não encontrado' });
    res.json(publico(user));
  } catch (err) { next(err); }
});

module.exports = router;