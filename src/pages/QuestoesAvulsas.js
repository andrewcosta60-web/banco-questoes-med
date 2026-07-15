import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import { buscarTodasQuestoes, salvarResposta, embaralharArray } from '../services/questoesService';

export default function QuestoesAvulsas() {
  const [etapa, setEtapa] = useState('selecao');
  const [todasQuestoesCache, setTodasQuestoesCache] = useState([]);
  const [misturarTudo, setMisturarTudo] = useState(true);
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
      } catch (error) {
        setErro('Erro ao carregar questoes: ' + error.message);
      } finally {
        setCarregando(false);
      }
    }
    carregarTudo();
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
    if (!misturarTudo && areasSelecionadas.length === 0) {
      setErro('Escolha pelo menos uma area, ou marque "Todas as areas"');
      return;
    }

    let questoesFiltradas = todasQuestoesCache;

    if (!misturarTudo) {
      questoesFiltradas = questoesFiltradas.filter((q) => areasSelecionadas.includes(q.area));

      if (subareasSelecionadas.length > 0) {
        questoesFiltradas = questoesFiltradas.filter((q) =>
          subareasSelecionadas.includes(q.subarea)
        );
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
      <div style={styles.container}>
        <div style={styles.loadingBox}>Carregando...</div>
      </div>
    );
  }

  if (etapa === 'selecao') {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <button onClick={() => navigate('/dashboard')} style={styles.btnVoltar}>
            Voltar
          </button>

          <h2 style={styles.titulo}>Questoes Avulsas</h2>

          {erro && <div style={styles.erroBox}>{erro}</div>}

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

          {!misturarTudo && (
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
      </div>
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
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={() => navigate('/dashboard')} style={styles.btnVoltar}>
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
              backgroundColor:
                respostaSelecionada === questaoAtual.gabarito ? '#d4edda' : '#f8d7da',
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
    </div>
  );
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
  btnVoltar: {
    padding: '8px 16px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    marginBottom: '15px',
  },
  progresso: {
    fontWeight: '600',
    color: '#333',
  },
  placar: {
    fontWeight: '600',
    color: '#28a745',
    fontSize: '13px',
  },
  titulo: {
    fontSize: '22px',
    marginBottom: '20px',
    color: '#333',
  },
  card: {
    maxWidth: '600px',
    margin: '0 auto',
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '30px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  formGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: '500',
    color: '#333',
    fontSize: '14px',
  },
  checkboxItemGrande: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
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
  tagDificuldade: {
    backgroundColor: '#fff3cd',
    color: '#856404',
  },
  enunciado: {
    fontSize: '17px',
    lineHeight: '1.6',
    color: '#333',
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
  border: '1px solid #ddd',
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
    border: '2px solid #ddd',
    borderRadius: '8px',
    backgroundColor: 'white',
    cursor: 'pointer',
    fontSize: '15px',
    lineHeight: '1.4',
  },
  alternativaCorreta: {
    borderColor: '#28a745',
    backgroundColor: '#d4edda',
  },
  alternativaErrada: {
    borderColor: '#dc3545',
    backgroundColor: '#f8d7da',
  },
  resultadoBox: {
    padding: '15px',
    borderRadius: '8px',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: '20px',
    fontSize: '16px',
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
    width: '100%',
    padding: '15px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  loadingBox: {
    textAlign: 'center',
    padding: '50px',
    fontSize: '18px',
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
};