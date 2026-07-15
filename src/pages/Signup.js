import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';

export default function Signup() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [validacoes, setValidacoes] = useState({
    senhaLength: false,
    senhasIguais: false,
  });

  const { signup, carregando, erro, setErro, usuario } = useAuth();
  const navigate = useNavigate();

  // Se já tá logado, manda pro dashboard
  useEffect(() => {
    if (usuario) {
      navigate('/dashboard');
    }
  }, [usuario, navigate]);

  // Valida senha em tempo real, enquanto digita
  useEffect(() => {
    setValidacoes({
      senhaLength: senha.length >= 6,
      senhasIguais: senha.length > 0 && senha === confirmarSenha,
    });
  }, [senha, confirmarSenha]);

  const handleSignup = async (e) => {
    e.preventDefault();
    setErro('');

    if (!nome.trim()) {
      setErro('Digite seu nome completo');
      return;
    }

    if (!email.includes('@') || !email.includes('.')) {
      setErro('Digite um email válido');
      return;
    }

    if (senha.length < 6) {
      setErro('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    if (senha !== confirmarSenha) {
      setErro('As senhas não conferem');
      return;
    }

    const sucesso = await signup(nome.trim(), email.trim(), senha);

    if (sucesso) {
      navigate('/dashboard');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* HEADER */}
        <div style={styles.header}>
          <h1 style={styles.titulo}>🏥 Banco de Questões</h1>
          <p style={styles.subtitulo}>Crie sua conta e comece a estudar</p>
        </div>

        {/* FORMULÁRIO */}
        <form onSubmit={handleSignup} style={styles.form}>
          <h2 style={styles.formTitulo}>Criar Conta</h2>

          {erro && (
            <div style={styles.erroBox}>
              <span style={styles.erroIcon}>⚠️</span>
              <span>{erro}</span>
            </div>
          )}

          {/* NOME */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Nome Completo</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              style={styles.input}
              placeholder="Ex: João Silva"
              disabled={carregando}
              autoComplete="name"
            />
          </div>

          {/* EMAIL */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              placeholder="seu@email.com"
              disabled={carregando}
              autoComplete="email"
            />
          </div>

          {/* SENHA */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Senha</label>
            <div style={styles.senhaContainer}>
              <input
                type={mostrarSenha ? 'text' : 'password'}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                style={styles.input}
                placeholder="Mínimo 6 caracteres"
                disabled={carregando}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setMostrarSenha(!mostrarSenha)}
                style={styles.olhoButton}
                disabled={carregando}
                tabIndex={-1}
              >
                {mostrarSenha ? '🙈' : '👁️'}
              </button>
            </div>
            {/* Indicador de validação */}
            {senha.length > 0 && (
              <p style={{
                ...styles.validacaoTexto,
                color: validacoes.senhaLength ? '#28a745' : '#dc3545',
              }}>
                {validacoes.senhaLength ? '✓' : '✗'} Pelo menos 6 caracteres
              </p>
            )}
          </div>

          {/* CONFIRMAR SENHA */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Confirmar Senha</label>
            <input
              type={mostrarSenha ? 'text' : 'password'}
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              style={styles.input}
              placeholder="Repita a senha"
              disabled={carregando}
              autoComplete="new-password"
            />
            {confirmarSenha.length > 0 && (
              <p style={{
                ...styles.validacaoTexto,
                color: validacoes.senhasIguais ? '#28a745' : '#dc3545',
              }}>
                {validacoes.senhasIguais ? '✓' : '✗'} Senhas conferem
              </p>
            )}
          </div>

          {/* BOTÃO */}
          <button
            type="submit"
            style={{
              ...styles.botao,
              opacity: carregando ? 0.7 : 1,
              cursor: carregando ? 'not-allowed' : 'pointer',
            }}
            disabled={carregando}
          >
            {carregando ? '⏳ Criando conta...' : '✓ Criar Conta'}
          </button>
        </form>

        {/* FOOTER */}
        <div style={styles.footer}>
          <p>
            Já tem conta?{' '}
            <Link to="/login" style={styles.link}>
              Faça login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

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
    backgroundColor: '#28a745',
    color: 'white',
    padding: '30px 20px',
    textAlign: 'center',
  },
  titulo: {
    margin: '0 0 10px 0',
    fontSize: '26px',
    fontWeight: 'bold',
  },
  subtitulo: {
    margin: 0,
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
    marginBottom: '18px',
  },
  label: {
    display: 'block',
    marginBottom: '6px',
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
  },
  senhaContainer: {
    position: 'relative',
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
  validacaoTexto: {
    fontSize: '12px',
    marginTop: '5px',
    marginBottom: 0,
    fontWeight: '500',
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
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '10px',
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
    color: '#28a745',
    textDecoration: 'none',
    fontWeight: '600',
  },
};