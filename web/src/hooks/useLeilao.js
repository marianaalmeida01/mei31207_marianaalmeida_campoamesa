// Passo 7: ligação em tempo real a uma sala de leilão (Socket.io)
import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { API_URL } from '../api/client.js';

// Converte um leilão da API para o formato usado pelos componentes (cartão e sala)
export function normalizarLeilao(l) {
  return {
    _id: l._id,
    lote: l.lote,
    quantidade: l.quantidade,
    produtor: l.produtor?.nome ?? l.produtor,
    localidade: l.produtor?.produtor?.localidade ?? l.localidade,
    valor: l.licitacaoAtual?.valor ?? l.valor,
    incremento: l.incremento,
    iniciaEm: l.iniciaEm,
    terminaEm: l.terminaEm,
    estado: l.estado,
    participantes: l.participantes,
  };
}

const normalizarLicitacao = (b) => ({ valor: b.valor, comprador: b.comprador?.nome ?? 'Comprador', em: b.em });

export function useLeilao(id, token) {
  const socketRef = useRef(null);
  const [leilao, setLeilao] = useState(null);
  const [atual, setAtual] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [participantes, setParticipantes] = useState(0);
  const [resultado, setResultado] = useState(null); // { valor, vencedor } quando o leilão termina
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (!token) return undefined;
    const socket = io(API_URL, { auth: { token } }); // o servidor valida o mesmo JWT da API
    socketRef.current = socket;

    // Entra na sala ao ligar (e outra vez se a ligação cair e voltar)
    socket.on('connect', () => socket.emit('entrar', id));

    socket.on('estado', ({ leilao: l, historico: h }) => {
      setLeilao(normalizarLeilao(l));
      setAtual({ valor: l.licitacaoAtual?.valor, comprador: l.licitacaoAtual?.comprador?.nome });
      setHistorico(h.map(normalizarLicitacao));
    });

    // Chega a TODOS os que estão na sala, sem recarregar a página
    socket.on('nova-licitacao', (b) => {
      const nova = normalizarLicitacao(b);
      setAtual(nova);
      setHistorico((lista) => [nova, ...lista].slice(0, 10));
      setErro('');
    });

    socket.on('presenca', setParticipantes);
    socket.on('recusada', setErro);
    socket.on('terminado', setResultado);
    socket.on('connect_error', (e) => setErro(`Sem ligação ao servidor: ${e.message}`));

    return () => {
      socket.emit('sair', id);
      socket.disconnect();
    };
  }, [id, token]);

  const licitar = (valor) => {
    setErro('');
    socketRef.current?.emit('licitar', { leilaoId: id, valor });
  };

  const minimo = leilao && atual?.valor != null ? atual.valor + leilao.incremento : 0;

  return { leilao, atual, historico, participantes, minimo, erro, licitar, resultado };
}
