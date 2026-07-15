import { db } from './firebaseConfig';
import { collection, addDoc, query, where, getDocs, doc, deleteDoc } from 'firebase/firestore';

// Cria um novo cronograma (oficial se usuarioId for null, pessoal se tiver usuarioId)
export async function criarCronograma(dadosCronograma) {
  const docRef = await addDoc(collection(db, 'cronogramas'), {
    ...dadosCronograma,
    dataCriacao: new Date().toISOString(),
  });
  return docRef.id;
}

// Busca todos os cronogramas OFICIAIS (visiveis para todos os alunos)
export async function buscarCronogramasOficiais() {
  const q = query(collection(db, 'cronogramas'), where('tipo', '==', 'oficial'));
  const querySnapshot = await getDocs(q);

  const cronogramas = [];
  querySnapshot.forEach((doc) => {
    cronogramas.push({ id: doc.id, ...doc.data() });
  });

  return cronogramas;
}

// Busca os cronogramas PESSOAIS de um usuario especifico
export async function buscarCronogramasPessoais(usuarioId) {
  const q = query(
    collection(db, 'cronogramas'),
    where('tipo', '==', 'pessoal'),
    where('usuarioId', '==', usuarioId)
  );
  const querySnapshot = await getDocs(q);

  const cronogramas = [];
  querySnapshot.forEach((doc) => {
    cronogramas.push({ id: doc.id, ...doc.data() });
  });

  return cronogramas;
}

// Busca TODOS os cronogramas disponiveis para um usuario (oficiais + pessoais dele)
export async function buscarCronogramasDisponiveis(usuarioId) {
  const [oficiais, pessoais] = await Promise.all([
    buscarCronogramasOficiais(),
    buscarCronogramasPessoais(usuarioId),
  ]);
  return [...oficiais, ...pessoais];
}

// Deleta um cronograma
export async function deletarCronograma(cronogramaId) {
  await deleteDoc(doc(db, 'cronogramas', cronogramaId));
}

// Descobre qual area esta "na vez" HOJE, dentro de um cronograma
export function areaDoCronogramaHoje(cronograma) {
  const hoje = new Date().toISOString().split('T')[0]; // formato YYYY-MM-DD

  const blocoAtivo = (cronograma.blocos || []).find(
    (bloco) => hoje >= bloco.dataInicio && hoje <= bloco.dataFim
  );

  return blocoAtivo ? blocoAtivo.area : null;
}