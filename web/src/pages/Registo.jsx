// Registo de comprador ou produtor (POST /api/auth/registo)
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import { COORDENADAS } from '../data/localidades.js';

export default function Registo() {
  const navigate = useNavigate();
  const [dados, setDados] = useState({
    nome: '', email: '', password: '', papel: 'comprador', nomeExploracao: '', localidade: '', descricao: '',
  });
  const [erro, setErro] = useState('');
  const [aEnviar, setAEnviar] = useState(false);

  const mudar = (campo) => (e) => setDados({ ...dados, [campo]: e.target.value });
  const ehProdutor = dados.papel === 'produtor';

  async function submeter(e) {
    e.preventDefault();
    setErro('');
    setAEnviar(true);
    try {
      const { nomeExploracao, localidade, descricao, ...base } = dados;
      await api('/auth/registo', {
        metodo: 'POST',
        corpo: ehProdutor ? { ...base, produtor: { nomeExploracao, localidade, descricao } } : base,
      });
      navigate('/login', { state: { registado: ehProdutor ? 'produtor' : 'comprador' } });
    } catch (err) {
      setErro(err.message);
    } finally {
      setAEnviar(false);
    }
  }

  return (
    <form className="formulario-estreito" onSubmit={submeter}>
      <h1>Criar conta</h1>

      <fieldset className="mb-3">
        <legend className="form-label fs-6">Tipo de conta</legend>
        {[['comprador', 'Comprador (particular ou restaurante)'], ['produtor', 'Produtor']].map(([valor, texto]) => (
          <div className="form-check" key={valor}>
            <input className="form-check-input" type="radio" name="papel" id={`papel-${valor}`} value={valor}
              checked={dados.papel === valor} onChange={mudar('papel')} />
            <label className="form-check-label" htmlFor={`papel-${valor}`}>{texto}</label>
          </div>
        ))}
      </fieldset>

      <label htmlFor="nome" className="form-label">Nome</label>
      <input id="nome" className="form-control mb-3" required value={dados.nome} onChange={mudar('nome')} />

      <label htmlFor="email" className="form-label">Email</label>
      <input id="email" type="email" className="form-control mb-3" required autoComplete="email"
        value={dados.email} onChange={mudar('email')} />

      <label htmlFor="password" className="form-label">Password</label>
      <input id="password" type="password" className="form-control mb-1" required minLength={8} autoComplete="new-password"
        value={dados.password} onChange={mudar('password')} />
      <p className="texto-secundario small mb-3">Pelo menos 8 caracteres.</p>

      {ehProdutor && (
        <>
          <label htmlFor="nomeExploracao" className="form-label">Nome da exploração</label>
          <input id="nomeExploracao" className="form-control mb-3" required
            value={dados.nomeExploracao} onChange={mudar('nomeExploracao')} />

          <label htmlFor="localidade" className="form-label">Localidade</label>
          <select id="localidade" className="form-select mb-3" required value={dados.localidade} onChange={mudar('localidade')}>
            <option value="">Escolha…</option>
            {Object.keys(COORDENADAS).map((l) => <option key={l} value={l}>{l}</option>)}
          </select>

          <label htmlFor="descricao" className="form-label">Apresentação</label>
          <textarea id="descricao" className="form-control mb-3" rows={3}
            value={dados.descricao} onChange={mudar('descricao')} />

          <div className="alert alert-light border small">
            A conta de produtor fica visível no mercado depois de ser validada pelo administrador.
          </div>
        </>
      )}

      {erro && <div className="alert alert-danger">{erro}</div>}
      <button type="submit" className="btn btn-success w-100" disabled={aEnviar}>
        {aEnviar ? 'A criar conta…' : 'Criar conta'}
      </button>
      <p className="texto-secundario small mt-3 mb-0">Já tem conta? <Link to="/login">Entrar</Link></p>
    </form>
  );
}
