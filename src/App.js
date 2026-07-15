import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './services/AuthContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import QuestoesAvulsas from './pages/QuestoesAvulsas';
import CriarRotacao from './pages/CriarRotacao';
import Rotacao from './pages/Rotacao';
import MinhasRotacoes from './pages/MinhasRotacoes';
import ImportarQuestoes from './pages/ImportarQuestoes';
import EditorQuestoes from './pages/EditorQuestoes';
import ConfigurarSimulado from './pages/ConfigurarSimulado';
import Simulado from './pages/Simulado';
import HistoricoSimulados from './pages/HistoricoSimulados';
import Estatisticas from './pages/Estatisticas';
import Admin from './pages/Admin';

function ProtectedRoute({ children }) {
  const { usuario, carregando } = useAuth();

  if (carregando) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>Carregando...</div>;
  }

  if (!usuario) {
    return <Navigate to="/login" />;
  }

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route
  path="/admin"
  element={
    <ProtectedRoute>
      <Admin />
    </ProtectedRoute>
  }
/>
          <Route
  path="/historico-simulados"
  element={
    <ProtectedRoute>
      <HistoricoSimulados />
    </ProtectedRoute>
  }
/>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
  path="/estatisticas"
  element={
    <ProtectedRoute>
      <Estatisticas />
    </ProtectedRoute>
  }
/>
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/questoes-avulsas"
            element={
              <ProtectedRoute>
                <QuestoesAvulsas />
              </ProtectedRoute>
            }
          />
          <Route
            path="/minhas-rotacoes"
            element={
              <ProtectedRoute>
                <MinhasRotacoes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/criar-rotacao"
            element={
              <ProtectedRoute>
                <CriarRotacao />
              </ProtectedRoute>
            }
          />
          <Route
            path="/rotacao/:rotacaoId"
            element={
              <ProtectedRoute>
                <Rotacao />
              </ProtectedRoute>
            }
          />
          <Route
            path="/importar-questoes"
            element={
              <ProtectedRoute>
                <ImportarQuestoes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/editor-questoes"
            element={
              <ProtectedRoute>
                <EditorQuestoes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/configurar-simulado"
            element={
              <ProtectedRoute>
                <ConfigurarSimulado />
              </ProtectedRoute>
            }
          />
          <Route
            path="/simulado"
            element={
              <ProtectedRoute>
                <Simulado />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
