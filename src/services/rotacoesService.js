import { db } from './firebaseConfig';
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
} from 'firebase/firestore';
import { embaralharArray } from './questoesService';

// Formata uma data (objeto Date) para string "YYYY-MM-DD"
export function formatarData(date) {
  const ano = date.getFullYear();
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  const dia = String(date.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

// Retorna a data de hoje formatada
export function hojeFormatado() {
  return formatarData(new Date());
}

// Cria uma nova rotação (modo "blocos" ou "misturado")
export async function criarRotacao(dadosRotacao) {
  try {
    const docRef = await addDoc(collection(db, 'rotacoes'), {
      ...dadosRotacao,
      questoesFeitasPorDia: {},
      questoesRespondidasIds: [],
      ativa: true,
      concluida: false,
      dataCriacao: new Date().toISOString(),
    });

    return docRef.id;
  } catch (error) {
    console.error('Erro ao criar rotação:', error);
    throw error;
  }
}

// Busca TODAS as rotações ativas do usuário
export async function buscarRotacoesAtivas(usuarioId) {
  try {
    const q = query(
      collection(db, 'rotacoes'),
      where('usuarioId', '==', usuarioId),
      where('ativa', '==', true)
    );

    const querySnapshot = await getDocs(q);

    let rotacoes = [];
    querySnapshot.forEach((doc) => {
      rotacoes.push({ id: doc.id, ...doc.data() });
    });

    rotacoes.sort((a, b) => new Date(b.dataCriacao) - new Date(a.dataCriacao));

    return rotacoes;
  } catch (error) {
    console.error('Erro ao buscar rotações ativas:', error);
    throw error;
  }
}

// Busca uma rotação específica pelo ID
export async function buscarRotacaoPorId(rotacaoId) {
  try {
    const docRef = doc(db, 'rotacoes', rotacaoId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error('Erro ao buscar rotação:', error);
    throw error;
  }
}

// Descobre qual(is) área(s) estão ativas HOJE, baseado no modo da rotação
export function areasAtivasHoje(rotacao) {
  const hoje = hojeFormatado();

  if (rotacao.modo === 'misturado') {
    return rotacao.areasMisturadas || [];
  }

  // Modo blocos: acha o bloco cuja data de hoje está dentro do intervalo
  if (rotacao.modo === 'blocos') {
    const blocoAtivo = (rotacao.blocos || []).find(
      (bloco) => hoje >= bloco.dataInicio && hoje <= bloco.dataFim
    );
    return blocoAtivo ? [blocoAtivo.area] : [];
  }

  return [];
}

// Calcula a meta de HOJE, somando déficits/excedentes acumulados
export function calcularMetaHoje(rotacao) {
  const hoje = hojeFormatado();
  const questoesFeitasPorDia = rotacao.questoesFeitasPorDia || {};

  // Pega todos os dias registrados ANTES de hoje, ordenados
  const diasAnteriores = Object.keys(questoesFeitasPorDia)
    .filter((data) => data < hoje)
    .sort();

  let saldoAcumulado = 0;

  diasAnteriores.forEach((data) => {
    const feitas = questoesFeitasPorDia[data] || 0;
    const diferenca = feitas - rotacao.metaBase; // positivo = fez a mais, negativo = fez a menos
    saldoAcumulado += diferenca;
  });

  // Meta de hoje = meta base - saldo acumulado
  // (se saldo é negativo/déficit, subtrair um negativo aumenta a meta)
  let metaHoje = rotacao.metaBase - saldoAcumulado;

  // Meta nunca fica menor que 1
  if (metaHoje < 1) metaHoje = 1;

  return metaHoje;
}

// Retorna quantas questões o usuário já fez HOJE nessa rotação
export function questoesFeitasHoje(rotacao) {
  const hoje = hojeFormatado();
  return (rotacao.questoesFeitasPorDia || {})[hoje] || 0;
}

// Busca questões disponíveis (das áreas ativas) que ainda NÃO foram respondidas
export async function buscarProximaQuestaoDaRotacao(rotacao) {
  const areas = areasAtivasHoje(rotacao);

  if (areas.length === 0) {
    return null; // Nenhuma área ativa hoje (fora de qualquer bloco)
  }

  const respondidasIds = rotacao.questoesRespondidasIds || [];

  // Busca questões de todas as áreas ativas
  let todasQuestoes = [];
  for (const area of areas) {
    const q = query(collection(db, 'questoes'), where('area', '==', area));
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
      todasQuestoes.push({ id: doc.id, ...doc.data() });
    });
  }

  // Remove as já respondidas
  const questoesDisponiveis = todasQuestoes.filter(
    (q) => !respondidasIds.includes(q.id)
  );

  if (questoesDisponiveis.length === 0) {
    return null; // Acabaram as questões disponíveis dessa(s) área(s)
  }

  const embaralhadas = embaralharArray(questoesDisponiveis);
  return embaralhadas[0];
}

// Registra que uma questão foi respondida (atualiza progresso do dia + lista de respondidas)
export async function registrarQuestaoRespondida(rotacaoId, questaoId) {
  try {
    const rotacao = await buscarRotacaoPorId(rotacaoId);
    const hoje = hojeFormatado();
    const feitasHojeAtual = questoesFeitasHoje(rotacao);

    const docRef = doc(db, 'rotacoes', rotacaoId);
    await updateDoc(docRef, {
      [`questoesFeitasPorDia.${hoje}`]: feitasHojeAtual + 1,
      questoesRespondidasIds: arrayUnion(questaoId),
    });
  } catch (error) {
    console.error('Erro ao registrar questão respondida:', error);
    throw error;
  }
}

// Cancela uma rotação (marca como inativa)
export async function cancelarRotacao(rotacaoId) {
  try {
    const docRef = doc(db, 'rotacoes', rotacaoId);
    await updateDoc(docRef, { ativa: false });
  } catch (error) {
    console.error('Erro ao cancelar rotação:', error);
    throw error;
  }
}

// Busca todas as áreas disponíveis (baseado nas questões cadastradas)
export async function buscarAreasDisponiveis() {
  try {
    const querySnapshot = await getDocs(collection(db, 'questoes'));
    const areasSet = new Set();

    querySnapshot.forEach((doc) => {
      const area = doc.data().area;
      if (area) areasSet.add(area);
    });

    return Array.from(areasSet);
  } catch (error) {
    console.error('Erro ao buscar áreas:', error);
    throw error;
  }
}