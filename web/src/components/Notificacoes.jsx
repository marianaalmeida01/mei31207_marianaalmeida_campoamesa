// Avisos em tempo real (toasts) que aparecem em qualquer página
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useNotificacoes } from '../hooks/useNotificacoes.js';

function Aviso({ notificacao, fechar }) {
  // Fecha sozinho ao fim de 8 segundos
  useEffect(() => {
    const t = setTimeout(() => fechar(notificacao.id), 8000);
    return () => clearTimeout(t);
  }, [notificacao.id, fechar]);

  return (
    <div className="toast show notificacao" role="status">
      <div className="toast-header">
        <strong className="me-auto">{notificacao.titulo}</strong>
        <button type="button" className="btn-close" aria-label="Fechar" onClick={() => fechar(notificacao.id)} />
      </div>
      <div className="toast-body">
        {notificacao.texto}{' '}
        {notificacao.link && <Link to={notificacao.link} onClick={() => fechar(notificacao.id)}>Ver</Link>}
      </div>
    </div>
  );
}

export default function Notificacoes() {
  const { token } = useAuth();
  const { notificacoes, fechar } = useNotificacoes(token);

  return (
    <div className="zona-notificacoes" aria-live="polite">
      {notificacoes.map((n) => <Aviso key={n.id} notificacao={n} fechar={fechar} />)}
    </div>
  );
}
