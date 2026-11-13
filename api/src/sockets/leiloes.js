// Passo 7: leilões em tempo real (Socket.io)
// Eventos do cliente:   'entrar' (leilaoId), 'sair' (leilaoId), 'licitar' ({ leilaoId, valor })
// Eventos do servidor:  'estado' ({ leilao, historico }), 'presenca' (n.º), 'nova-licitacao',
//                       'recusada' (mensagem), 'terminado' ({ valor, vencedor }), 'leilao-ganho' (só ao vencedor)
const Auction = require('../models/Auction');
const Bid = require('../models/Bid');
const User = require('../models/User');

const sala = (leilaoId) => `leilao:${leilaoId}`;

function emitirPresenca(io, leilaoId) {
  const n = io.sockets.adapter.rooms.get(sala(leilaoId))?.size ?? 0;
  io.to(sala(leilaoId)).emit('presenca', n);
}

// Licitação no formato enviado aos clientes
const paraCliente = (bid) => ({
  valor: bid.valor,
  comprador: { _id: bid.comprador?._id, nome: bid.comprador?.nome },
  em: bid.createdAt,
});

// Fecha os leilões que já passaram da hora e avisa a sala e o vencedor.
// O findOneAndUpdate com { estado: { $ne: 'terminado' } } garante que cada leilão só é fechado UMA vez.
async function fecharExpirados(io) {
  const agora = new Date();

  // Agendados cuja hora de início já chegou passam a ativos
  await Auction.updateMany({ estado: 'agendado', iniciaEm: { $lte: agora }, terminaEm: { $gt: agora } }, { estado: 'ativo' });

  const expirados = await Auction.find({ estado: { $ne: 'terminado' }, terminaEm: { $lte: agora } }).select('_id');
  for (const { _id } of expirados) {
    const leilao = await Auction.findOneAndUpdate(
      { _id, estado: { $ne: 'terminado' } },
      { estado: 'terminado' },
      { new: true },
    ).populate('licitacaoAtual.comprador', 'nome');
    if (!leilao) continue; // já tinha sido fechado

    const vencedor = leilao.licitacaoAtual?.comprador;
    io.to(sala(_id)).emit('terminado', {
      valor: leilao.licitacaoAtual?.valor,
      vencedor: vencedor ? { _id: vencedor._id, nome: vencedor.nome } : null,
    });
    if (vencedor) {
      io.to(`user:${vencedor._id}`).emit('leilao-ganho', { leilaoId: _id, lote: leilao.lote, valor: leilao.licitacaoAtual.valor });
    }
  }
}

// Verifica os leilões de 5 em 5 segundos (chamado uma vez, ao arrancar o servidor)
function iniciarFecho(io) {
  setInterval(() => fecharExpirados(io).catch((err) => console.error('Erro ao fechar leilões:', err)), 5000);
}

function registarLeiloes(io, socket) {
  // Entrar na sala de um leilão: recebe o estado atual e o histórico
  socket.on('entrar', async (leilaoId) => {
    try {
      const leilao = await Auction.findById(leilaoId)
        .populate('produtor', 'nome produtor.localidade')
        .populate('licitacaoAtual.comprador', 'nome');
      if (!leilao) return socket.emit('recusada', 'Leilão não encontrado');

      socket.join(sala(leilaoId));
      const historico = await Bid.find({ leilao: leilaoId }).sort({ createdAt: -1 }).limit(10).populate('comprador', 'nome');
      socket.emit('estado', { leilao, historico: historico.map(paraCliente) });
      emitirPresenca(io, leilaoId);
    } catch {
      socket.emit('recusada', 'Leilão não encontrado');
    }
  });

  socket.on('sair', (leilaoId) => {
    socket.leave(sala(leilaoId));
    emitirPresenca(io, leilaoId);
  });

  // DESAFIO CENTRAL: validar e gravar a licitação numa ÚNICA operação atómica.
  // O MongoDB só atualiza se TODAS as condições se verificarem no momento da escrita.
  // Se duas licitações chegarem ao mesmo tempo, a segunda já "vê" o valor novo e é recusada.
  socket.on('licitar', async ({ leilaoId, valor } = {}) => {
    try {
      if (socket.user.papel !== 'comprador') return socket.emit('recusada', 'Só compradores podem licitar');
      const v = Number(valor);
      if (!Number.isFinite(v) || v <= 0) return socket.emit('recusada', 'Valor inválido');

      const agora = new Date();
      const leilao = await Auction.findOneAndUpdate(
        {
          _id: leilaoId,
          estado: { $ne: 'terminado' },
          iniciaEm: { $lte: agora },
          terminaEm: { $gt: agora },
          // valor >= licitação atual + incremento (calculado pelo MongoDB, no momento da escrita)
          $expr: { $gte: [v, { $add: ['$licitacaoAtual.valor', '$incremento'] }] },
        },
        { $set: { 'licitacaoAtual.valor': v, 'licitacaoAtual.comprador': socket.user.id, estado: 'ativo' } },
        { new: true },
      );

      if (!leilao) {
        // Não foi aceite: descobre o motivo para explicar ao comprador
        const atual = await Auction.findById(leilaoId);
        if (!atual) return socket.emit('recusada', 'Leilão não encontrado');
        if (atual.estado === 'terminado' || atual.terminaEm <= agora) return socket.emit('recusada', 'O leilão já terminou');
        if (atual.iniciaEm > agora) return socket.emit('recusada', 'O leilão ainda não começou');
        const minimo = atual.licitacaoAtual.valor + atual.incremento;
        return socket.emit('recusada', `A licitação mínima é ${minimo.toFixed(2)} €`);
      }

      // Aceite: guarda no histórico e avisa TODOS os que estão na sala
      const bid = await Bid.create({ leilao: leilao._id, comprador: socket.user.id, valor: v });
      bid.comprador = await User.findById(socket.user.id).select('nome');
      io.to(sala(leilaoId)).emit('nova-licitacao', paraCliente(bid));
    } catch {
      socket.emit('recusada', 'Não foi possível registar a licitação');
    }
  });

  // Atualizar a presença quando o utilizador fecha a página
  socket.on('disconnecting', () => {
    for (const s of socket.rooms) {
      if (s.startsWith('leilao:')) {
        setImmediate(() => emitirPresenca(io, s.slice('leilao:'.length)));
      }
    }
  });
}

module.exports = registarLeiloes;
module.exports.iniciarFecho = iniciarFecho;
