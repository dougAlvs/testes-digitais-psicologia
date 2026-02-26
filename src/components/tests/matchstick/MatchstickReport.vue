<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import MatchstickCanvas from './MatchstickCanvas.vue'

const props = defineProps<{
    results: any[]
}>()

const emit = defineEmits<{
    (e: 'updateResults', results: any[]): void
}>()

const localResults = ref<any[]>(JSON.parse(JSON.stringify(props.results)).map((res: any) => {
    res.evalResult.config = ''
    res.evalResult.position = ''
    res.evalResult.detail = ''
    res.evalResult.total = ''
    return res
}))

const totalConfig = computed(() => localResults.value.reduce((acc: number, r: any) => acc + (Number(r.evalResult.config) || 0), 0))
const totalPos = computed(() => localResults.value.reduce((acc: number, r: any) => acc + (Number(r.evalResult.position) || 0), 0))
const totalDetail = computed(() => localResults.value.reduce((acc: number, r: any) => acc + (Number(r.evalResult.detail) || 0), 0))

const isEmpty = (val: any) => val === '' || val === null || val === undefined

function updateTotal(res: any) {
    if (isEmpty(res.evalResult.config) && isEmpty(res.evalResult.position) && isEmpty(res.evalResult.detail)) {
        res.evalResult.total = ''
    } else {
        res.evalResult.total = (Number(res.evalResult.config) || 0) + (Number(res.evalResult.position) || 0) + (Number(res.evalResult.detail) || 0)
    }
}

watch(localResults, (newVal) => {
    emit('updateResults', newVal)
}, { deep: true, immediate: true })

const totalGeral = computed(() => localResults.value.reduce((acc: number, r: any) => acc + (Number(r.evalResult.total) || 0), 0))


function getPhaseDescriptions(phaseId: string) {
    switch (phaseId) {
        case 'quadrado':
            return {
                config: "Figura de quatro lados está presente",
                pos: "Figura repousa sobre um dos lados",
                detail: "Cabeças estão orientadas corretamente"
            }
        case 'triangulo':
            return {
                config: "Figura de três lados está presente",
                pos: "A base do triângulo é a mais próxima ao participante",
                detail: "Cabeças estão orientadas corretamente"
            }
        case 'v':
            return {
                config: "Palitos formam um ângulo em forma de \"V\"",
                pos: "Ponto do Ápice estão para fora do participante",
                detail: "Cabeças estão orientadas corretamente"
            }
        case 'arvore':
            return {
                config: "Palitos do meio são alinhados da cabeça para os pés",
                pos: "Os palitos laterais fazem um ângulo para fora, partindo da cabeça do fósforo inferior",
                detail: "Cabeças estão orientadas corretamente"
            }
        default:
            return { config: "", pos: "", detail: "" }
    }
}
</script>

