import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import { cores } from '../styles/theme';

// ---------- Icones (SVG simples, sem dependencia externa) ----------
export function Icone({ path }) {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {path}
    </svg>
  );
}

export const icones = {
  home: <><path d="M3 11.5 12 4l9 7.5" /><path d="M5.5 10v9.5h13V10" /></>,
  calendario: <><rect x="3.5" y="5" width="17" height="15.5" rx="2" /><path d="M16 3v4M8 3v4M3.5 9.5h17" /></>,
  ajuda: <><circle cx="12" cy="12" r="8.5" /><path d="M9.3 9.3a2.7 2.7 0 0 1 5.2.9c0 1.6-2.3 2.1-2.5 3.6" /><path d="M12 17.2h.01" /></>,
  relogio: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2.5" /></>,
  grafico: <><path d="M4.5 19.5V11M12 19.5V4.5M19.5 19.5v-6" /></>,
  mapa: <><path d="M9 3.5 3.5 5.5v15L9 18.5l6 2 5.5-2v-15l-5.5 2-6-2Z" /><path d="M9 3.5v15M15 5.5v15" /></>,
  engrenagem: <><circle cx="12" cy="12" r="3.2" /><path d="M12 2.5v3M12 18.5v3M4.7 4.7l2.1 2.1M17.2 17.2l2.1 2.1M2.5 12h3M18.5 12h3M4.7 19.3l2.1-2.1M17.2 6.8l2.1-2.1" /></>,
  sair: <><path d="M9.5 20.5h-4a2 2 0 0 1-2-2v-13a2 2 0 0 1 2-2h4" /><path d="M16.5 16.5 21 12l-4.5-4.5" /><path d="M21 12H9.5" /></>,
  seta: <path d="M9 6l6 6-6 6" />,
};

const itensNav = [
  { path: '/dashboard', label: 'Inicio', icone: icones.home, match: ['/dashboard', '/'] },
  { path: '/minhas-rotacoes', label: 'Rotacoes', icone: icones.calendario, match: ['/minhas-rotacoes', '/criar-rotacao', '/rotacao'] },
  { path: '/questoes-avulsas', label: 'Questoes Avulsas', icone: icones.ajuda, match: ['/questoes-avulsas'] },
  { path: '/configurar-simulado', label: 'Simulados', icone: icones.relogio, match: ['/configurar-simulado', '/simulado', '/historico-simulados'] },
  { path: '/cronogramas', label: 'Cronogramas', icone: icones.mapa, match: ['/cronogramas'] },
  { path: '/estatisticas', label: 'Estatisticas', icone: icones.grafico, match: ['/estatisticas'] },
];

export default function Layout({ children, maxWidth }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    const sucesso = await logout();
    if (sucesso) navigate('/login');
  };

  return (
    <div style={styles.pagina}>
      <style>{`
        @media (max-width: 820px) {
          .app-sidebar { width: 100% !important; height: auto !important; flex-direction: row !important; overflow-x: auto; padding: 10px !important; }
          .app-sidebar-nav { flex-direction: row !important; gap: 6px !important; }
          .app-sidebar-label { display: none !important; }
          .app-sidebar-rodape { display: none !important; }
          .app-main { margin-left: 0 !important; }
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
            const ativo = item.match.some(
              (m) => location.pathname === m || location.pathname.startsWith(m + '/')
            );
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
      <div className="app-main" style={{ ...styles.main, ...(maxWidth ? { maxWidth } : {}) }}>
        {children}
      </div>
    </div>
  );
}

const styles = {
  pagina: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: cores.fundoPagina,
  },

  // SIDEBAR
  sidebar: {
    width: '230px',
    backgroundColor: cores.navy,
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
    backgroundColor: cores.teal,
    flexShrink: 0,
  },
  marcaTexto: {
    color: cores.branco,
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
    color: cores.textoClaro,
    textDecoration: 'none',
    fontSize: '13.5px',
    fontWeight: '500',
    transition: 'background-color 0.15s, color 0.15s',
  },
  navItemAtivo: {
    backgroundColor: cores.navySecundario,
    color: cores.branco,
  },
  rodapeSidebar: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    paddingTop: '14px',
    borderTop: '1px solid ' + cores.navyBorda,
  },
  navItemRodape: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 12px',
    borderRadius: '8px',
    color: cores.textoClaro,
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

  // MAIN
  main: {
    flex: 1,
    marginLeft: '230px',
    padding: '36px 40px',
    boxSizing: 'border-box',
  },
};
