// Comprador: sala de leilão em tempo real
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useLeilao } from '../hooks/useLeilao.js';
import { useLeilaoSimulado } from '../hooks/useLeilaoSimulado.js';
import { useTempoRestante, formatar } from '../hooks/useTempoRestante.js';
import { USAR_DADOS_SIMULADOS } from '../api/client.js';

// Escolhe a ligação uma única vez: simulação local ou sockets (Passo 7)
const usarLeilao = USAR_DADOS_SIMULADOS ? useLeilaoSimulado : useLeilao;

const euro = (v) => v.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' });

export default function SalaLeilao() {
  const { id } = useParams();
  const { token } = useAuth();
  const { leilao, atual, historico = [], participantes, minimo, erro, licitar } = usarLeilao(id, token);
  const ms = useTempoRestante(leilao?.terminaEm);
  const [valor, setValor] = useState('');
  const terminado = Boolean(leilao) && ms <= 0;

  if (!leilao) {
    return (
      <>
        <h1>Leilão</h1>
        <p className="texto-secundario">A carregar o leilão… Se não aparecer, volte à <Link to="/leiloes">lista de leilões</Link>.</p>
      </>
    );
  }

  return (
    <div className="sala-leilao">
      <section>
        <p className="destaque__regiao">{leilao.produtor} · {leilao.localidade}{leilao.biologico && ' · Biológico'}</p>
        <h1>{leilao.lote}</h1>
        <div className="sala-leilao__imagem" aria-hidden="true" />

        <h2 className="h5 mt-4">Histórico de licitações</h2>
        {historico.length === 0 ? (
          <p className="texto-secundario">Ainda sem licitações.</p>
        ) : (
          <ol className="historico list-unstyled mb-0">
            {historico.map((h, i) => (
              <li key={`${h.em}-${i}`} className={`historico__item${i === 0 ? ' historico__item--atual' : ''}`}>
                <span>{h.comprador}</span>
                <span className="texto-secundario small">{new Date(h.em).toLocaleTimeString('pt-PT')}</span>
                <strong>{euro(h.valor)}</strong>
              </li>
            ))}
          </ol>
        )}
      </section>

      <aside className="card p-3 sala-leilao__painel">
        <div className="d-flex justify-content-between small mb-2">
          <span className="texto-secundario">{participantes} a assistir</span>
          <span className={terminado ? 'text-danger fw-semibold' : 'fw-semibold'}>
            {terminado ? 'Terminado' : `Termina em ${formatar(ms)}`}
          </span>
        </div>

        <p className="texto-secundario small mb-0">Licitação atual</p>
        <p className="valor-atual mb-0">{atual?.valor != null ? euro(atual.valor) : '—'}</p>
        <p className="texto-secundario small">{atual?.comprador ? `por ${atual.comprador}` : ''}</p>

        <form onSubmit={(e) => { e.preventDefault(); licitar(Number(valor)); }}>
          <label htmlFor="valor" className="form-label">O seu valor (€)</label>
          <input id="valor" type="number" step="0.01" min="0" className="form-control mb-2"
            placeholder={minimo ? `mínimo ${minimo.toFixed(2)}` : ''}
            value={valor} onChange={(e) => setValor(e.target.value)} required disabled={terminado} />
          <button type="submit" className="btn btn-success w-100" disabled={terminado}>Licitar</button>
        </form>
        {erro && <div className="alert alert-warning mt-2 mb-0" role="alert">{erro}</div>}
      </aside>
    </div>
  );
}