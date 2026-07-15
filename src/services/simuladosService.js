import { db } from './firebaseConfig';
import { collection, addDoc, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

// Salva o resultado de um simulado concluido
export async function salvarSimulado(dadosSimulado) {
  const docRef = await addDoc(collection(db, 'simulados'), {
    ...dadosSimulado,
    dataCriacao: new Date().toISOString(),
  });
  return docRef.id;
}

// Busca o historico de simulados de um usuario, mais recente primeiro
export async function buscarHistoricoSimulados(usuarioId) {
  const q = query(collection(db, 'simulados'), where('usuarioId', '==', usuarioId));
  const querySnapshot = await getDocs(q);

  const simulados = [];
  querySnapshot.forEach((doc) => {
    simulados.push({ id: doc.id, ...doc.data() });
  });

  simulados.sort((a, b) => new Date(b.dataCriacao) - new Date(a.dataCriacao));
  return simulados;
}


// Busca um simulado especifico pelo ID (para reabrir o resultado detalhado)
export async function buscarSimuladoPorId(simuladoId) {
  const docRef = doc(db, 'simulados', simuladoId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  }
  return null;
}