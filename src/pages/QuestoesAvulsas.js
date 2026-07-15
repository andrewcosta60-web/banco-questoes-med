import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import { buscarTodasQuestoes, salvarResposta, embaralharArray } from '../services/questoesService';
import { buscarCronogramasDisponiveis, areaDoCronogramaHoje } from '../services/cronogramasService';
import Layout from '../components/Layout';
import { cores, estilosBase } from '../styles/theme';

export default function QuestoesAvulsas() {
  const [etapa, setEtapa] = useState('selecao');
  const [todasQuestoesCache, setTodasQuestoesCache] = useState([]);
  const [modoSelecao, setModoSelecao] = useState('livre'); // 'livre' ou 'cronograma'
  const [misturarTudo, setMisturarTudo] = useState(true);
  const [cronogramasDisponiveis, setCronogramasDisponiveis] = useState([]);
  const [cronogramaEscolhidoId, setCronogramaEscolhidoId] = useState('');
  const [areasSelecionadas, setAreasSelecionadas] = useState([]);
  const [subareasSelecionadas, setSubareasSelecionadas] = useState([]);

  const [questoes, setQuestoes] = useState([]);
  const [indiceAtual, setIndiceAtual] = useState(0);
  const [respostasPorIndice, setRespostasPorIndice] = useState({}); // { 0: 'B', 2: 'A', ... }
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [tempoInicio, setTempoInicio] = useState(Date.now());

  const { usuario } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
  async function carregarTudo() {
    try {
      setCarregando(true);
      const dados = await buscarTodasQuestoes();
      setTodasQuestoesCache(dados);

      const cronogramas = await buscarCronogramasDisponiveis(usuario.uid);
      setCronogramasDisponiveis(cronogramas);
    } catch (error) {
      setErro('Erro ao carregar questoes: ' + error.message);
    } finally {
      setCarregando(false);
    }
  }
  carregarTudo();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

  // Reinicia o cronometro toda vez que a questao atual mudar (avançar ou voltar)
  useEffect(() => {
    setTempoInicio(Date.now());
  }, [indiceAtual]);

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

  const handleIniciar = () => {
  let questoesFiltradas = todasQuestoesCache;

  if (modoSelecao === 'cronograma') {
    if (!cronogramaEscolhidoId) {
      setErro('Escolha um cronograma');
      return;
    }

    const cronograma = cronogramasDisponiveis.find((c) => c.id === cronogramaEscolhidoId);
    const areaHoje = areaDoCronogramaHoje(cronograma);

    if (!areaHoje) {
      setErro('Nenhum bloco desse cronograma esta ativo hoje.');
      return;
    }

    questoesFiltradas = questoesFiltradas.filter((q) => q.area === areaHoje);
  } else {
    // modo livre
    if (!misturarTudo && areasSelecionadas.length === 0) {
      setErro('Escolha pelo menos uma area, ou marque "Todas as areas"');
      return;
    }

    if (!misturarTudo) {
      questoesFiltradas = questoesFiltradas.filter((q) => areasSelecionadas.includes(q.area));

      if (subareasSelecionadas.length > 0) {
        questoesFiltradas = questoesFiltradas.filter((q) =>
          subareasSelecionadas.includes(q.subarea)
        );
      }
    }
  }

  if (questoesFiltradas.length === 0) {
    setErro('Nenhuma questao encontrada para essa selecao.');
    return;
  }

  setErro('');
  const questoesEmbaralhadas = embaralharArray(questoesFiltradas);
  setQuestoes(questoesEmbaralhadas);
  setIndiceAtual(0);
  setRespostasPorIndice({});
  setEtapa('questoes');
};

  const questaoAtual = questoes[indiceAtual];
  const respostaSelecionada = respostasPorIndice[indiceAtual] ?? null;
  const mostrarResultado = respostaSelecionada !== null;

  // Valores derivados (nunca ficam dessincronizados, mesmo navegando pra frente/tras)
  const totalRespondidas = Object.keys(respostasPorIndice).length;
  const acertos = Object.entries(respostasPorIndice).filter(
    ([idx, letra]) => questoes[idx]?.gabarito === letra
  ).length;

  const handleResponder = (letra) => {
    if (mostrarResultado) return; // ja respondida, trava

    setRespostasPorIndice((prev) => ({ ...prev, [indiceAtual]: letra }));

    const acertou = letra === questaoAtual.gabarito;
    const tempoGasto = Math.round((Date.now() - tempoInicio) / 1000);

    salvarResposta({
      usuarioId: usuario.uid,
      questaoId: questaoAtual.id,
      resposta: letra,
      correta: acertou,
      tempoSegundos: tempoGasto,
      tipo: 'avulsa',
      area: questaoAtual.area,
      subarea: questaoAtual.subarea,
    }).catch((err) => console.error('Erro ao salvar resposta:', err));
  };

  const handleAnterior = () => {
    if (indiceAtual > 0) {
      setIndiceAtual((prev) => prev - 1);
    }
  };

  const handleProxima = () => {
    if (indiceAtual < questoes.length - 1) {
      setIndiceAtual((prev) => prev + 1);
    } else {
      alert(`Fim das questoes! Voce respondeu ${totalRespondidas} de ${questoes.length}. Acertos: ${acertos}/${totalRespondidas}`);
      navigate('/dashboard');
    }
  };

  if (carregando) {
    return (
      <Layout maxWidth="600px">
        <div style={styles.loadingBox}>Carregando...</div>
      </Layout>
    );
  }

  if (etapa === 'selecao') {
    return (
      <Layout maxWidth="600px">
        <div style={styles.card}>
          <button onClick={() => navigate('/dashboard')} style={styles.btnVoltar}>
            Voltar
          </button>

          <h2 style={styles.titulo}>Questoes Avulsas</h2>

          {erro && <div style={styles.erroBox}>{erro}</div>}

          <div style={styles.formGroup}>
            <label style={styles.label}>Modo de Selecao</label>
            <div style={styles.modoOpcoes}>
              <button
                type="button"
                onClick={() => setModoSelecao('livre')}
                style={{
                  ...styles.modoBotao,
                  ...(modoSelecao === 'livre' ? styles.modoBotaoAtivo : {}),
                }}
              >
                Livre
              </button>
              <button
                type="button"
                onClick={() => setModoSelecao('cronograma')}
                style={{
                  ...styles.modoBotao,
                  ...(modoSelecao === 'cronograma' ? styles.modoBotaoAtivo : {}),
                }}
                disabled={cronogramasDisponiveis.length === 0}
              >
                Associada a Cronograma
              </button>
            </div>
            {cronogramasDisponiveis.length === 0 && (
              <p style={styles.infoTexto}>
                Voce ainda nao tem nenhum cronograma cadastrado.
              </p>
            )}
          </div>

          {modoSelecao === 'cronograma' && (
            <div style={styles.formGroup}>
              <label style={styles.label}>Escolha o Cronograma</label>
              <select
                value={cronogramaEscolhidoId}
                onChange={(e) => setCronogramaEscolhidoId(e.target.value)}
                style={styles.input}
              >
                <option value="">Selecione...</option>
                {cronogramasDisponiveis.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome} {c.tipo === 'oficial' ? '(Oficial)' : '(Pessoal)'}
                  </option>
                ))}
              </select>
            </div>
          )}

          {modoSelecao === 'livre' && (
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
          )}
          {modoSelecao === 'livre' && !misturarTudo && (
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
                    Escolha a(s) subarea(s) (opcional - deixe vazio para incluir todas)
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

          <button onClick={handleIniciar} style={styles.botaoProxima}>
            Comecar
          </button>
        </div>
      </Layout>
    );
  }

  if (!questaoAtual) {
    return null;
  }

  const alternativas = [
    { letra: 'A', texto: questaoAtual.alternativaA },
    { letra: 'B', texto: questaoAtual.alternativaB },
    { letra: 'C', texto: questaoAtual.alternativaC },
    { letra: 'D', texto: questaoAtual.alternativaD },
    { letra: 'E', texto: questaoAtual.alternativaE },
  ];

  return (
    <Layout maxWidth="800px">
      <div style={styles.header}>
        <button onClick={() => navigate('/dashboard')} style={styles.btnVoltarInline}>
          Sair
        </button>
        <div style={styles.progresso}>
          Questao {indiceAtual + 1} de {questoes.length}
        </div>
        <div style={styles.placar}>
          {acertos} / {totalRespondidas} respondidas
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.tags}>
          <span style={styles.tag}>{questaoAtual.area}</span>
          <span style={styles.tag}>{questaoAtual.subarea}</span>
          <span style={{ ...styles.tag, ...styles.tagDificuldade }}>
            {questaoAtual.dificuldade}
          </span>
        </div>

        <p style={styles.enunciado}>{questaoAtual.enunciado}</p>

        {questaoAtual.imagens && questaoAtual.imagens.length > 0 && (
          <div style={styles.imagensContainer}>
            {questaoAtual.imagens.map((url, index) => (
              <img key={index} src={url} alt={'Imagem ' + (index + 1)} style={styles.imagemQuestao} />
            ))}
          </div>
        )}

        <div style={styles.alternativas}>
          {alternativas.map((alt) => {
            if (!alt.texto) return null;

            let estiloAlternativa = { ...styles.alternativa };

            if (mostrarResultado) {
              if (alt.letra === questaoAtual.gabarito) {
                estiloAlternativa = { ...estiloAlternativa, ...styles.alternativaCorreta };
              } else if (alt.letra === respostaSelecionada) {
                estiloAlternativa = { ...estiloAlternativa, ...styles.alternativaErrada };
              }
            }

            return (
              <button
                key={alt.letra}
                onClick={() => handleResponder(alt.letra)}
                style={estiloAlternativa}
                disabled={mostrarResultado}
              >
                <strong>{alt.letra})</strong> {alt.texto}
              </button>
            );
          })}
        </div>

        {mostrarResultado && (
          <div
            style={{
              ...styles.resultadoBox,
              ...(respostaSelecionada === questaoAtual.gabarito
                ? styles.resultadoBoxCerto
                : styles.resultadoBoxErrado),
            }}
          >
            {respostaSelecionada === questaoAtual.gabarito
              ? 'Voce acertou!'
              : 'Voce errou. Gabarito: ' + questaoAtual.gabarito}
          </div>
        )}

        <div style={styles.navegacao}>
          <button
            onClick={handleAnterior}
            style={{ ...styles.botaoNav, opacity: indiceAtual === 0 ? 0.5 : 1 }}
            disabled={indiceAtual === 0}
          >
            Anterior
          </button>
          <button onClick={handleProxima} style={styles.botaoProxima}>
            {indiceAtual < questoes.length - 1 ? 'Proxima Questao' : 'Finalizar'}
          </button>
        </div>
      </div>
    </Layout>
  );
}

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: cores.branco,
    border: '1px solid ' + cores.borda,
    padding: '15px 20px',
    borderRadius: '10px',
    marginBottom: '20px',
  },
  btnVoltar: {
    ...estilosBase.botaoSecundario,
    marginBottom: '18px',
  },
  btnVoltarInline: estilosBase.botaoSecundario,
  progresso: {
    fontWeight: '600',
    color: cores.texto,
  },
  placar: {
    fontWeight: '600',
    color: cores.teal,
    fontSize: '13px',
  },
  titulo: {
    fontSize: '20px',
    marginBottom: '20px',
    color: cores.texto,
    fontWeight: '700',
  },
  card: {
    ...estilosBase.card,
    padding: '28px',
  },
  formGroup: {
    marginBottom: '20px',
  },
  label: estilosBase.label,
  infoTexto: {
    fontSize: '12px',
    color: cores.textoSecundario,
    marginTop: '5px',
  },
  checkboxItemGrande: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    color: cores.texto,
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
  tags: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
    flexWrap: 'wrap',
  },
  tag: estilosBase.tag,
  tagDificuldade: {
    backgroundColor: cores.avisoFundo,
    color: cores.avisoTexto,
  },
  enunciado: {
    fontSize: '17px',
    lineHeight: '1.6',
    color: cores.texto,
    marginBottom: '25px',
  },
  imagensContainer: {
    marginBottom: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  imagemQuestao: {
    maxWidth: '100%',
    borderRadius: '8px',
    border: '1px solid ' + cores.borda,
  },
  alternativas: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '20px',
  },
  alternativa: {
    padding: '15px',
    textAlign: 'left',
    border: '1.5px solid ' + cores.borda,
    borderRadius: '8px',
    backgroundColor: cores.branco,
    cursor: 'pointer',
    fontSize: '15px',
    lineHeight: '1.4',
    fontFamily: 'inherit',
    color: cores.texto,
  },
  alternativaCorreta: {
    borderColor: cores.teal,
    backgroundColor: cores.tealFundo,
  },
  alternativaErrada: {
    borderColor: cores.perigo,
    backgroundColor: cores.perigoFundo,
  },
  resultadoBox: {
    padding: '15px',
    borderRadius: '8px',
    textAlign: 'center',
    fontWeight: '700',
    marginBottom: '20px',
    fontSize: '15px',
  },
  resultadoBoxCerto: {
    backgroundColor: cores.tealFundo,
    color: cores.sucessoTexto,
  },
  resultadoBoxErrado: {
    backgroundColor: cores.perigoFundo,
    color: cores.perigoTexto,
  },
  navegacao: {
    display: 'flex',
    gap: '10px',
  },
  botaoNav: {
    ...estilosBase.botaoSecundario,
    flex: 1,
    padding: '15px',
    fontSize: '15px',
    textAlign: 'center',
  },
  botaoProxima: {
    ...estilosBase.botaoPrimario,
    flex: 2,
    width: '100%',
    padding: '15px',
    fontSize: '15px',
  },
  loadingBox: estilosBase.loadingBox,
  erroBox: estilosBase.erroBox,
  modoOpcoes: {
    display: 'flex',
    gap: '10px',
  },
  modoBotao: {
    flex: 1,
    padding: '12px 10px',
    border: '2px solid ' + cores.borda,
    borderRadius: '8px',
    backgroundColor: cores.branco,
    cursor: 'pointer',
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
};
