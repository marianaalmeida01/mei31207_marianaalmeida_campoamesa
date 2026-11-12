// Página de login 
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { USAR_DADOS_SIMULADOS } from '../api/client.js';

const CONTAS_TESTE = [
  ['Comprador', 'tasca@exemplo.pt'],
  ['Produtor', 'horta@exemplo.pt'],
  ['Administrador', 'admin@exemplo.pt'],
];

export default function Login() {
  const { entrar } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dados, setDados] = useState({ email: '', password: '' });
  const [erro, setErro] = useState('');

  async function submeter(e) {
    e.preventDefault();
    setErro('');
    try {
      const utilizador = await entrar(dados.email, dados.password);
      // Volta à página que pediu o login; senão vai para a página de cada papel
      const inicio = { produtor: '/produtor', admin: '/admin' }[utilizador.papel] || '/';
      navigate(location.state?.de || inicio, { replace: true });
    } catch (err) {
      setErro(err.message);
    }
  }

  return (
    <form className="formulario-estreito" onSubmit={submeter}>
      <h1>Entrar</h1>
      <label htmlFor="email" className="form-label">Email</label>
      <input id="email" type="email" className="form-control mb-3" required autoComplete="email"
        value={dados.email} onChange={(e) => setDados({ ...dados, email: e.target.value })} />
      <label htmlFor="password" className="form-label">Password</label>
      <input id="password" type="password" className="form-control mb-3" required autoComplete="current-password"
        value={dados.password} onChange={(e) => setDados({ ...dados, password: e.target.value })} />
      {erro && <div className="alert alert-danger">{erro}</div>}
      <button type="submit" className="btn btn-success w-100">Entrar</button>

      {USAR_DADOS_SIMULADOS && (
        <div className="alert alert-light border small mt-4 mb-0">
          <p className="fw-semibold mb-2">Contas de teste (password: password123)</p>
          <div className="d-flex flex-wrap gap-2">
            {CONTAS_TESTE.map(([papel, email]) => (
              <button key={email} type="button" className="btn btn-sm btn-outline-secondary"
                onClick={() => setDados({ email, password: 'password123' })}>
                {papel}
              </button>
            ))}
          </div>
        </div>
      )}
    </form>
  );
}
