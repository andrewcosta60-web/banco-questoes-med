import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import {
  buscarRotacaoPorId,
  areasAtivasHoje,
  calcularMetaHoje,
  questoesFeitasHoje,
  buscarProximaQuestaoDaRotacao,
  registrarQuestaoRespondida,
  cancelarRotacao,
} from '../services/rotacoesService';
import { salvarResposta } from '../services/questoesService';

export default function Rotacao() {
  const { rotacaoId } = useParams();
  const [rotacao, setRotacao] = useState(null);
  const [questaoAtual, setQuestaoAtual] = useState(null);
  const [respostaSelecionada, setRespostaSelecionada] = useState(null);
  const [mostrarResultado, setMostrarResultado] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [avisoSemArea, setAvisoSemArea] = useState('');
  const [tempoInicio, setTempoInicio] = useState(Date.now());

  const { usuario } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    carregarTudo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rotacaoId]);

  async function carregarTudo() {
    try {
      setCarregando(true);
      setErro('');
      setAvisoSemArea('');

      const dadosRotacao = await buscarRotacaoPorId(rotacaoId);

      if (!dadosRotacao) {
        setErro('Rotação não encontrada.');
        return;
      }

      setRotacao(dadosRotacao);

      // Verifica se há área ativa hoje
      const areas = areasAtivasHoje(dadosRotacao);
      if (areas.length === 0) {
        setAvisoSemArea(
          'Nenhum bloco de estudo está ativo hoje. Verifique as datas da sua rotação.'
        );
        return;
      }

      // Verifica se já bateu a meta de hoje
      const meta = calcularMetaHoje(dadosRotacao);
      const feitas = questoesFeitasHoje(dadosRotacao);

      if (feitas >= meta) {
        setAvisoSemArea(
          `Você já concluiu a meta de hoje! (${feitas}/${meta} questões). Volte amanhã.`
        );
        return;
      }

      // Busca a próxima questão
      const questao = await buscarProximaQuestaoDaRotacao(dadosRotacao);

      if (!questao) {
        setAvisoSemArea('Não há mais questões disponíveis para a(s) área(s) atual(is).');
        return;
      }

      setQuestaoAtual(questao);
      setRespostaSelecionada(null);
      setMostrarResultado(false);
      setTempoInicio(Date.now());
    } catch (error) {
      setErro('Erro ao carregar rotação: ' + error.message);
    } finally {
      setCarregando(false);
    }
  }

  const handleResponder = (letra) => {
    if (mostrarResultado) return;

    setRespostaSelecionada(letra);
    setMostrarResultado(true);

    const acertou = letra === questaoAtual.gabarito;
    const tempoGasto = Math.round((Date.now() - tempoInicio) / 1000);

    salvarResposta({
      usuarioId: usuario.uid,
      questaoId: questaoAtual.id,
      resposta: letra,
      correta: acertou,
      tempoSegundos: tempoGasto,
      tipo: 'rotacao',
      rotacaoId: rotacao.id,
      area: questaoAtual.area,
      subarea: questaoAtual.subarea,
    }).catch((err) => console.error('Erro ao salvar resposta:', err));

    registrarQuestaoRespondida(rotacao.id, questaoAtual.id).catch((err) =>
      console.error('Erro ao registrar progresso:', err)
    );
  };

  const handleProximaQuestao = async () => {
    await carregarTudo();
  };

  const handleCancelarRotacao = async () => {
    const confirmar = window.confirm('Tem certeza que deseja cancelar essa rotação?');
    if (!confirmar) return;

    try {
      await cancelarRotacao(rotacao.id);
      alert('Rotação cancelada.');
      navigate('/dashboard');
    } catch (error) {
      alert('Erro ao cancelar: ' + error.message);
    }
  };

  if (carregando) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingBox}>Carregando...</div>
      </div>
    );
  }

  if (erro) {
    return (
      <div style={styles.container}>
        <div style={styles.erroBox}>
          <p>{erro}</p>
          <button onClick={() => navigate('/dashboard')} style={styles.botaoVoltar}>
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    );
  }

  // TELA DE AVISO (meta batida, sem área ativa, ou sem questões disponíveis)
  if (avisoSemArea) {
    return (
      <div style={styles.container}>
        <div style={styles.erroBox}>
          <h3 style={{ marginTop: 0 }}>{rotacao?.nome}</h3>
          <p>{avisoSemArea}</p>
          <button onClick={() => navigate('/dashboard')} style={styles.botaoVoltar}>
            Voltar ao Dashboard
          </button>
          <button
            onClick={handleCancelarRotacao}
            style={{ ...styles.botaoVoltar, backgroundColor: '#dc3545', marginTop: '10px' }}
          >
            Cancelar esta Rotação
          </button>
        </div>
      </div>
    );
  }

  if (!questaoAtual || !rotacao) {
    return null;
  }

  const metaHoje = calcularMetaHoje(rotacao);
  const feitasHoje = questoesFeitasHoje(rotacao);

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
          Voltar
        </button>
        <div style={styles.progresso}>
          {rotacao.nome}: {feitasHoje} de {metaHoje} hoje
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
            let estiloAlternativa = { ...styles.alternativa };

            if (mostrarResultado) {
              if (alt.letra === questaoAtual.gabarito) {
                estiloAlternativa = { ...estiloAlternativa, ...styles.alternativaCorreta };
              } else if (alt.letra === respostaSelecionada) {
                estiloAlternativa = { ...estiloAlternativa, ...styles.alternativaErrada };
              }
            } else if (respostaSelecionada === alt.letra) {
              estiloAlternativa = { ...estiloAlternativa, ...styles.alternativaSelecionada };
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
              ? 'Você acertou!'
              : 'Você errou. Gabarito: ' + questaoAtual.gabarito}
          </div>
        )}

        {mostrarResultado && (
          <button onClick={handleProximaQuestao} style={styles.botaoProxima}>
            Proxima Questao
          </button>
        )}
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
  },
  progresso: {
    fontWeight: '600',
    color: '#333',
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
    marginBottom: '25px',
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
  alternativaSelecionada: {
    borderColor: '#007bff',
    backgroundColor: '#e7f3ff',
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
  botaoProxima: {
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
    maxWidth: '500px',
    margin: '50px auto',
    textAlign: 'center',
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  botaoVoltar: {
    marginTop: '15px',
    padding: '10px 20px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'block',
    width: '100%',
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
};