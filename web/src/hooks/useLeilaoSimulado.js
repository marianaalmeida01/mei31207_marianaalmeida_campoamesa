// Sala de leilão sem servidor (modo simulado).
// Devolve o mesmo que o useLeilao (sockets, Passo 7), por isso a página funciona com os dois.
import { useEffect, useState } from 'react';
import { leiloes } from '../data/simulados.js';

const INCREMENTO_MINIMO = 5; // cada licitação tem de subir pelo menos 5 €

export function useLeilaoSimulado(id) {
  const leilao = leiloes.find((l) => l._id === id) || null;

  // atual + histórico num só estado, para mudarem sempre juntos
  const [estado, setEstado] = useState(() => {
    if (!leilao) return { atual: null, historico: [] };
    const inicial = { valor: leilao.valor, comprador: 'Restaurante Lima', em: new Date(Date.now() - 120000).toISOString() };
    return { atual: inicial, historico: [inicial] };
  });
  const [erro, setErro] = useState('');

  function registar(valor, comprador) {
    setEstado((e) => {
      const nova = { valor, comprador, em: new Date().toISOString() };
      return { atual: nova, historico: [nova, ...e.historico].slice(0, 10) };
    });
  }

  // Simula outro comprador a licitar de vez em quando (para se ver o "tempo real")
  useEffect(() => {
    if (!leilao) return undefined;
    const intervalo = setInterval(() => {
      if (new Date(leilao.terminaEm) <= Date.now()) return;
      if (Math.random() < 0.35) {
        setEstado((e) => {
          const nova = { valor: e.atual.valor + INCREMENTO_MINIMO, comprador: 'Mercearia do Centro', em: new Date().toISOString() };
          return { atual: nova, historico: [nova, ...e.historico].slice(0, 10) };
        });
      }
    }, 8000);
    return () => clearInterval(intervalo);
  }, [leilao]);

  // Validação da licitação. No Passo 7 isto passa para o servidor,
  // numa operação atómica (findOneAndUpdate), para duas licitações ao mesmo tempo não se atropelarem.
  function licitar(valor) {
    setErro('');
    if (!leilao) return;
    if (new Date(leilao.terminaEm) <= Date.now()) return setErro('O leilão já terminou.');
    const minimo = estado.atual.valor + INCREMENTO_MINIMO;
    if (!Number.isFinite(valor) || valor < minimo) {
      return setErro(`A licitação mínima é ${minimo.toFixed(2)} €.`);
    }
    registar(valor, 'Você');
  }

  return {
    leilao,
    atual: estado.atual,
    historico: estado.historico,
    participantes: leilao?.participantes ?? 0,
    minimo: estado.atual ? estado.atual.valor + INCREMENTO_MINIMO : 0,
    erro,
    licitar,
  };
}