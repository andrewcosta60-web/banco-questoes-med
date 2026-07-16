import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import {
  criarCronograma,
  buscarCronogramasDisponiveis,
  deletarCronograma,
} from '../services/cronogramasService';
import { buscarAreasDisponiveis } from '../services/rotacoesService';
import Layout from '../components/Layout';
import { cores, estilosBase } from '../styles/theme';

export default function Cronogramas() {
  const [modo, setModo] = useState('lista'); // lista ou criar
  const [cronogramas, setCronogramas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  const [nome, setNome] = useState('');
  const [ehOficial, setEhOficial] = useState(false);
  const [areasDisponiveis, setAreasDisponiveis] = useState([]);
  const [blocos, setBlocos] = useState([{ area: '', dataInicio: '', dataFim: '' }]);
  const [salvando, setSalvando] = useState(false);

  const { usuario } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
  carregarCronogramas();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

  async function carregarCronogramas() {
    try {
      setCarregando(true);
      const dados = await buscarCronogramasDisponiveis(usuario.uid);
      setCronogramas(dados);
    } catch (error) {
      setErro('Erro ao carregar cronogramas: ' + error.message);
    } finally {
      setCarregando(false);
    }
  }

  const abrirCriacao = async () => {
    try {
      const areas = await buscarAreasDisponiveis();
      setAreasDisponiveis(areas);
      setNome('');
      setEhOficial(false);
      setBlocos([{ area: '', dataInicio: '', dataFim: '' }]);
      setModo('criar');
    } catch (error) {
      setErro('Erro ao carregar areas: ' + error.message);
    }
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
      setErro('Digite um nome para o cronograma');
      return;
    }

    const blocoInvalido = blocos.find((b) => !b.area || !b.dataInicio || !b.dataFim);
    if (blocoInvalido) {
      setErro('Preencha todos os campos de todos os blocos');
      return;
    }

    try {
      setSalvando(true);

      const dadosCronograma = {
        nome: nome.trim(),
        tipo: ehOficial ? 'oficial' : 'pessoal',
        blocos,
      };

      if (!ehOficial) {
        dadosCronograma.usuarioId = usuario.uid;
      }

      await criarCronograma(dadosCronograma);
      alert('Cronograma criado com sucesso!');
      await carregarCronogramas();
      setModo('lista');
    } catch (error) {
      setErro('Erro ao criar cronograma: ' + error.message);
    } finally {
      setSalvando(false);
    }
  };

  const handleDeletar = async (cronogramaId, nomeCronograma) => {
    const confirmar = window.confirm(
      `Tem certeza que deseja deletar o cronograma "${nomeCronograma}"?`
    );
    if (!confirmar) return;

    try {
      await deletarCronograma(cronogramaId);
      await carregarCronogramas();
    } catch (error) {
      alert('Erro ao deletar: ' + error.message);
    }
  };

  if (carregando) {
    return (
      <Layout maxWidth="700px">
        <div style={styles.loadingBox}>Carregando...</div>
      </Layout>
    );
  }

  // ===================== TELA DE LISTA =====================
  if (modo === 'lista') {
    const oficiais = cronogramas.filter((c) => c.tipo === 'oficial');
    const pessoais = cronogramas.filter((c) => c.tipo === 'pessoal');

    return (
      <Layout maxWidth="700px">
        <div style={styles.header}>
          <button onClick={() => navigate('/dashboard')} style={styles.btnVoltar}>
            Voltar
          </button>
          <h2 style={styles.titulo}>Cronogramas de Estudo</h2>
        </div>

        {erro && <div style={styles.erroBox}>{erro}</div>}

        <div style={styles.secao}>
          <h3 style={styles.subtitulo}>Cronogramas Oficiais (recomendados)</h3>
          {oficiais.length === 0 && (
            <div style={styles.vazioBox}>Nenhum cronograma oficial cadastrado ainda.</div>
          )}
          {oficiais.map((c) => (
            <div key={c.id} style={styles.card}>
              <div style={styles.cardTopo}>
                <span style={styles.cardNome}>{c.nome}</span>
                <span style={styles.badgeOficial}>Oficial</span>
              </div>
              <div style={styles.listaBlocosResumo}>
                {c.blocos.map((b, i) => (
                  <div key={i} style={styles.blocoResumoItem}>
                    {b.area} ({b.dataInicio} a {b.dataFim})
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={styles.secao}>
          <h3 style={styles.subtitulo}>Meus Cronogramas Pessoais</h3>
          {pessoais.length === 0 && (
            <div style={styles.vazioBox}>Voce ainda nao criou nenhum cronograma pessoal.</div>
          )}
          {pessoais.map((c) => (
            <div key={c.id} style={styles.card}>
              <div style={styles.cardTopo}>
                <span style={styles.cardNome}>{c.nome}</span>
                <button
                  onClick={() => handleDeletar(c.id, c.nome)}
                  style={styles.btnDeletarMini}
                >
                  Deletar
                </button>
              </div>
              <div style={styles.listaBlocosResumo}>
                {c.blocos.map((b, i) => (
                  <div key={i} style={styles.blocoResumoItem}>
                    {b.area} ({b.dataInicio} a {b.dataFim})
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <button onClick={abrirCriacao} style={styles.botaoNovo}>
          + Criar Novo Cronograma
        </button>
      </Layout>
    );
  }

  // ===================== TELA DE CRIACAO =====================
  return (
    <Layout maxWidth="700px">
      <div style={styles.card}>
        <button onClick={() => setModo('lista')} style={styles.btnVoltar}>
          Voltar a Lista
        </button>

        <h2 style={styles.titulo}>Criar Cronograma</h2>

        {erro && <div style={styles.erroBox}>{erro}</div>}

        <form onSubmit={handleCriar}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Nome do Cronograma</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              style={styles.input}
              placeholder="Ex: Cronograma Fase 8 - UNIARP"
              disabled={salvando}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.checkboxItemGrande}>
              <input
                type="checkbox"
                checked={ehOficial}
                onChange={(e) => setEhOficial(e.target.checked)}
                disabled={salvando}
              />
              Marcar como Cronograma Oficial (visivel para todos os alunos)
            </label>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Blocos do Cronograma</label>
            {blocos.map((bloco, index) => (
              <div key={index} style={styles.blocoCard}>
                <div style={styles.formGroup}>
                  <label style={styles.labelPequeno}>Area</label>
                  <select
                    value={bloco.area}
                    onChange={(e) => atualizarBloco(index, 'area', e.target.value)}
                    style={styles.input}
                    disabled={salvando}
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
                    <label style={styles.labelPequeno}>Inicio</label>
                    <input
                      type="date"
                      value={bloco.dataInicio}
                      onChange={(e) => atualizarBloco(index, 'dataInicio', e.target.value)}
                      style={styles.input}
                      disabled={salvando}
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.labelPequeno}>Fim</label>
                    <input
                      type="date"
                      value={bloco.dataFim}
                      onChange={(e) => atualizarBloco(index, 'dataFim', e.target.value)}
                      style={styles.input}
                      disabled={salvando}
                    />
                  </div>
                </div>
                {blocos.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removerBloco(index)}
                    style={styles.btnRemoverBloco}
                    disabled={salvando}
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
              disabled={salvando}
            >
              + Adicionar outro bloco
            </button>
          </div>

          <button type="submit" style={styles.botao} disabled={salvando}>
            {salvando ? 'Salvando...' : 'Criar Cronograma'}
          </button>
        </form>
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
  btnVoltar: {
    ...estilosBase.botaoSecundario,
    marginBottom: '15px',
  },
  titulo: {
    fontSize: '20px',
    color: cores.texto,
    fontWeight: '700',
    margin: 0,
  },
  secao: {
    marginBottom: '25px',
  },
  subtitulo: estilosBase.subtitulo,
  card: {
    ...estilosBase.card,
    padding: '20px',
    marginBottom: '10px',
  },
  cardTopo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  },
  cardNome: {
    fontWeight: '700',
    fontSize: '15px',
    color: cores.texto,
  },
  badgeOficial: {
    ...estilosBase.tag,
  },
  listaBlocosResumo: {
    fontSize: '12px',
    color: cores.textoSecundario,
  },
  blocoResumoItem: {
    padding: '4px 0',
  },
  btnDeletarMini: {
    padding: '5px 10px',
    backgroundColor: cores.perigoFundo,
    color: cores.perigoTexto,
    border: 'none',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  vazioBox: estilosBase.vazioBox,
  botaoNovo: {
    display: 'block',
    width: '100%',
    padding: '14px',
    backgroundColor: cores.teal,
    color: cores.branco,
    border: 'none',
    borderRadius: '8px',
    fontSize: '14.5px',
    fontWeight: '700',
    cursor: 'pointer',
    textAlign: 'center',
    fontFamily: 'inherit',
  },
  formGroup: {
    marginBottom: '18px',
  },
  label: estilosBase.label,
  labelPequeno: estilosBase.labelPequeno,
  checkboxItemGrande: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    color: cores.texto,
  },
  input: estilosBase.input,
  linhaDupla: {
    display: 'flex',
    gap: '15px',
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
  botao: estilosBase.botaoPrimario,
  erroBox: estilosBase.erroBox,
  loadingBox: estilosBase.loadingBox,
};
