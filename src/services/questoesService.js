import { db, storage } from './firebaseConfig';
import { collection, getDocs, query, where, addDoc, doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

// Busca TODAS as questões do Firestore
export async function buscarTodasQuestoes() {
  try {
    const querySnapshot = await getDocs(collection(db, 'questoes'));
    const questoes = [];

    querySnapshot.forEach((doc) => {
      questoes.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return questoes;
  } catch (error) {
    console.error('Erro ao buscar questões:', error);
    throw error;
  }
}

// Busca questões filtradas por área (opcional, vamos usar depois)
export async function buscarQuestoesPorArea(area) {
  try {
    const q = query(collection(db, 'questoes'), where('area', '==', area));
    const querySnapshot = await getDocs(q);
    const questoes = [];

    querySnapshot.forEach((doc) => {
      questoes.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return questoes;
  } catch (error) {
    console.error('Erro ao buscar questões por área:', error);
    throw error;
  }
}

// Salva a resposta do usuário no Firestore
export async function salvarResposta(dadosResposta) {
  try {
    await addDoc(collection(db, 'respostas'), {
      ...dadosResposta,
      dataCriacao: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Erro ao salvar resposta:', error);
    throw error;
  }
}

// Embaralha um array (usado para pegar questões em ordem aleatória)
export function embaralharArray(array) {
  const novoArray = [...array];
  for (let i = novoArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [novoArray[i], novoArray[j]] = [novoArray[j], novoArray[i]];
  }
  return novoArray;
}

// Lista todas as questoes, com um numero sequencial para identificacao
export async function listarQuestoesComNumero() {
  const querySnapshot = await getDocs(collection(db, 'questoes'));
  const questoes = [];

  querySnapshot.forEach((docSnap) => {
    questoes.push({ id: docSnap.id, ...docSnap.data() });
  });

  questoes.sort((a, b) => {
    if (a.dataCriacao && b.dataCriacao) {
      return new Date(a.dataCriacao) - new Date(b.dataCriacao);
    }
    return 0;
  });

  return questoes.map((q, index) => ({ ...q, numero: index + 1 }));
}

// Busca uma questao especifica pelo ID (para editar)
export async function buscarQuestaoParaEditar(questaoId) {
  const docRef = doc(db, 'questoes', questaoId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  }
  return null;
}

// Atualiza os dados de uma questao
export async function atualizarQuestao(questaoId, dadosAtualizados) {
  const docRef = doc(db, 'questoes', questaoId);
  await updateDoc(docRef, dadosAtualizados);
}

// Deleta uma questao permanentemente
export async function deletarQuestao(questaoId) {
  const docRef = doc(db, 'questoes', questaoId);
  await deleteDoc(docRef);
}

// Faz upload de uma nova imagem e adiciona na lista de imagens da questao
export async function adicionarImagemNaQuestao(questaoId, arquivoImagem, imagensAtuais, onProgresso) {
  const nomeUnico = `questoes/${Date.now()}_${arquivoImagem.name}`;
  const storageRef = ref(storage, nomeUnico);

  const uploadTask = uploadBytesResumable(storageRef, arquivoImagem);

  const url = await new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progresso = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        if (onProgresso) onProgresso(progresso);
      },
      (error) => reject(error),
      async () => {
        const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
        resolve(downloadUrl);
      }
    );
  });

  const novasImagens = [...(imagensAtuais || []), url];
  await atualizarQuestao(questaoId, { imagens: novasImagens });
  return novasImagens;
}

// Remove uma imagem da lista de imagens da questao
export async function removerImagemDaQuestao(questaoId, urlImagem, imagensAtuais) {
  const novasImagens = (imagensAtuais || []).filter((url) => url !== urlImagem);
  await atualizarQuestao(questaoId, { imagens: novasImagens });
  return novasImagens;
}