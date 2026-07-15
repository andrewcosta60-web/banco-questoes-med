import { db } from './firebaseConfig';
import { collection, query, where, getDocs, writeBatch, doc } from 'firebase/firestore';

// Deleta os documentos de uma colecao que pertencem a um usuario especifico
async function deletarDocumentosDoUsuario(nomeColecao, usuarioId, onProgresso) {
  const q = query(collection(db, nomeColecao), where('usuarioId', '==', usuarioId));
  const querySnapshot = await getDocs(q);
  const todosIds = querySnapshot.docs.map((d) => d.id);

  const tamanhoLote = 400;
  let deletados = 0;

  for (let i = 0; i < todosIds.length; i += tamanhoLote) {
    const loteIds = todosIds.slice(i, i + tamanhoLote);
    const batch = writeBatch(db);

    loteIds.forEach((id) => {
      batch.delete(doc(db, nomeColecao, id));
    });

    await batch.commit();
    deletados += loteIds.length;

    if (onProgresso) onProgresso(deletados, todosIds.length);
  }

  return deletados;
}

// Reseta as respostas do usuario atual (afeta Estatisticas dele)
export async function resetarRespostas(usuarioId, onProgresso) {
  return deletarDocumentosDoUsuario('respostas', usuarioId, onProgresso);
}

// Reseta o historico de simulados do usuario atual
export async function resetarSimulados(usuarioId, onProgresso) {
  return deletarDocumentosDoUsuario('simulados', usuarioId, onProgresso);
}

// Reseta as rotacoes do usuario atual
export async function resetarRotacoes(usuarioId, onProgresso) {
  return deletarDocumentosDoUsuario('rotacoes', usuarioId, onProgresso);
}