import { db } from './firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';

// Busca TODAS as respostas do usuario (vindas de avulsas, rotacoes e simulados)
export async function buscarTodasRespostas(usuarioId) {
  const q = query(collection(db, 'respostas'), where('usuarioId', '==', usuarioId));
  const querySnapshot = await getDocs(q);

  const respostas = [];
  querySnapshot.forEach((doc) => {
    respostas.push({ id: doc.id, ...doc.data() });
  });

  return respostas;
}

// Calcula estatisticas gerais a partir da lista de respostas
export function calcularEstatisticas(respostas) {
  const total = respostas.length;
  const acertos = respostas.filter((r) => r.correta).length;
  const percentualGeral = total > 0 ? Math.round((acertos / total) * 100) : 0;

  // Agrupa por area
  const porArea = {};
  respostas.forEach((r) => {
    const area = r.area || 'Sem area';
    if (!porArea[area]) porArea[area] = { total: 0, acertos: 0 };
    porArea[area].total += 1;
    if (r.correta) porArea[area].acertos += 1;
  });

  // Agrupa por subarea (chave combinada area+subarea)
  const porSubarea = {};
  respostas.forEach((r) => {
    const chave = (r.area || 'Sem area') + ' > ' + (r.subarea || 'Sem subarea');
    if (!porSubarea[chave]) {
      porSubarea[chave] = { area: r.area, subarea: r.subarea, total: 0, acertos: 0 };
    }
    porSubarea[chave].total += 1;
    if (r.correta) porSubarea[chave].acertos += 1;
  });

  // Agrupa por tipo (avulsa, rotacao, simulado)
  const porTipo = {};
  respostas.forEach((r) => {
    const tipo = r.tipo || 'outro';
    if (!porTipo[tipo]) porTipo[tipo] = { total: 0, acertos: 0 };
    porTipo[tipo].total += 1;
    if (r.correta) porTipo[tipo].acertos += 1;
  });

  // Ordena respostas por data, mais recente primeiro (para "atividade recente")
  const recentes = [...respostas]
    .sort((a, b) => new Date(b.dataCriacao) - new Date(a.dataCriacao))
    .slice(0, 15);

  return {
    total,
    acertos,
    percentualGeral,
    porArea,
    porSubarea,
    porTipo,
    recentes,
  };
}