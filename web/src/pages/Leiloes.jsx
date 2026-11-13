// Lista de leilões a decorrer (GET /api/auctions?estado=ativo)
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DestaqueLeilao from '../components/DestaqueLeilao.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api, USAR_DADOS_SIMULADOS } from '../api/client.js';
import { normalizarLeilao } from '../hooks/useLeilao.js';
import { leiloes as leiloesSimulados } from '../data/simulados.js';

export default function Leiloes() {
  const { utilizador } = useAuth();
  const [leiloes, setLeiloes] = useState(USAR_DADOS_SIMULADOS ? leiloesSimulados : null);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (USAR_DADOS_SIMULADOS) return;
    api('/auctions?estado=ativo')
      .then((lista) => setLeiloes(lista.map(normalizarLeilao)))
      .catch((e) => setErro(e.message));
  }, []);

  return (
    <>
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
        <h1 className="mb-0">Leilões em direto</h1>
        {utilizador?.papel === 'produtor' && <Link to="/produtor/leiloes/novo" className="btn btn-success">Criar leilão</Link>}
      </div>
      <p className="texto-secundario mb-4">
        Lotes da época vendidos a quem licitar mais. Entre na sala para acompanhar em tempo real.
      </p>

      {erro && <div className="alert alert-danger">{erro}</div>}
      {!leiloes && !erro && <p className="texto-secundario">A carregar…</p>}
      {leiloes?.length === 0 && <p className="texto-secundario">Não há leilões a decorrer neste momento. Volte mais tarde.</p>}

      <section className="grelha-leiloes" aria-label="Leilões ativos">
        {leiloes?.map((l) => <DestaqueLeilao key={l._id} leilao={l} />)}
      </section>
    </>
  );
}
