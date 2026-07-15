import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { buscarTodasQuestoes, embaralharArray } from '../services/questoesService';

export default function ConfigurarSimulado() {
  const [todasQuestoesCache, setTodasQuestoesCache] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  const [misturarTudo, setMisturarTudo] = useState(true);
  const [areasSelecionadas, setAreasSelecionadas] = useState([]);
  const [subareasSelecionadas, setSubareasSelecionadas] = useState([]);
  const [dificuldadesSelecionadas, setDificuldadesSelecionadas] = useState([]);
  const [quantidade, setQuantidade] = useState(20);
  const [usarCronometro, setUsarCronometro] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    async function carregar() {
      try {
        setCarregando(true);
        const dados = await buscarTodasQuestoes();
        setTodasQuestoesCache(dados);
      } catch (error) {
        setErro('Erro ao carregar questoes: ' + error.message);
      } finally {
        setCarregando(false);
      }
    }
    carregar();
  }, []);

  const areasDisponiveis = Array.from(
    new Set(todasQuestoesCache.map((q) => q.area).filter((a) => a && a.trim() !== ''))
  ).sort();

  const subareasDisponiveis = Array.from(
    new Set(
      todasQuestoesCache
        .filter((q) => areasSelecionadas.length === 0 || areasSelecionadas.includes(q.area))
        .map((q) => q.subarea)
        .filter((s) => s && s.trim() !== '')
    )
  ).sort();

  const toggleArea = (area) => {
    setAreasSelecionadas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );
    setSubareasSelecionadas([]);
  };

  const toggleSubarea = (subarea) => {
    setSubareasSelecionadas((prev) =>
      prev.includes(subarea) ? prev.filter((s) => s !== subarea) : [...prev, subarea]
    );
  };

  const toggleDificuldade = (dificuldade) => {
    setDificuldadesSelecionadas((prev) =>
      prev.includes(dificuldade) ? prev.filter((d) => d !== dificuldade) : [...prev, dificuldade]
    );
  };

  const calcularQuestoesDisponiveis = () => {
    let filtradas = todasQuestoesCache;

    if (!misturarTudo && areasSelecionadas.length > 0) {
      filtradas = filtradas.filter((q) => areasSelecionadas.includes(q.area));

      if (subareasSelecionadas.length > 0) {
        filtradas = filtradas.filter((q) => subareasSelecionadas.includes(q.subarea));
      }
    }

    if (dificuldadesSelecionadas.length > 0) {
      filtradas = filtradas.filter((q) => dificuldadesSelecionadas.includes(q.dificuldade));
    }

    return filtradas;
  };

  const questoesDisponiveisCount = calcularQuestoesDisponiveis().length;

  const handleIniciar = () => {
    if (!misturarTudo && areasSelecionadas.length === 0) {
      setErro('Escolha pelo menos uma area, ou marque "Todas as areas"');
      return;
    }

    const disponiveis = calcularQuestoesDisponiveis();

    if (disponiveis.length === 0) {
      setErro('Nenhuma questao encontrada para essa selecao.');
      return;
    }

    const qtdFinal = Math.min(Number(quantidade), disponiveis.length);
    const embaralhadas = embaralharArray(disponiveis).slice(0, qtdFinal);

    // Passa os dados via navigate state, para a tela de execucao usar
    navigate('/simulado', {
      state: {
        questoes: embaralhadas,
        usarCronometro,
        configuracao: {
          misturarTudo,
          areas: areasSelecionadas,
          subareas: subareasSelecionadas,
          dificuldades: dificuldadesSelecionadas,
          quantidade: qtdFinal,
        },
      },
    });
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
      <div style={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
  <button onClick={() => navigate('/dashboard')} style={styles.btnVoltar}>
    Voltar
  </button>
  <Link to="/historico-simulados" style={styles.btnVoltar}>
    Ver Historico
  </Link>
</div>

<h2 style={styles.titulo}>Configurar Simulado</h2>
        {erro && <div style={styles.erroBox}>{erro}</div>}

        <div style={styles.formGroup}>
          <label style={styles.checkboxItemGrande}>
            <input
              type="checkbox"
              checked={misturarTudo}
              onChange={(e) => setMisturarTudo(e.target.checked)}
            />
            Todas as areas misturadas
          </label>
        </div>

        {!misturarTudo && (
          <>
            <div style={styles.formGroup}>
              <label style={styles.label}>Escolha a(s) area(s)</label>
              <div style={styles.checkboxLista}>
                {areasDisponiveis.map((area) => (
                  <label key={area} style={styles.checkboxItem}>
                    <input
                      type="checkbox"
                      checked={areasSelecionadas.includes(area)}
                      onChange={() => toggleArea(area)}
                    />
                    {area}
                  </label>
                ))}
              </div>
            </div>

            {areasSelecionadas.length > 0 && subareasDisponiveis.length > 0 && (
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Escolha a(s) subarea(s) (opcional)
                </label>
                <div style={styles.checkboxLista}>
                  {subareasDisponiveis.map((subarea) => (
                    <label key={subarea} style={styles.checkboxItem}>
                      <input
                        type="checkbox"
                        checked={subareasSelecionadas.includes(subarea)}
                        onChange={() => toggleSubarea(subarea)}
                      />
                      {subarea}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <div style={styles.formGroup}>
          <label style={styles.label}>Dificuldade (opcional)</label>
          <div style={styles.checkboxLinhaHorizontal}>
            {['facil', 'medio', 'dificil'].map((dif) => (
              <label key={dif} style={styles.checkboxItem}>
                <input
                  type="checkbox"
                  checked={dificuldadesSelecionadas.includes(dif)}
                  onChange={() => toggleDificuldade(dif)}
                />
                {dif}
              </label>
            ))}
          </div>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Quantidade de Questoes</label>
          <input
            type="number"
            value={quantidade}
            onChange={(e) => setQuantidade(e.target.value)}
            style={styles.input}
            min="1"
          />
          <p style={styles.infoTexto}>
            {questoesDisponiveisCount} questoes disponiveis com esses filtros
          </p>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.checkboxItemGrande}>
            <input
              type="checkbox"
              checked={usarCronometro}
              onChange={(e) => setUsarCronometro(e.target.checked)}
            />
            Usar cronometro (tempo corrido, sem pausar)
          </label>
        </div>

        <button onClick={handleIniciar} style={styles.botaoIniciar}>
          Iniciar Simulado
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    padding: '20px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingTop: '30px',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '30px',
    maxWidth: '550px',
    width: '100%',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  btnVoltar: {
    padding: '8px 16px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    marginBottom: '15px',
  },
  titulo: {
    fontSize: '22px',
    marginBottom: '20px',
    color: '#333',
  },
  formGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: '500',
    color: '#333',
    fontSize: '14px',
  },
  checkboxItemGrande: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  checkboxLista: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    padding: '12px',
    maxHeight: '180px',
    overflowY: 'auto',
  },
  checkboxLinhaHorizontal: {
    display: 'flex',
    gap: '20px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    padding: '12px',
  },
  checkboxItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    cursor: 'pointer',
  },
  input: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '15px',
    boxSizing: 'border-box',
  },
  infoTexto: {
    fontSize: '12px',
    color: '#666',
    marginTop: '5px',
  },
  botaoIniciar: {
    width: '100%',
    padding: '15px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '10px',
  },
  erroBox: {
    backgroundColor: '#fee',
    border: '1px solid #fcc',
    color: '#c00',
    padding: '12px',
    borderRadius: '6px',
    marginBottom: '20px',
    fontSize: '14px',
  },
  loadingBox: {
    textAlign: 'center',
    padding: '50px',
    fontSize: '18px',
  },
};