import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';

export default function EditarPerfil() {
  const { usuario, atualizarPerfil, trocarSenha, erro, setErro } = useAuth();
  const navigate = useNavigate();

  const [nome, setNome] = useState(usuario?.nome || '');
  const [apelido, setApelido] = useState(usuario?.apelido || '');
  const [salvandoPerfil, setSalvandoPerfil] = useState(false);
  const [mensagemPerfil, setMensagemPerfil] = useState('');

  const [senhaAtual, setSenhaAtual] = useState('');
  const [senhaNova, setSenhaNova] = useState('');
  const [confirmarSenhaNova, setConfirmarSenhaNova] = useState('');
  const [salvandoSenha, setSalvandoSenha] = useState(false);
  const [mensagemSenha, setMensagemSenha] = useState('');

  const handleSalvarPerfil = async (e) => {
    e.preventDefault();
    setErro('');
    setMensagemPerfil('');

    if (!nome.trim()) {
      setErro('O nome nao pode ficar vazio');
      return;
    }

    try {
      setSalvandoPerfil(true);
      const sucesso = await atualizarPerfil({
        nome: nome.trim(),
        apelido: apelido.trim(),
      });

      if (sucesso) {
        setMensagemPerfil('Perfil atualizado com sucesso!');
      }
    } finally {
      setSalvandoPerfil(false);
    }
  };

  const handleTrocarSenha = async (e) => {
    e.preventDefault();
    setErro('');
    setMensagemSenha('');

    if (!senhaAtual || !senhaNova || !confirmarSenhaNova) {
      setErro('Preencha todos os campos de senha');
      return;
    }

    if (senhaNova !== confirmarSenhaNova) {
      setErro('As senhas novas nao conferem');
      return;
    }

    try {
      setSalvandoSenha(true);
      const sucesso = await trocarSenha(senhaAtual, senhaNova);

      if (sucesso) {
        setMensagemSenha('Senha alterada com sucesso!');
        setSenhaAtual('');
        setSenhaNova('');
        setConfirmarSenhaNova('');
      }
    } finally {
      setSalvandoSenha(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>
        <button onClick={() => navigate('/dashboard')} style={styles.btnVoltar}>
          Voltar
        </button>

        <h1 style={styles.titulo}>Editar Perfil</h1>

        {erro && <div style={styles.erroBox}>{erro}</div>}

        {/* CARD: DADOS DO PERFIL */}
        <div style={styles.card}>
          <h2 style={styles.subtitulo}>Informacoes Pessoais</h2>

          {mensagemPerfil && <div style={styles.sucessoBox}>{mensagemPerfil}</div>}

          <form onSubmit={handleSalvarPerfil}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Nome Completo</label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                style={styles.input}
                disabled={salvandoPerfil}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Apelido (exibido no Dashboard)</label>
              <input
                type="text"
                value={apelido}
                onChange={(e) => setApelido(e.target.value)}
                style={styles.input}
                placeholder="Ex: Dr. Andrew, Interno Andrew..."
                disabled={salvandoPerfil}
              />
              <p style={styles.dica}>Deixe em branco para usar seu nome normal.</p>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Email</label>
              <input
                type="email"
                value={usuario?.email || ''}
                style={{ ...styles.input, backgroundColor: '#F5F7FA', color: '#8A94A0' }}
                disabled
              />
              <p style={styles.dica}>O email nao pode ser alterado.</p>
            </div>

            <button type="submit" style={styles.botao} disabled={salvandoPerfil}>
              {salvandoPerfil ? 'Salvando...' : 'Salvar Alteracoes'}
            </button>
          </form>
        </div>

        {/* CARD: TROCAR SENHA */}
        <div style={styles.card}>
          <h2 style={styles.subtitulo}>Alterar Senha</h2>

          {mensagemSenha && <div style={styles.sucessoBox}>{mensagemSenha}</div>}

          <form onSubmit={handleTrocarSenha}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Senha Atual</label>
              <input
                type="password"
                value={senhaAtual}
                onChange={(e) => setSenhaAtual(e.target.value)}
                style={styles.input}
                disabled={salvandoSenha}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Nova Senha</label>
              <input
                type="password"
                value={senhaNova}
                onChange={(e) => setSenhaNova(e.target.value)}
                style={styles.input}
                placeholder="Minimo 6 caracteres"
                disabled={salvandoSenha}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Confirmar Nova Senha</label>
              <input
                type="password"
                value={confirmarSenhaNova}
                onChange={(e) => setConfirmarSenhaNova(e.target.value)}
                style={styles.input}
                disabled={salvandoSenha}
              />
            </div>

            <button type="submit" style={styles.botao} disabled={salvandoSenha}>
              {salvandoSenha ? 'Alterando...' : 'Alterar Senha'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#F5F7FA',
    padding: '30px 20px',
  },
  wrapper: {
    maxWidth: '500px',
    margin: '0 auto',
  },
  btnVoltar: {
    padding: '8px 16px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E3E7EC',
    color: '#16232E',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    marginBottom: '18px',
  },
  titulo: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#16232E',
    marginBottom: '22px',
  },
  card: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E3E7EC',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '18px',
  },
  subtitulo: {
    fontSize: '15.5px',
    fontWeight: '700',
    color: '#16232E',
    margin: '0 0 16px 0',
  },
  formGroup: {
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    marginBottom: '6px',
    fontWeight: '600',
    color: '#16232E',
    fontSize: '13px',
  },
  input: {
    width: '100%',
    padding: '11px 12px',
    border: '1px solid #DDE2E7',
    borderRadius: '8px',
    fontSize: '14.5px',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    color: '#16232E',
  },
  dica: {
    fontSize: '11.5px',
    color: '#8A94A0',
    margin: '5px 0 0 0',
  },
  botao: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#16232E',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '4px',
  },
  erroBox: {
    backgroundColor: '#FBEAEA',
    border: '1px solid #F0C4C4',
    color: '#B33A3A',
    padding: '11px 12px',
    borderRadius: '8px',
    marginBottom: '18px',
    fontSize: '13px',
  },
  sucessoBox: {
    backgroundColor: '#E7F2EF',
    border: '1px solid #B8DBD2',
    color: '#1E6B58',
    padding: '11px 12px',
    borderRadius: '8px',
    marginBottom: '16px',
    fontSize: '13px',
  },
};