// Visitante: página pública do produtor (GET /api/producers/:id)
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import CartaoProduto from '../components/CartaoProduto.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useCarrinho } from '../context/CarrinhoContext.jsx';
import { api } from '../api/client.js';
import { urlMapa } from '../data/localidades.js';

export default function Produtor() {
  const { id } = useParams(); // o ":id" do endereço /produtores/:id
  const { utilizador, token } = useAuth();
  const carrinho = useCarrinho();
  const [pagina, setPagina] = useState(null); // { produtor, produtos, avaliacaoMedia, numAvaliacoes }
  const [erro, setErro] = useState('');
  const [avaliacoes, setAvaliacoes] = useState([]);
  const [denunciadas, setDenunciadas] = useState([]);

  useEffect(() => {
    setPagina(null);
    setErro('');
    api(`/producers/${id}`).then(setPagina).catch((e) => setErro(e.message));
    api(`/reviews?produtor=${id}`).then(setAvaliacoes).catch(() => setAvaliacoes([]));
  }, [id]);

  async function denunciar(reviewId) {
    try {
      await api(`/reviews/${reviewId}/denuncia`, { metodo: 'POST', token });
      setDenunciadas((l) => [...l, reviewId]);
    } catch { /* a denúncia é opcional; ignora erros */ }
  }

  if (erro) {
    return (
      <>
        <h1>Produtor não encontrado</h1>
        <p className="texto-secundario">Volte ao <Link to="/">catálogo</Link> e escolha outro produtor.</p>
      </>
    );
  }
  if (!pagina) return <p className="texto-secundario">A carregar…</p>;

  const { produtor, produtos, avaliacaoMedia, numAvaliacoes } = pagina;
  const dados = produtor.produtor || {};
  // Os produtos vêm sem o produtor preenchido; juntamos-lhe o nome e a localidade para o cartão
  const comProdutor = produtos.map((p) => ({ ...p, produtor: { _id: produtor._id, nome: produtor.nome, produtor: { localidade: dados.localidade } } }));

  return (
    <>
      <section className="perfil-produtor">
        <div>
          <p className="destaque__regiao">{dados.localidade}</p>
          <h1>{produtor.nome}</h1>
          <p className="mb-2">
            {avaliacaoMedia != null ? (
              <>
                <span className="avaliacao-media">{avaliacaoMedia.toLocaleString('pt-PT')}</span>
                <span className="texto-secundario"> ({numAvaliacoes} avaliações)</span>
              </>
            ) : (
              <span className="texto-secundario">Ainda sem avaliações</span>
            )}
          </p>
          {dados.descricao && <p>{dados.descricao}</p>}
        </div>

        <iframe className="perfil-produtor__mapa" title={`Mapa de ${dados.localidade}`}
          src={urlMapa(dados.localidade, dados.localizacao)} loading="lazy" />
      </section>

      <h2 className="h4 mb-3">Produtos disponíveis</h2>
      {comProdutor.length === 0 && <p className="texto-secundario">Este produtor ainda não tem produtos.</p>}
      <section className="grelha-produtos" aria-label={`Produtos de ${produtor.nome}`}>
        {comProdutor.map((p) => (
          <CartaoProduto key={p._id} produto={p}
            onAdicionar={utilizador?.papel === 'comprador' ? () => carrinho.adicionar(p) : undefined} />
        ))}
      </section>

      <h2 className="h4 mt-5 mb-3">Avaliações</h2>
      {avaliacoes.length === 0 ? (
        <p className="texto-secundario">Ainda ninguém avaliou este produtor.</p>
      ) : (
        <ul className="list-group">
          {avaliacoes.map((r) => (
            <li key={r._id} className="list-group-item">
              <div className="d-flex justify-content-between flex-wrap gap-2">
                <span><span className="avaliacao-media">{r.classificacao}</span> · <strong>{r.autor?.nome}</strong></span>
                <span className="small texto-secundario">{new Date(r.createdAt).toLocaleDateString('pt-PT')}</span>
              </div>
              {r.comentario && <p className="mb-1 mt-1">{r.comentario}</p>}
              {utilizador && (denunciadas.includes(r._id)
                ? <span className="small texto-secundario">Denúncia enviada</span>
                : <button type="button" className="btn btn-link btn-sm p-0 text-danger" onClick={() => denunciar(r._id)}>Denunciar</button>)}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
