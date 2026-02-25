import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { TrialResponse, Participant, TestResult, PhaseResult, AnalysisResult } from "@/types";

const NORMS: Record<string, any> = {
  "18-29": {
    D: { mean: 16.16, sd: 5.3 },
    W: { mean: 19.69, sd: 5.9 },
    C: { mean: 32.06, sd: 11.9 },
  },
  "30-39": {
    D: { mean: 15.53, sd: 4.1 },
    W: { mean: 18.78, sd: 4.2 },
    C: { mean: 32.56, sd: 11.5 },
  },
  "40-49": {
    D: { mean: 19.12, sd: 6.3 },
    W: { mean: 22.63, sd: 5.1 },
    C: { mean: 34.06, sd: 8.4 },
  },
  "50-59": { D: { mean: 18.25, sd: 6.4 }, W: { mean: 23.4, sd: 7.3 }, C: { mean: 34.46, sd: 9.3 } },
  "60-69": {
    D: { mean: 18.05, sd: 5.9 },
    W: { mean: 25.48, sd: 7.6 },
    C: { mean: 39.93, sd: 10.3 },
  },
  "70+": { D: { mean: 21.5, sd: 7.8 }, W: { mean: 28.5, sd: 9.6 }, C: { mean: 49.21, sd: 21.7 } },
};

function getAgeGroup(age: number): string {
  if (age >= 18 && age <= 29) return "18-29";
  if (age >= 30 && age <= 39) return "30-39";
  if (age >= 40 && age <= 49) return "40-49";
  if (age >= 50 && age <= 59) return "50-59";
  if (age >= 60 && age <= 69) return "60-69";
  return "70+";
}

function generateAnalysis(
  phaseResults: Record<string, PhaseResult>,
  participant: Participant,
): AnalysisResult {
  const ageGroup = getAgeGroup(Number(participant.age));
  const norms = NORMS[ageGroup];
  const timeC_seconds = (phaseResults["cartao_c"]?.totalTime || 0) / 1000;
  const avgTimeB = phaseResults["cartao_b"]?.averageResponseTime || 0;
  const avgTimeC = phaseResults["cartao_c"]?.averageResponseTime || 0;
  const ratioC_B = avgTimeB > 0 ? (avgTimeC / avgTimeB).toFixed(2) : "0.00";
  const errorsC = phaseResults["cartao_c"]?.incorrectResponses || 0;

  let interpretationHTML = "";
  let interpretationText = "";
  let zScoreC = "N/A";

  if (norms) {
    const zVal = (timeC_seconds - norms.C.mean) / norms.C.sd;
    zScoreC = zVal.toFixed(2);

    interpretationHTML += `<p><strong>Faixa Etária:</strong> ${ageGroup}</p>`;
    interpretationHTML += `<p><strong>Erros no cartão de Interferência (Cartão C):</strong> ${errorsC}</p>`;
    interpretationHTML += `<p><strong>Z-Score (Cartão C vs Norma):</strong> ${zScoreC}</p>`;

    interpretationText += `Faixa Etária: ${ageGroup};`;
    interpretationText += `Erros no cartão de Interferência (Cartão C): ${errorsC};`;
    interpretationText += `Z-Score (Cartão C vs Norma): ${zScoreC};`;

    interpretationHTML += `<p class="analysis-text" style="margin-top: 10px;">`;
    if (Math.abs(zVal) <= 1) {
      interpretationHTML +=
        'O desempenho no Teste de Interferência está <span style="color:#16a34a; font-weight:bold">dentro do esperado</span> para a faixa etária.';
      interpretationText +=
        "O desempenho no Teste de Interferência está dentro do esperado para a faixa etária;";
    } else if (zVal > 1) {
      interpretationHTML +=
        'O desempenho no Teste de Interferência está <span style="color:#f97316; font-weight:bold">abaixo do esperado</span> (tempo de reação significativamente maior).';
      interpretationText +=
        "O desempenho no Teste de Interferência está abaixo do esperado (tempo de reação significativamente maior);";
    } else {
      interpretationHTML +=
        'O desempenho no Teste de Interferência está <span style="color:#2563eb; font-weight:bold">acima do esperado</span> (tempo de reação significativamente menor).';
      interpretationText +=
        "O desempenho no Teste de Interferência está acima do esperado (tempo de reação significativamente menor);";
    }
    interpretationHTML += `</p>`;
  } else {
    interpretationText +=
      "Não foi possível realizar a análise normativa. Idade fora das faixas de referência;";
  }

  interpretationHTML += `<p style="margin-top: 5px"><strong>Razão C/B:</strong> ${ratioC_B}</p>`;
  interpretationText += `Razão C/B: ${ratioC_B};`;

  return { ageGroup, zScoreC, ratioC_B: ratioC_B, interpretationHTML, interpretationText };
}

