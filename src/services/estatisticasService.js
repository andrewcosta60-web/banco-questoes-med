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
// Gera os ultimos N dias (incluindo hoje) no formato YYYY-MM-DD
function gerarUltimosDias(quantidade) {
  const dias = [];
  for (let i = quantidade - 1; i >= 0; i--) {
    const data = new Date();
    data.setDate(data.getDate() - i);
    dias.push(data.toISOString().split('T')[0]);
  }
  return dias;
}

// Monta o calendario de atividade dos ultimos N dias (padrao 35, ~5 semanas)
export function montarCalendarioAtividade(respostas, metaDiaria = 10, dias = 35) {
  const ultimosDias = gerarUltimosDias(dias);

  // Conta quantas respostas existem em cada dia
  const contagemPorDia = {};
  respostas.forEach((r) => {
    if (!r.dataCriacao) return;
    const dia = r.dataCriacao.split('T')[0];
    contagemPorDia[dia] = (contagemPorDia[dia] || 0) + 1;
  });

  return ultimosDias.map((dia) => {
    const feitas = contagemPorDia[dia] || 0;
    let status = 'vazio'; // sem nenhuma questao
    if (feitas > 0 && feitas < metaDiaria) status = 'parcial';
    if (feitas >= metaDiaria) status = 'completo';

    return { dia, feitas, status };
  });
}

// Calcula a sequencia atual de dias consecutivos com pelo menos 1 questao respondida
export function calcularSequenciaAtual(respostas) {
  const diasComAtividade = new Set(
    respostas.filter((r) => r.dataCriacao).map((r) => r.dataCriacao.split('T')[0])
  );

  let sequencia = 0;
  let dataAtual = new Date();

  // Se hoje ainda nao tem atividade, comeca a contar a partir de ontem
  // (para nao zerar a sequencia so porque o dia ainda nao acabou)
  const hojeStr = dataAtual.toISOString().split('T')[0];
  if (!diasComAtividade.has(hojeStr)) {
    dataAtual.setDate(dataAtual.getDate() - 1);
  }

  while (true) {
    const diaStr = dataAtual.toISOString().split('T')[0];
    if (diasComAtividade.has(diaStr)) {
      sequencia++;
      dataAtual.setDate(dataAtual.getDate() - 1);
    } else {
      break;
    }
  }

  return sequencia;
}
// Agrupa as respostas por semana e calcula o % de acerto de cada semana
// Retorna as ultimas N semanas (padrao 8), para mostrar a evolucao
export function calcularEvolucaoSemanal(respostas, numeroDeSemanas = 8) {
  // Descobre o inicio de cada semana (domingo) para os ultimos N periodos
  function inicioDaSemana(data) {
    const d = new Date(data);
    const diaSemana = d.getDay();
    d.setDate(d.getDate() - diaSemana);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  const hoje = new Date();
  const semanas = [];

  for (let i = numeroDeSemanas - 1; i >= 0; i--) {
    const referencia = new Date(hoje);
    referencia.setDate(referencia.getDate() - i * 7);
    const inicio = inicioDaSemana(referencia);
    const fim = new Date(inicio);
    fim.setDate(fim.getDate() + 7);

    semanas.push({ inicio, fim, total: 0, acertos: 0 });
  }

  respostas.forEach((r) => {
    if (!r.dataCriacao) return;
    const dataResposta = new Date(r.dataCriacao);

    const semana = semanas.find((s) => dataResposta >= s.inicio && dataResposta < s.fim);
    if (semana) {
      semana.total += 1;
      if (r.correta) semana.acertos += 1;
    }
  });

  return semanas.map((s) => ({
    label: `${String(s.inicio.getDate()).padStart(2, '0')}/${String(s.inicio.getMonth() + 1).padStart(2, '0')}`,
    total: s.total,
    acertos: s.acertos,
    percentual: s.total > 0 ? Math.round((s.acertos / s.total) * 100) : null,
  }));
}