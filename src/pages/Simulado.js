import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import { salvarSimulado } from '../services/simuladosService';
import Layout from '../components/Layout';
import { cores, estilosBase } from '../styles/theme';

export default function Simulado() {
  const location = useLocation();
  const navigate = useNavigate();
  const { usuario } = useAuth();

  const dadosIniciais = location.state;

  const [questoes] = useState(dadosIniciais?.questoes || []);
  const [usarCronometro] = useState(dadosIniciais?.usarCronometro || false);
  const [configuracao] = useState(dadosIniciais?.configuracao || {});

  const [etapa, setEtapa] = useState('executando'); // executando ou resultado
  const [indiceAtual, setIndiceAtual] = useState(0);
  const [respostasPorIndice, setRespostasPorIndice] = useState({});
  const [tempoAcumulado, setTempoAcumulado] = useState({});
  const [tempoDecorridoTotal, setTempoDecorridoTotal] = useState(0);
  const [mostrarGabaritoDetalhado, setMostrarGabaritoDetalhado] = useState(false);
  const [resultadoFinal, setResultadoFinal] = useState(null);
  const [salvando, setSalvando] = useState(false);

  const tempoInicioRef = useRef(Date.now());
  const ultimaTrocaRef = useRef(Date.now());
  const indiceAnteriorRef = useRef(0);

  // Se acessou essa pagina sem vir da configuracao, redireciona de volta
  useEffect(() => {
    if (!dadosIniciais || !dadosIniciais.questoes || dadosIniciais.questoes.length === 0) {
      navigate('/configurar-simulado');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cronometro geral (tempo corrido continuo)
  useEffect(() => {
    if (etapa !== 'executando') return;

    const intervalo = setInterval(() => {
      setTempoDecorridoTotal(Math.round((Date.now() - tempoInicioRef.current) / 1000));
    }, 1000);

    return () => clearInterval(intervalo);
  }, [etapa]);

  // Toda vez que muda de questao, acumula o tempo gasto na questao anterior
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

  const handleResponder = (letra) => {
    if (respostasPorIndice[indiceAtual]) return; // ja respondida, trava
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
    // Flush do tempo da ultima questao antes de calcular tudo
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

    // Agrupa acertos por area
const porArea = {};
detalhes.forEach((d) => {
  if (!porArea[d.area]) porArea[d.area] = { total: 0, acertos: 0 };
  porArea[d.area].total += 1;
  if (d.correta) porArea[d.area].acertos += 1;
});

// Agrupa acertos por subarea (chave combinada Area + Subarea, para nao misturar subareas de nomes iguais em areas diferentes)
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

    // Salva no Firestore (nao trava a tela esperando)
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
      <Layout maxWidth="800px">
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

              return (
                <button
                  key={alt.letra}
                  onClick={() => handleResponder(alt.letra)}
                  style={{
                    ...styles.alternativa,
                    ...(selecionada ? styles.alternativaSelecionada : {}),
                  }}
                  disabled={respostaSelecionada !== null}
                >
                  <strong>{alt.letra})</strong> {alt.texto}
                </button>
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
      </Layout>
    );
  }

  // ===================== TELA DE RESULTADO =====================
  if (etapa === 'resultado' && resultadoFinal) {
    return (
      <Layout maxWidth="800px">
        <div style={styles.cardResultado}>
          <h2 style={styles.tituloResultado}>Resultado do Simulado</h2>

          {salvando && <p style={styles.textoSalvando}>Salvando historico...</p>}

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
              <div style={{ ...styles.resumoValor, color: cores.teal }}>
                {resultadoFinal.acertos}
              </div>
              <div style={styles.resumoLabel}>Acertos</div>
            </div>
            <div style={styles.resumoItem}>
              <div style={{ ...styles.resumoValor, color: cores.teal }}>
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
        <span style={{ ...styles.itemAreaValor, color: pct < 60 ? cores.perigo : cores.teal }}>
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
      return pctA - pctB; // mostra as piores primeiro
    })
    .map(([chave, dados]) => {
      const pct = Math.round((dados.acertos / dados.total) * 100);
      return (
        <div key={chave} style={styles.itemArea}>
          <span>
            {dados.subarea || 'Sem subarea'}
            <span style={styles.itemSubareaArea}> ({dados.area})</span>
          </span>
          <span style={{ ...styles.itemAreaValor, color: pct < 60 ? cores.perigo : cores.teal }}>
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
                          backgroundColor: d.correta ? cores.tealFundo : cores.perigoFundo,
                          color: d.correta ? cores.sucessoTexto : cores.perigoTexto,
                        }}
                      >
                        {d.respostaDada
                          ? d.correta
                            ? 'Acertou'
                            : 'Errou'
                          : 'Nao respondida'}
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
      </Layout>
    );
  }

  return null;
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
  progresso: {
    fontWeight: '600',
    color: cores.texto,
    fontSize: '14px',
  },
  cronometro: {
    fontWeight: '700',
    color: cores.aviso,
    fontSize: '18px',
    fontFamily: 'monospace',
  },
  placar: {
    fontWeight: '600',
    color: cores.teal,
    fontSize: '13px',
  },
  card: {
    ...estilosBase.card,
    padding: '28px',
  },
  tags: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
    flexWrap: 'wrap',
  },
  tag: estilosBase.tag,
  enunciado: {
    fontSize: '17px',
    lineHeight: '1.6',
    color: cores.texto,
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
  alternativaSelecionada: {
    borderColor: cores.teal,
    backgroundColor: cores.tealFundo,
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
    padding: '15px',
    fontSize: '15px',
  },
  cardResultado: {
    ...estilosBase.card,
    padding: '28px',
  },
  tituloResultado: {
    fontSize: '22px',
    marginBottom: '20px',
    color: cores.texto,
    fontWeight: '700',
    textAlign: 'center',
  },
  textoSalvando: {
    fontSize: '12px',
    color: cores.textoSecundario,
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
    backgroundColor: cores.fundoPagina,
    borderRadius: '8px',
  },
  resumoValor: {
    fontSize: '24px',
    fontWeight: '700',
    color: cores.texto,
  },
  resumoLabel: {
    fontSize: '12px',
    color: cores.textoSecundario,
    marginTop: '5px',
  },
  subtitulo: estilosBase.subtitulo,
  listaAreas: {
    marginBottom: '20px',
  },
  itemArea: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '10px',
    borderBottom: '1px solid ' + cores.borda,
    fontSize: '14px',
    color: cores.texto,
  },
  itemAreaValor: {
    fontWeight: '700',
  },
  itemSubareaArea: {
    fontSize: '11px',
    color: cores.textoSecundario,
    marginLeft: '5px',
  },
  botaoSecundario: {
    ...estilosBase.botaoSecundario,
    width: '100%',
    padding: '12px',
    fontSize: '14px',
    marginBottom: '20px',
    textAlign: 'center',
  },
  detalhesLista: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    marginBottom: '20px',
  },
  detalheCard: {
    border: '1px solid ' + cores.borda,
    borderRadius: '8px',
    padding: '15px',
  },
  enunciadoDetalhe: {
    fontSize: '14px',
    lineHeight: '1.5',
    color: cores.texto,
    marginBottom: '12px',
  },
  alternativasDetalhe: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  alternativaDetalheItem: {
    padding: '10px',
    border: '1px solid ' + cores.borda,
    borderRadius: '6px',
    fontSize: '13px',
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
  botoesFinais: {
    display: 'flex',
    gap: '10px',
  },
  botaoFinalPrimario: {
    flex: 1,
    textAlign: 'center',
    padding: '14px',
    backgroundColor: cores.teal,
    color: cores.branco,
    borderRadius: '8px',
    textDecoration: 'none',
    fontWeight: '700',
    fontSize: '15px',
  },
  botaoFinalSecundario: {
    flex: 1,
    textAlign: 'center',
    padding: '14px',
    backgroundColor: cores.branco,
    color: cores.texto,
    border: '1px solid ' + cores.borda,
    borderRadius: '8px',
    textDecoration: 'none',
    fontWeight: '700',
    fontSize: '15px',
    boxSizing: 'border-box',
  },
};
