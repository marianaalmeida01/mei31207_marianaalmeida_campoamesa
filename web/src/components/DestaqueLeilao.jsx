// Cartão do leilão 
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const euro = (v) => v.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' });

// O servidor só envia terminaEm; cada cliente calcula o tempo restante
function useTempoRestante(terminaEm) {
  const calcular = () => Math.max(0, new Date(terminaEm) - Date.now());
  const [ms, setMs] = useState(calcular);

  useEffect(() => {
    setMs(calcular());
    const intervalo = setInterval(() => setMs(calcular()), 1000);
    return () => clearInterval(intervalo);
  }, [terminaEm]);

  return ms;
}

function formatar(ms) {
  const total = Math.ceil(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
  const s = String(total % 60).padStart(2, '0');
  return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
}

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