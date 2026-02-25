<script setup lang="ts">
import { useRouter } from 'vue-router'
import stroopIcon from '@/assets/svg/stroop_icon.svg'
import matchstickIcon from '@/assets/svg/matchstick_icon.svg'

const router = useRouter()

function goToStroop() {
  router.push('/stroop')
}

function goToMatchsticks() {
  router.push('/matchsticks')
}
</script>

<template>
  <div class="home-wrapper">
    <div class="header">
      <h1>Testes Psicológicos Digitais</h1>
      <p>Selecione o teste que deseja realizar.</p>
    </div>

    <div class="cards-container">
      <div class="test-card" @click="goToStroop">
        <div class="card-icon">
          <stroopIcon class="svg-icon" alt="Ícone de Camisa" />
        </div>
        <h2>Teste de Stroop</h2>
        <p>Avaliação da atenção seletiva, controle inibitório e flexibilidade cognitiva.</p>
        <button class="btn">Iniciar Teste</button>
      </div>

      <div class="test-card" @click="goToMatchsticks">
        <div class="card-icon">
          <matchstickIcon class="svg-icon" alt="Ícone de Palito" />
        </div>
        <h2>Teste do Palito</h2>
        <p>Avaliação de habilidades construtivas e visuomotoras.</p>
        <button class="btn">Iniciar Teste</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home-wrapper {
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.header {
  text-align: center;
  margin-bottom: 50px;
}

.header h1 {
  color: #1a237e;
  font-size: 2.5rem;
  margin-bottom: 15px;
}

.header p {
  color: #555;
  font-size: 1.2rem;
}

.cards-container {
  display: flex;
  gap: 30px;
  max-width: 900px;
  width: 100%;
  flex-wrap: wrap;
  justify-content: center;
}

.test-card {
  background: white;
  border-radius: 15px;
  padding: 30px;
  flex: 1;
  min-width: 300px;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  border: 2px solid transparent;
}

.test-card:hover {
  transform: translateY(-10px);
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.1);
  border-color: #3949ab;
}

.card-icon {
  margin-bottom: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 80px;
}

.svg-icon {
  width: 80px;
  height: 80px;
  object-fit: contain;
}

.test-card h2 {
  color: #3949ab;
  margin-bottom: 15px;
}

.test-card p {
  color: #666;
  margin-bottom: 25px;
  flex-grow: 1;
}

.btn {
  width: 100%;
  background: #3949ab;
  color: white;
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.2s ease;
}

.test-card:hover .btn {
  background: #1a237e;
}

@media (max-width: 768px) {
  .header h1 {
    font-size: 2rem;
  }
}
</style>
