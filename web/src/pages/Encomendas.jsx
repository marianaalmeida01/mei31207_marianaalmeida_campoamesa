// Comprador: acompanhamento das encomendas (GET /api/orders), atualizado em tempo real
import { useEffect, useState } from 'react';
import EstadoEncomenda from '../components/EstadoEncomenda.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api, USAR_DADOS_SIMULADOS } from '../api/client.js';
import { encomendasExemplo, lerEncomendasSimuladas } from '../data/simulados.js';

const euro = (v) => v.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' });

// Formulário para avaliar o produtor depois de a encomenda ser entregue (POST /api/reviews)
function Avaliar({ encomendaId, token, onAvaliada }) {
  const [aberto, setAberto] = useState(false);
  const [classificacao, setClassificacao] = useState('5');
  const [comentario, setComentario] = useState('');
  const [erro, setErro] = useState('');
  const [avaliadas, setAvaliadas] = useState([]); // ids das encomendas avaliadas nesta visita

  if (!aberto) {
    return (
      <button type="button" className="btn btn-sm btn-outline-success mt-3" onClick={() => setAberto(true)}>
        Avaliar o produtor
      </button>
    );
  }

  async function enviar(e) {
    e.preventDefault();
    setErro('');
    try {
      await api('/reviews', { metodo: 'POST', token, corpo: { encomenda: encomendaId, classificacao: Number(classificacao), comentario } });
      onAvaliada();
    } catch (err) {
      setErro(err.message);
    }
  }

  return (
    <form className="mt-3" onSubmit={enviar}>
      <label htmlFor={`nota-${encomendaId}`} className="form-label small">Classificação</label>
      <select id={`nota-${encomendaId}`} className="form-select form-select-sm mb-2" value={classificacao}
        onChange={(e) => setClassificacao(e.target.value)}>
        {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{'★'.repeat(n)}{'☆'.repeat(5 - n)} ({n})</option>)}
      </select>
      <label htmlFor={`comentario-${encomendaId}`} className="form-label small">Comentário (opcional)</label>
      <textarea id={`comentario-${encomendaId}`} className="form-control form-control-sm mb-2" rows={2}
        value={comentario} onChange={(e) => setComentario(e.target.value)} />
      {erro && <div className="alert alert-warning py-1 small">{erro}</div>}
      <button type="submit" className="btn btn-sm btn-success">Enviar avaliação</button>
    </form>
  );
}

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

  // Passo 7: quando o produtor muda o estado, a encomenda atualiza-se aqui sem recarregar a página
  useEffect(() => {
    const atualizar = (ev) => setEncomendas((lista) => lista?.map((e) =>
      (String(e.id) === String(ev.detail.id) ? { ...e, estado: ev.detail.estado } : e)));
    window.addEventListener('encomenda-atualizada', atualizar);
    return () => window.removeEventListener('encomenda-atualizada', atualizar);
  }, []);

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
            {avaliadas.includes(e.id) && <p className="small text-success mt-3 mb-0">Obrigado pela sua avaliação!</p>}
            {e.estado === 'entregue' && !USAR_DADOS_SIMULADOS && !avaliadas.includes(e.id) && (
              <Avaliar encomendaId={e.id} token={token} onAvaliada={() => setAvaliadas((l) => [...l, e.id])} />
            )}
          </article>
        ))}
      </div>
    </>
  );
}
