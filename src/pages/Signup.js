import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import { cores } from '../styles/theme';

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
          <div style={styles.marca}>
            <div style={styles.marcaPonto} />
            <h1 style={styles.titulo}>Banco de Questões</h1>
          </div>
          <p style={styles.subtitulo}>Crie sua conta e comece a estudar</p>
        </div>

        {/* FORMULÁRIO */}
        <form onSubmit={handleSignup} style={styles.form}>
          <h2 style={styles.formTitulo}>Criar Conta</h2>

          {erro && (
            <div style={styles.erroBox}>
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
                {mostrarSenha ? 'Ocultar' : 'Ver'}
              </button>
            </div>
            {/* Indicador de validação */}
            {senha.length > 0 && (
              <p style={{
                ...styles.validacaoTexto,
                color: validacoes.senhaLength ? cores.teal : cores.perigo,
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
                color: validacoes.senhasIguais ? cores.teal : cores.perigo,
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
            {carregando ? 'Criando conta...' : 'Criar Conta'}
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
  validacaoTexto: {
    fontSize: '12px',
    marginTop: '5px',
    marginBottom: 0,
    fontWeight: '600',
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
    marginTop: '4px',
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
  },
};
