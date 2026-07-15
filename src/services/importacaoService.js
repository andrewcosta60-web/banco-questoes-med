import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { db, storage } from './firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Lê o arquivo Excel e transforma em uma lista de questões
export async function lerExcel(arquivo) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const primeiraAba = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[primeiraAba];
        const linhas = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        // Normaliza os nomes das colunas (case-insensitive)
        const questoes = linhas.map((linha, index) => {
          const linhaNormalizada = {};
          Object.keys(linha).forEach((chave) => {
            const chaveNormalizada = chave.trim().toLowerCase();
            linhaNormalizada[chaveNormalizada] = linha[chave];
          });

          return {
            linhaOriginal: index + 2, // +2 porque linha 1 é cabeçalho
            enunciado: String(linhaNormalizada['enunciado'] || '').trim(),
            alternativaA: String(linhaNormalizada['alternativaa'] || '').trim(),
            alternativaB: String(linhaNormalizada['alternativab'] || '').trim(),
            alternativaC: String(linhaNormalizada['alternativac'] || '').trim(),
            alternativaD: String(linhaNormalizada['alternativad'] || '').trim(),
            alternativaE: String(linhaNormalizada['alternativae'] || '').trim(),
            gabarito: String(linhaNormalizada['gabarito'] || '').trim().toUpperCase(),
            area: String(linhaNormalizada['area'] || '').trim(),
            subarea: String(linhaNormalizada['subarea'] || '').trim(),
            dificuldade: String(linhaNormalizada['dificuldade'] || '').trim().toLowerCase(),
            fonte: String(linhaNormalizada['fonte'] || '').trim(),
            imagemNome: String(linhaNormalizada['imagem'] || '').trim(),
          };
        });

        resolve(questoes);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(arquivo);
  });
}

// Lê o arquivo ZIP e retorna um objeto { nomeArquivo: blob }
export async function lerZip(arquivo) {
  const zip = new JSZip();
  const conteudo = await zip.loadAsync(arquivo);
  const imagens = {};

  for (const nomeArquivo of Object.keys(conteudo.files)) {
    const arquivoZip = conteudo.files[nomeArquivo];
    if (!arquivoZip.dir) {
      const blob = await arquivoZip.async('blob');
      // Pega só o nome do arquivo, sem caminho de pasta
      const nomeSimples = nomeArquivo.split('/').pop();
      imagens[nomeSimples] = blob;
    }
  }

  return imagens;
}

// Valida uma questão e retorna lista de problemas encontrados (vazia = OK)
export function validarQuestao(questao) {
  const problemas = [];

  if (!questao.enunciado) problemas.push('Enunciado vazio');
  if (!questao.alternativaA) problemas.push('Alternativa A vazia');
  if (!questao.alternativaB) problemas.push('Alternativa B vazia');
  if (!questao.gabarito) problemas.push('Gabarito vazio');
  if (!['A', 'B', 'C', 'D', 'E'].includes(questao.gabarito)) {
    problemas.push('Gabarito invalido (deve ser A, B, C, D ou E)');
  }
  if (!questao.area) problemas.push('Area vazia');

  return problemas;
}

// Faz upload de uma imagem para o Firebase Storage e retorna a URL
async function uploadImagem(blob, nomeArquivo) {
  const nomeUnico = `questoes/${Date.now()}_${nomeArquivo}`;
  const storageRef = ref(storage, nomeUnico);
  await uploadBytes(storageRef, blob);
  const url = await getDownloadURL(storageRef);
  return url;
}

// Salva uma lista de questões no Firestore (com upload de imagens se houver)
export async function salvarQuestoesEmLote(questoes, imagensZip, onProgresso) {
  const resultado = {
    sucesso: 0,
    falhas: [],
  };

  for (let i = 0; i < questoes.length; i++) {
    const questao = questoes[i];

    try {
      let imagensUrls = [];

      // Se a questão tem nome de imagem, tenta achar no ZIP e fazer upload
      if (questao.imagemNome && imagensZip[questao.imagemNome]) {
        const url = await uploadImagem(imagensZip[questao.imagemNome], questao.imagemNome);
        imagensUrls.push(url);
      }

      await addDoc(collection(db, 'questoes'), {
        enunciado: questao.enunciado,
        alternativaA: questao.alternativaA,
        alternativaB: questao.alternativaB,
        alternativaC: questao.alternativaC,
        alternativaD: questao.alternativaD,
        alternativaE: questao.alternativaE,
        gabarito: questao.gabarito,
        area: questao.area,
        subarea: questao.subarea,
        dificuldade: questao.dificuldade,
        fonte: questao.fonte,
        imagens: imagensUrls,
        dataCriacao: new Date().toISOString(),
      });

      resultado.sucesso++;
    } catch (error) {
      resultado.falhas.push({
        linha: questao.linhaOriginal,
        erro: error.message,
      });
    }

    if (onProgresso) {
      onProgresso(i + 1, questoes.length);
    }
  }

  return resultado;
}