<template>
    <div class="report-wrapper">
        <h1 class="report-title">FOLHA DE REGISTRO</h1>

        <table class="registro-table">
            <thead>
                <tr>
                    <th style="width: 25%">Figura</th>
                    <th style="width: 20%">Configuração</th>
                    <th style="width: 20%">Posicionamento</th>
                    <th style="width: 20%">Detalhe</th>
                    <th style="width: 15%">Total do Problema</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="(res, index) in localResults" :key="index">
                    <td class="canvas-cell">
                        <div class="mini-canvas">
                            <MatchstickCanvas :sticks="res.finalSticks" :interactive="false" :miniature="true" />
                        </div>
                        <p class="tempo-info">Tempo: {{ (res.timeMs / 1000).toFixed(1) }}s</p>
                    </td>
                    <td class="desc-cell">
                        <div class="cell-content">
                            <p>{{ getPhaseDescriptions(res.phase).config }}</p>
                            <div class="score-input-wrapper">
                                <input type="number" v-model.number="res.evalResult.config" @input="updateTotal(res)"
                                    min="0" max="3" class="score-input" /> pt(s)
                            </div>
                        </div>
                    </td>
                    <td class="desc-cell">
                        <div class="cell-content">
                            <p>{{ getPhaseDescriptions(res.phase).pos }}</p>
                            <div class="score-input-wrapper">
                                <input type="number" v-model.number="res.evalResult.position" @input="updateTotal(res)"
                                    min="0" max="3" class="score-input" /> pt(s)
                            </div>
                        </div>
                    </td>
                    <td class="desc-cell">
                        <div class="cell-content">
                            <p>{{ getPhaseDescriptions(res.phase).detail }}</p>
                            <div class="score-input-wrapper">
                                <input type="number" v-model.number="res.evalResult.detail" @input="updateTotal(res)"
                                    min="0" max="3" class="score-input" /> pt(s)
                            </div>
                        </div>
                    </td>
                    <td class="score-cell">
                        <div class="cell-content justify-end">
                            <div class="score-line mt-auto"><strong>{{ res.evalResult.total }} pt(s)</strong></div>
                        </div>
                    </td>
                </tr>

                <!-- Linha de Totais -->
                <tr class="total-row">
                    <td><strong>Total por etapa</strong></td>
                    <td>
                        <p>Configuração</p>
                        <div class="score-line">{{ totalConfig }}pt(s)</div>
                    </td>
                    <td>
                        <p>Posicionamento</p>
                        <div class="score-line">{{ totalPos }}pt(s)</div>
                    </td>
                    <td>
                        <p>Detalhe</p>
                        <div class="score-line">{{ totalDetail }}pt(s)</div>
                    </td>
                    <td>
                        <strong>Total Geral</strong>
                        <div class="score-line"><strong>{{ totalGeral }} pt(s)</strong></div>
                    </td>
                </tr>
            </tbody>
        </table>

        <!-- Mobile View (Cards) -->
        <div class="mobile-cards">
            <div v-for="(res, index) in localResults" :key="'card-' + index" class="report-card">
                <div class="card-header">
                    <h3>Figura {{ index + 1 }}</h3>
                    <div class="card-total">{{ res.evalResult.total }} pts</div>
                </div>

                <div class="card-body">
                    <div class="card-canvas">
                        <div class="mini-canvas">
                            <MatchstickCanvas :sticks="res.finalSticks" :interactive="false" :miniature="true" />
                        </div>
                        <p class="tempo-info">Tempo: {{ (res.timeMs / 1000).toFixed(1) }}s</p>
                    </div>

                    <div class="card-details">
                        <div class="detail-item">
                            <strong>Configuração:</strong>
                            <p>{{ getPhaseDescriptions(res.phase).config }}</p>
                            <div class="interactive-score">
                                <input type="number" v-model.number="res.evalResult.config" @input="updateTotal(res)"
                                    min="0" max="3" class="score-input" /> pt(s)
                            </div>
                        </div>
                        <div class="detail-item">
                            <strong>Posicionamento:</strong>
                            <p>{{ getPhaseDescriptions(res.phase).pos }}</p>
                            <div class="interactive-score">
                                <input type="number" v-model.number="res.evalResult.position" @input="updateTotal(res)"
                                    min="0" max="3" class="score-input" /> pt(s)
                            </div>
                        </div>
                        <div class="detail-item">
                            <strong>Detalhe:</strong>
                            <p>{{ getPhaseDescriptions(res.phase).detail }}</p>
                            <div class="interactive-score">
                                <input type="number" v-model.number="res.evalResult.detail" @input="updateTotal(res)"
                                    min="0" max="3" class="score-input" /> pt(s)
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Total Card -->
            <div class="report-card total-card">
                <div class="card-header">
                    <h3>Total Geral</h3>
                    <div class="card-total">{{ totalGeral }} pts</div>
                </div>
                <div class="card-body total-body">
                    <div class="detail-item">
                        <strong>Configuração:</strong>
                        <span>{{ totalConfig }} pt(s)</span>
                    </div>
                    <div class="detail-item">
                        <strong>Posicionamento:</strong>
                        <span>{{ totalPos }} pt(s)</span>
                    </div>
                    <div class="detail-item">
                        <strong>Detalhe:</strong>
                        <span>{{ totalDetail }} pt(s)</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.report-wrapper {
    background: white;
    padding: 40px;
    color: #000;
    width: 100%;
    max-width: 1050px;
    margin: 0 auto;
}