export function calculateResults(responses: TrialResponse[], participant: Participant): TestResult {
  const phaseResults: Record<string, PhaseResult> = {};
  const phaseKeyMap = ["cartao_a", "cartao_b", "cartao_c"];

  [0, 1, 2].forEach((index) => {
    const key = phaseKeyMap[index];
    const phaseResponses = responses.filter((r) => r.phaseIndex === index);
    const correct = phaseResponses.filter((r) => r.correct).length;
    const total = phaseResponses.length;
    const totalTime = phaseResponses.reduce((sum, r) => sum + r.responseTime, 0);

    phaseResults[key] = {
      phase: key,
      totalTrials: total,
      correctResponses: correct,
      incorrectResponses: total - correct,
      accuracy: total > 0 ? parseFloat(((correct / total) * 100).toFixed(2)) : 0,
      averageResponseTime: total > 0 ? Math.round(totalTime / total) : 0,
      totalTime: totalTime,
    };
  });

  const allCorrect = responses.filter((r) => r.correct).length;
  const allTotal = responses.length;
  const allTotalTime = responses.reduce((sum, r) => sum + r.responseTime, 0);

  const result: TestResult = {
    participant,
    testDate: new Date().toISOString(),
    summary: {
      totalTrials: allTotal,
      correctResponses: allCorrect,
      incorrectResponses: allTotal - allCorrect,
      overallAccuracy: allTotal > 0 ? parseFloat(((allCorrect / allTotal) * 100).toFixed(2)) : 0,
      overallAverageResponseTime: allTotal > 0 ? Math.round(allTotalTime / allTotal) : 0,
    },
    phaseResults,
    responses,
  };
  result.analysis = generateAnalysis(phaseResults, participant);
  return result;
}

