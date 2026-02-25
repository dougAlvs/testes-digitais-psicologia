<script setup lang="ts">
import { ref } from 'vue';
import { useAssessmentStore } from '@/stores/assessment';
import type { Participant } from '@/types';


const emit = defineEmits<{
  (e: 'start'): void
}>();

const store = useAssessmentStore();


const formData = ref<Participant>({
  name: '',
  age: '',
  gender: '',
  education: ''
});

function handleSubmit() {
  if (!formData.value.name || !formData.value.age) return;

  store.setParticipant(formData.value);
  emit('start');
}
</script>

<template>
  <div class="form-section card-base fade-in">
    <h2>Cadastro do Participante</h2>

    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <label for="name">Nome Completo:</label>
        <input type="text" id="name" v-model="formData.name" required placeholder="Digite o nome...">
      </div>

      <div class="form-group">
        <label for="age">Idade:</label>
        <input type="number" id="age" v-model="formData.age" min="1" max="120" required placeholder="Ex: 25">
      </div>

      <div class="form-group">
        <label for="gender">Gênero:</label>
        <select id="gender" v-model="formData.gender" required>
          <option value="" disabled>Selecione...</option>
          <option value="masculino">Masculino</option>
          <option value="feminino">Feminino</option>
          <option value="outro">Outro</option>
          <option value="prefiro-nao-dizer">Prefiro não dizer</option>
        </select>
      </div>

      <div class="form-group">
        <label for="education">Escolaridade:</label>
        <select id="education" v-model="formData.education" required>
          <option value="" disabled>Selecione...</option>
          <option value="fundamental-incompleto">Fundamental Incompleto</option>
          <option value="fundamental-completo">Fundamental Completo</option>
          <option value="medio-incompleto">Médio Incompleto</option>
          <option value="medio-completo">Médio Completo</option>
          <option value="superior-incompleto">Superior Incompleto</option>
          <option value="superior-completo">Superior Completo</option>
          <option value="pos-graduacao">Pós-graduação</option>
        </select>
      </div>

      <button type="submit" class="btn">Iniciar Teste</button>
    </form>
  </div>
</template>

<style scoped>

.fade-in {
  animation: fadeIn 0.5s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.form-section {
  max-width: 800px;
  margin: 0 auto;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #333;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 12px;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 16px;
}

.btn {
  width: 100%;
  margin-top: 10px;
}
</style>