import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  listarQuestoesComNumero,
  buscarQuestaoParaEditar,
  atualizarQuestao,
  deletarQuestao,
  adicionarImagemNaQuestao,
  removerImagemDaQuestao,
} from '../services/questoesService';
import Layout from '../components/Layout';
import { cores, estilosBase } from '../styles/theme';

export default function EditorQuestoes() {
  const [modo, setModo] = useState('lista');
  const [questoes, setQuestoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [busca, setBusca] = useState('');
  const [apenasIncompletas, setApenasIncompletas] = useState(false);
  const [areaSelecionada, setAreaSelecionada] = useState('TODAS');
  const [subareaSelecionada, setSubareaSelecionada] = useState('TODAS');

  const [questaoEditando, setQuestaoEditando] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [uploadandoImagem, setUploadandoImagem] = useState(false);
  const [progressoUpload, setProgressoUpload] = useState(0);

  const navigate = useNavigate();

  useEffect(() => {
    carregarQuestoes();
  }, []);

  async function carregarQuestoes() {
    try {
      setCarregando(true);
      const dados = await listarQuestoesComNumero();
      setQuestoes(dados);
    } catch (error) {
      setErro('Erro ao carregar questoes: ' + error.message);
    } finally {
      setCarregando(false);
    }
  }

  const areasDisponiveis = Array.from(
    new Set(questoes.map((q) => q.area).filter((a) => a && a.trim() !== ''))
  ).sort();

  const subareasDisponiveis = Array.from(
    new Set(
      questoes
        .filter((q) => areaSelecionada === 'TODAS' || q.area === areaSelecionada)
        .map((q) => q.subarea)
        .filter((s) => s && s.trim() !== '')
    )
  ).sort();

  const handleTrocarArea = (novaArea) => {
    setAreaSelecionada(novaArea);
    setSubareaSelecionada('TODAS');
  };

  const abrirEdicao = async (questaoId) => {
    try {
      const questao = await buscarQuestaoParaEditar(questaoId);
      const numeroOriginal = questoes.find((q) => q.id === questaoId)?.numero;
      setQuestaoEditando({ ...questao, numero: numeroOriginal });
      setModo('edicao');
    } catch (error) {
      setErro('Erro ao abrir questao: ' + error.message);
    }
  };

  const handleCampoChange = (campo, valor) => {
    setQuestaoEditando((prev) => ({ ...prev, [campo]: valor }));
  };

  const handleSalvar = async () => {
    try {
      setSalvando(true);
      const { id, numero, ...dadosParaSalvar } = questaoEditando;
      await atualizarQuestao(id, dadosParaSalvar);
      alert('Questao atualizada com sucesso!');
      await carregarQuestoes();
      setModo('lista');
      setQuestaoEditando(null);
    } catch (error) {
      alert('Erro ao salvar: ' + error.message);
    } finally {
      setSalvando(false);
    }
  };

  const handleDeletar = async () => {
    const confirmar = window.confirm(
      'Tem certeza que deseja deletar a questao numero ' + questaoEditando.numero + '? Essa acao nao pode ser desfeita.'
    );
    if (!confirmar) return;

    try {
      await deletarQuestao(questaoEditando.id);
      alert('Questao deletada.');
      await carregarQuestoes();
      setModo('lista');
      setQuestaoEditando(null);
    } catch (error) {
      alert('Erro ao deletar: ' + error.message);
    }
  };

  const handleUploadImagem = async (e) => {
    const arquivo = e.target.files[0];
    if (!arquivo) return;

    try {
      setUploadandoImagem(true);
      setProgressoUpload(0);
      const novasImagens = await adicionarImagemNaQuestao(
        questaoEditando.id,
        arquivo,
        questaoEditando.imagens,
        (progresso) => setProgressoUpload(progresso)
      );
      setQuestaoEditando((prev) => ({ ...prev, imagens: novasImagens }));
    } catch (error) {
      alert('Erro ao adicionar imagem: ' + error.message);
    } finally {
      setUploadandoImagem(false);
      setProgressoUpload(0);
    }
  };

  const handleColarImagem = async (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    let arquivoImagem = null;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        arquivoImagem = items[i].getAsFile();
        break;
      }
    }

    if (!arquivoImagem) return;

    try {
      setUploadandoImagem(true);
      setProgressoUpload(0);
      const novasImagens = await adicionarImagemNaQuestao(
        questaoEditando.id,
        arquivoImagem,
        questaoEditando.imagens,
        (progresso) => setProgressoUpload(progresso)
      );
      setQuestaoEditando((prev) => ({ ...prev, imagens: novasImagens }));
    } catch (error) {
      alert('Erro ao adicionar imagem colada: ' + error.message);
    } finally {
      setUploadandoImagem(false);
      setProgressoUpload(0);
    }
  };

  const handleRemoverImagem = async (urlImagem) => {
    const confirmar = window.confirm('Remover esta imagem da questao?');
    if (!confirmar) return;

    try {
      const novasImagens = await removerImagemDaQuestao(
        questaoEditando.id,
        urlImagem,
        questaoEditando.imagens
      );
      setQuestaoEditando((prev) => ({ ...prev, imagens: novasImagens }));
    } catch (error) {
      alert('Erro ao remover imagem: ' + error.message);
    }
  };

  const questoesFiltradas = questoes
  .filter((q) => areaSelecionada === 'TODAS' || q.area === areaSelecionada)
  .filter((q) => subareaSelecionada === 'TODAS' || q.subarea === subareaSelecionada)
  .filter((q) => {
    if (!apenasIncompletas) return true;
    return (
      !q.enunciado ||
      !q.enunciado.trim() ||
      !q.alternativaA ||
      !q.alternativaA.trim() ||
      !q.alternativaB ||
      !q.alternativaB.trim() ||
      !q.gabarito ||
      !q.gabarito.trim()
    );
  })
  .filter((q) => {
    if (!busca.trim()) return true;
    const termo = busca.trim().toLowerCase();

    return (
      String(q.numero).includes(termo) ||
      (q.area || '').toLowerCase().includes(termo) ||
      (q.subarea || '').toLowerCase().includes(termo) ||
      (q.enunciado || '').toLowerCase().includes(termo)
    );
  });

  if (carregando) {
    return (
      <Layout maxWidth="800px">
        <div style={styles.loadingBox}>Carregando questoes...</div>
      </Layout>
    );
  }

  if (modo === 'lista') {
    return (
      <Layout maxWidth="800px">
        <div style={styles.header}>
          <button onClick={() => navigate('/dashboard')} style={styles.btnVoltar}>
            Voltar
          </button>
          <h2 style={styles.titulo}>
            Editor de Questoes ({questoesFiltradas.length} de {questoes.length})
          </h2>
        </div>

        {erro && <div style={styles.erroBox}>{erro}</div>}

        <div style={styles.filtrosContainer}>
  <div style={styles.formGroupFiltro}>
    <label style={styles.labelPequeno}>Status</label>
    <button
      type="button"
      onClick={() => setApenasIncompletas((prev) => !prev)}
      style={{
        ...styles.inputBusca,
        cursor: 'pointer',
        textAlign: 'left',
        backgroundColor: apenasIncompletas ? '#FBEAEA' : 'white',
        color: apenasIncompletas ? '#B33A3A' : '#333',
        fontWeight: apenasIncompletas ? '700' : '400',
        border: apenasIncompletas ? '1px solid #F0C4C4' : '1px solid #ddd',
      }}
    >
      {apenasIncompletas ? 'Mostrando so incompletas ✕' : 'Mostrar so incompletas'}
    </button>
  </div>

  <div style={styles.formGroupFiltro}>
    <label style={styles.labelPequeno}>Filtrar por Area</label>
            <select
              value={areaSelecionada}
              onChange={(e) => handleTrocarArea(e.target.value)}
              style={styles.inputBusca}
            >
              <option value="TODAS">Todas as areas ({questoes.length})</option>
              {areasDisponiveis.map((area) => {
                const qtd = questoes.filter((q) => q.area === area).length;
                return (
                  <option key={area} value={area}>
                    {area} ({qtd})
                  </option>
                );
              })}
            </select>
          </div>

          <div style={styles.formGroupFiltro}>
            <label style={styles.labelPequeno}>Filtrar por Subarea</label>
            <select
              value={subareaSelecionada}
              onChange={(e) => setSubareaSelecionada(e.target.value)}
              style={styles.inputBusca}
            >
              <option value="TODAS">Todas as subareas</option>
              {subareasDisponiveis.map((subarea) => {
                const qtd = questoes.filter(
                  (q) =>
                    (areaSelecionada === 'TODAS' || q.area === areaSelecionada) &&
                    q.subarea === subarea
                ).length;
                return (
                  <option key={subarea} value={subarea}>
                    {subarea} ({qtd})
                  </option>
                );
              })}
            </select>
          </div>

          <div style={styles.formGroupFiltro}>
            <label style={styles.labelPequeno}>Buscar</label>
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Numero ou texto do enunciado..."
              style={styles.inputBusca}
            />
          </div>
        </div>

        <div style={styles.lista}>
          {questoesFiltradas.length === 0 && (
            <div style={styles.vazioBox}>Nenhuma questao encontrada.</div>
          )}

          {questoesFiltradas.map((q) => (
            <div key={q.id} style={styles.itemLista} onClick={() => abrirEdicao(q.id)}>
              <div style={styles.itemNumero}>#{q.numero}</div>
              <div style={styles.itemInfo}>
                <div style={styles.itemTags}>
                  <span style={styles.tag}>{q.area || 'sem area'}</span>
                  <span style={styles.tag}>{q.subarea || 'sem subarea'}</span>
                  {q.imagens && q.imagens.length > 0 && (
                    <span style={styles.tagImagem}>{q.imagens.length} imagem(ns)</span>
                  )}
                </div>
                <p style={styles.itemEnunciado}>
                  {(q.enunciado || '').substring(0, 120)}
                  {(q.enunciado || '').length > 120 ? '...' : ''}
                </p>
              </div>
              <div style={styles.itemSeta}>Editar</div>
            </div>
          ))}
        </div>
      </Layout>
    );
  }

  if (modo === 'edicao' && questaoEditando) {
    return (
      <Layout maxWidth="700px">
        <div style={styles.cardGrande}>
          <div style={styles.previewHeader}>
            <button
              onClick={() => {
                setModo('lista');
                setQuestaoEditando(null);
              }}
              style={styles.btnVoltar}
            >
              Voltar a Lista
            </button>
            <div style={styles.previewContador}>Editando questao #{questaoEditando.numero}</div>
          </div>

          <div style={styles.linhaDupla}>
            <div style={styles.formGroup}>
              <label style={styles.labelPequeno}>Area</label>
              <input
                type="text"
                value={questaoEditando.area || ''}
                onChange={(e) => handleCampoChange('area', e.target.value)}
                style={styles.input}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.labelPequeno}>Subarea</label>
              <input
                type="text"
                value={questaoEditando.subarea || ''}
                onChange={(e) => handleCampoChange('subarea', e.target.value)}
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.linhaDupla}>
            <div style={styles.formGroup}>
              <label style={styles.labelPequeno}>Dificuldade</label>
              <select
                value={questaoEditando.dificuldade || ''}
                onChange={(e) => handleCampoChange('dificuldade', e.target.value)}
                style={styles.input}
              >
                <option value="facil">facil</option>
                <option value="medio">medio</option>
                <option value="dificil">dificil</option>
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.labelPequeno}>Fonte</label>
              <input
                type="text"
                value={questaoEditando.fonte || ''}
                onChange={(e) => handleCampoChange('fonte', e.target.value)}
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.labelPequeno}>Enunciado</label>
            <textarea
              value={questaoEditando.enunciado || ''}
              onChange={(e) => handleCampoChange('enunciado', e.target.value)}
              style={styles.textarea}
              rows={5}
            />
          </div>

          {['A', 'B', 'C', 'D', 'E'].map((letra) => (
            <div key={letra} style={styles.formGroup}>
              <label style={styles.labelPequeno}>Alternativa {letra}</label>
              <input
                type="text"
                value={questaoEditando['alternativa' + letra] || ''}
                onChange={(e) => handleCampoChange('alternativa' + letra, e.target.value)}
                style={{
                  ...styles.input,
                  ...(questaoEditando.gabarito === letra ? styles.inputGabarito : {}),
                }}
                placeholder={letra === 'D' || letra === 'E' ? '(deixe vazio se nao houver)' : ''}
              />
            </div>
          ))}

          <div style={styles.formGroup}>
            <label style={styles.labelPequeno}>Gabarito</label>
            <select
              value={questaoEditando.gabarito || ''}
              onChange={(e) => handleCampoChange('gabarito', e.target.value)}
              style={styles.input}
            >
              <option value="">Selecione...</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="D">D</option>
              <option value="E">E</option>
            </select>
          </div>

          <div style={styles.secaoImagens}>
            <label style={styles.labelPequeno}>Imagens da Questao</label>

            {questaoEditando.imagens && questaoEditando.imagens.length > 0 && (
              <div style={styles.gridImagens}>
                {questaoEditando.imagens.map((url, index) => (
                  <div key={index} style={styles.imagemItem}>
                    <img src={url} alt={'Imagem ' + (index + 1)} style={styles.imagemPreview} />
                    <button
                      onClick={() => handleRemoverImagem(url)}
                      style={styles.btnRemoverImagem}
                    >
                      Remover
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div style={styles.uploadBox} onPaste={handleColarImagem} tabIndex={0}>
              <input
                type="file"
                accept="image/*"
                onChange={handleUploadImagem}
                disabled={uploadandoImagem}
                style={styles.inputFile}
              />
              <p style={styles.dicaColar}>
                Ou clique aqui e aperte Ctrl+V para colar uma imagem copiada
              </p>
              {uploadandoImagem && (
                <p style={styles.progressoTexto}>
                  Enviando imagem... {progressoUpload}%
                </p>
              )}
            </div>
          </div>

          <div style={styles.botoesAcao}>
            <button onClick={handleDeletar} style={styles.btnDeletar}>
              Deletar Questao
            </button>
            <button
              onClick={handleSalvar}
              style={{ ...styles.btnSalvar, opacity: salvando ? 0.7 : 1 }}
              disabled={salvando}
            >
              {salvando ? 'Salvando...' : 'Salvar Alteracoes'}
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return null;
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
    fontSize: '18px',
    color: cores.texto,
    fontWeight: '700',
    margin: 0,
  },
  filtrosContainer: {
    display: 'flex',
    gap: '15px',
    flexWrap: 'wrap',
    marginBottom: '20px',
  },
  formGroupFiltro: {
    flex: 1,
    minWidth: '150px',
  },
  labelPequeno: estilosBase.labelPequeno,
  inputBusca: {
    ...estilosBase.input,
    padding: '12px',
  },
  lista: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  itemLista: {
    ...estilosBase.card,
    padding: '15px',
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    cursor: 'pointer',
  },
  itemNumero: {
    fontWeight: '700',
    color: cores.teal,
    fontSize: '14px',
    minWidth: '40px',
  },
  itemInfo: {
    flex: 1,
  },
  itemTags: {
    display: 'flex',
    gap: '6px',
    marginBottom: '6px',
    flexWrap: 'wrap',
  },
  tag: estilosBase.tag,
  tagImagem: {
    padding: '3px 8px',
    backgroundColor: cores.avisoFundo,
    color: cores.avisoTexto,
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '700',
  },
  itemEnunciado: {
    fontSize: '13px',
    color: cores.textoTerciario,
    margin: 0,
  },
  itemSeta: {
    fontSize: '13px',
    color: cores.teal,
    fontWeight: '700',
  },
  vazioBox: estilosBase.vazioBox,
  erroBox: estilosBase.erroBox,
  loadingBox: estilosBase.loadingBox,
  cardGrande: {
    ...estilosBase.card,
    padding: '28px',
  },
  previewHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  previewContador: {
    fontSize: '14px',
    fontWeight: '700',
    color: cores.texto,
  },
  linhaDupla: {
    display: 'flex',
    gap: '15px',
  },
  formGroup: {
    marginBottom: '15px',
    flex: 1,
  },
  input: estilosBase.input,
  inputGabarito: {
    borderColor: cores.teal,
    backgroundColor: cores.tealFundo,
  },
  textarea: {
    ...estilosBase.input,
    resize: 'vertical',
  },
  secaoImagens: {
    marginTop: '20px',
    marginBottom: '20px',
    paddingTop: '20px',
    borderTop: '1px solid ' + cores.borda,
  },
  gridImagens: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
    gap: '10px',
    marginBottom: '15px',
  },
  imagemItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
  },
  imagemPreview: {
    width: '100%',
    height: '100px',
    objectFit: 'cover',
    borderRadius: '8px',
    border: '1px solid ' + cores.borda,
  },
  btnRemoverImagem: {
    padding: '6px',
    backgroundColor: cores.perigoFundo,
    color: cores.perigoTexto,
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '11px',
    fontFamily: 'inherit',
  },
  uploadBox: {
    padding: '15px',
    border: '2px dashed ' + cores.borda,
    borderRadius: '8px',
    textAlign: 'center',
  },
  inputFile: {
    fontSize: '13px',
  },
  dicaColar: {
    fontSize: '12px',
    color: cores.textoSecundario,
    marginTop: '10px',
  },
  progressoTexto: {
    fontSize: '13px',
    color: cores.textoTerciario,
  },
  botoesAcao: {
    display: 'flex',
    gap: '10px',
    marginTop: '20px',
  },
  btnDeletar: {
    ...estilosBase.botaoPerigo,
    padding: '12px 20px',
    fontSize: '14px',
  },
  btnSalvar: {
    ...estilosBase.botaoPrimario,
    flex: 1,
    padding: '12px 20px',
    fontSize: '14px',
  },
};