export function generatePDF(results: TestResult) {
  const doc = new jsPDF();
  const phaseNames: Record<string, string> = {
    cartao_a: "Cartão A",
    cartao_b: "Cartão B",
    cartao_c: "Cartão C",
  };

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Teste Psicológico de Stroop - Roupas", 105, 20, { align: "center" });

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  let yPos = 35;

  doc.text(`Nome: ${results.participant.name}`, 20, yPos);
  yPos += 7;
  doc.text(`Idade: ${results.participant.age}`, 20, yPos);
  yPos += 7;
  doc.text(`Gênero: ${results.participant.gender}`, 20, yPos);
  yPos += 7;
  doc.text(`Escolaridade: ${results.participant.education}`, 20, yPos);
  yPos += 7;
  doc.text(`Data do Teste: ${new Date(results.testDate).toLocaleString("pt-BR")}`, 20, yPos);
  yPos += 12;

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Resumo Geral", 20, yPos);
  yPos += 7;

  autoTable(doc, {
    startY: yPos,
    head: [["Métrica", "Valor"]],
    body: [
      ["Total de Tentativas", results.summary.totalTrials],
      ["Respostas Corretas", results.summary.correctResponses],
      ["Respostas Incorretas", results.summary.incorrectResponses],
      ["Acurácia Geral (%)", results.summary.overallAccuracy],
      ["Tempo Médio de Resposta (ms)", results.summary.overallAverageResponseTime],
    ],
    theme: "grid",
    headStyles: { fillColor: [102, 126, 234] },
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Análise e Interpretação", 20, yPos);
  yPos += 7;

  const rawText = results.analysis?.interpretationText || "";

  const sentences = rawText
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => s + ".");

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  sentences.forEach((sentence) => {
    sentence = sentence.trim();

    if (!sentence.includes(":")) {
      doc.setFont("helvetica", "bold");
      doc.text(sentence, 20, yPos);
      yPos += 6;
      return;
    }

    const [boldPart, rest] = sentence.split(":");
    const boldText = boldPart.trim() + ":";
    const normalText = rest ? " " + rest.trim() : "";

    doc.setFont("helvetica", "bold");
    doc.text(boldText, 20, yPos);

    const nextX = 20 + doc.getTextWidth(boldText);

    if (normalText) {
      doc.setFont("helvetica", "normal");
      doc.text(normalText, nextX, yPos);
    }

    yPos += 6;
  });

  yPos += 4;

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Resultados por Fase", 20, yPos);
  yPos += 7;

  const phaseData = Object.keys(results.phaseResults).map((key) => {
    const p = results.phaseResults[key];
    return [
      phaseNames[key] || p.phase,
      p.totalTrials,
      p.correctResponses,
      p.incorrectResponses,
      p.accuracy + "%",
      p.averageResponseTime,
    ];
  });

  autoTable(doc, {
    startY: yPos,
    head: [["Fase", "Tentativas", "Acertos", "Erros", "Acurácia (%)", "Tempo Médio (ms)"]],
    body: phaseData,
    theme: "grid",
    headStyles: { fillColor: [102, 126, 234] },
  });

  doc.addPage();
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Dados Brutos - Todas as Tentativas", 20, 20);

  const rawData = results.responses.map((r) => [
    ["Cartão A", "Cartão B", "Cartão C"][r.phaseIndex],
    r.trial,
    r.itemPresented,
    r.colorPresented,
    r.compartmentChosen,
    r.correct ? "Sim" : "Não",
    r.responseTime,
  ]);

  autoTable(doc, {
    startY: 30,
    head: [["Fase", "Tent.", "Item", "Cor", "Escolha", "Correto", "Tempo (ms)"]],
    body: rawData,
    theme: "grid",
    headStyles: { fillColor: [102, 126, 234] },
    styles: { fontSize: 8 },
  });

  const filename = `teste_stroop_${results.participant.name.replace(/\s/g, "_")}_${Date.now()}.pdf`;
  doc.save(filename);
}

export function generateCSV(results: TestResult) {
  let csv = '';
  const mapName = { 'cartao_a': 'Cartão A', 'cartao_b': 'Cartão B', 'cartao_c': 'Cartão C' };

  csv += 'TESTE PSICOLÓGICO DE STROOP - ROUPAS\n';
  csv += `Nome:,${results.participant.name}\n`;
  csv += `Idade:,${results.participant.age}\n`;
  csv += `Data:,${new Date(results.testDate).toLocaleString('pt-BR')}\n\n`;

  csv += 'ANÁLISE E INTERPRETAÇÃO\n';
  csv += `"${results.analysis?.interpretationText || ''}"\n\n`;

  csv += 'RESUMO GERAL\n';
  csv += `Acurácia (%),${results.summary.overallAccuracy}\n`;
  csv += `Tempo Médio (ms),${results.summary.overallAverageResponseTime}\n\n`;

  csv += 'RESULTADOS POR FASE\n';
  csv += 'Fase,Tentativas,Acertos,Erros,Acurácia (%),Tempo Médio (ms)\n';
  Object.keys(results.phaseResults).forEach(key => {
    const p = results.phaseResults[key];
    csv += `${mapName[key as keyof typeof mapName] || p.phase},${p.totalTrials},${p.correctResponses},${p.incorrectResponses},${p.accuracy},${p.averageResponseTime}\n`;
  });
  csv += '\n';

  csv += 'DADOS BRUTOS\n';
  csv += 'Fase,Tentativa,Item,Cor,Escolha,Correto,Tempo(ms)\n';
  results.responses.forEach(r => {
    csv += `${r.phaseName},${r.trial},${r.itemPresented},${r.colorPresented},${r.compartmentChosen},${r.correct ? 'Sim' : 'Não'},${r.responseTime}\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `teste_stroop_${results.participant.name.replace(/\s/g, '_')}_${Date.now()}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
export function generateJSON(results: TestResult) {
  const json = JSON.stringify(results, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `teste_stroop_${results.participant.name.replace(/\s/g, '_')}_${Date.now()}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function renderSticksToImage(sticks: any[]): string {
  if (typeof document === 'undefined') return '';
  const canvas = document.createElement('canvas');
  canvas.width = 150;
  canvas.height = 150;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const stickLength = 85;
  const stickWidth = 8;
  const headRadius = 10;

  let minX = Infinity, maxX = -Infinity
  let minY = Infinity, maxY = -Infinity
  sticks.forEach(s => {
    const rad = (90 - s.angle) * Math.PI / 180
    const tailX = s.x - stickLength * Math.sin(rad)
    const tailY = s.y + stickLength * Math.cos(rad)
    minX = Math.min(minX, s.x, tailX)
    maxX = Math.max(maxX, s.x, tailX)
    minY = Math.min(minY, s.y, tailY)
    maxY = Math.max(maxY, s.y, tailY)
  })

  const padding = 20
  const contentWidth = maxX - minX
  const contentHeight = maxY - minY
  const scaleX = (canvas.width - padding * 2) / (contentWidth || 1)
  const scaleY = (canvas.height - padding * 2) / (contentHeight || 1)
  const scale = Math.min(scaleX, scaleY, 1)

  ctx.scale(scale, scale);
  const centerX = (minX + maxX) / 2
  const centerY = (minY + maxY) / 2
  const offsetX = (canvas.width / 2) / scale - centerX;
  const offsetY = (canvas.height / 2) / scale - centerY;

  sticks.forEach((stick) => {
    ctx.save();
    ctx.translate(stick.x + offsetX, stick.y + offsetY);
    ctx.rotate(((90 - stick.angle) * Math.PI) / 180);

    ctx.fillStyle = '#d4a373';
    ctx.beginPath();
    ctx.roundRect(-stickWidth / 2, 0, stickWidth, stickLength, 5);
    ctx.fill();

    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    ctx.beginPath();
    ctx.roundRect(-stickWidth / 2 + 2, 2, stickWidth - 4, stickLength - 4, 3);
    ctx.fill();

    ctx.fillStyle = '#e63946';
    ctx.beginPath();
    ctx.ellipse(0, -2, headRadius - 2, headRadius + 2, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath();
    ctx.ellipse(-3, -4, headRadius / 3, headRadius / 2, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  });

  return canvas.toDataURL('image/png');
}

function getPhaseDescriptions(phaseId: string) {
  switch (phaseId) {
    case 'quadrado': return { config: "Figura de quatro lados está presente", pos: "Figura repousa sobre um dos lados", detail: "Cabeças estão orientadas corretamente" };
    case 'triangulo': return { config: "Figura de três lados está presente", pos: "A base do triângulo é a mais próxima ao participante", detail: "Cabeças estão orientadas corretamente" };
    case 'v': return { config: "Palitos formam um ângulo em forma de \"V\"", pos: "Ponto do Ápice estão para fora do participante", detail: "Cabeças estão orientadas corretamente" };
    case 'arvore': return { config: "Palitos do meio são alinhados da cabeça para os pés", pos: "Os palitos laterais fazem um ângulo para fora, partindo da cabeça do fósforo inferior", detail: "Cabeças estão orientadas corretamente" };
    default: return { config: "", pos: "", detail: "" };
  }
}

export function generateMatchstickPDF(participant: Participant, phaseResults: any[]) {
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Teste do Palito", 105, 20, { align: "center" });

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  let yPos = 30;

  doc.text(`Nome: ${participant.name}`, 20, yPos);
  doc.text(`Idade: ${participant.age} anos`, 120, yPos);
  yPos += 6;
  doc.text(`Gênero: ${participant.gender}`, 20, yPos);
  doc.text(`Escolaridade: ${participant.education}`, 120, yPos);
  yPos += 6;
  doc.text(`Data da Aplicação: ${new Date().toLocaleString("pt-BR")}`, 20, yPos);
  yPos += 10;

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Folha de Registro", 105, yPos, { align: "center" });
  yPos += 6;

  const tableData = phaseResults.map((r) => {
    const configPt = r.evalResult.config;
    const posPt = r.evalResult.position;
    const detailPt = r.evalResult.detail;
    const totalPt = r.evalResult.total;
    const descs = getPhaseDescriptions(r.phase);

    return [
      `\n\n\n\n\n\nTempo: ${(r.timeMs / 1000).toFixed(1)}s`,
      `${descs.config}\n\n___ (${configPt}pt)`,
      `${descs.pos}\n\n___ (${posPt}pt)`,
      `${descs.detail}\n\n___ (${detailPt}pt)`,
      `\n\n___ (${totalPt}pts)`
    ];
  });

  const totalConfig = phaseResults.reduce((acc, r) => acc + r.evalResult.config, 0);
  const totalPos = phaseResults.reduce((acc, r) => acc + r.evalResult.position, 0);
  const totalDetail = phaseResults.reduce((acc, r) => acc + r.evalResult.detail, 0);
  const totalGeral = phaseResults.reduce((acc, r) => acc + r.evalResult.total, 0);

  tableData.push([
    "Total por etapa",
    `Configuração\n___ (${totalConfig}pts)`,
    `Posicionamento\n___ (${totalPos}pts)`,
    `Detalhe\n___ (${totalDetail}pts)`,
    `Total Geral\n___ (${totalGeral}pts)`
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [["Figura", "Config.", "Posicionamento", "Detalhe", "Total"]],
    body: tableData,
    theme: "grid",
    headStyles: { fillColor: [102, 126, 234], textColor: 255 },
    styles: { valign: 'middle', halign: 'center', fontSize: 9 },
    columnStyles: { 0: { cellWidth: 35 }, 4: { cellWidth: 25 } },
    didParseCell: function (data) {
      if (data.section === 'body') {
        data.cell.styles.minCellHeight = 42;
      }
    },
    didDrawCell: function (data) {
      if (data.column.index === 0 && data.cell.section === 'body') {
        if (data.row.index < phaseResults.length) {
          const phaseResult = phaseResults[data.row.index];
          if (phaseResult && phaseResult.finalSticks) {
            const imgData = renderSticksToImage(phaseResult.finalSticks);
            if (imgData) {
              doc.addImage(imgData, 'PNG', data.cell.x + 2, data.cell.y + 2, 31, 31);
            }
          }
        }
      }
    }
  });

  const filename = `teste_palito_${participant.name.replace(/\s/g, "_")}_${Date.now()}.pdf`;
  doc.save(filename);
}
