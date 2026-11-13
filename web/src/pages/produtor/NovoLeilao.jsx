// Produtor: criar leilão (POST /api/auctions)
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { api } from '../../api/client.js';

export default function NovoLeilao() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [dados, setDados] = useState({ lote: '', quantidade: '', precoBase: '', incremento: '5', duracaoMin: '10' });
  const [erro, setErro] = useState('');
  const [aEnviar, setAEnviar] = useState(false);

  const mudar = (campo) => (e) => setDados({ ...dados, [campo]: e.target.value });

  async function submeter(e) {
    e.preventDefault();
    setErro('');
    setAEnviar(true);
    try {
      const leilao = await api('/auctions', {
        metodo: 'POST',
        token,
        corpo: {
          lote: dados.lote,
          quantidade: dados.quantidade,
          precoBase: Number(dados.precoBase),
          incremento: Number(dados.incremento),
          duracaoMin: Number(dados.duracaoMin),
        },
      });
      navigate(`/leiloes/${leilao._id}`);
    } catch (err) {
      setErro(err.message);
    } finally {
      setAEnviar(false);
    }
  }

  return (
    <form className="formulario-estreito" onSubmit={submeter}>
      <h1>Criar leilão</h1>
      <p className="texto-secundario">O leilão começa logo que o criar e termina ao fim da duração escolhida.</p>

      <label htmlFor="lote" className="form-label">Lote</label>
      <input id="lote" className="form-control mb-3" required placeholder="Ex.: 200 kg de kiwi Hayward, calibre A"
        value={dados.lote} onChange={mudar('lote')} />

      <label htmlFor="quantidade" className="form-label">Quantidade</label>
      <input id="quantidade" className="form-control mb-3" placeholder="Ex.: 200 kg"
        value={dados.quantidade} onChange={mudar('quantidade')} />

      <div className="row g-3 mb-3">
        <div className="col-6">
          <label htmlFor="precoBase" className="form-label">Preço base (€)</label>
          <input id="precoBase" type="number" step="0.01" min="0" className="form-control" required
            value={dados.precoBase} onChange={mudar('precoBase')} />
        </div>
        <div className="col-6">
          <label htmlFor="incremento" className="form-label">Incremento mínimo (€)</label>
          <input id="incremento" type="number" step="0.01" min="0.01" className="form-control" required
            value={dados.incremento} onChange={mudar('incremento')} />
        </div>
      </div>

      <label htmlFor="duracao" className="form-label">Duração</label>
      <select id="duracao" className="form-select mb-3" value={dados.duracaoMin} onChange={mudar('duracaoMin')}>
        <option value="3">3 minutos (para demonstração)</option>
        <option value="10">10 minutos</option>
        <option value="30">30 minutos</option>
        <option value="60">1 hora</option>
        <option value="1440">24 horas</option>
      </select>

      {erro && <div className="alert alert-danger">{erro}</div>}
      <button type="submit" className="btn btn-success w-100" disabled={aEnviar}>
        {aEnviar ? 'A criar…' : 'Criar leilão'}
      </button>
    </form>
  );
}
