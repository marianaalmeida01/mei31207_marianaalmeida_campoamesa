// Comprador: carrinho e finalização da encomenda (POST /api/orders)
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCarrinho } from '../context/CarrinhoContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api, USAR_DADOS_SIMULADOS } from '../api/client.js';
import { guardarEncomendasSimuladas } from '../data/simulados.js';

const euro = (v) => v.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' });

const METODOS = [
  ['levantamento', 'Levantar na quinta'],
  ['entrega', 'Entrega ao domicílio'],
];

export default function Carrinho() {
  const { linhas, alterarQuantidade, remover, esvaziar, total } = useCarrinho();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [metodo, setMetodo] = useState('levantamento');
  const [morada, setMorada] = useState('');
  const [erro, setErro] = useState('');
  const [aEnviar, setAEnviar] = useState(false);

  async function encomendar() {
    setErro('');
    if (metodo === 'entrega' && !morada.trim()) {
      setErro('Indique a morada para a entrega ao domicílio.');
      return;
    }
    setAEnviar(true);
    try {
      if (USAR_DADOS_SIMULADOS) {
        guardarEncomendasSimuladas(linhas, metodo);
      } else {
        // A API cria uma encomenda por produtor e desconta o stock
        await api('/orders', {
          metodo: 'POST',
          token,
          corpo: {
            linhas: linhas.map((l) => ({ produto: l.produto._id, quantidade: l.quantidade })),
            entrega: { tipo: metodo, morada: metodo === 'entrega' ? morada.trim() : undefined },
          },
        });
      }
      esvaziar();
      navigate('/encomendas');
    } catch (e) {
      setErro(e.message);
    } finally {
      setAEnviar(false);
    }
  }

  if (linhas.length === 0) {
    return (
      <>
        <h1>Carrinho</h1>
        <p className="texto-secundario">O carrinho está vazio. <Link to="/">Explore os produtos</Link> e adicione o que precisar.</p>
      </>
    );
  }

  return (
    <>
      <h1>Carrinho</h1>
      <div className="pagina-carrinho">
        <ul className="list-group">
          {linhas.map(({ produto, quantidade }) => (
            <li key={produto._id} className="list-group-item d-flex flex-wrap align-items-center gap-2">
              <div className="me-auto">
                <p className="fw-semibold mb-0">{produto.nome}</p>
                <p className="texto-secundario small mb-0">
                  {produto.produtor?.nome} · {euro(produto.preco)} / {produto.unidade}
                </p>
              </div>

              <div className="btn-group btn-group-sm" role="group" aria-label={`Quantidade de ${produto.nome}`}>
                <button type="button" className="btn btn-outline-secondary" aria-label="Menos um"
                  onClick={() => alterarQuantidade(produto._id, quantidade - 1)}>−</button>
                <span className="btn btn-outline-secondary disabled">{quantidade}</span>
                <button type="button" className="btn btn-outline-secondary" aria-label="Mais um"
                  onClick={() => alterarQuantidade(produto._id, quantidade + 1)}>+</button>
              </div>

              <span className="fw-semibold text-end" style={{ minWidth: '5rem' }}>{euro(produto.preco * quantidade)}</span>
              <button type="button" className="btn btn-sm btn-link text-danger" onClick={() => remover(produto._id)}>
                Remover
              </button>
            </li>
          ))}
        </ul>

        <aside className="card p-3">
          <h2 className="h5">Resumo</h2>
          <fieldset className="mb-3">
            <legend className="form-label fs-6">Como quer receber?</legend>
            {METODOS.map(([valor, texto]) => (
              <div className="form-check" key={valor}>
                <input className="form-check-input" type="radio" name="metodo" id={`metodo-${valor}`} value={valor}
                  checked={metodo === valor} onChange={(e) => setMetodo(e.target.value)} />
                <label className="form-check-label" htmlFor={`metodo-${valor}`}>{texto}</label>
              </div>
            ))}
          </fieldset>

          {metodo === 'entrega' && (
            <>
              <label htmlFor="morada" className="form-label">Morada de entrega</label>
              <textarea id="morada" className="form-control mb-3" rows={2} required
                value={morada} onChange={(e) => setMorada(e.target.value)} />
            </>
          )}

          <p className="d-flex justify-content-between fw-bold fs-5">
            <span>Total</span><span>{euro(total)}</span>
          </p>
          {erro && <div className="alert alert-danger">{erro}</div>}
          <button type="button" className="btn btn-success w-100" disabled={aEnviar} onClick={encomendar}>
            {aEnviar ? 'A enviar…' : 'Encomendar'}
          </button>
          <p className="texto-secundario small mt-2 mb-0">É criada uma encomenda por produtor.</p>
        </aside>
      </div>
    </>
  );
}
