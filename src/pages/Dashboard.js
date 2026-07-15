import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';

export default function Dashboard() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    const sucesso = await logout();
    if (sucesso) {
      navigate('/login');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.titulo}>Banco de Questoes Medicas</h1>
          <div style={styles.headerBotoes}>
            <Link to="/admin" style={styles.btnAdmin}>
              Admin
            </Link>
            <button onClick={handleLogout} style={styles.btnLogout}>
              Logout
            </button>
          </div>
        </div>
      </div>

      <div style={styles.main}>
        <div style={styles.card}>
          <h2>Bem-vindo, {usuario?.nome || 'Usuario'}!</h2>
          <p>Email: {usuario?.email}</p>
        </div>

        <div style={styles.grid}>
          <div style={styles.featureCard}>
            <div style={styles.icon}>Rotacoes</div>
            <h3>Rotacoes</h3>
            <p>Crie rotacoes de estudo personalizadas</p>
            <Link to="/minhas-rotacoes" style={{ ...styles.btnFeature, textDecoration: 'none', display: 'inline-block' }}>
              Comecar
            </Link>
          </div>

          <div style={styles.featureCard}>
            <div style={styles.icon}>Questoes</div>
            <h3>Questoes Avulsas</h3>
            <p>Pratique questoes aleatorias</p>
            <Link to="/questoes-avulsas" style={{ ...styles.btnFeature, textDecoration: 'none', display: 'inline-block' }}>
              Comecar
            </Link>
          </div>

          <div style={styles.featureCard}>
            <div style={styles.icon}>Simulados</div>
            <h3>Simulados</h3>
            <p>Faca simulados com cronometro</p>
            <Link to="/configurar-simulado" style={{ ...styles.btnFeature, textDecoration: 'none', display: 'inline-block' }}>
              Comecar
            </Link>
          </div>

          <div style={styles.featureCard}>
            <div style={styles.icon}>Estatisticas</div>
            <h3>Estatisticas</h3>
            <p>Veja seu desempenho e progresso</p>
            <Link to="/estatisticas" style={{ ...styles.btnFeature, textDecoration: 'none', display: 'inline-block' }}>
              Ver
            </Link>
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
  },
  header: {
    backgroundColor: '#007bff',
    color: 'white',
    padding: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  headerContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titulo: {
    margin: 0,
    fontSize: '28px',
  },
  headerBotoes: {
    display: 'flex',
    gap: '10px',
  },
  btnAdmin: {
    padding: '10px 20px',
    backgroundColor: '#6c757d',
    color: 'white',
    borderRadius: '6px',
    fontWeight: '600',
    textDecoration: 'none',
    fontSize: '14px',
  },
  btnLogout: {
    padding: '10px 20px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
  },
  main: {
    maxWidth: '1200px',
    margin: '30px auto',
    padding: '0 20px',
  },
  card: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '30px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
  },
  featureCard: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    textAlign: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  icon: {
    fontSize: '16px',
    marginBottom: '10px',
    fontWeight: 'bold',
    color: '#007bff',
  },
  btnFeature: {
    marginTop: '15px',
    padding: '10px 20px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
  },
};