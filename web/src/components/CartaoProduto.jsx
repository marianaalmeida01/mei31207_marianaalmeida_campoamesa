// Componente reutilizável: cartão de produto do catálogo
import { Link } from 'react-router-dom';
import { idDoProdutor } from '../data/simulados.js';

const euro = (v) => v.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' });

// Hortícolas, fruta, carne, peixe, laticínios, bebidas, mercearia, padaria, outros
const slug = (texto = '') => texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export default function CartaoProduto({ produto, onAdicionar }) {
  const etiqueta = produto.etiqueta ?? (produto.biologico ? 'Bio' : null);
  const localidade = produto.produtor?.produtor?.localidade;
  // Com a API real o produtor terá _id; com os dados simulados usamos o nome
  const produtorId = produto.produtor?._id ?? idDoProdutor(produto.produtor?.nome);

  return (
    <article className="card cartao-produto h-100">
      <div className={`cartao-produto__imagem cartao-produto__imagem--${slug(produto.categoria)}`}>
        {produto.imagemUrl && <img src={produto.imagemUrl} alt={produto.nome} loading="lazy" />}
        {etiqueta && <span className="cartao-produto__etiqueta">{etiqueta}</span>}
      </div>

      <div className="card-body d-flex flex-column">
        <h3 className="h6 mb-1">{produto.nome}</h3>
        <p className="texto-secundario small mb-2">
          <Link to={`/produtores/${produtorId}`} className="link-secondary">{produto.produtor?.nome}</Link>
          {localidade && ` · ${localidade}`}
        </p>

        <div className="d-flex justify-content-between align-items-baseline mt-auto">
          <p className="preco mb-0">
            {euro(produto.preco)} <span className="texto-secundario small fw-normal">/ {produto.unidade}</span>
          </p>
          {produto.avaliacao && (
            <span className="cartao-produto__avaliacao" aria-label={`Avaliação ${produto.avaliacao} em 5`}>
              {produto.avaliacao.toLocaleString('pt-PT')}
            </span>
          )}
        </div>

        {onAdicionar && (
          <button type="button" className="btn btn-success w-100 mt-3" onClick={onAdicionar}>
            Adicionar ao carrinho
          </button>
        )}
      </div>
    </article>
  );
}