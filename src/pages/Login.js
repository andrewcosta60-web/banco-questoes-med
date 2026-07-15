import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  
  const { login, carregando, erro, setErro, usuario } = useAuth();
  const navigate = useNavigate();

  // Se usuário já tá logado, redireciona pro dashboard
  useEffect(() => {
    if (usuario) {
      navigate('/dashboard');
    }
  }, [usuario, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErro(''); // Limpa erros anteriores

    // Valida campos
    if (!email || !senha) {
      setErro('Preencha email e senha');
      return;
    }

    if (!email.includes('@')) {
      setErro('Email inválido');
      return;
    }

    // Tenta fazer login
    const sucesso = await login(email, senha);

    if (sucesso) {
      // Login funcionou! Redireciona para dashboard
      navigate('/dashboard');
    }
    // Se não funcionou, o erro já está no estado "erro"
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* HEADER */}
        <div style={styles.header}>
          <h1 style={styles.titulo}>🏥 Banco de Questões</h1>
          <p style={styles.subtitulo}>Sistema de Estudo para Residência Médica</p>
        </div>

        {/* FORMULÁRIO */}
        <form onSubmit={handleLogin} style={styles.form}>
          <h2 style={styles.formTitulo}>Fazer Login</h2>

          {/* MENSAGEM DE ERRO */}
          {erro && (
            <div style={styles.erroBox}>
              <span style={styles.erroIcon}>⚠️</span>
              <span>{erro}</span>
            </div>
          )}

          {/* CAMPO EMAIL */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              placeholder="seu@email.com"
              disabled={carregando}
            />
          </div>

          {/* CAMPO SENHA */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Senha:</label>
            <div style={styles.senhaContainer}>
              <input
                type={mostrarSenha ? 'text' : 'password'}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                style={styles.input}
                placeholder="Sua senha"
                disabled={carregando}
              />
              <button
                type="button"
                onClick={() => setMostrarSenha(!mostrarSenha)}
                style={styles.olhoButton}
                disabled={carregando}
              >
                {mostrarSenha ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          {/* BOTÃO LOGIN */}
          <button
            type="submit"
            style={{
              ...styles.botao,
              opacity: carregando ? 0.7 : 1,
              cursor: carregando ? 'not-allowed' : 'pointer',
            }}
            disabled={carregando}
          >
            {carregando ? '⏳ Entrando...' : '✓ Fazer Login'}
          </button>
        </form>

        {/* LINK PARA SIGNUP */}
        <div style={styles.footer}>
          <p>
            Não tem conta?{' '}
            <Link to="/signup" style={styles.link}>
              Crie uma aqui
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

// ESTILOS (CSS em JavaScript)
const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    padding: '20px',
  },

  card: {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    maxWidth: '450px',
    width: '100%',
    overflow: 'hidden',
  },

  header: {
    backgroundColor: '#007bff',
    color: 'white',
    padding: '30px 20px',
    textAlign: 'center',
  },

  titulo: {
    margin: '0 0 10px 0',
    fontSize: '28px',
    fontWeight: 'bold',
  },

  subtitulo: {
    margin: '0',
    fontSize: '14px',
    opacity: 0.9,
  },

  form: {
    padding: '30px 20px',
  },

  formTitulo: {
    fontSize: '22px',
    fontWeight: '600',
    marginBottom: '20px',
    color: '#333',
  },

  formGroup: {
    marginBottom: '20px',
  },

  label: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: '500',
    color: '#333',
    fontSize: '14px',
  },

  input: {
    width: '100%',
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '16px',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    transition: 'border-color 0.3s',
  },

  senhaContainer: {
    position: 'relative',
    display: 'flex',
  },

  olhoButton: {
    position: 'absolute',
    right: '10px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '18px',
    padding: '5px',
  },

  erroBox: {
    backgroundColor: '#fee',
    border: '1px solid #fcc',
    color: '#c00',
    padding: '12px',
    borderRadius: '6px',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '14px',
  },

  erroIcon: {
    fontSize: '18px',
  },

  botao: {
    width: '100%',
    padding: '14px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
  },

  footer: {
    textAlign: 'center',
    padding: '20px',
    backgroundColor: '#f9f9f9',
    borderTop: '1px solid #eee',
    fontSize: '14px',
    color: '#666',
  },

  link: {
    color: '#007bff',
    textDecoration: 'none',
    fontWeight: '600',
    cursor: 'pointer',
  },
};