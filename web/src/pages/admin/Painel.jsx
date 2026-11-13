// Administrador: estatísticas, validação de produtores e moderação de avaliações
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { api } from '../../api/client.js';

const euro = (v) => v.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' });

export default function PainelAdmin() {
  const { token } = useAuth();
  const [estatisticas, setEstatisticas] = useState(null);
  const [pendentes, setPendentes] = useState([]);
  const [denunciadas, setDenunciadas] = useState([]);
  const [erro, setErro] = useState('');

  function carregar() {
    Promise.all([
      api('/admin/estatisticas', { token }),
      api('/admin/produtores/pendentes', { token }),
      api('/admin/reviews/denunciadas', { token }),
    ])
      .then(([e, p, d]) => { setEstatisticas(e); setPendentes(p); setDenunciadas(d); })
      .catch((err) => setErro(err.message));
  }

  useEffect(carregar, [token]);

  async function validar(id, aprovado) {
    setErro('');
    try {
      await api(`/admin/produtores/${id}/validacao`, { metodo: 'PATCH', token, corpo: { aprovado } });
      carregar();
    } catch (err) { setErro(err.message); }
  }

  async function moderar(id, visivel) {
    setErro('');
    try {
      await api(`/admin/reviews/${id}`, { metodo: 'PATCH', token, corpo: { visivel } });
      setDenunciadas((lista) => lista.filter((r) => r._id !== id));
    } catch (err) { setErro(err.message); }
  }

  const cartoes = estatisticas ? [
    ['Utilizadores', estatisticas.utilizadores],
    ['Produtores ativos', estatisticas.produtores],
    ['Por validar', estatisticas.pendentes],
    ['Encomendas hoje', estatisticas.encomendasHoje],
    ['Leilões a decorrer', estatisticas.leiloesAtivos],
    ['Vendas totais', euro(estatisticas.vendasTotal)],
  ] : [];

  return (
    <>
      <p className="destaque__regiao mb-1">Backoffice</p>
      <h1>Administração</h1>
      {erro && <div className="alert alert-danger">{erro}</div>}

      <section className="indicadores indicadores--admin mb-4" aria-label="Estatísticas">
        {cartoes.map(([titulo, valor]) => (
          <div className="card p-3" key={titulo}>
            <p className="texto-secundario small mb-1">{titulo}</p>
            <p className="indicadores__valor">{valor}</p>
          </div>
        ))}
      </section>

      <h2 className="h4">Produtores por validar</h2>
      {pendentes.length === 0 ? (
        <p className="texto-secundario mb-4">Não há registos de produtores à espera de validação.</p>
      ) : (
        <div className="table-responsive mb-4">
          <table className="table align-middle mb-0">
            <thead>
              <tr><th>Produtor</th><th>Localidade</th><th>Registado em</th><th /></tr>
            </thead>
            <tbody>
              {pendentes.map((p) => (
                <tr key={p._id}>
                  <td>
                    <strong>{p.produtor?.nomeExploracao || p.nome}</strong><br />
                    <span className="small texto-secundario">{p.email}</span>
                    {p.produtor?.descricao && <p className="small mb-0 mt-1">{p.produtor.descricao}</p>}
                  </td>
                  <td>{p.produtor?.localidade}</td>
                  <td>{new Date(p.createdAt).toLocaleDateString('pt-PT')}</td>
                  <td className="text-end text-nowrap">
                    <button type="button" className="btn btn-sm btn-success me-2" onClick={() => validar(p._id, true)}>Aprovar</button>
                    <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => validar(p._id, false)}>Rejeitar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2 className="h4">Avaliações denunciadas</h2>
      {denunciadas.length === 0 ? (
        <p className="texto-secundario">Não há avaliações denunciadas.</p>
      ) : (
        <ul className="list-group">
          {denunciadas.map((r) => (
            <li key={r._id} className="list-group-item d-flex flex-wrap justify-content-between gap-2">
              <div>
                <p className="mb-1"><span className="avaliacao-media">{r.classificacao}</span> · {r.autor?.nome} sobre {r.produtor?.nome}</p>
                <p className="mb-1">{r.comentario || <em className="texto-secundario">sem comentário</em>}</p>
                <p className="small text-danger mb-0">{r.denuncias} denúncia(s)</p>
              </div>
              <div className="text-nowrap align-self-center">
                <button type="button" className="btn btn-sm btn-outline-danger me-2" onClick={() => moderar(r._id, false)}>Ocultar</button>
                <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => moderar(r._id, true)}>Manter</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
