<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useAssessmentStore } from "@/stores/assessment";
import { calculateResults, generatePDF, generateCSV, generateJSON } from "@/utils/exportHelpers";
import type { TrialResponse, TestResult } from "@/types";

import PatientForm from "@/components/common/PatientForm.vue";

import StroopTest from "@/components/tests/stroop/StroopTest.vue";

onMounted(() => {
  if (import.meta.env.DEV) {
    console.log("🔧 Modo DEV detectado: Pulando formulário...");

    store.setParticipant({
      name: "Tester Debugger",
      age: 30,
      gender: "masculino",
      education: "superior-completo",
      startTime: new Date().toISOString(),
    });

    currentStep.value = "game";
  }
});

const store = useAssessmentStore();

type Step = "form" | "game" | "results";
const currentStep = ref<Step>("form");
const computedResults = ref<TestResult | null>(null);

function handleFormStart() {
  currentStep.value = "game";
}

function handleGameFinish(rawResponses: TrialResponse[]) {
  if (!store.participant) return;

  const results = calculateResults(rawResponses, store.participant);

  store.setResults(results);
  computedResults.value = results;
  currentStep.value = "results";
}

function restartTest() {
  store.reset();
  computedResults.value = null;
  currentStep.value = "form";
}
</script>

<template>
  <div class="view-wrapper">
    <PatientForm v-if="currentStep === 'form'" @start="handleFormStart" />

    <StroopTest v-if="currentStep === 'game'" @finish="handleGameFinish" />

    <div
      v-if="currentStep === 'results' && computedResults"
      class="results-section card-base fade-in"
    >
      <h1>Resultados do Teste</h1>

      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-label">Acurácia Geral</div>
          <div class="metric-value">{{ computedResults.summary.overallAccuracy }}%</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Tempo Médio de Resposta</div>
          <div class="metric-value">
            {{ computedResults.summary.overallAverageResponseTime }} ms
          </div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Total de Erros</div>
          <div class="metric-value">{{ computedResults.summary.incorrectResponses }}</div>
        </div>
      </div>

      <h2>Detalhes por Fase</h2>
      <div class="table-responsive">
        <table class="summary-table">
          <thead>
            <tr>
              <th>Fase</th>
              <th>Tentativas</th>
              <th>Acertos</th>
              <th>Erros</th>
              <th>Acurácia (%)</th>
              <th>Tempo Médio (ms)</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(result, key) in computedResults.phaseResults" :key="key">
              <td>
                {{ key === "cartao_a" ? "Cartão A" : key === "cartao_b" ? "Cartão B" : "Cartão C" }}
              </td>
              <td>{{ result.totalTrials }}</td>
              <td>{{ result.correctResponses }}</td>
              <td>{{ result.incorrectResponses }}</td>
              <td>{{ result.accuracy }}%</td>
              <td>{{ result.averageResponseTime }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 style="margin-top: 30px">Análise e Interpretação (Normativa)</h2>
      <div class="analysis-card">
        <div v-html="computedResults.analysis?.interpretationHTML"></div>
      </div>

      <div class="btn-group">
        <button class="btn btn-success" @click="generateCSV(computedResults!)">Exportar CSV</button>
        <button class="btn btn-success" @click="generateJSON(computedResults!)">
          Exportar JSON
        </button>
        <button class="btn btn-success" @click="generatePDF(computedResults!)">Exportar PDF</button>
        <button class="btn btn-secondary" @click="restartTest">Reiniciar Teste</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.view-wrapper {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.fade-in {
  animation: fadeIn 0.5s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

h1 {
  color: #1a237e;
  text-align: center;
  margin-bottom: 30px;
}

h2 {
  color: #3949ab;
  text-align: center;
  margin-top: 30px;
  margin-bottom: 20px;
}

.metrics-grid {
  display: flex;
  gap: 15px;
  margin-bottom: 30px;
  justify-content: center;
  flex-wrap: wrap;
}

.metric-card {
  flex: 1;
  min-width: 200px;
  background: linear-gradient(135deg, #3949ab 0%, #1a237e 100%);
  color: white;
  padding: 20px;
  border-radius: 10px;
  text-align: center;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.metric-value {
  font-size: 2.5rem;
  font-weight: bold;
  margin: 10px 0;
}

.metric-label {
  font-size: 1rem;
  opacity: 0.9;
}

.table-responsive {
  overflow-x: auto;
}

.summary-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 30px;
  border-radius: 8px;
  overflow: hidden;
}

.summary-table th {
  background: #3949ab;
  color: white;
  padding: 15px;
  text-align: left;
}

.summary-table td {
  padding: 15px;
  border-bottom: 1px solid #eee;
  color: #555;
}

.summary-table tr:hover {
  background-color: #f5f5f5;
}

.btn-group {
  display: flex;
  gap: 15px;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 30px;
}

@media (max-width: 768px) {
  .view-wrapper {
    padding: 10px;
  }

  h1 {
    font-size: 1.8rem;
    margin-bottom: 20px;
  }

  h2 {
    font-size: 1.4rem;
    margin-top: 20px;
  }

  .metrics-grid {
    flex-direction: column;
    gap: 10px;
  }

  .metric-card {
    min-width: 100%;
    padding: 15px;
  }

  .metric-value {
    font-size: 2rem;
  }

  .summary-table,
  .summary-table tbody,
  .summary-table tr,
  .summary-table td {
    display: block;
    width: 100%;
  }

  .summary-table thead {
    display: none;
  }

  .summary-table tr {
    margin-bottom: 15px;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    background: #fff;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
    padding: 10px;
  }

  .summary-table td {
    display: flex;
    justify-content: space-between;
    align-items: center;
    text-align: right;
    padding: 10px 5px;
    border-bottom: 1px solid #f0f0f0;
    font-size: 0.95rem;
  }

  .summary-table td:last-child {
    border-bottom: none;
  }

  .summary-table td::before {
    content: attr(data-label);
    font-weight: bold;
    color: #3949ab;
    text-transform: uppercase;
    font-size: 0.85rem;
  }

  .summary-table td:nth-of-type(1)::before {
    content: "Fase";
  }

  .summary-table td:nth-of-type(2)::before {
    content: "Tentativas";
  }

  .summary-table td:nth-of-type(3)::before {
    content: "Acertos";
  }

  .summary-table td:nth-of-type(4)::before {
    content: "Erros";
  }

  .summary-table td:nth-of-type(5)::before {
    content: "Acurácia";
  }

  .summary-table td:nth-of-type(6)::before {
    content: "Tempo Médio";
  }

  .summary-table td:nth-of-type(1) {
    background-color: #e8eaf6;
    color: #1a237e;
    font-weight: bold;
    border-radius: 4px;
    justify-content: center;
    margin-bottom: 5px;
  }

  .summary-table td:nth-of-type(1)::before {
    display: none;
  }

  .btn-group {
    flex-direction: column;
    width: 100%;
    gap: 10px;
  }

  .btn-group button {
    width: 100%;
    margin: 0 !important;
  }
}
</style>
