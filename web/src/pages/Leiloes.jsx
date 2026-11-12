// Lista de leilões ativos e agendados
import DestaqueLeilao from '../components/DestaqueLeilao.jsx';
import { leiloes } from '../data/simulados.js';

export default function Leiloes() {
  return (
    <>
      <h1>Leilões em direto</h1>
      <p className="texto-secundario mb-4">
        Lotes da época vendidos a quem licitar mais. Entre na sala para acompanhar em tempo real.
      </p>

      <section className="grelha-leiloes" aria-label="Leilões ativos">
        {leiloes.map((l) => <DestaqueLeilao key={l._id} leilao={l} />)}
      </section>
    </>
  );
}
