// Produtor: painel de gestão (encomendas recebidas, indicadores e catálogo)
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { api } from '../../api/client.js';

const ESTADOS = ['pendente', 'confirmada', 'pronta', 'entregue'];
const CATEGORIAS = ['Hortícolas', 'Fruta', 'Mel', 'Vinho', 'Queijo', 'Padaria', 'Outros'];
const euro = (v) => v.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' });
const PRODUTO_VAZIO = { nome: '', categoria: 'Hortícolas', preco: '', unidade: 'kg', stock: '', biologico: false };

export default function PainelProdutor() {
  const { utilizador, token } = useAuth();
  const [encomendas, setEncomendas] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [avaliacao, setAvaliacao] = useState(null);
  const [novo, setNovo] = useState(PRODUTO_VAZIO);
  const [erro, setErro] = useState('');

  // Carrega tudo o que o painel precisa (os três pedidos correm em paralelo)
  useEffect(() => {
    if (!utilizador) return;
    Promise.all([
      api('/orders', { token }),
      api(`/products?produtor=${utilizador._id}`),
      api(`/producers/${utilizador._id}`).catch(() => null), // produtor ainda não validado -> sem página pública
    ])
      .then(([listaEncomendas, listaProdutos, pagina]) => {
        setEncomendas(listaEncomendas);
        setProdutos(listaProdutos);
        setAvaliacao(pagina?.avaliacaoMedia ?? null);
      })
      .catch((e) => setErro(e.message));
  }, [utilizador, token]);

  // Indicadores calculados a partir dos dados reais
  const agora = new Date();
  const vendasMes = encomendas
    .filter((e) => { const d = new Date(e.createdAt); return d.getMonth() === agora.getMonth() && d.getFullYear() === agora.getFullYear(); })
    .reduce((s, e) => s + (e.total || 0), 0);
  const porTratar = encomendas.filter((e) => e.estado !== 'entregue').length;
  const stockBaixo = produtos.filter((p) => p.stock <= 5);

  async function mudarEstado(id, estado) {
    setErro('');
    try {
      const atualizada = await api(`/orders/${id}/estado`, { metodo: 'PATCH', token, corpo: { estado } });
      setEncomendas((lista) => lista.map((e) => (e._id === id ? { ...e, estado: atualizada.estado } : e)));
    } catch (e) {
      setErro(e.message);
    }
  }

  async function criarProduto(e) {
    e.preventDefault();
    setErro('');
    try {
      const criado = await api('/products', {
        metodo: 'POST',
        token,
        corpo: { ...novo, preco: Number(novo.preco), stock: Number(novo.stock || 0) },
      });
      setProdutos((lista) => [...lista, criado]);
      setNovo(PRODUTO_VAZIO);
    } catch (err) {
      setErro(err.message);
    }
  }

  async function apagarProduto(id) {
    setErro('');
    try {
      await api(`/products/${id}`, { metodo: 'DELETE', token });
      setProdutos((lista) => lista.filter((p) => p._id !== id));
    } catch (err) {
      setErro(err.message);
    }
  }

  const mudarNovo = (campo) => (e) =>
    setNovo({ ...novo, [campo]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  return (
    <>
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
        <div>
          <p className="destaque__regiao mb-1">Painel do produtor</p>
          <h1 className="mb-0">{utilizador?.nome}</h1>
        </div>
        <Link to="/produtor/leiloes/novo" className="btn btn-success">Criar leilão</Link>
      </div>

      {erro && <div className="alert alert-danger">{erro}</div>}

      <section className="indicadores mb-4" aria-label="Indicadores">
        <div className="card p-3">
          <p className="texto-secundario small mb-1">Vendas do mês</p>
          <p className="indicadores__valor">{euro(vendasMes)}</p>
        </div>
        <div className="card p-3">
          <p className="texto-secundario small mb-1">Encomendas por tratar</p>
          <p className="indicadores__valor">{porTratar}</p>
        </div>
        <div className="card p-3">
          <p className="texto-secundario small mb-1">Avaliação média</p>
          <p className="indicadores__valor">
            {avaliacao != null ? <span className="avaliacao-media">{avaliacao.toLocaleString('pt-PT')}</span> : '—'}
          </p>
        </div>
      </section>

      {stockBaixo.length > 0 && (
        <div className="alert alert-warning">
          Stock baixo: {stockBaixo.map((p) => `${p.nome} (${p.stock} ${p.unidade})`).join(', ')}
        </div>
      )}

      <h2 className="h4">Encomendas recebidas</h2>
      {encomendas.length === 0 ? (
        <p className="texto-secundario">Ainda não recebeu encomendas.</p>
      ) : (
        <div className="table-responsive mb-4">
          <table className="table align-middle mb-0">
            <thead>
              <tr>
                <th>Encomenda</th>
                <th>Cliente</th>
                <th>Produtos</th>
                <th className="text-end">Total</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {encomendas.map((e) => (
                <tr key={e._id}>
                  <td>#{e._id.slice(-6).toUpperCase()}<br /><span className="small texto-secundario">{new Date(e.createdAt).toLocaleDateString('pt-PT')}</span></td>
                  <td>{e.comprador?.nome}<br /><span className="small texto-secundario">{e.entrega?.tipo === 'entrega' ? 'Entrega' : 'Levantamento'}</span></td>
                  <td className="small">{e.linhas.map((l) => `${l.quantidade} × ${l.nome}`).join(', ')}</td>
                  <td className="text-end">{euro(e.total || 0)}</td>
                  <td>
                    <label className="visually-hidden" htmlFor={`estado-${e._id}`}>Estado da encomenda</label>
                    {/* Só deixa escolher o estado atual ou os seguintes (o estado só avança) */}
                    <select id={`estado-${e._id}`} className="form-select form-select-sm"
                      value={e.estado} disabled={e.estado === 'entregue'}
                      onChange={(ev) => mudarEstado(e._id, ev.target.value)}>
                      {ESTADOS.slice(ESTADOS.indexOf(e.estado)).map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2 className="h4">Os meus produtos</h2>
      <div className="table-responsive mb-3">
        <table className="table align-middle mb-0">
          <thead>
            <tr><th>Produto</th><th>Categoria</th><th className="text-end">Preço</th><th className="text-end">Stock</th><th /></tr>
          </thead>
          <tbody>
            {produtos.map((p) => (
              <tr key={p._id}>
                <td>{p.nome}{p.biologico && <span className="badge text-bg-success ms-2">Bio</span>}</td>
                <td>{p.categoria}</td>
                <td className="text-end">{euro(p.preco)} / {p.unidade}</td>
                <td className="text-end">{p.stock}</td>
                <td className="text-end">
                  <button type="button" className="btn btn-sm btn-link text-danger" onClick={() => apagarProduto(p._id)}>Apagar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form className="card p-3 novo-produto" onSubmit={criarProduto}>
        <h3 className="h6">Adicionar produto</h3>
        <div className="novo-produto__campos">
          <input className="form-control" placeholder="Nome" aria-label="Nome" required value={novo.nome} onChange={mudarNovo('nome')} />
          <select className="form-select" aria-label="Categoria" value={novo.categoria} onChange={mudarNovo('categoria')}>
            {CATEGORIAS.map((c) => <option key={c}>{c}</option>)}
          </select>
          <input className="form-control" type="number" step="0.01" min="0" placeholder="Preço (€)" aria-label="Preço" required value={novo.preco} onChange={mudarNovo('preco')} />
          <input className="form-control" placeholder="Unidade (kg, unid.)" aria-label="Unidade" value={novo.unidade} onChange={mudarNovo('unidade')} />
          <input className="form-control" type="number" min="0" placeholder="Stock" aria-label="Stock" value={novo.stock} onChange={mudarNovo('stock')} />
          <div className="form-check align-self-center">
            <input id="novo-bio" className="form-check-input" type="checkbox" checked={novo.biologico} onChange={mudarNovo('biologico')} />
            <label className="form-check-label" htmlFor="novo-bio">Biológico</label>
          </div>
          <button type="submit" className="btn btn-success">Adicionar</button>
        </div>
      </form>
    </>
  );
}
