import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import { buscarTodasRespostas, calcularEstatisticas } from '../services/estatisticasService';

export default function Estatisticas() {
  const [stats, setStats] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [ordenarPor, setOrdenarPor] = useState('pior'); // 'pior' ou 'melhor'

  const { usuario } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    async function carregar() {
      try {
        setCarregando(true);
        const respostas = await buscarTodasRespostas(usuario.uid);
        const calculado = calcularEstatisticas(respostas);
        setStats(calculado);
      } catch (error) {
        setErro('Erro ao carregar estatisticas: ' + error.message);
      } finally {
        setCarregando(false);
      }
    }
    carregar();
  }, [usuario.uid]);

  const formatarData = (isoString) => {
    const data = new Date(isoString);
    return data.toLocaleDateString('pt-BR') + ' ' + data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const traduzirTipo = (tipo) => {
    const mapa = { avulsa: 'Avulsa', rotacao: 'Rotacao', simulado: 'Simulado' };
    return mapa[tipo] || tipo;
  };

  if (carregando) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingBox}>Carregando estatisticas...</div>
      </div>
    );
  }

  if (erro) {
    return (
      <div style={styles.container}>
        <div style={styles.erroBox}>{erro}</div>
      </div>
    );
  }

  if (!stats || stats.total === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <button onClick={() => navigate('/dashboard')} style={styles.btnVoltar}>
            Voltar
          </button>
          <h2 style={styles.titulo}>Estatisticas</h2>
        </div>
        <div style={styles.vazioBox}>
          <p>Voce ainda nao respondeu nenhuma questao. Comece a estudar para ver suas estatisticas aqui!</p>
        </div>
      </div>
    );
  }

  const subareasOrdenadas = Object.entries(stats.porSubarea).sort((a, b) => {
    const pctA = a[1].acertos / a[1].total;
    const pctB = b[1].acertos / b[1].total;
    return ordenarPor === 'pior' ? pctA - pctB : pctB - pctA;
  });

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={() => navigate('/dashboard')} style={styles.btnVoltar}>
          Voltar
        </button>
        <h2 style={styles.titulo}>Estatisticas</h2>
      </div>

      {/* RESUMO GERAL */}
      <div style={styles.card}>
        <div style={styles.gridResumo}>
          <div style={styles.resumoItem}>
            <div style={styles.resumoValor}>{stats.total}</div>
            <div style={styles.resumoLabel}>Questoes Respondidas</div>
          </div>
          <div style={styles.resumoItem}>
            <div style={{ ...styles.resumoValor, color: '#28a745' }}>{stats.acertos}</div>
            <div style={styles.resumoLabel}>Acertos</div>
          </div>
          <div style={styles.resumoItem}>
            <div style={{ ...styles.resumoValor, color: '#007bff' }}>{stats.percentualGeral}%</div>
            <div style={styles.resumoLabel}>Aproveitamento Geral</div>
          </div>
        </div>
      </div>

      {/* POR TIPO */}
      <div style={styles.card}>
        <h3 style={styles.subtitulo}>Por Tipo de Atividade</h3>
        {Object.entries(stats.porTipo).map(([tipo, dados]) => {
          const pct = Math.round((dados.acertos / dados.total) * 100);
          return (
            <div key={tipo} style={styles.itemLinha}>
              <span>{traduzirTipo(tipo)}</span>
              <span style={{ fontWeight: '600', color: pct >= 60 ? '#28a745' : '#dc3545' }}>
                {dados.acertos} / {dados.total} ({pct}%)
              </span>
            </div>
          );
        })}
      </div>

      {/* POR AREA */}
      <div style={styles.card}>
        <h3 style={styles.subtitulo}>Por Area</h3>
        {Object.entries(stats.porArea)
          .sort((a, b) => b[1].total - a[1].total)
          .map(([area, dados]) => {
            const pct = Math.round((dados.acertos / dados.total) * 100);
            return (
              <div key={area} style={styles.itemAreaComBarra}>
                <div style={styles.itemAreaTopo}>
                  <span>{area}</span>
                  <span style={{ fontWeight: '600', color: pct >= 60 ? '#28a745' : '#dc3545' }}>
                    {dados.acertos} / {dados.total} ({pct}%)
                  </span>
                </div>
                <div style={styles.barraFundo}>
                  <div
                    style={{
                      ...styles.barraPreenchida,
                      width: pct + '%',
                      backgroundColor: pct >= 60 ? '#28a745' : '#dc3545',
                    }}
                  />
                </div>
              </div>
            );
          })}
      </div>

      {/* POR SUBAREA */}
      <div style={styles.card}>
        <div style={styles.subtituloComFiltro}>
          <h3 style={styles.subtitulo}>Por Subarea</h3>
          <div style={styles.botoesOrdenar}>
            <button
              onClick={() => setOrdenarPor('pior')}
              style={{
                ...styles.botaoOrdenar,
                ...(ordenarPor === 'pior' ? styles.botaoOrdenarAtivo : {}),
              }}
            >
              Piores primeiro
            </button>
            <button
              onClick={() => setOrdenarPor('melhor')}
              style={{
                ...styles.botaoOrdenar,
                ...(ordenarPor === 'melhor' ? styles.botaoOrdenarAtivo : {}),
              }}
            >
              Melhores primeiro
            </button>
          </div>
        </div>

        <div style={styles.listaSubareaScroll}>
          {subareasOrdenadas.map(([chave, dados]) => {
            const pct = Math.round((dados.acertos / dados.total) * 100);
            return (
              <div key={chave} style={styles.itemLinha}>
                <span>
                  {dados.subarea || 'Sem subarea'}
                  <span style={styles.itemSubareaArea}> ({dados.area})</span>
                </span>
                <span style={{ fontWeight: '600', color: pct >= 60 ? '#28a745' : '#dc3545' }}>
                  {dados.acertos} / {dados.total} ({pct}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ATIVIDADE RECENTE */}
      <div style={styles.card}>
        <h3 style={styles.subtitulo}>Atividade Recente</h3>
        {stats.recentes.map((r) => (
          <div key={r.id} style={styles.itemRecente}>
            <div>
              <span
                style={{
                  ...styles.badgeRecente,
                  backgroundColor: r.correta ? '#d4edda' : '#f8d7da',
                  color: r.correta ? '#155724' : '#721c24',
                }}
              >
                {r.correta ? 'Acertou' : 'Errou'}
              </span>
              <span style={styles.itemRecenteTexto}>
                {r.area} - {r.subarea} ({traduzirTipo(r.tipo)})
              </span>
            </div>
            <span style={styles.itemRecenteData}>{formatarData(r.dataCriacao)}</span>
          </div>
        ))}
      </div>
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
    fontSize: '13px',
  },
  titulo: {
    fontSize: '18px',
    color: '#333',
    margin: 0,
  },
  card: {
    maxWidth: '700px',
    margin: '0 auto 15px auto',
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  gridResumo: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '15px',
  },
  resumoItem: {
    textAlign: 'center',
    padding: '15px 10px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
  },
  resumoValor: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#333',
  },
  resumoLabel: {
    fontSize: '12px',
    color: '#666',
    marginTop: '5px',
  },
  subtitulo: {
    fontSize: '15px',
    color: '#333',
    margin: '0 0 15px 0',
  },
  subtituloComFiltro: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px',
    flexWrap: 'wrap',
    gap: '10px',
  },
  botoesOrdenar: {
    display: 'flex',
    gap: '8px',
  },
  botaoOrdenar: {
    padding: '6px 12px',
    backgroundColor: '#f0f0f0',
    color: '#666',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '11px',
    cursor: 'pointer',
  },
  botaoOrdenarAtivo: {
    backgroundColor: '#007bff',
    color: 'white',
    borderColor: '#007bff',
  },
  itemLinha: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '10px 0',
    borderBottom: '1px solid #f0f0f0',
    fontSize: '13px',
  },
  itemSubareaArea: {
    fontSize: '11px',
    color: '#999',
    marginLeft: '5px',
  },
  itemAreaComBarra: {
    marginBottom: '15px',
  },
  itemAreaTopo: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
    marginBottom: '5px',
  },
  barraFundo: {
    width: '100%',
    height: '8px',
    backgroundColor: '#e9ecef',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  barraPreenchida: {
    height: '100%',
    transition: 'width 0.3s',
  },
  listaSubareaScroll: {
    maxHeight: '350px',
    overflowY: 'auto',
  },
  itemRecente: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 0',
    borderBottom: '1px solid #f0f0f0',
    fontSize: '12px',
    flexWrap: 'wrap',
    gap: '5px',
  },
  badgeRecente: {
    padding: '3px 8px',
    borderRadius: '10px',
    fontSize: '11px',
    fontWeight: '600',
    marginRight: '8px',
  },
  itemRecenteTexto: {
    color: '#555',
  },
  itemRecenteData: {
    color: '#999',
    fontSize: '11px',
  },
  vazioBox: {
    maxWidth: '700px',
    margin: '0 auto',
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '30px',
    textAlign: 'center',
    color: '#666',
  },
  erroBox: {
    maxWidth: '700px',
    margin: '0 auto',
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