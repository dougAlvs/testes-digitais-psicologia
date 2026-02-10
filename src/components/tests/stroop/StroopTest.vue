<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { ITEMS, COLORS, COLOR_HEX } from "@/utils/stroopAssets";
import type { TrialResponse, PhaseConfig } from "@/types";

import wardrobeBg from "@/assets/svg/wardrobe.svg?url";
import ShirtIcon from "@/assets/svg/shirt.svg?component";
import SocksIcon from "@/assets/svg/socks.svg?component";
import PantsIcon from "@/assets/svg/pants.svg?component";
import ShoesIcon from "@/assets/svg/shoes.svg?component";

const emit = defineEmits<{
  (e: "finish", data: TrialResponse[]): void;
}>();

const iconMap: Record<string, any> = {
  blusa: ShirtIcon,
  meias: SocksIcon,
  calca: PantsIcon,
  tenis: ShoesIcon,
};

const PHASES: PhaseConfig[] = [
  {
    name: "Cartão A",
    instruction: "Arraste cada peça de roupa para o compartimento correto do guarda-roupa.",
    trials: 24,
    showColor: false,
    shuffleSlots: false,
    randomizeColors: false,
  },
  {
    name: "Cartão B",
    instruction:
      "Agora os compartimentos têm cores. Continue arrastando as peças para o compartimento correto baseado no NOME da peça, não na cor!",
    trials: 24,
    showColor: true,
    shuffleSlots: false,
    randomizeColors: false,
  },
  {
    name: "Cartão C",
    instruction:
      "As cores dos compartimentos mudam a cada rodada. Continue focando no NOME da peça, não na cor!",
    trials: 24,
    showColor: true,
    shuffleSlots: true,
    randomizeColors: true,
  },
];

const currentPhaseIndex = ref(0);
const currentTrial = ref(0);
const showModal = ref(true);
const responses = ref<TrialResponse[]>([]);
const feedback = ref<"correct" | "incorrect" | null>(null);

const slotAssignment = ref<Record<string, string>>({
  blusa: "slot-1",
  calca: "slot-2",
  meias: "slot-3",
  tenis: "slot-4",
});

const currentStimulus = ref<{ item: string; color: string } | null>(null);
const compartmentColors = ref<Record<string, string>>({});
let trialStartTime = 0;

const currentConfig = computed(() => PHASES[currentPhaseIndex.value]);

const totalTrials = computed(() => currentConfig.value.trials);

const activeColor = computed(() => {
  if (!currentStimulus.value) return "transparent";
  if (!currentConfig.value.showColor) return "#c0c0c0";

  return COLOR_HEX[currentStimulus.value.color as keyof typeof COLOR_HEX];
});

function getCompartmentColor(item: string): string {
  if (!currentConfig.value.showColor) {
    return "rgba(255, 255, 255, 0.5)";
  }

  const colorName = compartmentColors.value[item];

  if (colorName) {
    const hex = COLOR_HEX[colorName as keyof typeof COLOR_HEX];
    if (hex) {
      return hex + "60";
    }
  }

  return "rgba(255, 255, 255, 0.5)";
}

function shuffleArray<T>(array: T[]) {
  return [...array].sort(() => Math.random() - 0.5);
}
function getRandomElement<T>(array: T[]) {
  return array[Math.floor(Math.random() * array.length)];
}

function shuffleSlots() {
  const slots = ["slot-1", "slot-2", "slot-3", "slot-4"];
  const shuffled = shuffleArray(slots);
  const newAssignment: Record<string, string> = {};
  ITEMS.forEach((item, i) => {
    newAssignment[item] = shuffled[i];
  });
  slotAssignment.value = newAssignment;
}

function assignCompartmentColors() {
  const shuffled = shuffleArray(COLORS).slice(0, 4);
  compartmentColors.value = {
    blusa: shuffled[0],
    meias: shuffled[1],
    calca: shuffled[2],
    tenis: shuffled[3],
  };
}

function setupEnvironment(isNewPhase: boolean) {
  const cfg = currentConfig.value;

  if (isNewPhase || cfg.randomizeColors || Object.keys(compartmentColors.value).length === 0) {
    assignCompartmentColors();
  }

  if (isNewPhase && cfg.shuffleSlots) {
    shuffleSlots();
  }
}

function preparePhase(index: number) {
  currentPhaseIndex.value = index;
  currentTrial.value = -1;

  setupEnvironment(true);

  showModal.value = true;
}

function startPhaseLogic() {
  showModal.value = false;
  nextTrial();
}

function nextTrial() {
  feedback.value = null;
  currentTrial.value++;

  if (currentTrial.value >= totalTrials.value) {
    if (currentPhaseIndex.value < PHASES.length - 1) {
      preparePhase(currentPhaseIndex.value + 1);
    } else {
      emit("finish", responses.value);
    }
    return;
  }

  currentStimulus.value = {
    item: getRandomElement([...ITEMS]),
    color: getRandomElement([...COLORS]),
  };

  setupEnvironment(false);

  trialStartTime = Date.now();
}

