// Visitante: página inicial com destaque, leilão em direto, filtros e catálogo (GET /api/products)
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import CartaoProduto from '../components/CartaoProduto.jsx';
import DestaqueLeilao from '../components/DestaqueLeilao.jsx';
import { useCarrinho } from '../context/CarrinhoContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api, USAR_DADOS_SIMULADOS } from '../api/client.js';
import { normalizarLeilao } from '../hooks/useLeilao.js';
import { leiloes as leiloesSimulados } from '../data/simulados.js';
import produtosSimulados from '../data/produtos.json';

const CATEGORIAS = ['Todos', 'Hortícolas', 'Fruta', 'Mel', 'Vinho', 'Queijo', 'Padaria'];

export default function Catalogo() {
  const [produtos, setProdutos] = useState([]);
  const [filtro, setFiltro] = useState({ q: '', categoria: 'Todos', bio: false });
  const [erro, setErro] = useState('');
  const carrinho = useCarrinho();
  const { utilizador } = useAuth();
  // Leilão em destaque: o primeiro a terminar dos que estão a decorrer
  const [destaque, setDestaque] = useState(USAR_DADOS_SIMULADOS ? leiloesSimulados[0] : null);

  useEffect(() => {
    if (USAR_DADOS_SIMULADOS) return;
    api('/auctions?estado=ativo')
      .then((lista) => setDestaque(lista[0] ? normalizarLeilao(lista[0]) : null))
      .catch(() => setDestaque(null));
  }, []);

  useEffect(() => {
    if (USAR_DADOS_SIMULADOS) {
      setProdutos(produtosSimulados.filter((p) =>
        (filtro.categoria === 'Todos' || p.categoria === filtro.categoria) &&
        (!filtro.bio || p.biologico) &&
        p.nome.toLowerCase().includes(filtro.q.toLowerCase())));
      return;
    }
    const q = new URLSearchParams(filtro);
    api(`/products?${q}`).then(setProdutos).catch((e) => setErro(e.message));
  }, [filtro]);

  const mudar = (campo) => (e) =>
    setFiltro((f) => ({ ...f, [campo]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  return (
    <>
      <section className="destaque">
        <div>
          <p className="destaque__regiao">Alto Minho · produção local</p>
          <h1>Direto de quem produz, para a sua mesa.</h1>
          <p className="texto-secundario">
            Produtores da região. Encomende para levantar na quinta ou receber em casa,
            e dispute os lotes da época nos leilões em direto.
          </p>
          <div className="d-flex flex-wrap gap-2">
            <a href="#produtos" className="btn btn-success rounded-pill px-4">Explorar produtos</a>
            <Link to="/registo" className="btn btn-outline-secondary rounded-pill px-4">Sou produtor</Link>
          </div>
        </div>
        {destaque && <DestaqueLeilao leilao={destaque} />}
      </section>

      <section className="filtros mb-3" aria-label="Filtros">
        <label className="visually-hidden" htmlFor="pesquisa">Pesquisar</label>
        <input id="pesquisa" type="search" className="form-control" placeholder="Pesquisar kiwi, mel, Alvarinho…"
          value={filtro.q} onChange={mudar('q')} />
        <div className="chips">
          {CATEGORIAS.map((c) => (
            <button key={c} type="button" aria-pressed={filtro.categoria === c}
              className={`btn btn-sm ${filtro.categoria === c ? 'btn-dark' : 'btn-outline-secondary bg-white'}`}
              onClick={() => setFiltro((f) => ({ ...f, categoria: c }))}>{c}</button>
          ))}
        </div>
        <div className="form-check flex-shrink-0">
          <input id="bio" className="form-check-input" type="checkbox" checked={filtro.bio} onChange={mudar('bio')} />
          <label className="form-check-label" htmlFor="bio">Só biológico</label>
        </div>
        {/* TODO: filtros por época, preço máximo e ordenação */}
      </section>

      {erro && <div className="alert alert-danger">{erro}</div>}

      <section id="produtos" className="grelha-produtos" aria-label="Produtos">
        {produtos.map((p) => (
          <CartaoProduto key={p._id} produto={p}
            onAdicionar={utilizador?.papel === 'comprador' ? () => carrinho.adicionar(p) : undefined} />
        ))}
      </section>
      {produtos.length === 0 && (
        <p className="texto-secundario">Nenhum produto corresponde aos filtros. Experimente outra categoria ou limpe a pesquisa.</p>
      )}
    </>
  );
}
