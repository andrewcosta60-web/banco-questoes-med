import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import { buscarTodasRespostas, calcularEstatisticas, calcularEvolucaoSemanal } from '../services/estatisticasService';
import Layout from '../components/Layout';
import { cores, estilosBase } from '../styles/theme';

function GraficoEvolucao({ dados }) {
  const largura = 600;
  const altura = 180;
  const padding = 30;
  const larguraBarra = (largura - padding * 2) / dados.length;

  const maiorTotal = Math.max(...dados.map((d) => d.total), 1);

  const corPorPercentual = (pct) => {
    if (pct === null) return '#E9ECEF';
    if (pct >= 60) return '#2F8F7A';
    return '#D6893F';
  };

  return (
    <svg viewBox={`0 0 ${largura} ${altura + 30}`} style={{ width: '100%', height: 'auto' }}>
      {dados.map((d, i) => {
        const alturaBarra = d.total > 0 ? (d.total / maiorTotal) * (altura - 20) : 2;
        const x = padding + i * larguraBarra + larguraBarra * 0.15;
        const larguraReal = larguraBarra * 0.7;
        const y = altura - alturaBarra;

        return (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width={larguraReal}
              height={alturaBarra}
              rx={4}
              fill={corPorPercentual(d.percentual)}
            />
            {d.percentual !== null && (
              <text
                x={x + larguraReal / 2}
                y={y - 6}
                textAnchor="middle"
                fontSize="11"
                fontWeight="700"
                fill="#16232E"
              >
                {d.percentual}%
              </text>
            )}
            <text
              x={x + larguraReal / 2}
              y={altura + 18}
              textAnchor="middle"
              fontSize="10.5"
              fill="#8A94A0"
            >
              {d.label}
            </text>
          </g>
        );
      })}
      <line x1={padding} y1={altura} x2={largura - padding} y2={altura} stroke="#E3E7EC" strokeWidth="1" />
    </svg>
  );
}

export default function Estatisticas() {
  const [stats, setStats] = useState(null);
  const [evolucao, setEvolucao] = useState([]);
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
    setEvolucao(calcularEvolucaoSemanal(respostas, 8));
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
      <Layout maxWidth="700px">
        <div style={styles.loadingBox}>Carregando estatisticas...</div>
      </Layout>
    );
  }

  if (erro) {
    return (
      <Layout maxWidth="700px">
        <div style={styles.erroBox}>{erro}</div>
      </Layout>
    );
  }

  if (!stats || stats.total === 0) {
    return (
      <Layout maxWidth="700px">
        <div style={styles.header}>
          <button onClick={() => navigate('/dashboard')} style={styles.btnVoltar}>
            Voltar
          </button>
          <h2 style={styles.titulo}>Estatisticas</h2>
        </div>
        <div style={styles.vazioBox}>
          <p>Voce ainda nao respondeu nenhuma questao. Comece a estudar para ver suas estatisticas aqui!</p>
        </div>
      </Layout>
    );
  }

  const subareasOrdenadas = Object.entries(stats.porSubarea).sort((a, b) => {
    const pctA = a[1].acertos / a[1].total;
    const pctB = b[1].acertos / b[1].total;
    return ordenarPor === 'pior' ? pctA - pctB : pctB - pctA;
  });

  return (
    <Layout maxWidth="700px">
      <div style={styles.header}>
        <button onClick={() => navigate('/dashboard')} style={styles.btnVoltar}>
          Voltar
        </button>
        <h2 style={styles.titulo}>Estatisticas</h2>
      </div>
{/* GRAFICO DE EVOLUCAO */}
<div style={styles.card}>
  <h3 style={styles.subtitulo}>Evolucao (ultimas 8 semanas)</h3>
  {evolucao.some((e) => e.total > 0) ? (
    <GraficoEvolucao dados={evolucao} />
  ) : (
    <p style={{ fontSize: '13px', color: '#8A94A0' }}>
      Ainda nao ha dados suficientes para mostrar a evolucao.
    </p>
  )}
</div>

{/* RESUMO GERAL */}
<div style={styles.card}></div>
      {/* RESUMO GERAL */}
      <div style={styles.card}>
        <div style={styles.gridResumo}>
          <div style={styles.resumoItem}>
            <div style={styles.resumoValor}>{stats.total}</div>
            <div style={styles.resumoLabel}>Questoes Respondidas</div>
          </div>
          <div style={styles.resumoItem}>
            <div style={{ ...styles.resumoValor, color: cores.teal }}>{stats.acertos}</div>
            <div style={styles.resumoLabel}>Acertos</div>
          </div>
          <div style={styles.resumoItem}>
            <div style={{ ...styles.resumoValor, color: cores.teal }}>{stats.percentualGeral}%</div>
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
              <span style={{ fontWeight: '700', color: pct >= 60 ? cores.teal : cores.perigo }}>
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
                  <span style={{ fontWeight: '700', color: pct >= 60 ? cores.teal : cores.perigo }}>
                    {dados.acertos} / {dados.total} ({pct}%)
                  </span>
                </div>
                <div style={styles.barraFundo}>
                  <div
                    style={{
                      ...styles.barraPreenchida,
                      width: pct + '%',
                      backgroundColor: pct >= 60 ? cores.teal : cores.perigo,
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
                <span style={{ fontWeight: '700', color: pct >= 60 ? cores.teal : cores.perigo }}>
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
                  backgroundColor: r.correta ? cores.tealFundo : cores.perigoFundo,
                  color: r.correta ? cores.sucessoTexto : cores.perigoTexto,
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
  card: {
    ...estilosBase.card,
    padding: '20px',
    marginBottom: '15px',
  },
  gridResumo: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '15px',
  },
  resumoItem: {
    textAlign: 'center',
    padding: '15px 10px',
    backgroundColor: cores.fundoPagina,
    borderRadius: '8px',
  },
  resumoValor: {
    fontSize: '24px',
    fontWeight: '700',
    color: cores.texto,
  },
  resumoLabel: {
    fontSize: '12px',
    color: cores.textoSecundario,
    marginTop: '5px',
  },
  subtitulo: estilosBase.subtitulo,
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
    backgroundColor: cores.branco,
    color: cores.textoSecundario,
    border: '1px solid ' + cores.borda,
    borderRadius: '8px',
    fontSize: '11px',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  botaoOrdenarAtivo: {
    backgroundColor: cores.teal,
    color: cores.branco,
    borderColor: cores.teal,
  },
  itemLinha: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '10px 0',
    borderBottom: '1px solid ' + cores.borda,
    fontSize: '13px',
    color: cores.texto,
  },
  itemSubareaArea: {
    fontSize: '11px',
    color: cores.textoSecundario,
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
    color: cores.texto,
  },
  barraFundo: {
    width: '100%',
    height: '8px',
    backgroundColor: cores.fundoPagina,
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
    borderBottom: '1px solid ' + cores.borda,
    fontSize: '12px',
    flexWrap: 'wrap',
    gap: '5px',
  },
  badgeRecente: {
    padding: '3px 8px',
    borderRadius: '10px',
    fontSize: '11px',
    fontWeight: '700',
    marginRight: '8px',
  },
  itemRecenteTexto: {
    color: cores.textoTerciario,
  },
  itemRecenteData: {
    color: cores.textoSecundario,
    fontSize: '11px',
  },
  vazioBox: estilosBase.vazioBox,
  erroBox: estilosBase.erroBox,
  loadingBox: estilosBase.loadingBox,
};