function handleDragStart(e: DragEvent, item: string) {
  if (e.dataTransfer && e.target instanceof HTMLElement) {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", item);
    e.target.classList.add("opacity-50");
  }
}

function handleDragEnd(e: DragEvent) {
  if (e.target instanceof HTMLElement) {
    e.target.classList.remove("opacity-50");
  }
}

function processAnswer(compartmentItem: string) {
  if (!currentStimulus.value) return;
  const isCorrect = compartmentItem === currentStimulus.value.item;

  responses.value.push({
    phaseName: currentConfig.value.name,
    phaseIndex: currentPhaseIndex.value,
    trial: currentTrial.value + 1,
    itemPresented: currentStimulus.value.item,
    colorPresented: !currentConfig.value.showColor ? "nenhuma" : currentStimulus.value.color,
    compartmentChosen: compartmentItem,
    correct: isCorrect,
    responseTime: Date.now() - trialStartTime,
    timestamp: new Date().toISOString(),
  });

  feedback.value = isCorrect ? "correct" : "incorrect";
  setTimeout(nextTrial, 800);
}

function handleDrop(e: DragEvent, compartmentItem: string) {
  processAnswer(compartmentItem);
}

let startX = 0;
let startY = 0;
let initialTransform = "";
function onTouchStart(e: TouchEvent) {
  if (e.cancelable) e.preventDefault();

  const touch = e.touches[0];
  startX = touch.clientX;
  startY = touch.clientY;

  if (e.target instanceof HTMLElement) {
    const el = e.target.closest(".clothing-item") as HTMLElement;
    if (el) {
      initialTransform = el.style.transform;

      el.classList.add("dragging-active");
    }
  }
}

