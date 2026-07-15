import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import {
  buscarTodasRespostas,
  calcularEstatisticas,
  montarCalendarioAtividade,
  calcularSequenciaAtual,
} from '../services/estatisticasService';
import { buscarRotacoesAtivas } from '../services/rotacoesService';
import { buscarRanking } from '../services/rankingService';

// ---------- Icones (SVG simples, sem dependencia externa) ----------
function Icone({ path }) {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {path}
    </svg>
  );
}

const icones = {
  home: <><path d="M3 11.5 12 4l9 7.5" /><path d="M5.5 10v9.5h13V10" /></>,
  calendario: <><rect x="3.5" y="5" width="17" height="15.5" rx="2" /><path d="M16 3v4M8 3v4M3.5 9.5h17" /></>,
  ajuda: <><circle cx="12" cy="12" r="8.5" /><path d="M9.3 9.3a2.7 2.7 0 0 1 5.2.9c0 1.6-2.3 2.1-2.5 3.6" /><path d="M12 17.2h.01" /></>,
  relogio: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2.5" /></>,
  grafico: <><path d="M4.5 19.5V11M12 19.5V4.5M19.5 19.5v-6" /></>,
  mapa: <><path d="M9 3.5 3.5 5.5v15L9 18.5l6 2 5.5-2v-15l-5.5 2-6-2Z" /><path d="M9 3.5v15M15 5.5v15" /></>,
  engrenagem: <><circle cx="12" cy="12" r="3.2" /><path d="M12 2.5v3M12 18.5v3M4.7 4.7l2.1 2.1M17.2 17.2l2.1 2.1M2.5 12h3M18.5 12h3M4.7 19.3l2.1-2.1M17.2 6.8l2.1-2.1" /></>,
  sair: <><path d="M9.5 20.5h-4a2 2 0 0 1-2-2v-13a2 2 0 0 1 2-2h4" /><path d="M16.5 16.5 21 12l-4.5-4.5" /><path d="M21 12H9.5" /></>,
  seta: <path d="M9 6l6 6-6 6" />,
  fogo: <><path d="M12 3s-4 4-4 8.5A4 4 0 0 0 12 16a4 4 0 0 0 4-4.5C16 9 14.5 8 14.5 8s.5 2-1 3c.3-2-1.5-3.5-1.5-5.5C12 4.5 12 3 12 3Z" /><path d="M9 16.5a3 3 0 0 0 6 0" /></>,
  trofeu: <><path d="M8 4h8v4a4 4 0 0 1-8 0V4Z" /><path d="M8 5H5.5A2.5 2.5 0 0 0 5 9.9L8 11M16 5h2.5A2.5 2.5 0 0 1 19 9.9L16 11" /><path d="M12 12v3.5M9 20h6M10 15.5h4v2a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-2Z" /></>,
};

const NOMES_DIA_SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

