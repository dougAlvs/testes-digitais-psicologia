import type { MatchstickState } from '../components/tests/matchstick/MatchstickCanvas.vue'

export interface MatchstickEvaluation {
    config: number
    position: number
    detail: number
    total: number
}

export function evaluatePhase(phaseId: string, sticks: MatchstickState[]): MatchstickEvaluation {
    let evalResult = { config: 0, position: 0, detail: 0, total: 0 }
    const stickLength = 120;
    const tolerance = 40;

    if (phaseId === 'quadrado') {
        let horizontals = 0
        let verticals = 0
        sticks.forEach(s => {
            const a = Math.abs(s.angle % 180)
            if (a < 20 || a > 160) horizontals++
            else if (a > 70 && a < 110) verticals++ 
        })

        if (horizontals >= 2 && verticals >= 2) {
            evalResult.config = 1
            evalResult.position = 1
            evalResult.detail = 1
        }

    } else if (phaseId === 'triangulo') {
        evalResult.config = 1
        evalResult.position = 1
        evalResult.detail = 1
    } else if (phaseId === 'divergente') {
        evalResult.config = 1
        evalResult.position = 1
        evalResult.detail = 1
    } else if (phaseId === 'arvore') {
        evalResult.config = 1
        evalResult.position = 1
        evalResult.detail = 1
    }

    if (evalResult.config === 0 && evalResult.position === 0 && evalResult.detail === 0) {
        evalResult = { config: 1, position: 1, detail: 1, total: 3 }
    }

    evalResult.total = evalResult.config + evalResult.position + evalResult.detail
    return evalResult
}
