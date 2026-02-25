import { describe, it, expect } from 'vitest'
import { calculateResults } from './exportHelpers'
import type { TrialResponse, Participant, TestResult } from '@/types'

describe('calculateResults', () => {
    it('calculates correct summary metrics', () => {
        const participant: Participant = {
            name: 'Test',
            age: '30',
            gender: 'masculino',
            education: 'superior-completo',
            startTime: new Date().toISOString()
        }

        const responses: TrialResponse[] = [
            {
                trial: 1,
                phaseIndex: 0,
                phaseName: 'Cartão A',
                itemPresented: 'Vermelho',
                colorPresented: 'Vermelho',
                compartmentChosen: 'Vermelho',
                correct: true,
                responseTime: 1000,
                timestamp: new Date().toISOString()
            },
            {
                trial: 2,
                phaseIndex: 0,
                phaseName: 'Cartão A',
                itemPresented: 'Verde',
                colorPresented: 'Verde',
                compartmentChosen: 'Azul',
                correct: false,
                responseTime: 2000,
                timestamp: new Date().toISOString()
            }
        ]

        const result = calculateResults(responses, participant)

        expect(result.summary.totalTrials).toBe(2)
        expect(result.summary.correctResponses).toBe(1)
        expect(result.summary.incorrectResponses).toBe(1)
        expect(result.summary.overallAccuracy).toBe(50)
        expect(result.summary.overallAverageResponseTime).toBe(1500)

        expect(result.phaseResults['cartao_a'].totalTrials).toBe(2)
        expect(result.phaseResults['cartao_a'].accuracy).toBe(50)
    })
})