function onTouchMove(e: TouchEvent) {
  if (e.cancelable) e.preventDefault();

  const touch = e.touches[0];
  const deltaX = touch.clientX - startX;
  const deltaY = touch.clientY - startY;

  if (e.target instanceof HTMLElement) {
    const el = e.target.closest(".clothing-item") as HTMLElement;
    if (el) {
      el.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(1.1)`;
    }
  }

  document
    .querySelectorAll(".compartment")
    .forEach((el) => el.classList.remove("drag-over-mobile"));

  const compartments = document.querySelectorAll(".compartment");
  compartments.forEach((comp) => {
    const rect = comp.getBoundingClientRect();
    if (
      touch.clientX >= rect.left &&
      touch.clientX <= rect.right &&
      touch.clientY >= rect.top &&
      touch.clientY <= rect.bottom
    ) {
      comp.classList.add("drag-over-mobile");
    }
  });
}

function onTouchEnd(e: TouchEvent) {
  const activeCompartment = document.querySelector(".compartment.drag-over-mobile");

  document
    .querySelectorAll(".compartment")
    .forEach((el) => el.classList.remove("drag-over-mobile"));

  if (e.target instanceof HTMLElement) {
    const el = e.target.closest(".clothing-item") as HTMLElement;
    if (el) {
      el.classList.remove("dragging-active");
      el.style.transform = "";
    }
  }

  if (activeCompartment) {
    const itemKey = activeCompartment.getAttribute("data-item");
    if (itemKey) {
      processAnswer(itemKey);
    }
  }
}

onMounted(() => preparePhase(0));
</script>

<template>
  <div class="stroop-game card-base">
    <div v-if="showModal" class="instruction-modal-overlay">
      <div class="instruction-card">
        <h2>{{ currentConfig.name }}</h2>
        <p class="instruction-text">{{ currentConfig.instruction }}</p>
        <button class="btn btn-start" @click="startPhaseLogic">
          COMEÇAR {{ currentConfig.name.toUpperCase() }}
        </button>
      </div>
    </div>

    <div class="header">
      <div class="phase-title">{{ currentConfig?.name.toUpperCase() }}</div>
      <div class="trial-info">Tentativa {{ currentTrial + 1 }} / {{ totalTrials }}</div>
      <div class="instructions">{{ currentConfig.instruction }}</div>
    </div>

    <div class="wardrobe-container" :style="{ backgroundImage: `url(${wardrobeBg})` }">
      <div
        v-for="item in ITEMS"
        :key="item"
        :data-item="item"
        :class="['compartment', slotAssignment[item]]"
        @dragover.prevent
        @dragenter="$event.target.classList.add('drag-over')"
        @dragleave="$event.target.classList.remove('drag-over')"
        @drop="
          handleDrop($event, item);
          $event.target.classList.remove('drag-over');
        "
        :style="{
          backgroundColor: getCompartmentColor(item),
        }"
      >
        <span class="label">{{ item.toUpperCase() }}</span>
      </div>

      <div v-if="feedback" class="feedback-overlay">
        <span v-if="feedback === 'correct'" style="color: green; font-size: 5rem">✓</span>
        <span v-else style="color: red; font-size: 5rem">✗</span>
      </div>
    </div>

    <div class="stimulus-area">
      <div
        v-if="currentStimulus && !feedback && !showModal"
        class="clothing-item"
        draggable="true"
        @dragstart="handleDragStart($event, currentStimulus.item)"
        @dragend="handleDragEnd"
        @touchstart="onTouchStart"
        @touchmove="onTouchMove"
        @touchend="onTouchEnd"
        :style="{ color: activeColor }"
      >
        <component :is="iconMap[currentStimulus.item]" class="svg-icon" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.stroop-game {
  width: 100%;
  max-width: 1200px;
  min-height: 600px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.app-wrapper {
  width: 100%;
  display: flex;
  justify-content: center;
}

.header {
  text-align: center;
  margin-bottom: 20px;
  width: 100%;
  min-height: 80px;
}

.phase-title {
  color: #3949ab;
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 10px;
}

.trial-info {
  color: #3949ab;
  font-size: 16px;
  margin-bottom: 15px;
}

.instructions {
  background: #e8eaf6;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 30px;
  text-align: center;
  font-size: 18px;
  color: #1a237e;
  border-left: 5px solid #3949ab;
  font-weight: 500;
}

.wardrobe-container {
  position: relative;
  aspect-ratio: 1;
  width: 100%;
  max-width: 480px;
  background-color: #f0f0f0;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  border-radius: 10px;
  margin-bottom: 30px;
  border: 1px solid #ddd;
  flex-shrink: 0;
}

.instruction-modal-overlay {
  position: absolute;
  inset: 0;

  background: rgba(255, 255, 255, 0.9);

  backdrop-filter: blur(5px);

  z-index: 100;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 12px;
}

.instruction-card {
  background: white;
  padding: 40px;
  border-radius: 15px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  text-align: center;
  max-width: 500px;
  border: 1px solid #eee;
  animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes popIn {
  from {
    transform: scale(0.8);
    opacity: 0;
  }

  to {
    transform: scale(1);
    opacity: 1;
  }
}

.instruction-text {
  font-size: 1.2rem;
  color: #555;
  margin: 20px 0;
  line-height: 1.6;
}

.btn-start {
  background: #1a237e;

  font-size: 1.1rem;
  padding: 15px 40px;
  margin-top: 20px;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(26, 35, 126, 0.4);
  }

  70% {
    box-shadow: 0 0 0 10px rgba(26, 35, 126, 0);
  }

  100% {
    box-shadow: 0 0 0 0 rgba(26, 35, 126, 0);
  }
}

.compartment {
  position: absolute;
  border: 3px dashed #333;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.1s;
}

.compartment.drag-over,
.compartment.drag-over-mobile {
  border-color: #333;
  border-width: 4px;
  transform: scale(1.05);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

.label {
  font-size: 1.2rem;
  font-weight: bold;
  color: #333;
  text-transform: uppercase;
  padding: 2px 5px;
  border-radius: 4px;
  pointer-events: none;
}

.slot-1 {
  left: 2%;
  top: 25%;
  width: 22%;
  height: 45%;
}

.slot-2 {
  left: 26%;
  top: 25%;
  width: 28%;
  height: 45%;
}

.slot-3 {
  left: 2%;
  top: 72%;
  width: 52%;
  height: 14%;
}

.slot-4 {
  left: 56%;
  top: 25%;
  width: 42%;
  height: 73%;
}

.feedback-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.7);
  z-index: 10;
  border-radius: 10px;
}

.stimulus-area {
  min-height: 160px;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
}

.clothing-item {
  width: 150px;
  height: 150px;
  cursor: grab;
  filter: drop-shadow(0 5px 15px rgba(0, 0, 0, 0.2));
  transition:
    color 0.2s ease,
    transform 0.2s;
  touch-action: none;

  user-select: none;
}

.clothing-item:active {
  cursor: grabbing;
  transform: scale(1.1);
}

.clothing-item.dragging-active {
  opacity: 0.5;

  transform: scale(1.1);

  z-index: 9999;
  cursor: grabbing;

  transition: none !important;

  filter: drop-shadow(0 15px 30px rgba(0, 0, 0, 0.4));
}

.svg-icon {
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.opacity-50 {
  opacity: 0.5;
}

@media (max-width: 768px) {
  .stroop-game {
    min-height: auto;
    padding-bottom: 20px;
  }

  .header {
    margin-bottom: 10px;
    min-height: auto;
  }

  .phase-title {
    font-size: 18px;
  }

  .instructions {
    font-size: 14px;
    padding: 10px;
    margin-bottom: 15px;
    min-height: 60px;
  }

  .wardrobe-container {
    max-width: 100%;
    margin-bottom: 20px;

    max-height: 60vh;
  }

  .label {
    font-size: 0.8rem;
    padding: 1px 3px;
  }

  .clothing-item {
    width: 90px;
    height: 90px;
  }

  .clothing-item.dragging-active {
    transform: scale(1.05);
  }

  .stimulus-area {
    min-height: 110px;
  }

  .feedback-overlay span {
    font-size: 3rem !important;
  }
}

@media (max-width: 380px) {
  .clothing-item {
    width: 75px;
    height: 75px;
  }

  .label {
    font-size: 0.7rem;
    font-weight: 800;
  }
}
</style>
