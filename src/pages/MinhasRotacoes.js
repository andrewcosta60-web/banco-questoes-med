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
      <div style={styles.container}>
        <div style={styles.loadingBox}>Carregando...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
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
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    padding: '20px',
  },
  header: {
    maxWidth: '700px',
    margin: '0 auto 20px auto',
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
  },
  btnVoltar: {
    padding: '8px 16px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  titulo: {
    fontSize: '22px',
    color: '#333',
    margin: 0,
  },
  lista: {
    maxWidth: '700px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  },
  cardTitulo: {
    margin: 0,
    fontSize: '18px',
    color: '#333',
  },
  badge: {
    padding: '4px 10px',
    backgroundColor: '#e7f3ff',
    color: '#007bff',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: '600',
  },
  cardInfo: {
    fontSize: '13px',
    color: '#666',
    margin: '4px 0',
  },
  progressoContainer: {
    marginTop: '15px',
    marginBottom: '15px',
  },
  progressoBarraFundo: {
    width: '100%',
    height: '10px',
    backgroundColor: '#e9ecef',
    borderRadius: '5px',
    overflow: 'hidden',
  },
  progressoBarraPreenchida: {
    height: '100%',
    backgroundColor: '#28a745',
    transition: 'width 0.3s',
  },
  progressoTexto: {
    fontSize: '12px',
    color: '#666',
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
    backgroundColor: '#007bff',
    color: 'white',
    borderRadius: '6px',
    textDecoration: 'none',
    fontWeight: '600',
    fontSize: '14px',
  },
  btnRemover: {
    padding: '10px 16px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
  },
  vazioBox: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '30px',
    textAlign: 'center',
    color: '#666',
  },
  btnNovaRotacao: {
    display: 'block',
    maxWidth: '700px',
    margin: '20px auto 0 auto',
    textAlign: 'center',
    padding: '14px',
    backgroundColor: '#28a745',
    color: 'white',
    borderRadius: '6px',
    textDecoration: 'none',
    fontWeight: '600',
  },
  erroBox: {
    maxWidth: '700px',
    margin: '0 auto 20px auto',
    backgroundColor: '#fee',
    border: '1px solid #fcc',
    color: '#c00',
    padding: '12px',
    borderRadius: '6px',
    fontSize: '14px',
  },
  loadingBox: {
    textAlign: 'center',
    padding: '50px',
    fontSize: '18px',
  },
};