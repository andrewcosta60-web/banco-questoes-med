import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import { buscarHistoricoSimulados } from '../services/simuladosService';
import Layout from '../components/Layout';
import { cores, estilosBase } from '../styles/theme';

export default function HistoricoSimulados() {
  const [simulados, setSimulados] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [simuladoExpandido, setSimuladoExpandido] = useState(null);

  const { usuario } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    async function carregar() {
      try {
        setCarregando(true);
        const dados = await buscarHistoricoSimulados(usuario.uid);
        setSimulados(dados);
      } catch (error) {
        setErro('Erro ao carregar historico: ' + error.message);
      } finally {
        setCarregando(false);
      }
    }
    carregar();
  }, [usuario.uid]);

  const formatarData = (isoString) => {
    const data = new Date(isoString);
    return data.toLocaleDateString('pt-BR') + ' as ' + data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatarTempo = (segundos) => {
    const h = Math.floor(segundos / 3600);
    const m = Math.floor((segundos % 3600) / 60);
    const s = segundos % 60;
    if (h > 0) {
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const toggleExpandir = (id) => {
    setSimuladoExpandido((prev) => (prev === id ? null : id));
  };

  if (carregando) {
    return (
      <Layout maxWidth="700px">
        <div style={styles.loadingBox}>Carregando historico...</div>
      </Layout>
    );
  }

  return (
    <Layout maxWidth="700px">
      <div style={styles.header}>
        <button onClick={() => navigate('/dashboard')} style={styles.btnVoltar}>
          Voltar
        </button>
        <h2 style={styles.titulo}>Historico de Simulados ({simulados.length})</h2>
      </div>

      {erro && <div style={styles.erroBox}>{erro}</div>}

      <div style={styles.lista}>
        {simulados.length === 0 && (
          <div style={styles.vazioBox}>
            <p>Voce ainda nao fez nenhum simulado.</p>
          </div>
        )}

        {simulados.map((sim) => {
          const expandido = simuladoExpandido === sim.id;
          const pct = sim.resultado?.percentualAcerto ?? 0;

          return (
            <div key={sim.id} style={styles.card}>
              <div style={styles.cardHeader} onClick={() => toggleExpandir(sim.id)}>
                <div>
                  <div style={styles.cardData}>{formatarData(sim.dataCriacao)}</div>
                  <div style={styles.cardAreas}>
                    {sim.configuracao?.misturarTudo
                      ? 'Todas as areas'
                      : (sim.configuracao?.areas || []).join(', ') || 'Sem area definida'}
                  </div>
                </div>
                <div style={styles.cardResumo}>
                  <span
                    style={{
                      ...styles.pctBadge,
                      backgroundColor: pct >= 60 ? cores.tealFundo : cores.perigoFundo,
                      color: pct >= 60 ? cores.sucessoTexto : cores.perigoTexto,
                    }}
                  >
                    {pct}%
                  </span>
                  <span style={styles.cardDetalheTexto}>
                    {sim.resultado?.acertos ?? 0} / {sim.resultado?.totalRespondidas ?? 0} acertos
                  </span>
                  <span style={styles.cardSeta}>{expandido ? '▲' : '▼'}</span>
                </div>
              </div>

              {expandido && (
                <div style={styles.cardExpandido}>
                  <div style={styles.gridResumoMini}>
                    <div style={styles.resumoMiniItem}>
                      <div style={styles.resumoMiniValor}>{sim.resultado?.totalQuestoes ?? 0}</div>
                      <div style={styles.resumoMiniLabel}>Total</div>
                    </div>
                    <div style={styles.resumoMiniItem}>
                      <div style={styles.resumoMiniValor}>{sim.resultado?.totalRespondidas ?? 0}</div>
                      <div style={styles.resumoMiniLabel}>Respondidas</div>
                    </div>
                    <div style={styles.resumoMiniItem}>
                      <div style={styles.resumoMiniValor}>{sim.resultado?.totalPuladas ?? 0}</div>
                      <div style={styles.resumoMiniLabel}>Puladas</div>
                    </div>
                    <div style={styles.resumoMiniItem}>
                      <div style={styles.resumoMiniValor}>
                        {formatarTempo(sim.resultado?.tempoTotalSegundos ?? 0)}
                      </div>
                      <div style={styles.resumoMiniLabel}>Tempo</div>
                    </div>
                  </div>

                  {sim.resultado?.porArea && (
                    <div style={styles.listaAreasMini}>
                      <div style={styles.subtituloMini}>Por Area:</div>
                      {Object.entries(sim.resultado.porArea).map(([area, dados]) => (
                        <div key={area} style={styles.itemAreaMini}>
                          <span>{area}</span>
                          <span>
                            {dados.acertos} / {dados.total} (
                            {Math.round((dados.acertos / dados.total) * 100)}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
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
    gap: '10px',
  },
  card: {
    ...estilosBase.card,
    padding: 0,
    overflow: 'hidden',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px',
    cursor: 'pointer',
  },
  cardData: {
    fontSize: '13px',
    fontWeight: '700',
    color: cores.texto,
  },
  cardAreas: {
    fontSize: '12px',
    color: cores.textoSecundario,
    marginTop: '3px',
  },
  cardResumo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  pctBadge: {
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '13px',
    fontWeight: '700',
  },
  cardDetalheTexto: {
    fontSize: '12px',
    color: cores.textoSecundario,
  },
  cardSeta: {
    fontSize: '11px',
    color: cores.textoSecundario,
  },
  cardExpandido: {
    padding: '0 15px 15px 15px',
    borderTop: '1px solid ' + cores.borda,
  },
  gridResumoMini: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '10px',
    marginTop: '15px',
    marginBottom: '15px',
  },
  resumoMiniItem: {
    textAlign: 'center',
    padding: '10px 5px',
    backgroundColor: cores.fundoPagina,
    borderRadius: '8px',
  },
  resumoMiniValor: {
    fontSize: '16px',
    fontWeight: '700',
    color: cores.texto,
  },
  resumoMiniLabel: {
    fontSize: '10px',
    color: cores.textoSecundario,
    marginTop: '3px',
  },
  listaAreasMini: {
    fontSize: '12px',
  },
  subtituloMini: {
    fontWeight: '700',
    color: cores.texto,
    marginBottom: '6px',
  },
  itemAreaMini: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '5px 0',
    borderBottom: '1px solid ' + cores.borda,
    color: cores.textoTerciario,
  },
  vazioBox: estilosBase.vazioBox,
  erroBox: estilosBase.erroBox,
  loadingBox: estilosBase.loadingBox,
};
