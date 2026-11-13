// Passo 7: notificações pessoais em tempo real (Socket.io)
// O servidor envia para a "sala pessoal" de cada utilizador (user:ID):
//   'encomenda-atualizada' { id, estado }  -> quando o produtor muda o estado da encomenda
//   'leilao-ganho' { leilaoId, lote, valor } -> quando o comprador ganha um leilão
import { useCallback, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { API_URL, USAR_DADOS_SIMULADOS } from '../api/client.js';

const TEXTO_ESTADO = {
  confirmada: 'foi confirmada pelo produtor',
  pronta: 'está pronta',
  entregue: 'foi entregue',
};

export function useNotificacoes(token) {
  const [notificacoes, setNotificacoes] = useState([]);

  useEffect(() => {
    if (!token || USAR_DADOS_SIMULADOS) return undefined;
    const socket = io(API_URL, { auth: { token } });
    const juntar = (n) => setNotificacoes((lista) => [...lista, { id: `${Date.now()}-${Math.random()}`, ...n }]);

    socket.on('encomenda-atualizada', ({ id, estado }) => {
      juntar({
        titulo: 'Encomenda atualizada',
        texto: `A encomenda #${String(id).slice(-6).toUpperCase()} ${TEXTO_ESTADO[estado] || `está "${estado}"`}.`,
        link: '/encomendas',
      });
      // Avisa a página "Encomendas" (se estiver aberta) para atualizar sem recarregar
      window.dispatchEvent(new CustomEvent('encomenda-atualizada', { detail: { id, estado } }));
    });

    socket.on('leilao-ganho', ({ leilaoId, lote, valor }) => {
      juntar({ titulo: 'Ganhou um leilão!', texto: `${lote} por ${Number(valor).toFixed(2)} €.`, link: `/leiloes/${leilaoId}` });
    });

    return () => socket.disconnect();
  }, [token]);

  // useCallback: a função mantém-se a mesma entre renderizações (não reinicia os temporizadores)
  const fechar = useCallback((id) => setNotificacoes((lista) => lista.filter((n) => n.id !== id)), []);

  return { notificacoes, fechar };
}
