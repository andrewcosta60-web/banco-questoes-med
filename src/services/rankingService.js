import { db } from './firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';

// Busca o ranking geral: quantidade de questoes respondidas por cada usuario
export async function buscarRanking() {
  const respostasSnapshot = await getDocs(collection(db, 'respostas'));
  const usuariosSnapshot = await getDocs(collection(db, 'usuarios'));

  // Mapa usuarioId -> nome
  const nomesPorId = {};
  usuariosSnapshot.forEach((doc) => {
    nomesPorId[doc.id] = doc.data().nome || 'Usuario';
  });

  // Conta quantas respostas cada usuario tem
  const contagemPorUsuario = {};
  respostasSnapshot.forEach((doc) => {
    const usuarioId = doc.data().usuarioId;
    if (!usuarioId) return;
    contagemPorUsuario[usuarioId] = (contagemPorUsuario[usuarioId] || 0) + 1;
  });

  // Monta a lista final, ordenada do maior pro menor
  const ranking = Object.entries(contagemPorUsuario)
    .map(([usuarioId, total]) => ({
      usuarioId,
      nome: nomesPorId[usuarioId] || 'Usuario',
      total,
    }))
    .sort((a, b) => b.total - a.total);

  return ranking;
}