.report-title {
    text-align: center;
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 30px;
    text-transform: uppercase;
}

.registro-table {
    width: 100%;
    border-collapse: collapse;
    font-family: serif;
}

.registro-table th,
.registro-table td {
    border: 1px solid #000;
    padding: 10px;
    vertical-align: top;
}

.registro-table th {
    text-align: left;
    font-weight: normal;
}

.canvas-cell {
    text-align: center;
    vertical-align: middle !important;
}

.mini-canvas {
    width: 150px;
    height: 150px;
    margin: 0 auto;
    border: 1px solid #eee;
}

.tempo-info {
    margin-top: 5px;
    font-size: 14px;
}

.cell-content {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 100%;
    min-height: 140px;
}

.cell-content p {
    margin: 0 0 15px 0;
    font-size: 14px;
}

.score-line {
    text-align: center;
    margin-top: auto;
}

.score-cell {
    vertical-align: bottom !important;
    text-align: center;
}

.total-row td {
    text-align: center;
    vertical-align: middle;
}

.total-row td p {
    margin: 0 0 10px 0;
}

.mobile-cards {
    display: none;
    flex-direction: column;
    gap: 20px;
}

.report-card {
    border: 1px solid #ccc;
    border-radius: 8px;
    overflow: hidden;
    background: #fff;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.card-header {
    background: #f0f4f8;
    padding: 12px 15px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #ccc;
}

.card-header h3 {
    margin: 0;
    font-size: 1.1rem;
    color: #3949ab;
}

.card-total {
    font-weight: bold;
    font-size: 1.1rem;
    background: #e8eaf6;
    padding: 4px 8px;
    border-radius: 4px;
    color: #1a237e;
}

.card-body {
    display: flex;
    flex-direction: column;
    padding: 15px;
    gap: 15px;
}

.card-canvas {
    text-align: center;
}

.card-details {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.detail-item {
    background: #fdfdfd;
    padding: 10px;
    border-radius: 6px;
    border: 1px solid #eee;
}

.detail-item strong {
    display: block;
    color: #555;
    margin-bottom: 5px;
    font-size: 0.9rem;
}

.detail-item p {
    margin: 0 0 8px 0;
    font-size: 0.95rem;
    color: #333;
}

.score-input {
    width: 60px;
    padding: 6px;
    border: 1px solid #3949ab;
    border-radius: 4px;
    font-size: 1rem;
    text-align: center;
    font-weight: bold;
    color: #1a237e;
    display: inline-block;
}

.score-input-wrapper,
.interactive-score {
    margin-top: auto;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-weight: bold;
    color: #555;
    background: #e8eaf6;
    padding: 6px 12px;
    border-radius: 6px;
    width: fit-content;
    margin: 10px auto 0 auto;
}

.interactive-score {
    margin: 5px 0 0 0;
    width: auto;
    justify-content: flex-start;
}

.total-card .total-body {
    gap: 10px;
}

.total-card .detail-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 0;
    padding: 12px;
}

.total-card .detail-item strong {
    margin: 0;
    font-size: 1rem;
}

.total-card .detail-item span {
    font-size: 1rem;
}

@media (max-width: 768px) {
    .report-wrapper {
        padding: 15px;
    }

    .registro-table {
        display: none;
    }

    .mobile-cards {
        display: flex;
    }
}

@media print {
    .report-wrapper {
        padding: 0;
        max-width: none;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
    }

    .registro-table {
        display: table;
        page-break-inside: avoid;
    }

    .mobile-cards {
        display: none !important;
    }

    .score-input {
        border: none !important;
        background: transparent !important;
        appearance: none;
        -webkit-appearance: none;
        padding: 0;
        margin: 0;
        width: 30px;
    }

    .score-input-wrapper {
        background: transparent !important;
        padding: 0 !important;
    }
}
</style>