export default function Dashboard() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [stats, setStats] = useState(null);
  const [rotacoesAtivas, setRotacoesAtivas] = useState([]);
  const [calendario, setCalendario] = useState([]);
  const [sequencia, setSequencia] = useState(0);
  const [ranking, setRanking] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregar() {
      try {
        const [respostas, rotacoes, rankingLista] = await Promise.all([
          buscarTodasRespostas(usuario.uid),
          buscarRotacoesAtivas(usuario.uid),
          buscarRanking(),
        ]);

        setStats(calcularEstatisticas(respostas));
        setRotacoesAtivas(rotacoes);
        setRanking(rankingLista);

        const metaDiaria = rotacoes.length > 0 ? rotacoes[0].metaBase : 10;
        setCalendario(montarCalendarioAtividade(respostas, metaDiaria, 35));
        setSequencia(calcularSequenciaAtual(respostas));
      } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
      } finally {
        setCarregando(false);
      }
    }
    carregar();
  }, [usuario.uid]);

  const handleLogout = async () => {
    const sucesso = await logout();
    if (sucesso) navigate('/login');
  };

  const itensNav = [
    { path: '/dashboard', label: 'Inicio', icone: icones.home },
    { path: '/minhas-rotacoes', label: 'Rotacoes', icone: icones.calendario },
    { path: '/questoes-avulsas', label: 'Questoes Avulsas', icone: icones.ajuda },
    { path: '/configurar-simulado', label: 'Simulados', icone: icones.relogio },
    { path: '/cronogramas', label: 'Cronogramas', icone: icones.mapa },
    { path: '/estatisticas', label: 'Estatisticas', icone: icones.grafico },
  ];

  const acoesRapidas = [
    { path: '/minhas-rotacoes', titulo: 'Rotacoes', desc: 'Continue seu plano de estudos', icone: icones.calendario },
    { path: '/questoes-avulsas', titulo: 'Questoes Avulsas', desc: 'Pratique por area ou tema', icone: icones.ajuda },
    { path: '/configurar-simulado', titulo: 'Simulados', desc: 'Teste seu tempo e desempenho', icone: icones.relogio },
    { path: '/cronogramas', titulo: 'Cronogramas', desc: 'Veja o oficial ou crie o seu', icone: icones.mapa },
  ];

  let melhorArea = null;
  let piorArea = null;
  if (stats && Object.keys(stats.porArea).length > 0) {
    const areasComPct = Object.entries(stats.porArea)
      .filter(([, d]) => d.total >= 3)
      .map(([area, d]) => ({ area, pct: Math.round((d.acertos / d.total) * 100), total: d.total }));

    if (areasComPct.length > 0) {
      melhorArea = [...areasComPct].sort((a, b) => b.pct - a.pct)[0];
      piorArea = [...areasComPct].sort((a, b) => a.pct - b.pct)[0];
    }
  }

  const corStatusDia = (status) => {
    if (status === 'completo') return '#2F8F7A';
    if (status === 'parcial') return '#E8C674';
    return '#E9ECEF';
  };

  // Agrupa o calendario em semanas de 7 dias para exibir em grade
  const semanas = [];
  for (let i = 0; i < calendario.length; i += 7) {
    semanas.push(calendario.slice(i, i + 7));
  }

  const posicaoUsuario = ranking.findIndex((r) => r.usuarioId === usuario.uid);

  return (
    <div style={styles.pagina}>
      <style>{`
        @media (max-width: 820px) {
          .app-sidebar { width: 100% !important; height: auto !important; flex-direction: row !important; overflow-x: auto; padding: 10px !important; }
          .app-sidebar-nav { flex-direction: row !important; gap: 6px !important; }
          .app-sidebar-label { display: none !important; }
          .app-sidebar-rodape { display: none !important; }
          .app-main { margin-left: 0 !important; }
          .app-layout-colunas { flex-direction: column !important; }
          .app-coluna-direita { width: 100% !important; }
        }
      `}</style>

      {/* SIDEBAR */}
      <div className="app-sidebar" style={styles.sidebar}>
        <div style={styles.marca}>
          <div style={styles.marcaPonto} />
          <span className="app-sidebar-label" style={styles.marcaTexto}>Banco de Questoes</span>
        </div>

        <nav className="app-sidebar-nav" style={styles.nav}>
          {itensNav.map((item) => {
            const ativo = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                style={{ ...styles.navItem, ...(ativo ? styles.navItemAtivo : {}) }}
              >
                <Icone path={item.icone} />
                <span className="app-sidebar-label">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="app-sidebar-rodape" style={styles.rodapeSidebar}>
  <Link to="/editar-perfil" style={styles.navItemRodape}>
    <Icone path={icones.engrenagem} />
    <span>Meu Perfil</span>
  </Link>
  <Link to="/admin" style={styles.navItemRodape}>
    <Icone path={icones.engrenagem} />
    <span>Admin</span>
  </Link>
  <button onClick={handleLogout} style={styles.navItemRodapeBotao}>
    <Icone path={icones.sair} />
    <span>Sair</span>
  </button>
</div>
      </div>

      {/* CONTEUDO PRINCIPAL */}
      <div className="app-main" style={styles.main}>
        <div style={styles.cabecalho}>
  <div>
    <p style={styles.saudacaoPequena}>Bem-vindo de volta</p>
    <h1 style={styles.saudacaoNome}>
      {usuario?.apelido && usuario.apelido.trim() ? usuario.apelido : (usuario?.nome || 'Estudante')}
    </h1>
  </div>
</div>

        {carregando ? (
          <div style={styles.carregandoBox}>Carregando seus dados...</div>
        ) : (
          <div className="app-layout-colunas" style={styles.layoutColunas}>
            {/* COLUNA ESQUERDA/CENTRAL: conteudo original */}
            <div style={styles.colunaEsquerda}>
              <div style={styles.gridStats}>
                <div style={styles.statCard}>
                  <span style={styles.statLabel}>Questoes respondidas</span>
                  <span style={styles.statValor}>{stats?.total ?? 0}</span>
                </div>
                <div style={styles.statCard}>
                  <span style={styles.statLabel}>Aproveitamento geral</span>
                  <span style={{ ...styles.statValor, color: styles.corPorPct(stats?.percentualGeral) }}>
                    {stats?.percentualGeral ?? 0}%
                  </span>
                </div>
                <div style={styles.statCard}>
                  <span style={styles.statLabel}>Rotacoes ativas</span>
                  <span style={styles.statValor}>{rotacoesAtivas.length}</span>
                </div>
              </div>

              {(melhorArea || piorArea) && (
                <div style={styles.destaquesLinha}>
                  {melhorArea && (
                    <div style={{ ...styles.destaqueCard, borderLeft: '3px solid #2F8F7A' }}>
                      <span style={styles.destaqueLabel}>Seu ponto forte</span>
                      <span style={styles.destaqueTitulo}>{melhorArea.area}</span>
                      <span style={styles.destaquePct}>{melhorArea.pct}% de aproveitamento</span>
                    </div>
                  )}
                  {piorArea && (
                    <div style={{ ...styles.destaqueCard, borderLeft: '3px solid #D6893F' }}>
                      <span style={styles.destaqueLabel}>Vale a pena revisar</span>
                      <span style={styles.destaqueTitulo}>{piorArea.area}</span>
                      <span style={styles.destaquePct}>{piorArea.pct}% de aproveitamento</span>
                    </div>
                  )}
                  <Link to="/estatisticas" style={styles.linkVerTudo}>
                    Ver estatisticas completas <Icone path={icones.seta} />
                  </Link>
                </div>
              )}

              <h2 style={styles.subtitulo}>Continuar estudando</h2>
              <div style={styles.gridAcoes}>
                {acoesRapidas.map((acao) => (
                  <Link key={acao.path} to={acao.path} style={styles.acaoCard}>
                    <div style={styles.acaoIcone}>
                      <Icone path={acao.icone} />
                    </div>
                    <div style={styles.acaoTextos}>
                      <span style={styles.acaoTitulo}>{acao.titulo}</span>
                      <span style={styles.acaoDesc}>{acao.desc}</span>
                    </div>
                    <span style={styles.acaoSeta}>
                      <Icone path={icones.seta} />
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {/* COLUNA DIREITA: widgets */}
            <div className="app-coluna-direita" style={styles.colunaDireita}>
              {/* SEQUENCIA */}
              <div style={styles.widgetCard}>
                <div style={styles.streakLinha}>
                  <div style={styles.streakIcone}>
                    <Icone path={icones.fogo} />
                  </div>
                  <div>
                    <div style={styles.streakValor}>{sequencia} {sequencia === 1 ? 'dia' : 'dias'}</div>
                    <div style={styles.streakLabel}>
                      {sequencia > 0 ? 'seguidos estudando' : 'Comece hoje sua sequencia'}
                    </div>
                  </div>
                </div>
              </div>

              {/* CALENDARIO DE ATIVIDADE */}
              <div style={styles.widgetCard}>
                <h3 style={styles.widgetTitulo}>Atividade recente</h3>
                <div style={styles.calendarioGrid}>
                  {semanas.map((semana, wi) => (
                    <div key={wi} style={styles.calendarioColuna}>
                      {semana.map((dia) => (
                        <div
                          key={dia.dia}
                          title={`${dia.dia}: ${dia.feitas} questao(oes)`}
                          style={{
                            ...styles.calendarioQuadrado,
                            backgroundColor: corStatusDia(dia.status),
                          }}
                        />
                      ))}
                    </div>
                  ))}
                </div>
                <div style={styles.calendarioLegenda}>
                  <span style={styles.legendaItem}>
                    <span style={{ ...styles.legendaBolinha, backgroundColor: '#E9ECEF' }} /> Nada
                  </span>
                  <span style={styles.legendaItem}>
                    <span style={{ ...styles.legendaBolinha, backgroundColor: '#E8C674' }} /> Parcial
                  </span>
                  <span style={styles.legendaItem}>
                    <span style={{ ...styles.legendaBolinha, backgroundColor: '#2F8F7A' }} /> Meta batida
                  </span>
                </div>
              </div>

              {/* RANKING */}
              <div style={styles.widgetCard}>
                <div style={styles.widgetTituloLinha}>
                  <Icone path={icones.trofeu} />
                  <h3 style={{ ...styles.widgetTitulo, marginBottom: 0 }}>Ranking do grupo</h3>
                </div>

                {ranking.length === 0 && (
                  <p style={styles.rankingVazio}>Ninguem respondeu questoes ainda.</p>
                )}

                <div style={styles.rankingLista}>
                  {ranking.slice(0, 5).map((r, index) => {
                    const souEu = r.usuarioId === usuario.uid;
                    return (
                      <div
                        key={r.usuarioId}
                        style={{ ...styles.rankingItem, ...(souEu ? styles.rankingItemAtivo : {}) }}
                      >
                        <span style={styles.rankingPosicao}>{index + 1}º</span>
                        <span style={styles.rankingNome}>{r.nome}{souEu ? ' (voce)' : ''}</span>
                        <span style={styles.rankingTotal}>{r.total}</span>
                      </div>
                    );
                  })}
                </div>

                {posicaoUsuario >= 5 && (
                  <div style={{ ...styles.rankingItem, ...styles.rankingItemAtivo, marginTop: '6px' }}>
                    <span style={styles.rankingPosicao}>{posicaoUsuario + 1}º</span>
                    <span style={styles.rankingNome}>{ranking[posicaoUsuario].nome} (voce)</span>
                    <span style={styles.rankingTotal}>{ranking[posicaoUsuario].total}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  corPorPct: (pct) => (pct >= 60 ? '#2F8F7A' : '#D6893F'),

  pagina: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: '#F5F7FA',
  },

  sidebar: {
    width: '230px',
    backgroundColor: '#16232E',
    display: 'flex',
    flexDirection: 'column',
    padding: '22px 14px',
    position: 'fixed',
    top: 0,
    left: 0,
    bottom: 0,
    boxSizing: 'border-box',
  },
  marca: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '0 8px 24px 8px',
  },
  marcaPonto: {
    width: '9px',
    height: '9px',
    borderRadius: '50%',
    backgroundColor: '#2F8F7A',
    flexShrink: 0,
  },
  marcaTexto: {
    color: '#FFFFFF',
    fontSize: '14px',
    fontWeight: '700',
    letterSpacing: '0.2px',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    flex: 1,
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 12px',
    borderRadius: '8px',
    color: '#9BA8B5',
    textDecoration: 'none',
    fontSize: '13.5px',
    fontWeight: '500',
  },
  navItemAtivo: {
    backgroundColor: '#20303D',
    color: '#FFFFFF',
  },
  rodapeSidebar: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    paddingTop: '14px',
    borderTop: '1px solid #24333F',
  },
  navItemRodape: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 12px',
    borderRadius: '8px',
    color: '#9BA8B5',
    textDecoration: 'none',
    fontSize: '13.5px',
    fontWeight: '500',
  },
  navItemRodapeBotao: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 12px',
    borderRadius: '8px',
    color: '#D68080',
    textDecoration: 'none',
    fontSize: '13.5px',
    fontWeight: '500',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'left',
    fontFamily: 'inherit',
  },

  main: {
    flex: 1,
    marginLeft: '230px',
    padding: '36px 40px',
  },
  cabecalho: {
    marginBottom: '28px',
  },
  saudacaoPequena: {
    margin: 0,
    fontSize: '13px',
    color: '#8A94A0',
    fontWeight: '500',
  },
  saudacaoNome: {
    margin: '2px 0 0 0',
    fontSize: '26px',
    color: '#16232E',
    fontWeight: '700',
  },
  carregandoBox: {
    padding: '40px',
    textAlign: 'center',
    color: '#8A94A0',
  },

  layoutColunas: {
    display: 'flex',
    gap: '24px',
    alignItems: 'flex-start',
  },
  colunaEsquerda: {
    flex: '2 1 0',
    minWidth: 0,
  },
  colunaDireita: {
    flex: '1 1 0',
    minWidth: '280px',
    maxWidth: '320px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },

  gridStats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '14px',
    marginBottom: '18px',
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E3E7EC',
    borderRadius: '10px',
    padding: '18px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  statLabel: {
    fontSize: '12.5px',
    color: '#8A94A0',
    fontWeight: '600',
  },
  statValor: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#16232E',
  },

  destaquesLinha: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
    alignItems: 'stretch',
    marginBottom: '32px',
  },
  destaqueCard: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E3E7EC',
    borderRadius: '10px',
    padding: '14px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
    minWidth: '190px',
    flex: '1 1 190px',
  },
  destaqueLabel: {
    fontSize: '11px',
    color: '#8A94A0',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
  },
  destaqueTitulo: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#16232E',
  },
  destaquePct: {
    fontSize: '12.5px',
    color: '#6B7785',
  },
  linkVerTudo: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '13px',
    color: '#2F8F7A',
    fontWeight: '600',
    textDecoration: 'none',
    alignSelf: 'center',
    padding: '0 6px',
  },

  subtitulo: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#16232E',
    marginBottom: '14px',
  },
  gridAcoes: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
    gap: '12px',
  },
  acaoCard: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E3E7EC',
    borderRadius: '10px',
    padding: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    textDecoration: 'none',
  },
  acaoIcone: {
    width: '38px',
    height: '38px',
    borderRadius: '9px',
    backgroundColor: '#E7F2EF',
    color: '#2F8F7A',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  acaoTextos: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    flex: 1,
  },
  acaoTitulo: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#16232E',
  },
  acaoDesc: {
    fontSize: '12.5px',
    color: '#8A94A0',
  },
  acaoSeta: {
    color: '#C3CAD1',
    flexShrink: 0,
  },

  // WIDGETS COLUNA DIREITA
  widgetCard: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E3E7EC',
    borderRadius: '10px',
    padding: '18px',
  },
  widgetTitulo: {
    fontSize: '13.5px',
    fontWeight: '700',
    color: '#16232E',
    margin: '0 0 12px 0',
  },
  widgetTituloLinha: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#D6893F',
    marginBottom: '4px',
  },

  streakLinha: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  streakIcone: {
    width: '42px',
    height: '42px',
    borderRadius: '10px',
    backgroundColor: '#FDF0E3',
    color: '#D6893F',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  streakValor: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#16232E',
    lineHeight: 1.2,
  },
  streakLabel: {
    fontSize: '12px',
    color: '#8A94A0',
  },

  calendarioGrid: {
    display: 'flex',
    gap: '3px',
    marginBottom: '10px',
    overflowX: 'auto',
  },
  calendarioColuna: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
  },
  calendarioQuadrado: {
    width: '12px',
    height: '12px',
    borderRadius: '3px',
  },
  calendarioLegenda: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
  },
  legendaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    fontSize: '11px',
    color: '#8A94A0',
  },
  legendaBolinha: {
    width: '9px',
    height: '9px',
    borderRadius: '3px',
    display: 'inline-block',
  },

  rankingVazio: {
    fontSize: '12.5px',
    color: '#8A94A0',
  },
  rankingLista: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  rankingItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 6px',
    borderRadius: '7px',
    fontSize: '13px',
  },
  rankingItemAtivo: {
    backgroundColor: '#E7F2EF',
  },
  rankingPosicao: {
    fontWeight: '700',
    color: '#8A94A0',
    minWidth: '22px',
  },
  rankingNome: {
    flex: 1,
    color: '#16232E',
    fontWeight: '500',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  rankingTotal: {
    fontWeight: '700',
    color: '#2F8F7A',
  },
};