// Comprador: acompanhamento das encomendas
import { useEffect, useState } from 'react';
import EstadoEncomenda from '../components/EstadoEncomenda.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api, USAR_DADOS_SIMULADOS } from '../api/client.js';
import { encomendasExemplo, lerEncomendasSimuladas } from '../data/simulados.js';

const euro = (v) => v.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' });
const totalDe = (encomenda) => encomenda.linhas.reduce((s, l) => s + l.preco * l.quantidade, 0);

export default function Encomendas() {
  const { token } = useAuth();
  const [encomendas, setEncomendas] = useState([]);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (USAR_DADOS_SIMULADOS) {
      setEncomendas([...lerEncomendasSimuladas(), ...encomendasExemplo]);
      return;
    }
    // Com API: GET /api/orders devolve as encomendas do comprador (ajustes futuros)
    api('/orders', { token }).then(setEncomendas).catch((e) => setErro(e.message));
  }, [token]);

  return (
    <>
      <h1>As minhas encomendas</h1>
      {erro && <div className="alert alert-danger">{erro}</div>}
      {encomendas.length === 0 && !erro && <p className="texto-secundario">Ainda não fez encomendas.</p>}

      <div className="lista-encomendas">
        {encomendas.map((e) => (
          <article key={e._id} className="card p-3">
            <div className="d-flex justify-content-between flex-wrap gap-2 mb-2">
              <div>
                <p className="fw-bold mb-0">#{e._id} · {e.produtor}</p>
                <p className="texto-secundario small mb-0">
                  {new Date(e.data).toLocaleDateString('pt-PT')} · {e.metodo === 'entrega' ? 'Entrega ao domicílio' : 'Levantamento na quinta'}
                </p>
              </div>
              <p className="fw-bold mb-0">{euro(totalDe(e))}</p>
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