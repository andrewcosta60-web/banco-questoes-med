import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import { resetarRespostas, resetarSimulados, resetarRotacoes } from '../services/adminService';

export default function Admin() {
  const [executando, setExecutando] = useState(false);
  const [progresso, setProgresso] = useState(null);
  const [mensagemResultado, setMensagemResultado] = useState('');

  const { usuario } = useAuth();
  const navigate = useNavigate();

  const executarReset = async (nomeAcao, funcaoReset) => {
    const confirmar1 = window.confirm(
      `ATENCAO: Isso vai apagar PERMANENTEMENTE ${nomeAcao} da SUA conta. Essa acao NAO pode ser desfeita. Tem certeza?`
    );
    if (!confirmar1) return;

    const confirmar2 = window.confirm(
      `Confirmacao final: voce tem ABSOLUTA certeza que quer apagar ${nomeAcao}?`
    );
    if (!confirmar2) return;

    try {
      setExecutando(true);
      setMensagemResultado('');
      setProgresso({ atual: 0, total: 0 });

      const totalDeletado = await funcaoReset(usuario.uid, (atual, total) => {
        setProgresso({ atual, total });
      });

      setMensagemResultado(`Concluido! ${totalDeletado} registros de ${nomeAcao} foram apagados.`);
    } catch (error) {
      setMensagemResultado('Erro: ' + error.message);
    } finally {
      setExecutando(false);
      setProgresso(null);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.cardGrande}>
        <button onClick={() => navigate('/dashboard')} style={styles.btnVoltar}>
          Voltar ao Dashboard
        </button>

        <h2 style={styles.titulo}>Painel Administrativo</h2>
        <p style={styles.subtitulo}>Logado como: {usuario?.email}</p>

        <div style={styles.secao}>
          <h3 style={styles.subtituloSecao}>Gerenciar Questoes (banco compartilhado)</h3>
          <div style={styles.linhaBotoes}>
            <Link to="/importar-questoes" style={styles.botaoAcao}>
              Importar Questoes em Lote
            </Link>
            <Link to="/editor-questoes" style={styles.botaoAcao}>
              Editor de Questoes
            </Link>
          </div>
        </div>

        <div style={styles.secaoPerigo}>
          <h3 style={styles.subtituloPerigo}>Zona de Perigo (afeta so a SUA conta)</h3>
          <p style={styles.avisoTexto}>
            As acoes abaixo apagam permanentemente os SEUS dados. O banco de questoes
            (compartilhado com todos) nunca e afetado por essas acoes.
          </p>

          {mensagemResultado && (
            <div style={styles.mensagemResultado}>{mensagemResultado}</div>
          )}

          {executando && progresso && (
            <div style={styles.progressoBox}>
              Processando... {progresso.atual} / {progresso.total || '?'}
            </div>
          )}

          <div style={styles.linhaBotoesPerigo}>
            <button
              onClick={() => executarReset('suas respostas e estatisticas', resetarRespostas)}
              style={styles.botaoPerigo}
              disabled={executando}
            >
              Zerar Minhas Respostas e Estatisticas
            </button>

            <button
              onClick={() => executarReset('seu historico de simulados', resetarSimulados)}
              style={styles.botaoPerigo}
              disabled={executando}
            >
              Zerar Meu Historico de Simulados
            </button>

            <button
              onClick={() => executarReset('suas rotacoes', resetarRotacoes)}
              style={styles.botaoPerigo}
              disabled={executando}
            >
              Zerar Minhas Rotacoes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    padding: '20px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingTop: '30px',
  },
  cardGrande: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '30px',
    maxWidth: '700px',
    width: '100%',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  btnVoltar: {
    padding: '8px 16px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    marginBottom: '15px',
  },
  titulo: {
    fontSize: '22px',
    marginBottom: '5px',
    color: '#333',
  },
  subtitulo: {
    fontSize: '13px',
    color: '#666',
    marginBottom: '25px',
  },
  secao: {
    marginBottom: '30px',
    paddingBottom: '25px',
    borderBottom: '1px solid #eee',
  },
  subtituloSecao: {
    fontSize: '16px',
    color: '#333',
    marginBottom: '15px',
  },
  linhaBotoes: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
  },
  botaoAcao: {
    flex: 1,
    minWidth: '200px',
    textAlign: 'center',
    padding: '14px',
    backgroundColor: '#007bff',
    color: 'white',
    borderRadius: '6px',
    textDecoration: 'none',
    fontWeight: '600',
    fontSize: '14px',
  },
  secaoPerigo: {
    backgroundColor: '#fff8f8',
    border: '1px solid #f5c6cb',
    borderRadius: '8px',
    padding: '20px',
  },
  subtituloPerigo: {
    fontSize: '16px',
    color: '#721c24',
    marginBottom: '10px',
  },
  avisoTexto: {
    fontSize: '13px',
    color: '#721c24',
    marginBottom: '15px',
  },
  mensagemResultado: {
    backgroundColor: '#d4edda',
    color: '#155724',
    padding: '10px',
    borderRadius: '6px',
    fontSize: '13px',
    marginBottom: '15px',
  },
  progressoBox: {
    backgroundColor: '#fff3cd',
    color: '#856404',
    padding: '10px',
    borderRadius: '6px',
    fontSize: '13px',
    marginBottom: '15px',
  },
  linhaBotoesPerigo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  botaoPerigo: {
    padding: '14px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
};