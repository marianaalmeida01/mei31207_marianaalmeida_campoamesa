// Estado global da sessão (utilizador + token), partilhado por todas as páginas
import { createContext, useContext, useState } from 'react';
import { api, USAR_DADOS_SIMULADOS } from '../api/client.js';
import { utilizadores } from '../data/simulados.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Ao abrir o site, recupera a sessão guardada no browser (se existir)
  const [sessao, setSessao] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sessao')) || null; } catch { return null; }
  });

  function guardarSessao(nova) {
    localStorage.setItem('sessao', JSON.stringify(nova));
    setSessao(nova);
  }

  async function entrar(email, password) {
    if (USAR_DADOS_SIMULADOS) {
      // Sem API: aceita as contas de teste com a password "password123"
      const utilizador = utilizadores.find((u) => u.email === email.trim().toLowerCase());
      if (!utilizador || password !== 'password123') throw new Error('Email ou password incorretos.');
      guardarSessao({ token: 'token-simulado', utilizador });
      return utilizador;
    }
    // Com API (Passo 6): o servidor valida a password e devolve { token, utilizador }
    const resposta = await api('/auth/login', { metodo: 'POST', corpo: { email, password } });
    guardarSessao(resposta);
    return resposta.utilizador;
  }

  function sair() {
    localStorage.removeItem('sessao');
    setSessao(null);
  }

  return (
    <AuthContext.Provider value={{
      utilizador: sessao?.utilizador || null,
      token: sessao?.token || null,
      entrar, sair, guardarSessao
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);