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

export default function EditorQuestoes() {
  const [modo, setModo] = useState('lista');
  const [questoes, setQuestoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [busca, setBusca] = useState('');
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
      <div style={styles.container}>
        <div style={styles.loadingBox}>Carregando questoes...</div>
      </div>
    );
  }

  if (modo === 'lista') {
    return (
      <div style={styles.container}>
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
      </div>
    );
  }

  if (modo === 'edicao' && questaoEditando) {
    return (
      <div style={styles.container}>
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
              <p style={{ fontSize: '12px', color: '#888', marginTop: '10px' }}>
                Ou clique aqui e aperte Ctrl+V para colar uma imagem copiada
              </p>
              {uploadandoImagem && (
                <p style={{ fontSize: '13px', color: '#666' }}>
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
      </div>
    );
  }

  return null;
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    padding: '20px',
  },
  header: {
    maxWidth: '800px',
    margin: '0 auto 20px auto',
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
  },
  btnVoltar: {
    padding: '8px 16px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
  },
  titulo: {
    fontSize: '18px',
    color: '#333',
    margin: 0,
  },
  filtrosContainer: {
    maxWidth: '800px',
    margin: '0 auto 20px auto',
    display: 'flex',
    gap: '15px',
    flexWrap: 'wrap',
  },
  formGroupFiltro: {
    flex: 1,
    minWidth: '150px',
  },
  labelPequeno: {
    display: 'block',
    marginBottom: '4px',
    fontWeight: '500',
    color: '#666',
    fontSize: '12px',
  },
  inputBusca: {
    width: '100%',
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  },
  lista: {
    maxWidth: '800px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  itemLista: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '15px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    cursor: 'pointer',
  },
  itemNumero: {
    fontWeight: '700',
    color: '#007bff',
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
  tag: {
    padding: '3px 8px',
    backgroundColor: '#e7f3ff',
    color: '#007bff',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '600',
  },
  tagImagem: {
    padding: '3px 8px',
    backgroundColor: '#fff3cd',
    color: '#856404',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '600',
  },
  itemEnunciado: {
    fontSize: '13px',
    color: '#555',
    margin: 0,
  },
  itemSeta: {
    fontSize: '13px',
    color: '#007bff',
    fontWeight: '600',
  },
  vazioBox: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '30px',
    textAlign: 'center',
    color: '#666',
  },
  erroBox: {
    maxWidth: '800px',
    margin: '0 auto 20px auto',
    backgroundColor: '#fee',
    border: '1px solid #fcc',
    color: '#c00',
    padding: '12px',
    borderRadius: '6px',
    fontSize: '14px',
  },
  loadingBox: {
    textAlign: 'center',
    padding: '50px',
    fontSize: '18px',
  },
  cardGrande: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '30px',
    maxWidth: '700px',
    margin: '0 auto',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  previewHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  previewContador: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#333',
  },
  linhaDupla: {
    display: 'flex',
    gap: '15px',
  },
  formGroup: {
    marginBottom: '15px',
    flex: 1,
  },
  input: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  },
  inputGabarito: {
    borderColor: '#28a745',
    backgroundColor: '#f0fff4',
  },
  textarea: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    resize: 'vertical',
  },
  secaoImagens: {
    marginTop: '20px',
    marginBottom: '20px',
    paddingTop: '20px',
    borderTop: '1px solid #eee',
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
    borderRadius: '6px',
    border: '1px solid #ddd',
  },
  btnRemoverImagem: {
    padding: '5px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '11px',
  },
  uploadBox: {
    padding: '15px',
    border: '2px dashed #ddd',
    borderRadius: '8px',
    textAlign: 'center',
  },
  inputFile: {
    fontSize: '13px',
  },
  botoesAcao: {
    display: 'flex',
    gap: '10px',
    marginTop: '20px',
  },
  btnDeletar: {
    padding: '12px 20px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
  },
  btnSalvar: {
    flex: 1,
    padding: '12px 20px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
  },
};