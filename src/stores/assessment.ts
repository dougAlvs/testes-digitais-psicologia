import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Participant, TestResult } from '@/types';

export const useAssessmentStore = defineStore('assessment', () => {
  const participant = ref<Participant | null>(null);
  const results = ref<TestResult | null>(null);

  function setParticipant(data: Participant) {
    participant.value = { ...data, startTime: new Date().toISOString() };
  }

  function setResults(data: TestResult) {
    results.value = data;
  }

  function reset() {
    participant.value = null;
    results.value = null;
  }

  return { participant, results, setParticipant, setResults, reset };
});