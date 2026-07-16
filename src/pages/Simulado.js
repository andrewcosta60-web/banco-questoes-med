import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import { salvarSimulado } from '../services/simuladosService';

export default function Simulado() {
  const location = useLocation();
  const navigate = useNavigate();
  const { usuario } = useAuth();

  const dadosIniciais = location.state;

  const [questoes] = useState(dadosIniciais?.questoes || []);
  const [usarCronometro] = useState(dadosIniciais?.usarCronometro || false);
  const [configuracao] = useState(dadosIniciais?.configuracao || {});

  const [etapa, setEtapa] = useState('executando');
  const [indiceAtual, setIndiceAtual] = useState(0);
  const [respostasPorIndice, setRespostasPorIndice] = useState({});
  const [eliminadas, setEliminadas] = useState({});
  const [tempoAcumulado, setTempoAcumulado] = useState({});
  const [tempoDecorridoTotal, setTempoDecorridoTotal] = useState(0);
  const [mostrarGabaritoDetalhado, setMostrarGabaritoDetalhado] = useState(false);
  const [resultadoFinal, setResultadoFinal] = useState(null);
  const [salvando, setSalvando] = useState(false);

  const tempoInicioRef = useRef(Date.now());
  const ultimaTrocaRef = useRef(Date.now());
  const indiceAnteriorRef = useRef(0);

  useEffect(() => {
    if (!dadosIniciais || !dadosIniciais.questoes || dadosIniciais.questoes.length === 0) {
      navigate('/configurar-simulado');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (etapa !== 'executando') return;

    const intervalo = setInterval(() => {
      setTempoDecorridoTotal(Math.round((Date.now() - tempoInicioRef.current) / 1000));
    }, 1000);

    return () => clearInterval(intervalo);
  }, [etapa]);

  useEffect(() => {
    const agora = Date.now();
    const decorrido = Math.round((agora - ultimaTrocaRef.current) / 1000);

    setTempoAcumulado((prev) => ({
      ...prev,
      [indiceAnteriorRef.current]: (prev[indiceAnteriorRef.current] || 0) + decorrido,
    }));

    ultimaTrocaRef.current = agora;
    indiceAnteriorRef.current = indiceAtual;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indiceAtual]);

  if (!questoes || questoes.length === 0) {
    return null;
  }

  const questaoAtual = questoes[indiceAtual];
  const respostaSelecionada = respostasPorIndice[indiceAtual] ?? null;

  const formatarTempo = (segundos) => {
    const h = Math.floor(segundos / 3600);
    const m = Math.floor((segundos % 3600) / 60);
    const s = segundos % 60;
    if (h > 0) {
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const toggleEliminada = (letra) => {
    setEliminadas((prev) => {
      const atuais = prev[indiceAtual] || [];
      const novasEliminadas = atuais.includes(letra)
        ? atuais.filter((l) => l !== letra)
        : [...atuais, letra];
      return { ...prev, [indiceAtual]: novasEliminadas };
    });
  };

  const handleResponder = (letra) => {
    if (respostasPorIndice[indiceAtual]) return;
    setRespostasPorIndice((prev) => ({ ...prev, [indiceAtual]: letra }));
  };

  const handleAnterior = () => {
    if (indiceAtual > 0) setIndiceAtual((prev) => prev - 1);
  };

  const handleProxima = () => {
    if (indiceAtual < questoes.length - 1) {
      setIndiceAtual((prev) => prev + 1);
    } else {
      finalizarSimulado();
    }
  };

  const finalizarSimulado = async () => {
    const agora = Date.now();
    const decorridoFinal = Math.round((agora - ultimaTrocaRef.current) / 1000);
    const tempoAcumuladoFinal = {
      ...tempoAcumulado,
      [indiceAtual]: (tempoAcumulado[indiceAtual] || 0) + decorridoFinal,
    };

    const totalRespondidas = Object.keys(respostasPorIndice).length;
    const totalPuladas = questoes.length - totalRespondidas;

    const detalhes = questoes.map((q, idx) => {
      const respostaDada = respostasPorIndice[idx] || null;
      const correta = respostaDada === q.gabarito;
      return {
        questaoId: q.id,
        area: q.area,
        subarea: q.subarea,
        enunciado: q.enunciado,
        alternativaA: q.alternativaA,
        alternativaB: q.alternativaB,
        alternativaC: q.alternativaC,
        alternativaD: q.alternativaD,
        alternativaE: q.alternativaE,
        imagens: q.imagens || [],
        gabarito: q.gabarito,
        respostaDada,
        correta,
        tempoSegundos: tempoAcumuladoFinal[idx] || 0,
      };
    });

    const acertos = detalhes.filter((d) => d.correta).length;

    const porArea = {};
    detalhes.forEach((d) => {
      if (!porArea[d.area]) porArea[d.area] = { total: 0, acertos: 0 };
      porArea[d.area].total += 1;
      if (d.correta) porArea[d.area].acertos += 1;
    });

    const porSubarea = {};
    detalhes.forEach((d) => {
      const chave = (d.area || 'Sem area') + ' > ' + (d.subarea || 'Sem subarea');
      if (!porSubarea[chave]) {
        porSubarea[chave] = { area: d.area, subarea: d.subarea, total: 0, acertos: 0 };
      }
      porSubarea[chave].total += 1;
      if (d.correta) porSubarea[chave].acertos += 1;
    });

    const tempoTotalSegundos = Math.round((agora - tempoInicioRef.current) / 1000);

    const resultado = {
      totalQuestoes: questoes.length,
      totalRespondidas,
      totalPuladas,
      acertos,
      percentualAcerto: totalRespondidas > 0 ? Math.round((acertos / totalRespondidas) * 100) : 0,
      tempoTotalSegundos,
      porArea,
      porSubarea,
      detalhes,
    };

    setResultadoFinal(resultado);
    setEtapa('resultado');

    try {
      setSalvando(true);
      await salvarSimulado({
        usuarioId: usuario.uid,
        configuracao,
        resultado: {
          totalQuestoes: resultado.totalQuestoes,
          totalRespondidas: resultado.totalRespondidas,
          totalPuladas: resultado.totalPuladas,
          acertos: resultado.acertos,
          percentualAcerto: resultado.percentualAcerto,
          tempoTotalSegundos: resultado.tempoTotalSegundos,
          porArea: resultado.porArea,
          porSubarea: resultado.porSubarea,
        },
        detalhes: resultado.detalhes,
      });
    } catch (error) {
      console.error('Erro ao salvar simulado:', error);
    } finally {
      setSalvando(false);
    }
  };

  // ===================== TELA DE EXECUCAO =====================
  if (etapa === 'executando') {
    const alternativas = [
      { letra: 'A', texto: questaoAtual.alternativaA },
      { letra: 'B', texto: questaoAtual.alternativaB },
      { letra: 'C', texto: questaoAtual.alternativaC },
      { letra: 'D', texto: questaoAtual.alternativaD },
      { letra: 'E', texto: questaoAtual.alternativaE },
    ];

    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <div style={styles.progresso}>
            Questao {indiceAtual + 1} de {questoes.length}
          </div>
          {usarCronometro && (
            <div style={styles.cronometro}>{formatarTempo(tempoDecorridoTotal)}</div>
          )}
          <div style={styles.placar}>
            {Object.keys(respostasPorIndice).length} / {questoes.length} respondidas
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.tags}>
            <span style={styles.tag}>{questaoAtual.area}</span>
            <span style={styles.tag}>{questaoAtual.subarea}</span>
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

              const selecionada = respostaSelecionada === alt.letra;
              const estaEliminada = (eliminadas[indiceAtual] || []).includes(alt.letra);

              let estiloAlternativa = { ...styles.alternativa };
              if (selecionada) {
                estiloAlternativa = { ...estiloAlternativa, ...styles.alternativaSelecionada };
              } else if (estaEliminada) {
                estiloAlternativa = { ...estiloAlternativa, ...styles.alternativaEliminada };
              }

              return (
                <div key={alt.letra} style={styles.linhaAlternativa}>
                  <button
                    onClick={() => handleResponder(alt.letra)}
                    style={{ ...estiloAlternativa, flex: 1 }}
                    disabled={respostaSelecionada !== null}
                  >
                    <strong>{alt.letra})</strong>{' '}
                    <span style={estaEliminada ? styles.textoRiscado : {}}>{alt.texto}</span>
                  </button>
                  {respostaSelecionada === null && (
                    <button
                      type="button"
                      onClick={() => toggleEliminada(alt.letra)}
                      style={{
                        ...styles.btnEliminar,
                        ...(estaEliminada ? styles.btnEliminarAtivo : {}),
                      }}
                      title={estaEliminada ? 'Desfazer eliminacao' : 'Eliminar esta alternativa'}
                    >
                      X
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <div style={styles.navegacao}>
            <button
              onClick={handleAnterior}
              style={{ ...styles.botaoNav, opacity: indiceAtual === 0 ? 0.5 : 1 }}
              disabled={indiceAtual === 0}
            >
              Anterior
            </button>
            <button onClick={handleProxima} style={styles.botaoProxima}>
              {indiceAtual < questoes.length - 1 ? 'Proxima Questao' : 'Finalizar Simulado'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ===================== TELA DE RESULTADO =====================
  if (etapa === 'resultado' && resultadoFinal) {
    return (
      <div style={styles.container}>
        <div style={styles.cardResultado}>
          <h2 style={styles.tituloResultado}>Resultado do Simulado</h2>

          {salvando && <p style={{ fontSize: '12px', color: '#888' }}>Salvando historico...</p>}

          <div style={styles.gridResumo}>
            <div style={styles.resumoItem}>
              <div style={styles.resumoValor}>{resultadoFinal.totalQuestoes}</div>
              <div style={styles.resumoLabel}>Total</div>
            </div>
            <div style={styles.resumoItem}>
              <div style={styles.resumoValor}>{resultadoFinal.totalRespondidas}</div>
              <div style={styles.resumoLabel}>Respondidas</div>
            </div>
            <div style={styles.resumoItem}>
              <div style={styles.resumoValor}>{resultadoFinal.totalPuladas}</div>
              <div style={styles.resumoLabel}>Puladas</div>
            </div>
            <div style={styles.resumoItem}>
              <div style={{ ...styles.resumoValor, color: '#28a745' }}>
                {resultadoFinal.acertos}
              </div>
              <div style={styles.resumoLabel}>Acertos</div>
            </div>
            <div style={styles.resumoItem}>
              <div style={{ ...styles.resumoValor, color: '#007bff' }}>
                {resultadoFinal.percentualAcerto}%
              </div>
              <div style={styles.resumoLabel}>% Acerto</div>
            </div>
            <div style={styles.resumoItem}>
              <div style={styles.resumoValor}>{formatarTempo(resultadoFinal.tempoTotalSegundos)}</div>
              <div style={styles.resumoLabel}>Tempo Total</div>
            </div>
          </div>

          <h3 style={styles.subtitulo}>Desempenho por Area</h3>
          <div style={styles.listaAreas}>
            {Object.entries(resultadoFinal.porArea).map(([area, dados]) => {
              const pct = Math.round((dados.acertos / dados.total) * 100);
              return (
                <div key={area} style={styles.itemArea}>
                  <span>{area}</span>
                  <span style={{ ...styles.itemAreaValor, color: pct < 60 ? '#dc3545' : '#28a745' }}>
                    {dados.acertos} / {dados.total} ({pct}%)
                  </span>
                </div>
              );
            })}
          </div>

          <h3 style={styles.subtitulo}>Desempenho por Subarea</h3>
          <div style={styles.listaAreas}>
            {Object.entries(resultadoFinal.porSubarea)
              .sort((a, b) => {
                const pctA = a[1].acertos / a[1].total;
                const pctB = b[1].acertos / b[1].total;
                return pctA - pctB;
              })
              .map(([chave, dados]) => {
                const pct = Math.round((dados.acertos / dados.total) * 100);
                return (
                  <div key={chave} style={styles.itemArea}>
                    <span>
                      {dados.subarea || 'Sem subarea'}
                      <span style={styles.itemSubareaArea}> ({dados.area})</span>
                    </span>
                    <span style={{ ...styles.itemAreaValor, color: pct < 60 ? '#dc3545' : '#28a745' }}>
                      {dados.acertos} / {dados.total} ({pct}%)
                    </span>
                  </div>
                );
              })}
          </div>

          <button
            onClick={() => setMostrarGabaritoDetalhado((prev) => !prev)}
            style={styles.botaoSecundario}
          >
            {mostrarGabaritoDetalhado ? 'Ocultar Gabarito Detalhado' : 'Ver Gabarito Detalhado'}
          </button>

          {mostrarGabaritoDetalhado && (
            <div style={styles.detalhesLista}>
              {resultadoFinal.detalhes.map((d, idx) => {
                const alternativas = [
                  { letra: 'A', texto: d.alternativaA },
                  { letra: 'B', texto: d.alternativaB },
                  { letra: 'C', texto: d.alternativaC },
                  { letra: 'D', texto: d.alternativaD },
                  { letra: 'E', texto: d.alternativaE },
                ];

                return (
                  <div key={idx} style={styles.detalheCard}>
                    <div style={styles.tags}>
                      <span style={styles.tag}>Questao {idx + 1}</span>
                      <span style={styles.tag}>{d.area}</span>
                      <span style={styles.tag}>{d.subarea}</span>
                      <span
                        style={{
                          ...styles.tag,
                          backgroundColor: d.correta ? '#d4edda' : '#f8d7da',
                          color: d.correta ? '#155724' : '#721c24',
                        }}
                      >
                        {d.respostaDada ? (d.correta ? 'Acertou' : 'Errou') : 'Nao respondida'}
                      </span>
                      <span style={styles.tag}>{formatarTempo(d.tempoSegundos)}</span>
                    </div>

                    <p style={styles.enunciadoDetalhe}>{d.enunciado}</p>

                    {d.imagens && d.imagens.length > 0 && (
                      <div style={styles.imagensContainer}>
                        {d.imagens.map((url, i) => (
                          <img key={i} src={url} alt="" style={styles.imagemQuestao} />
                        ))}
                      </div>
                    )}

                    <div style={styles.alternativasDetalhe}>
                      {alternativas.map((alt) => {
                        if (!alt.texto) return null;

                        let estilo = { ...styles.alternativaDetalheItem };
                        if (alt.letra === d.gabarito) {
                          estilo = { ...estilo, ...styles.alternativaCorreta };
                        } else if (alt.letra === d.respostaDada) {
                          estilo = { ...estilo, ...styles.alternativaErrada };
                        }

                        return (
                          <div key={alt.letra} style={estilo}>
                            <strong>{alt.letra})</strong> {alt.texto}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div style={styles.botoesFinais}>
            <Link to="/configurar-simulado" style={styles.botaoFinalPrimario}>
              Fazer Outro Simulado
            </Link>
            <Link to="/dashboard" style={styles.botaoFinalSecundario}>
              Voltar ao Dashboard
            </Link>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: '15px 20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  progresso: {
    fontWeight: '600',
    color: '#333',
    fontSize: '14px',
  },
  cronometro: {
    fontWeight: '700',
    color: '#dc3545',
    fontSize: '18px',
    fontFamily: 'monospace',
  },
  placar: {
    fontWeight: '600',
    color: '#28a745',
    fontSize: '13px',
  },
  card: {
    maxWidth: '800px',
    margin: '0 auto',
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '30px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  tags: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
    flexWrap: 'wrap',
  },
  tag: {
    padding: '4px 12px',
    backgroundColor: '#e7f3ff',
    color: '#007bff',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
  },
  enunciado: {
    fontSize: '17px',
    lineHeight: '1.6',
    color: '#333',
    marginBottom: '20px',
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
    border: '1px solid #ddd',
  },
  alternativas: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '20px',
  },
  linhaAlternativa: {
    display: 'flex',
    alignItems: 'stretch',
    gap: '8px',
  },
  alternativa: {
    padding: '15px',
    textAlign: 'left',
    border: '2px solid #ddd',
    borderRadius: '8px',
    backgroundColor: 'white',
    cursor: 'pointer',
    fontSize: '15px',
    lineHeight: '1.4',
  },
  alternativaSelecionada: {
    borderColor: '#007bff',
    backgroundColor: '#e7f3ff',
  },
  alternativaEliminada: {
    opacity: 0.5,
    backgroundColor: '#F5F7FA',
  },
  textoRiscado: {
    textDecoration: 'line-through',
  },
  btnEliminar: {
    width: '38px',
    flexShrink: 0,
    border: '2px solid #ddd',
    borderRadius: '8px',
    backgroundColor: 'white',
    color: '#999',
    fontWeight: '700',
    cursor: 'pointer',
    fontSize: '14px',
  },
  btnEliminarAtivo: {
    borderColor: '#D64545',
    backgroundColor: '#FBEAEA',
    color: '#D64545',
  },
  navegacao: {
    display: 'flex',
    gap: '10px',
  },
  botaoNav: {
    flex: 1,
    padding: '15px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  botaoProxima: {
    flex: 2,
    padding: '15px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  cardResultado: {
    maxWidth: '800px',
    margin: '0 auto',
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '30px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  tituloResultado: {
    fontSize: '24px',
    marginBottom: '20px',
    color: '#333',
    textAlign: 'center',
  },
  gridResumo: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
    gap: '15px',
    marginBottom: '25px',
  },
  resumoItem: {
    textAlign: 'center',
    padding: '15px 10px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
  },
  resumoValor: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#333',
  },
  resumoLabel: {
    fontSize: '12px',
    color: '#666',
    marginTop: '5px',
  },
  subtitulo: {
    fontSize: '16px',
    color: '#333',
    marginBottom: '10px',
  },
  listaAreas: {
    marginBottom: '20px',
  },
  itemArea: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '10px',
    borderBottom: '1px solid #eee',
    fontSize: '14px',
  },
  itemAreaValor: {
    fontWeight: '600',
    color: '#007bff',
  },
  itemSubareaArea: {
    fontSize: '11px',
    color: '#999',
    marginLeft: '5px',
  },
  botaoSecundario: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    marginBottom: '20px',
  },
  detalhesLista: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    marginBottom: '20px',
  },
  detalheCard: {
    border: '1px solid #eee',
    borderRadius: '8px',
    padding: '15px',
  },
  enunciadoDetalhe: {
    fontSize: '14px',
    lineHeight: '1.5',
    color: '#333',
    marginBottom: '12px',
  },
  alternativasDetalhe: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  alternativaDetalheItem: {
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '13px',
  },
  alternativaCorreta: {
    borderColor: '#28a745',
    backgroundColor: '#d4edda',
  },
  alternativaErrada: {
    borderColor: '#dc3545',
    backgroundColor: '#f8d7da',
  },
  botoesFinais: {
    display: 'flex',
    gap: '10px',
  },
  botaoFinalPrimario: {
    flex: 1,
    textAlign: 'center',
    padding: '14px',
    backgroundColor: '#007bff',
    color: 'white',
    borderRadius: '8px',
    textDecoration: 'none',
    fontWeight: '600',
    fontSize: '15px',
  },
  botaoFinalSecundario: {
    flex: 1,
    textAlign: 'center',
    padding: '14px',
    backgroundColor: '#6c757d',
    color: 'white',
    borderRadius: '8px',
    textDecoration: 'none',
    fontWeight: '600',
    fontSize: '15px',
  },
};