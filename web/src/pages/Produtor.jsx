// Visitante: página pública do produtor
import { Link, useParams } from 'react-router-dom';
import CartaoProduto from '../components/CartaoProduto.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useCarrinho } from '../context/CarrinhoContext.jsx';
import { produtores, idDoProdutor } from '../data/simulados.js';
import produtosSimulados from '../data/produtos.json';

export default function Produtor() {
  const { id } = useParams(); // o ":id" do endereço /produtores/:id
  const { utilizador } = useAuth();
  const carrinho = useCarrinho();

  const produtor = produtores.find((p) => p._id === id);

  if (!produtor) {
    return (
      <>
        <h1>Produtor não encontrado</h1>
        <p className="texto-secundario">Volte ao <Link to="/">catálogo</Link> e escolha outro produtor.</p>
      </>
    );
  }

  const produtos = produtosSimulados.filter((p) => idDoProdutor(p.produtor?.nome) === id);

  // Mapa do OpenStreetMap centrado na localidade do produtor not key
  const { lat, lng } = produtor;
  const mapa = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.06},${lat - 0.04},${lng + 0.06},${lat + 0.04}&layer=mapnik&marker=${lat},${lng}`;

  return (
    <>
      <section className="perfil-produtor">
        <div>
          <p className="destaque__regiao">{produtor.localidade} · produtor desde {produtor.desde}</p>
          <h1>{produtor.nome}</h1>
          <p className="mb-2">
            <span className="avaliacao-media">{produtor.avaliacao.toLocaleString('pt-PT')}</span>
            <span className="texto-secundario"> ({produtor.numAvaliacoes} avaliações)</span>
          </p>
          <p>{produtor.descricao}</p>
          <ul className="list-unstyled texto-secundario small mb-0">
            {produtor.metodos.map((m) => <li key={m}>✓ {m}</li>)}
          </ul>
        </div>

        <iframe className="perfil-produtor__mapa" title={`Mapa de ${produtor.localidade}`} src={mapa} loading="lazy" />
      </section>

      <h2 className="h4 mb-3">Produtos disponíveis</h2>
      <section className="grelha-produtos" aria-label={`Produtos de ${produtor.nome}`}>
        {produtos.map((p) => (
          <CartaoProduto key={p._id} produto={p}
            onAdicionar={utilizador?.papel === 'comprador' ? () => carrinho.adicionar(p) : undefined} />
        ))}
      </section>
    </>
  );
}