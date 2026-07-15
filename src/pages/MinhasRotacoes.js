import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import {
  buscarRotacoesAtivas,
  areasAtivasHoje,
  calcularMetaHoje,
  questoesFeitasHoje,
  cancelarRotacao,
} from '../services/rotacoesService';
import Layout from '../components/Layout';
import { cores, estilosBase } from '../styles/theme';

export default function MinhasRotacoes() {
  const [rotacoes, setRotacoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  const { usuario } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    carregarRotacoes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function carregarRotacoes() {
    try {
      setCarregando(true);
      const dados = await buscarRotacoesAtivas(usuario.uid);
      setRotacoes(dados);
    } catch (error) {
      setErro('Erro ao carregar rotacoes: ' + error.message);
    } finally {
      setCarregando(false);
    }
  }

  const handleRemover = async (rotacaoId, nomeRotacao) => {
    const confirmar = window.confirm(
      `Tem certeza que deseja remover a rotacao "${nomeRotacao}"? Essa acao nao pode ser desfeita.`
    );
    if (!confirmar) return;

    try {
      await cancelarRotacao(rotacaoId);
      // Atualiza a lista removendo essa rotação da tela, sem precisar recarregar tudo
      setRotacoes((prev) => prev.filter((r) => r.id !== rotacaoId));
    } catch (error) {
      alert('Erro ao remover rotacao: ' + error.message);
    }
  };

  if (carregando) {
    return (
      <Layout maxWidth="700px">
        <div style={styles.loadingBox}>Carregando...</div>
      </Layout>
    );
  }

  return (
    <Layout maxWidth="700px">
      <div style={styles.header}>
        <button onClick={() => navigate('/dashboard')} style={styles.btnVoltar}>
          Voltar
        </button>
        <h2 style={styles.titulo}>Minhas Rotacoes</h2>
      </div>

      {erro && <div style={styles.erroBox}>{erro}</div>}

      <div style={styles.lista}>
        {rotacoes.length === 0 && (
          <div style={styles.vazioBox}>
            <p>Voce ainda nao tem nenhuma rotacao ativa.</p>
          </div>
        )}

        {rotacoes.map((rotacao) => {
          const areas = areasAtivasHoje(rotacao);
          const meta = calcularMetaHoje(rotacao);
          const feitas = questoesFeitasHoje(rotacao);
          const progressoPct = Math.min(100, Math.round((feitas / meta) * 100));

          return (
            <div key={rotacao.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <h3 style={styles.cardTitulo}>{rotacao.nome}</h3>
                <span style={styles.badge}>
                  {rotacao.modo === 'misturado' ? 'Misturado' : 'Blocos'}
                </span>
              </div>

              <p style={styles.cardInfo}>
                Area hoje: {areas.length > 0 ? areas.join(', ') : 'Nenhuma area ativa hoje'}
              </p>

              <p style={styles.cardInfo}>
                Periodo: {rotacao.dataInicio} ate {rotacao.dataFim}
              </p>

              <div style={styles.progressoContainer}>
                <div style={styles.progressoBarraFundo}>
                  <div
                    style={{
                      ...styles.progressoBarraPreenchida,
                      width: progressoPct + '%',
                    }}
                  />
                </div>
                <span style={styles.progressoTexto}>
                  {feitas} / {meta} hoje
                </span>
              </div>

              <div style={styles.botoesLinha}>
                <Link to={'/rotacao/' + rotacao.id} style={styles.btnContinuar}>
                  Continuar
                </Link>
                <button
                  onClick={() => handleRemover(rotacao.id, rotacao.nome)}
                  style={styles.btnRemover}
                >
                  Remover
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <Link to="/criar-rotacao" style={styles.btnNovaRotacao}>
        + Criar Nova Rotacao
      </Link>
    </Layout>
  );
}

const styles = {
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    marginBottom: '20px',
  },
  btnVoltar: estilosBase.botaoSecundario,
  titulo: {
    fontSize: '20px',
    color: cores.texto,
    fontWeight: '700',
    margin: 0,
  },
  lista: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  card: {
    ...estilosBase.card,
    padding: '20px',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  },
  cardTitulo: {
    margin: 0,
    fontSize: '17px',
    color: cores.texto,
    fontWeight: '700',
  },
  badge: estilosBase.tag,
  cardInfo: {
    fontSize: '13px',
    color: cores.textoSecundario,
    margin: '4px 0',
  },
  progressoContainer: {
    marginTop: '15px',
    marginBottom: '15px',
  },
  progressoBarraFundo: {
    width: '100%',
    height: '10px',
    backgroundColor: cores.fundoPagina,
    borderRadius: '5px',
    overflow: 'hidden',
  },
  progressoBarraPreenchida: {
    height: '100%',
    backgroundColor: cores.teal,
    transition: 'width 0.3s',
  },
  progressoTexto: {
    fontSize: '12px',
    color: cores.textoSecundario,
    marginTop: '5px',
    display: 'block',
  },
  botoesLinha: {
    display: 'flex',
    gap: '10px',
  },
  btnContinuar: {
    flex: 1,
    textAlign: 'center',
    padding: '10px',
    backgroundColor: cores.teal,
    color: cores.branco,
    borderRadius: '8px',
    textDecoration: 'none',
    fontWeight: '700',
    fontSize: '14px',
  },
  btnRemover: {
    padding: '10px 16px',
    backgroundColor: cores.perigoFundo,
    color: cores.perigoTexto,
    border: 'none',
    borderRadius: '8px',
    fontWeight: '700',
    fontSize: '14px',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  vazioBox: estilosBase.vazioBox,
  btnNovaRotacao: {
    display: 'block',
    marginTop: '20px',
    textAlign: 'center',
    padding: '14px',
    backgroundColor: cores.teal,
    color: cores.branco,
    borderRadius: '8px',
    textDecoration: 'none',
    fontWeight: '700',
  },
  erroBox: estilosBase.erroBox,
  loadingBox: estilosBase.loadingBox,
};
