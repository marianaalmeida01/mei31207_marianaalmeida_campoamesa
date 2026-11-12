// Estado global do carrinho 
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const CarrinhoContext = createContext(null);

export function CarrinhoProvider({ children }) {
  const [linhas, setLinhas] = useState(() => {
    try { return JSON.parse(localStorage.getItem('carrinho')) || []; } catch { return []; }
  }); // [{ produto, quantidade }]

  // Sempre que o carrinho muda, guarda-o no browser
  useEffect(() => {
    try { localStorage.setItem('carrinho', JSON.stringify(linhas)); } catch { /* sem armazenamento */ }
  }, [linhas]);

  function adicionar(produto, quantidade = 1) {
    setLinhas((atual) => {
      const existe = atual.find((l) => l.produto._id === produto._id);
      if (existe) {
        return atual.map((l) => l.produto._id === produto._id
          ? { ...l, quantidade: l.quantidade + quantidade } : l);
      }
      return [...atual, { produto, quantidade }];
    });
  }

  function alterarQuantidade(produtoId, quantidade) {
    if (quantidade <= 0) return remover(produtoId);
    setLinhas((atual) => atual.map((l) => l.produto._id === produtoId ? { ...l, quantidade } : l));
  }

  function remover(produtoId) {
    setLinhas((atual) => atual.filter((l) => l.produto._id !== produtoId));
  }

  function esvaziar() {
    setLinhas([]);
  }

  // useMemo: só recalcula o total quando as linhas mudam
  const total = useMemo(
    () => linhas.reduce((s, l) => s + l.produto.preco * l.quantidade, 0), [linhas]);

  return (
    <CarrinhoContext.Provider value={{ linhas, adicionar, alterarQuantidade, remover, esvaziar, total }}>
      {children}
    </CarrinhoContext.Provider>
  );
}

export const useCarrinho = () => useContext(CarrinhoContext);