import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import { criarRotacao, buscarAreasDisponiveis } from '../services/rotacoesService';

export default function CriarRotacao() {
  const [nome, setNome] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [metaBase, setMetaBase] = useState(20);
  const [modo, setModo] = useState('misturado');

  const [areasMisturadas, setAreasMisturadas] = useState([]);
  const [blocos, setBlocos] = useState([{ area: '', dataInicio: '', dataFim: '' }]);

  const [areasDisponiveis, setAreasDisponiveis] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [carregandoAreas, setCarregandoAreas] = useState(true);
  const [erro, setErro] = useState('');

  const { usuario } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    async function carregarAreas() {
      try {
        const areas = await buscarAreasDisponiveis();
        setAreasDisponiveis(areas);
      } catch (error) {
        setErro('Erro ao carregar areas: ' + error.message);
      } finally {
        setCarregandoAreas(false);
      }
    }
    carregarAreas();
  }, []);

  const toggleAreaMisturada = (area) => {
    setAreasMisturadas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );
  };

  const adicionarBloco = () => {
    setBlocos([...blocos, { area: '', dataInicio: '', dataFim: '' }]);
  };

  const removerBloco = (index) => {
    setBlocos(blocos.filter((_, i) => i !== index));
  };

  const atualizarBloco = (index, campo, valor) => {
    const novosBlocos = [...blocos];
    novosBlocos[index][campo] = valor;
    setBlocos(novosBlocos);
  };

  const handleCriar = async (e) => {
    e.preventDefault();
    setErro('');

    if (!nome.trim()) {
      setErro('Digite um nome para a rotacao');
      return;
    }
    if (!dataInicio || !dataFim) {
      setErro('Preencha data de inicio e fim');
      return;
    }
    if (dataFim < dataInicio) {
      setErro('A data fim deve ser depois da data inicio');
      return;
    }
    if (metaBase < 1) {
      setErro('A meta diaria deve ser pelo menos 1');
      return;
    }
    if (modo === 'misturado' && areasMisturadas.length === 0) {
      setErro('Escolha pelo menos uma area');
      return;
    }
    if (modo === 'blocos') {
      const blocoInvalido = blocos.find((b) => !b.area || !b.dataInicio || !b.dataFim);
      if (blocoInvalido) {
        setErro('Preencha todos os campos de todos os blocos');
        return;
      }
    }

    try {
      setCarregando(true);

      const dadosRotacao = {
        usuarioId: usuario.uid,
        nome: nome.trim(),
        dataInicio,
        dataFim,
        metaBase: Number(metaBase),
        modo,
      };

      if (modo === 'misturado') {
        dadosRotacao.areasMisturadas = areasMisturadas;
      } else {
        dadosRotacao.blocos = blocos;
      }

      const rotacaoId = await criarRotacao(dadosRotacao);
      alert('Rotacao criada com sucesso!');
      navigate('/rotacao/' + rotacaoId);
    } catch (error) {
      setErro('Erro ao criar rotacao: ' + error.message);
    } finally {
      setCarregando(false);
    }
  };

  if (carregandoAreas) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>Carregando areas disponiveis...</div>
      </div>
    );
  }

  if (areasDisponiveis.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <p>Nenhuma area com questoes cadastradas ainda.</p>
          <button onClick={() => navigate('/dashboard')} style={styles.botao}>
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <button onClick={() => navigate('/dashboard')} style={styles.btnVoltar}>
          Voltar
        </button>

        <h2 style={styles.titulo}>Criar Nova Rotacao</h2>

        {erro && <div style={styles.erroBox}>{erro}</div>}

        <form onSubmit={handleCriar}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Nome da Rotacao</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              style={styles.input}
              placeholder="Ex: Internato GO"
              disabled={carregando}
            />
          </div>

          <div style={styles.linhaDupla}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Data Inicio</label>
              <input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                style={styles.input}
                disabled={carregando}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Data Fim</label>
              <input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                style={styles.input}
                disabled={carregando}
              />
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Meta de Questoes por Dia</label>
            <input
              type="number"
              value={metaBase}
              onChange={(e) => setMetaBase(e.target.value)}
              style={styles.input}
              min="1"
              disabled={carregando}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Modo de Estudo</label>
            <div style={styles.modoOpcoes}>
              <button
                type="button"
                onClick={() => setModo('misturado')}
                style={{
                  ...styles.modoBotao,
                  ...(modo === 'misturado' ? styles.modoBotaoAtivo : {}),
                }}
                disabled={carregando}
              >
                Misturado
                <span style={styles.modoDescricao}>Varias areas juntas o tempo todo</span>
              </button>
              <button
                type="button"
                onClick={() => setModo('blocos')}
                style={{
                  ...styles.modoBotao,
                  ...(modo === 'blocos' ? styles.modoBotaoAtivo : {}),
                }}
                disabled={carregando}
              >
                Blocos por Data
                <span style={styles.modoDescricao}>Uma area por periodo</span>
              </button>
            </div>
          </div>

          {modo === 'misturado' && (
            <div style={styles.formGroup}>
              <label style={styles.label}>Escolha as Areas</label>
              <div style={styles.checkboxLista}>
                {areasDisponiveis.map((area) => (
                  <label key={area} style={styles.checkboxItem}>
                    <input
                      type="checkbox"
                      checked={areasMisturadas.includes(area)}
                      onChange={() => toggleAreaMisturada(area)}
                      disabled={carregando}
                    />
                    {area}
                  </label>
                ))}
              </div>
            </div>
          )}

          {modo === 'blocos' && (
            <div style={styles.formGroup}>
              <label style={styles.label}>Blocos de Estudo</label>
              {blocos.map((bloco, index) => (
                <div key={index} style={styles.blocoCard}>
                  <div style={styles.formGroup}>
                    <label style={styles.labelPequeno}>Area</label>
                    <select
                      value={bloco.area}
                      onChange={(e) => atualizarBloco(index, 'area', e.target.value)}
                      style={styles.input}
                      disabled={carregando}
                    >
                      <option value="">Selecione...</option>
                      {areasDisponiveis.map((area) => (
                        <option key={area} value={area}>
                          {area}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div style={styles.linhaDupla}>
                    <div style={styles.formGroup}>
                      <label style={styles.labelPequeno}>Inicio do Bloco</label>
                      <input
                        type="date"
                        value={bloco.dataInicio}
                        onChange={(e) => atualizarBloco(index, 'dataInicio', e.target.value)}
                        style={styles.input}
                        disabled={carregando}
                      />
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.labelPequeno}>Fim do Bloco</label>
                      <input
                        type="date"
                        value={bloco.dataFim}
                        onChange={(e) => atualizarBloco(index, 'dataFim', e.target.value)}
                        style={styles.input}
                        disabled={carregando}
                      />
                    </div>
                  </div>
                  {blocos.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removerBloco(index)}
                      style={styles.btnRemoverBloco}
                      disabled={carregando}
                    >
                      Remover este bloco
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={adicionarBloco}
                style={styles.btnAdicionarBloco}
                disabled={carregando}
              >
                + Adicionar outro bloco
              </button>
            </div>
          )}

          <button
            type="submit"
            style={{ ...styles.botao, opacity: carregando ? 0.7 : 1, marginTop: '20px' }}
            disabled={carregando}
          >
            {carregando ? 'Criando...' : 'Criar Rotacao'}
          </button>
        </form>
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
    maxWidth: '600px',
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
    marginBottom: '20px',
  },
  titulo: {
    fontSize: '22px',
    marginBottom: '20px',
    color: '#333',
  },
  formGroup: {
    marginBottom: '18px',
    flex: 1,
  },
  linhaDupla: {
    display: 'flex',
    gap: '15px',
  },
  label: {
    display: 'block',
    marginBottom: '6px',
    fontWeight: '500',
    color: '#333',
    fontSize: '14px',
  },
  labelPequeno: {
    display: 'block',
    marginBottom: '4px',
    fontWeight: '500',
    color: '#666',
    fontSize: '12px',
  },
  input: {
    width: '100%',
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '15px',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
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
  botao: {
    width: '100%',
    padding: '14px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  modoOpcoes: {
    display: 'flex',
    gap: '10px',
  },
  modoBotao: {
    flex: 1,
    padding: '15px 10px',
    border: '2px solid #ddd',
    borderRadius: '8px',
    backgroundColor: 'white',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
    fontWeight: '600',
    fontSize: '14px',
  },
  modoBotaoAtivo: {
    borderColor: '#007bff',
    backgroundColor: '#e7f3ff',
    color: '#007bff',
  },
  modoDescricao: {
    fontSize: '11px',
    fontWeight: '400',
    color: '#888',
  },
  checkboxLista: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    padding: '12px',
    maxHeight: '200px',
    overflowY: 'auto',
  },
  checkboxItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    cursor: 'pointer',
  },
  blocoCard: {
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '15px',
    marginBottom: '15px',
    backgroundColor: '#fafafa',
  },
  btnRemoverBloco: {
    padding: '6px 12px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
  },
  btnAdicionarBloco: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
  },
};