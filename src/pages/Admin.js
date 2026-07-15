import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import { resetarRespostas, resetarSimulados, resetarRotacoes } from '../services/adminService';
import Layout from '../components/Layout';
import { cores, estilosBase } from '../styles/theme';

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
    <Layout maxWidth="700px">
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
    </Layout>
  );
}

const styles = {
  cardGrande: {
    ...estilosBase.card,
    padding: '28px',
  },
  btnVoltar: {
    ...estilosBase.botaoSecundario,
    marginBottom: '18px',
  },
  titulo: {
    fontSize: '20px',
    marginBottom: '5px',
    color: cores.texto,
    fontWeight: '700',
  },
  subtitulo: {
    fontSize: '13px',
    color: cores.textoSecundario,
    marginBottom: '25px',
  },
  secao: {
    marginBottom: '30px',
    paddingBottom: '25px',
    borderBottom: '1px solid ' + cores.borda,
  },
  subtituloSecao: {
    fontSize: '15px',
    color: cores.texto,
    fontWeight: '700',
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
    backgroundColor: cores.teal,
    color: cores.branco,
    borderRadius: '8px',
    textDecoration: 'none',
    fontWeight: '700',
    fontSize: '14px',
  },
  secaoPerigo: {
    backgroundColor: cores.perigoFundo,
    border: '1px solid ' + cores.perigo + '33',
    borderRadius: '10px',
    padding: '20px',
  },
  subtituloPerigo: {
    fontSize: '15px',
    color: cores.perigoTexto,
    fontWeight: '700',
    marginBottom: '10px',
  },
  avisoTexto: {
    fontSize: '13px',
    color: cores.perigoTexto,
    marginBottom: '15px',
  },
  mensagemResultado: {
    backgroundColor: cores.tealFundo,
    color: cores.sucessoTexto,
    padding: '10px',
    borderRadius: '8px',
    fontSize: '13px',
    marginBottom: '15px',
  },
  progressoBox: {
    backgroundColor: cores.avisoFundo,
    color: cores.avisoTexto,
    padding: '10px',
    borderRadius: '8px',
    fontSize: '13px',
    marginBottom: '15px',
  },
  linhaBotoesPerigo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  botaoPerigo: {
    ...estilosBase.botaoPerigo,
    padding: '14px',
    fontSize: '14px',
  },
};
