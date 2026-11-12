// Cartão do leilão em direto (página inicial e lista de leilões)
import { Link } from 'react-router-dom';
import { useTempoRestante, formatar } from '../hooks/useTempoRestante.js';

const euro = (v) => v.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' });

export default function DestaqueLeilao({ leilao }) {
  const ms = useTempoRestante(leilao.terminaEm);

  return (
    <aside className="leilao-destaque" aria-label="Leilão em direto">
      <div className="d-flex justify-content-between align-items-center">
        <span className="leilao-destaque__estado">Leilão em direto</span>
        <span className="small opacity-75">{leilao.participantes} compradores</span>
      </div>

      <h2 className="leilao-destaque__lote">{leilao.lote}</h2>
      <p className="leilao-destaque__origem mb-0">
        {leilao.produtor} · {leilao.localidade}{leilao.biologico && ' · Biológico'}
      </p>

      <dl className="leilao-destaque__numeros">
        <div>
          <dt>Licitação atual</dt>
          <dd>{euro(leilao.valor)}</dd>
        </div>
        <div>
          <dt>Termina em</dt>
          <dd><time>{ms > 0 ? formatar(ms) : 'Terminado'}</time></dd>
        </div>
      </dl>

      <Link to={`/leiloes/${leilao._id}`} className="btn btn-light w-100 fw-semibold">
        Entrar para licitar
      </Link>
    </aside>
  );
}