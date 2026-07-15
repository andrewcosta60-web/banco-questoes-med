import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  lerExcel,
  lerZip,
  validarQuestao,
  salvarQuestoesEmLote,
} from '../services/importacaoService';

export default function ImportarQuestoes() {
  const [etapa, setEtapa] = useState('upload'); // upload, preview, salvando, concluido
  const [arquivoExcel, setArquivoExcel] = useState(null);
  const [arquivoZip, setArquivoZip] = useState(null);
  const [questoes, setQuestoes] = useState([]);
  const [imagensZip, setImagensZip] = useState({});
  const [indiceAtual, setIndiceAtual] = useState(0);
  const [questoesRevisadas, setQuestoesRevisadas] = useState({});
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [progresso, setProgresso] = useState({ atual: 0, total: 0 });
  const [resultadoFinal, setResultadoFinal] = useState(null);

  const navigate = useNavigate();

  const handleAnalisar = async () => {
    if (!arquivoExcel) {
      setErro('Selecione um arquivo Excel');
      return;
    }

    try {
      setCarregando(true);
      setErro('');

      const questoesLidas = await lerExcel(arquivoExcel);

      let imagens = {};
      if (arquivoZip) {
        imagens = await lerZip(arquivoZip);
      }

      if (questoesLidas.length === 0) {
        setErro('Nenhuma questao encontrada no Excel');
        setCarregando(false);
        return;
      }

      setQuestoes(questoesLidas);
      setImagensZip(imagens);
      setIndiceAtual(0);
      setQuestoesRevisadas({});
      setEtapa('preview');
    } catch (error) {
      setErro('Erro ao ler arquivos: ' + error.message);
    } finally {
      setCarregando(false);
    }
  };

  const marcarComoRevisada = (index) => {
    setQuestoesRevisadas((prev) => ({ ...prev, [index]: true }));
  };

  const handleDeletarQuestao = (index) => {
    const novasQuestoes = questoes.filter((_, i) => i !== index);
    setQuestoes(novasQuestoes);
    if (indiceAtual >= novasQuestoes.length) {
      setIndiceAtual(Math.max(0, novasQuestoes.length - 1));
    }
  };

  const handleEditarCampo = (index, campo, valor) => {
    const novasQuestoes = [...questoes];
    novasQuestoes[index] = { ...novasQuestoes[index], [campo]: valor };
    setQuestoes(novasQuestoes);
  };

  const handleConfirmarImportacao = async () => {
    try {
      setEtapa('salvando');
      setProgresso({ atual: 0, total: questoes.length });

      const resultado = await salvarQuestoesEmLote(questoes, imagensZip, (atual, total) => {
        setProgresso({ atual, total });
      });

      setResultadoFinal(resultado);
      setEtapa('concluido');
    } catch (error) {
      setErro('Erro ao importar: ' + error.message);
      setEtapa('preview');
    }
  };

  // ===================== TELA 1: UPLOAD =====================
  if (etapa === 'upload') {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <button onClick={() => navigate('/dashboard')} style={styles.btnVoltar}>
            Voltar
          </button>

          <h2 style={styles.titulo}>Importar Questoes em Lote</h2>

          {erro && <div style={styles.erroBox}>{erro}</div>}

          <div style={styles.formGroup}>
            <label style={styles.label}>Arquivo Excel (.xlsx)</label>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => setArquivoExcel(e.target.files[0])}
              style={styles.inputFile}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Arquivo ZIP de Imagens (opcional)</label>
            <input
              type="file"
              accept=".zip"
              onChange={(e) => setArquivoZip(e.target.files[0])}
              style={styles.inputFile}
            />
          </div>

          <button
            onClick={handleAnalisar}
            style={{ ...styles.botao, opacity: carregando ? 0.7 : 1 }}
            disabled={carregando}
          >
            {carregando ? 'Analisando...' : 'Analisar Questoes'}
          </button>
        </div>
      </div>
    );
  }

  // ===================== TELA 2: PREVIEW =====================
  if (etapa === 'preview') {
    const questaoAtual = questoes[indiceAtual];
    const totalRevisadas = Object.keys(questoesRevisadas).length;

    if (!questaoAtual) {
      return (
        <div style={styles.container}>
          <div style={styles.card}>
            <p>Nenhuma questao restante. Todas foram deletadas.</p>
            <button onClick={() => setEtapa('upload')} style={styles.botao}>
              Voltar ao Upload
            </button>
          </div>
        </div>
      );
    }

    const problemas = validarQuestao(questaoAtual);
    const temImagem = questaoAtual.imagemNome && imagensZip[questaoAtual.imagemNome];
    const imagemFaltando = questaoAtual.imagemNome && !imagensZip[questaoAtual.imagemNome];

    return (
      <div style={styles.container}>
        <div style={styles.cardGrande}>
          <div style={styles.previewHeader}>
            <button onClick={() => setEtapa('upload')} style={styles.btnVoltar}>
              Cancelar Importacao
            </button>
            <div style={styles.previewContador}>
              Questao {indiceAtual + 1} de {questoes.length} | Revisadas: {totalRevisadas}
            </div>
          </div>

          {problemas.length > 0 && (
            <div style={styles.erroBox}>
              <strong>Problemas encontrados:</strong>
              <ul style={{ margin: '5px 0 0 0', paddingLeft: '20px' }}>
                {problemas.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </div>
          )}

          {imagemFaltando && (
            <div style={styles.avisoBox}>
              Imagem "{questaoAtual.imagemNome}" nao foi encontrada no ZIP.
            </div>
          )}

          {temImagem && (
            <div style={styles.avisoBoxOk}>
              Imagem "{questaoAtual.imagemNome}" encontrada.
            </div>
          )}

          <div style={styles.tags}>
            <span style={styles.tag}>{questaoAtual.area || 'sem area'}</span>
            <span style={styles.tag}>{questaoAtual.subarea || 'sem subarea'}</span>
            <span style={styles.tag}>{questaoAtual.dificuldade || 'sem dificuldade'}</span>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.labelPequeno}>Enunciado</label>
            <textarea
              value={questaoAtual.enunciado}
              onChange={(e) => handleEditarCampo(indiceAtual, 'enunciado', e.target.value)}
              style={styles.textarea}
              rows={4}
            />
          </div>

          {['A', 'B', 'C', 'D', 'E'].map((letra) => (
            <div key={letra} style={styles.formGroup}>
              <label style={styles.labelPequeno}>Alternativa {letra}</label>
              <input
                type="text"
                value={questaoAtual['alternativa' + letra]}
                onChange={(e) =>
                  handleEditarCampo(indiceAtual, 'alternativa' + letra, e.target.value)
                }
                style={{
                  ...styles.input,
                  ...(questaoAtual.gabarito === letra ? styles.inputGabarito : {}),
                }}
              />
            </div>
          ))}

          <div style={styles.formGroup}>
            <label style={styles.labelPequeno}>Gabarito</label>
            <select
              value={questaoAtual.gabarito}
              onChange={(e) => handleEditarCampo(indiceAtual, 'gabarito', e.target.value)}
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

          <div style={styles.botoesAcao}>
            <button
              onClick={() => setIndiceAtual((prev) => Math.max(0, prev - 1))}
              style={styles.btnNav}
              disabled={indiceAtual === 0}
            >
              Anterior
            </button>

            <button
              onClick={() => handleDeletarQuestao(indiceAtual)}
              style={styles.btnDeletar}
            >
              Deletar
            </button>

            <button
              onClick={() => {
                marcarComoRevisada(indiceAtual);
                if (indiceAtual < questoes.length - 1) {
                  setIndiceAtual((prev) => prev + 1);
                }
              }}
              style={styles.btnOk}
            >
              OK, Proxima
            </button>
          </div>

          <div style={styles.footerPreview}>
            <p style={{ fontSize: '13px', color: '#666' }}>
              Total de questoes prontas para importar: {questoes.length}
            </p>
            <button onClick={handleConfirmarImportacao} style={styles.btnConfirmarFinal}>
              Confirmar e Importar Todas ({questoes.length})
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ===================== TELA 3: SALVANDO =====================
  if (etapa === 'salvando') {
    const pct = progresso.total > 0 ? Math.round((progresso.atual / progresso.total) * 100) : 0;

    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h2 style={styles.titulo}>Importando questoes...</h2>
          <div style={styles.progressoBarraFundo}>
            <div style={{ ...styles.progressoBarraPreenchida, width: pct + '%' }} />
          </div>
          <p style={{ textAlign: 'center', marginTop: '10px' }}>
            {progresso.atual} de {progresso.total} ({pct}%)
          </p>
        </div>
      </div>
    );
  }

  // ===================== TELA 4: CONCLUIDO =====================
  if (etapa === 'concluido') {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h2 style={styles.titulo}>Importacao Concluida!</h2>
          <p style={{ color: '#28a745', fontWeight: '600' }}>
            {resultadoFinal.sucesso} questoes importadas com sucesso.
          </p>

          {resultadoFinal.falhas.length > 0 && (
            <div style={styles.erroBox}>
              <strong>{resultadoFinal.falhas.length} falharam:</strong>
              <ul style={{ margin: '5px 0 0 0', paddingLeft: '20px' }}>
                {resultadoFinal.falhas.map((f, i) => (
                  <li key={i}>
                    Linha {f.linha}: {f.erro}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button onClick={() => navigate('/dashboard')} style={styles.botao}>
            Voltar ao Dashboard
          </button>
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
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingTop: '30px',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '30px',
    maxWidth: '500px',
    width: '100%',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  cardGrande: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '30px',
    maxWidth: '700px',
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
  },
  titulo: {
    fontSize: '22px',
    marginBottom: '20px',
    color: '#333',
  },
  formGroup: {
    marginBottom: '15px',
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
  inputFile: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    boxSizing: 'border-box',
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
    marginTop: '10px',
  },
  erroBox: {
    backgroundColor: '#fee',
    border: '1px solid #fcc',
    color: '#c00',
    padding: '12px',
    borderRadius: '6px',
    marginBottom: '15px',
    fontSize: '13px',
  },
  avisoBox: {
    backgroundColor: '#fff3cd',
    border: '1px solid #ffc107',
    color: '#856404',
    padding: '10px',
    borderRadius: '6px',
    marginBottom: '15px',
    fontSize: '13px',
  },
  avisoBoxOk: {
    backgroundColor: '#d4edda',
    border: '1px solid #28a745',
    color: '#155724',
    padding: '10px',
    borderRadius: '6px',
    marginBottom: '15px',
    fontSize: '13px',
  },
  previewHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px',
  },
  previewContador: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#333',
  },
  tags: {
    display: 'flex',
    gap: '8px',
    marginBottom: '15px',
    flexWrap: 'wrap',
  },
  tag: {
    padding: '4px 10px',
    backgroundColor: '#e7f3ff',
    color: '#007bff',
    borderRadius: '15px',
    fontSize: '11px',
    fontWeight: '600',
  },
  botoesAcao: {
    display: 'flex',
    gap: '10px',
    marginTop: '20px',
  },
  btnNav: {
    padding: '10px 16px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
  },
  btnDeletar: {
    padding: '10px 16px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
  },
  btnOk: {
    flex: 1,
    padding: '10px 16px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
  },
  footerPreview: {
    marginTop: '25px',
    paddingTop: '20px',
    borderTop: '1px solid #eee',
    textAlign: 'center',
  },
  btnConfirmarFinal: {
    width: '100%',
    padding: '15px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  progressoBarraFundo: {
    width: '100%',
    height: '20px',
    backgroundColor: '#e9ecef',
    borderRadius: '10px',
    overflow: 'hidden',
  },
  progressoBarraPreenchida: {
    height: '100%',
    backgroundColor: '#28a745',
    transition: 'width 0.3s',
  },
};