import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  lerExcel,
  lerZip,
  validarQuestao,
  salvarQuestoesEmLote,
} from '../services/importacaoService';
import Layout from '../components/Layout';
import { cores, estilosBase } from '../styles/theme';

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
      <Layout maxWidth="500px">
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
      </Layout>
    );
  }

  // ===================== TELA 2: PREVIEW =====================
  if (etapa === 'preview') {
    const questaoAtual = questoes[indiceAtual];
    const totalRevisadas = Object.keys(questoesRevisadas).length;

    if (!questaoAtual) {
      return (
        <Layout maxWidth="500px">
          <div style={styles.card}>
            <p>Nenhuma questao restante. Todas foram deletadas.</p>
            <button onClick={() => setEtapa('upload')} style={styles.botao}>
              Voltar ao Upload
            </button>
          </div>
        </Layout>
      );
    }

    const problemas = validarQuestao(questaoAtual);
    const temImagem = questaoAtual.imagemNome && imagensZip[questaoAtual.imagemNome];
    const imagemFaltando = questaoAtual.imagemNome && !imagensZip[questaoAtual.imagemNome];

    return (
      <Layout maxWidth="700px">
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
              <ul style={styles.listaProblemas}>
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
            <div style={styles.sucessoBox}>
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
            <p style={styles.footerTexto}>
              Total de questoes prontas para importar: {questoes.length}
            </p>
            <button onClick={handleConfirmarImportacao} style={styles.btnConfirmarFinal}>
              Confirmar e Importar Todas ({questoes.length})
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  // ===================== TELA 3: SALVANDO =====================
  if (etapa === 'salvando') {
    const pct = progresso.total > 0 ? Math.round((progresso.atual / progresso.total) * 100) : 0;

    return (
      <Layout maxWidth="500px">
        <div style={styles.card}>
          <h2 style={styles.titulo}>Importando questoes...</h2>
          <div style={styles.progressoBarraFundo}>
            <div style={{ ...styles.progressoBarraPreenchida, width: pct + '%' }} />
          </div>
          <p style={styles.progressoTexto}>
            {progresso.atual} de {progresso.total} ({pct}%)
          </p>
        </div>
      </Layout>
    );
  }

  // ===================== TELA 4: CONCLUIDO =====================
  if (etapa === 'concluido') {
    return (
      <Layout maxWidth="500px">
        <div style={styles.card}>
          <h2 style={styles.titulo}>Importacao Concluida!</h2>
          <p style={styles.mensagemSucesso}>
            {resultadoFinal.sucesso} questoes importadas com sucesso.
          </p>

          {resultadoFinal.falhas.length > 0 && (
            <div style={styles.erroBox}>
              <strong>{resultadoFinal.falhas.length} falharam:</strong>
              <ul style={styles.listaProblemas}>
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
      </Layout>
    );
  }

  return null;
}

const styles = {
  card: {
    ...estilosBase.card,
    padding: '28px',
  },
  cardGrande: {
    ...estilosBase.card,
    padding: '28px',
  },
  btnVoltar: estilosBase.botaoSecundario,
  titulo: {
    fontSize: '20px',
    marginBottom: '20px',
    color: cores.texto,
    fontWeight: '700',
  },
  formGroup: {
    marginBottom: '15px',
  },
  label: estilosBase.label,
  labelPequeno: estilosBase.labelPequeno,
  inputFile: {
    width: '100%',
    padding: '10px',
    border: '1px solid ' + cores.borda,
    borderRadius: '8px',
    fontSize: '14px',
    boxSizing: 'border-box',
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
  botao: {
    ...estilosBase.botaoPrimario,
    width: '100%',
    marginTop: '10px',
  },
  erroBox: {
    ...estilosBase.erroBox,
    marginBottom: '15px',
  },
  listaProblemas: {
    margin: '5px 0 0 0',
    paddingLeft: '20px',
  },
  avisoBox: estilosBase.avisoBox,
  sucessoBox: estilosBase.sucessoBox,
  previewHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px',
  },
  previewContador: {
    fontSize: '13px',
    fontWeight: '700',
    color: cores.texto,
  },
  tags: {
    display: 'flex',
    gap: '8px',
    marginBottom: '15px',
    flexWrap: 'wrap',
  },
  tag: estilosBase.tag,
  botoesAcao: {
    display: 'flex',
    gap: '10px',
    marginTop: '20px',
  },
  btnNav: estilosBase.botaoSecundario,
  btnDeletar: {
    ...estilosBase.botaoPerigo,
    padding: '10px 16px',
    fontSize: '13px',
  },
  btnOk: {
    ...estilosBase.botaoPrimario,
    flex: 1,
    padding: '10px 16px',
    fontSize: '13px',
  },
  footerPreview: {
    marginTop: '25px',
    paddingTop: '20px',
    borderTop: '1px solid ' + cores.borda,
    textAlign: 'center',
  },
  footerTexto: {
    fontSize: '13px',
    color: cores.textoSecundario,
  },
  btnConfirmarFinal: {
    ...estilosBase.botaoPrimario,
    width: '100%',
    padding: '15px',
    fontSize: '15px',
  },
  progressoBarraFundo: {
    width: '100%',
    height: '20px',
    backgroundColor: cores.fundoPagina,
    borderRadius: '10px',
    overflow: 'hidden',
  },
  progressoBarraPreenchida: {
    height: '100%',
    backgroundColor: cores.teal,
    transition: 'width 0.3s',
  },
  progressoTexto: {
    textAlign: 'center',
    marginTop: '10px',
    color: cores.textoSecundario,
    fontSize: '13px',
  },
  mensagemSucesso: {
    color: cores.sucessoTexto,
    fontWeight: '600',
  },
};
