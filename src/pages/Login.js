import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import { cores } from '../styles/theme';

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
          <div style={styles.marca}>
            <div style={styles.marcaPonto} />
            <h1 style={styles.titulo}>Banco de Questões</h1>
          </div>
          <p style={styles.subtitulo}>Sistema de Estudo para Residência Médica</p>
        </div>

        {/* FORMULÁRIO */}
        <form onSubmit={handleLogin} style={styles.form}>
          <h2 style={styles.formTitulo}>Fazer Login</h2>

          {/* MENSAGEM DE ERRO */}
          {erro && (
            <div style={styles.erroBox}>
              <span>{erro}</span>
            </div>
          )}

          {/* CAMPO EMAIL */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Email</label>
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
            <label style={styles.label}>Senha</label>
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
                {mostrarSenha ? 'Ocultar' : 'Ver'}
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
            {carregando ? 'Entrando...' : 'Fazer Login'}
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
    backgroundColor: cores.fundoPagina,
    padding: '20px',
  },

  card: {
    backgroundColor: cores.branco,
    border: '1px solid ' + cores.borda,
    borderRadius: '12px',
    maxWidth: '440px',
    width: '100%',
    overflow: 'hidden',
  },

  header: {
    backgroundColor: cores.navy,
    color: cores.branco,
    padding: '30px 24px',
    textAlign: 'center',
  },

  marca: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    marginBottom: '8px',
  },

  marcaPonto: {
    width: '9px',
    height: '9px',
    borderRadius: '50%',
    backgroundColor: cores.teal,
    flexShrink: 0,
  },

  titulo: {
    margin: 0,
    fontSize: '22px',
    fontWeight: '700',
  },

  subtitulo: {
    margin: 0,
    fontSize: '13.5px',
    color: cores.textoClaro,
  },

  form: {
    padding: '28px 24px',
  },

  formTitulo: {
    fontSize: '18px',
    fontWeight: '700',
    marginBottom: '20px',
    color: cores.texto,
  },

  formGroup: {
    marginBottom: '18px',
  },

  label: {
    display: 'block',
    marginBottom: '6px',
    fontWeight: '600',
    color: cores.texto,
    fontSize: '13px',
  },

  input: {
    width: '100%',
    padding: '12px',
    border: '1px solid ' + cores.borda,
    borderRadius: '8px',
    fontSize: '15px',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    color: cores.texto,
  },

  senhaContainer: {
    position: 'relative',
    display: 'flex',
  },

  olhoButton: {
    position: 'absolute',
    right: '8px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '600',
    color: cores.teal,
    padding: '5px 6px',
    fontFamily: 'inherit',
  },

  erroBox: {
    backgroundColor: cores.perigoFundo,
    border: '1px solid ' + cores.perigo + '33',
    color: cores.perigoTexto,
    padding: '12px 14px',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '13.5px',
  },

  botao: {
    width: '100%',
    padding: '14px',
    backgroundColor: cores.teal,
    color: cores.branco,
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '700',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },

  footer: {
    textAlign: 'center',
    padding: '18px',
    backgroundColor: cores.fundoPagina,
    borderTop: '1px solid ' + cores.borda,
    fontSize: '13.5px',
    color: cores.textoSecundario,
  },

  link: {
    color: cores.teal,
    textDecoration: 'none',
    fontWeight: '700',
    cursor: 'pointer',
  },
};
