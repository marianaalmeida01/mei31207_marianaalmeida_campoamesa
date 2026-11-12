// Produtor: painel de gestão (dados simulados até haver API)
import { useState } from 'react';
import { Link } from 'react-router-dom';
import CartaoProduto from '../../components/CartaoProduto.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { encomendasRecebidas, idDoProdutor, produtores } from '../../data/simulados.js';
import produtosSimulados from '../../data/produtos.json';

const ESTADOS = ['pendente', 'confirmada', 'pronta', 'entregue'];
const euro = (v) => v.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' });

export default function PainelProdutor() {
  const { utilizador } = useAuth();
  const [encomendas, setEncomendas] = useState(encomendasRecebidas);

  const perfil = produtores.find((p) => p._id === utilizador?._id);
  const meusProdutos = produtosSimulados.filter((p) => idDoProdutor(p.produtor?.nome) === utilizador?._id);

  // Indicadores calculados a partir das encomendas
  const vendas = encomendas.reduce((s, e) => s + e.total, 0);
  const porTratar = encomendas.filter((e) => e.estado !== 'entregue').length;

  function mudarEstado(id, estado) {
    // Com API: PATCH /api/orders/:id/estado (e o comprador é avisado em tempo real no Passo 7)
    setEncomendas((lista) => lista.map((e) => (e._id === id ? { ...e, estado } : e)));
  }

  return (
    <>
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
        <div>
          <p className="destaque__regiao mb-1">Painel do produtor</p>
          <h1 className="mb-0">{utilizador?.nome}</h1>
        </div>
        <Link to="/produtor/leiloes/novo" className="btn btn-success">Criar leilão</Link>
      </div>

      <section className="indicadores mb-4" aria-label="Indicadores">
        <div className="card p-3">
          <p className="texto-secundario small mb-1">Vendas do mês</p>
          <p className="indicadores__valor">{euro(vendas)}</p>
        </div>
        <div className="card p-3">
          <p className="texto-secundario small mb-1">Encomendas por tratar</p>
          <p className="indicadores__valor">{porTratar}</p>
        </div>
        <div className="card p-3">
          <p className="texto-secundario small mb-1">Avaliação média</p>
          <p className="indicadores__valor avaliacao-media">{perfil?.avaliacao.toLocaleString('pt-PT') ?? '—'}</p>
        </div>
      </section>

      <h2 className="h4">Encomendas recebidas</h2>
      <div className="table-responsive mb-4">
        <table className="table align-middle mb-0">
          <thead>
            <tr>
              <th>Encomenda</th>
              <th>Cliente</th>
              <th>Data</th>
              <th className="text-end">Total</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {encomendas.map((e) => (
              <tr key={e._id}>
                <td>#{e._id}</td>
                <td>{e.cliente}</td>
                <td>{new Date(e.data).toLocaleDateString('pt-PT')}</td>
                <td className="text-end">{euro(e.total)}</td>
                <td>
                  <label className="visually-hidden" htmlFor={`estado-${e._id}`}>Estado da encomenda {e._id}</label>
                  <select id={`estado-${e._id}`} className="form-select form-select-sm"
                    value={e.estado} onChange={(ev) => mudarEstado(e._id, ev.target.value)}>
                    {ESTADOS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="h4">Os meus produtos</h2>
      <section className="grelha-produtos" aria-label="Os meus produtos">
        {meusProdutos.map((p) => <CartaoProduto key={p._id} produto={p} />)}
      </section>
    </>
  );
}

