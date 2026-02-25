<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useAssessmentStore } from "@/stores/assessment";
import PatientForm from "@/components/common/PatientForm.vue";
import MatchstickTest from "@/components/tests/matchstick/MatchstickTest.vue";
import MatchstickReport from "@/components/tests/matchstick/MatchstickReport.vue";
import { generateMatchstickPDF } from "@/utils/exportHelpers";

const store = useAssessmentStore();

type Step = "form" | "game" | "results";
const currentStep = ref<Step>("form");
const computedResults = ref<any[] | null>(null);

onMounted(() => {
  if (import.meta.env.DEV) {
    store.setParticipant({
      name: "Tester Debugger",
      age: 25,
      gender: "masculino",
      education: "superior-completo",
      startTime: new Date().toISOString(),
    });
    currentStep.value = "game";
  }
});

function handleFormStart() {
  currentStep.value = "game";
}

function handleGameFinish(phaseResults: any[]) {
  if (!store.participant) return;
  computedResults.value = phaseResults;
  currentStep.value = "results";
}

function handleExport() {
  if (store.participant && computedResults.value) {
    generateMatchstickPDF(store.participant, computedResults.value);
  }
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

    <MatchstickTest v-if="currentStep === 'game'" @finish="handleGameFinish" />

    <div v-if="currentStep === 'results' && computedResults" class="results-section fade-in">

      <MatchstickReport :results="computedResults" />

      <div style="margin-top: 30px" class="no-print actions-bar">
        <button class="btn btn-success" @click="handleExport">Exportar PDF</button>
        <button class="btn btn-secondary" @click="restartTest">Reiniciar Teste</button>
        <button class="btn btn-secondary" @click="$router.push('/')">Voltar para Início</button>
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

.results-section {
  text-align: center;
  width: 100%;
}

.actions-bar {
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  display: inline-block;
}

.btn {
  margin: 0 10px;
}

@media print {
  .no-print {
    display: none !important;
  }

  .view-wrapper {
    padding: 0;
  }
}
</style>
