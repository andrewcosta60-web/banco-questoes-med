import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import { criarRotacao, buscarAreasDisponiveis } from '../services/rotacoesService';
import { buscarCronogramasDisponiveis } from '../services/cronogramasService';
import Layout from '../components/Layout';
import { cores, estilosBase } from '../styles/theme';

export default function CriarRotacao() {

  const [nome, setNome] = useState('');
  const [cronogramasDisponiveis, setCronogramasDisponiveis] = useState([]);
  const [cronogramaEscolhidoId, setCronogramaEscolhidoId] = useState('');
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
  async function carregarDados() {
    try {
      const areas = await buscarAreasDisponiveis();
      setAreasDisponiveis(areas);

      const cronogramas = await buscarCronogramasDisponiveis(usuario.uid);
      setCronogramasDisponiveis(cronogramas);
    } catch (error) {
      setErro('Erro ao carregar dados: ' + error.message);
    } finally {
      setCarregandoAreas(false);
    }
  }
  carregarDados();
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
      <Layout maxWidth="600px">
        <div style={styles.card}>Carregando areas disponiveis...</div>
      </Layout>
    );
  }

  if (areasDisponiveis.length === 0) {
    return (
      <Layout maxWidth="600px">
        <div style={styles.card}>
          <p>Nenhuma area com questoes cadastradas ainda.</p>
          <button onClick={() => navigate('/dashboard')} style={styles.botao}>
            Voltar ao Dashboard
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout maxWidth="600px">
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
    </Layout>
  );
}

const styles = {
  card: {
    ...estilosBase.card,
    padding: '28px',
  },
  btnVoltar: {
    ...estilosBase.botaoSecundario,
    marginBottom: '18px',
  },
  titulo: {
    fontSize: '20px',
    marginBottom: '20px',
    color: cores.texto,
    fontWeight: '700',
  },
  formGroup: {
    marginBottom: '18px',
    flex: 1,
  },
  linhaDupla: {
    display: 'flex',
    gap: '15px',
  },
  label: estilosBase.label,
  labelPequeno: estilosBase.labelPequeno,
  input: estilosBase.input,
  erroBox: estilosBase.erroBox,
  botao: estilosBase.botaoPrimario,
  modoOpcoes: {
    display: 'flex',
    gap: '10px',
  },
  modoBotao: {
    flex: 1,
    padding: '15px 10px',
    border: '2px solid ' + cores.borda,
    borderRadius: '8px',
    backgroundColor: cores.branco,
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
    fontWeight: '600',
    fontSize: '14px',
    fontFamily: 'inherit',
    color: cores.texto,
  },
  modoBotaoAtivo: {
    borderColor: cores.teal,
    backgroundColor: cores.tealFundo,
    color: cores.teal,
  },
  modoDescricao: {
    fontSize: '11px',
    fontWeight: '400',
    color: cores.textoSecundario,
  },
  checkboxLista: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    border: '1px solid ' + cores.borda,
    borderRadius: '8px',
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
    color: cores.texto,
  },
  blocoCard: {
    border: '1px solid ' + cores.borda,
    borderRadius: '8px',
    padding: '15px',
    marginBottom: '15px',
    backgroundColor: cores.fundoPagina,
  },
  btnRemoverBloco: {
    ...estilosBase.botaoPerigo,
    padding: '7px 12px',
    fontSize: '12px',
  },
  btnAdicionarBloco: {
    width: '100%',
    padding: '10px',
    backgroundColor: cores.tealFundo,
    color: cores.teal,
    border: '1px dashed ' + cores.teal,
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontFamily: 'inherit',
  },
};
