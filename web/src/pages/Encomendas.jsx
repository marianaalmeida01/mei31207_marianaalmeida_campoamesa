// Comprador: acompanhamento das encomendas (GET /api/orders)
import { useEffect, useState } from 'react';
import EstadoEncomenda from '../components/EstadoEncomenda.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api, USAR_DADOS_SIMULADOS } from '../api/client.js';
import { encomendasExemplo, lerEncomendasSimuladas } from '../data/simulados.js';

const euro = (v) => v.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' });

// Põe as encomendas da API e as simuladas no mesmo formato
const normalizar = (e) => ({
  id: e._id,
  produtor: e.produtor?.nome ?? e.produtor,
  data: e.createdAt ?? e.data,
  metodo: e.entrega?.tipo ?? e.metodo,
  estado: e.estado,
  linhas: e.linhas.map((l) => ({ nome: l.nome, quantidade: l.quantidade, preco: l.precoUnit ?? l.preco })),
  total: e.total ?? e.linhas.reduce((s, l) => s + (l.precoUnit ?? l.preco) * l.quantidade, 0),
});

export default function Encomendas() {
  const { token } = useAuth();
  const [encomendas, setEncomendas] = useState(null);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (USAR_DADOS_SIMULADOS) {
      setEncomendas([...lerEncomendasSimuladas(), ...encomendasExemplo].map(normalizar));
      return;
    }
    api('/orders', { token })
      .then((lista) => setEncomendas(lista.map(normalizar)))
      .catch((e) => setErro(e.message));
  }, [token]);

  return (
    <>
      <h1>As minhas encomendas</h1>
      {erro && <div className="alert alert-danger">{erro}</div>}
      {!encomendas && !erro && <p className="texto-secundario">A carregar…</p>}
      {encomendas?.length === 0 && <p className="texto-secundario">Ainda não fez encomendas.</p>}

      <div className="lista-encomendas">
        {encomendas?.map((e) => (
          <article key={e.id} className="card p-3">
            <div className="d-flex justify-content-between flex-wrap gap-2 mb-2">
              <div>
                <p className="fw-bold mb-0">#{String(e.id).slice(-6).toUpperCase()} · {e.produtor}</p>
                <p className="texto-secundario small mb-0">
                  {new Date(e.data).toLocaleDateString('pt-PT')} · {e.metodo === 'entrega' ? 'Entrega ao domicílio' : 'Levantamento na quinta'}
                </p>
              </div>
              <p className="fw-bold mb-0">{euro(e.total)}</p>
            </div>
            <ul className="small texto-secundario ps-3 mb-3">
              {e.linhas.map((l) => <li key={l.nome}>{l.quantidade} × {l.nome}</li>)}
            </ul>
            <EstadoEncomenda estado={e.estado} />
          </article>
        ))}
      </div>
    </>
  );
}
