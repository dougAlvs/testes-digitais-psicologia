<script setup lang="ts">
import { computed } from 'vue'
import MatchstickCanvas from './MatchstickCanvas.vue'

const props = defineProps<{
    results: any[]
}>()

const totalConfig = computed(() => props.results.reduce((acc, r) => acc + r.evalResult.config, 0))
const totalPos = computed(() => props.results.reduce((acc, r) => acc + r.evalResult.position, 0))
const totalDetail = computed(() => props.results.reduce((acc, r) => acc + r.evalResult.detail, 0))
const totalGeral = computed(() => props.results.reduce((acc, r) => acc + r.evalResult.total, 0))

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
                <tr v-for="(res, index) in results" :key="index">
                    <td class="canvas-cell">
                        <div class="mini-canvas">
                            <MatchstickCanvas :sticks="res.finalSticks" :interactive="false" :miniature="true" />
                        </div>
                        <p class="tempo-info">Tempo: {{ (res.timeMs / 1000).toFixed(1) }}s</p>
                    </td>
                    <td class="desc-cell">
                        <div class="cell-content">
                            <p>{{ getPhaseDescriptions(res.phase).config }}</p>
                            <div class="score-line">____ ({{ res.evalResult.config }}pt)</div>
                        </div>
                    </td>
                    <td class="desc-cell">
                        <div class="cell-content">
                            <p>{{ getPhaseDescriptions(res.phase).pos }}</p>
                            <div class="score-line">____ ({{ res.evalResult.position }}pt)</div>
                        </div>
                    </td>
                    <td class="desc-cell">
                        <div class="cell-content">
                            <p>{{ getPhaseDescriptions(res.phase).detail }}</p>
                            <div class="score-line">____ ({{ res.evalResult.detail }}pt)</div>
                        </div>
                    </td>
                    <td class="score-cell">
                        <div class="cell-content justify-end">
                            <div class="score-line mt-auto">____ ({{ res.evalResult.total }}pts)</div>
                        </div>
                    </td>
                </tr>

                <!-- Linha de Totais -->
                <tr class="total-row">
                    <td><strong>Total por etapa</strong></td>
                    <td>
                        <p>Configuração</p>
                        <div class="score-line">____ ({{ totalConfig }}pts)</div>
                    </td>
                    <td>
                        <p>Posicionamento</p>
                        <div class="score-line">____ ({{ totalPos }}pts)</div>
                    </td>
                    <td>
                        <p>Detalhe</p>
                        <div class="score-line">____ ({{ totalDetail }}pts)</div>
                    </td>
                    <td>
                        <strong>Total Geral</strong>
                        <div class="score-line">____ ({{ totalGeral }}pts)</div>
                    </td>
                </tr>
            </tbody>
        </table>
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

@media print {
    .report-wrapper {
        padding: 0;
        max-width: none;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
    }

    .registro-table {
        page-break-inside: avoid;
    }
}
</style>
