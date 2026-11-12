// Navegação inferior tablete/telemóvel
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useCarrinho } from '../context/CarrinhoContext.jsx';

const Icone = ({ children }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);

const icones = {
  inicio: <Icone><path d="M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z" /></Icone>,
  leiloes: <Icone><path d="m14 13-8.5 8.5a2.1 2.1 0 0 1-3-3L11 10" /><path d="m16 16 6-6" /><path d="m8 8 6-6" /><path d="m9 7 8 8" /></Icone>,
  carrinho: <Icone><circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" /><path d="M2 2h3l2.7 12.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" /></Icone>,
  caixa: <Icone><path d="M21 8 12 3 3 8v8l9 5 9-5z" /><path d="m3 8 9 5 9-5M12 13v8" /></Icone>,
  pessoa: <Icone><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></Icone>,
};

export default function BarraInferior() {
  const { utilizador, sair } = useAuth();
  const { linhas } = useCarrinho();
  const papel = utilizador?.papel;

  const itens = [
    { to: '/', texto: 'Início', icone: icones.inicio, end: true },
    { to: '/leiloes', texto: 'Leilões', icone: icones.leiloes },
    ...(papel === 'comprador' ? [
      { to: '/carrinho', texto: 'Carrinho', icone: icones.carrinho, contador: linhas.length },
      { to: '/encomendas', texto: 'Encomendas', icone: icones.caixa },
    ] : []),
    ...(papel === 'produtor' ? [{ to: '/produtor', texto: 'Painel', icone: icones.caixa }] : []),
    ...(papel === 'admin' ? [{ to: '/admin', texto: 'Admin', icone: icones.caixa }] : []),
    ...(!utilizador ? [{ to: '/login', texto: 'Entrar', icone: icones.pessoa }] : []),
  ];

  return (
    <nav className="barra-inferior" aria-label="Navegação telemóvel">
      {itens.map(({ to, texto, icone, end, contador }) => (
        <NavLink key={to} to={to} end={end} className="barra-inferior__item">
          {icone}
          {texto}
          {contador > 0 && (
            <span className="barra-inferior__contador" aria-label={`${contador} no carrinho`}>{contador}</span>
          )}
        </NavLink>
      ))}
      {utilizador && (
        <button type="button" className="barra-inferior__item" onClick={sair}>
          {icones.pessoa}
          Sair
        </button>
      )}
    </nav>
  );
}