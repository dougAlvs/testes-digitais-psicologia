import { describe, it, expect } from 'vitest'
import { evaluatePhase } from './matchstickLogic'

describe('matchstickLogic', () => {
    it('evaluates configuration correctly for a square', () => {
        const sticks = [
            { id: '1', x: 0, y: 0, angle: 90 },
            { id: '2', x: 0, y: 0, angle: 90 },
            { id: '3', x: 0, y: 0, angle: 0 },
            { id: '4', x: 0, y: 0, angle: 0 },
        ]

        const result = evaluatePhase('quadrado', sticks)

        expect(result.config).toBe(1)
        expect(result.position).toBe(1)
        expect(result.detail).toBe(1)
        expect(result.total).toBe(3)
    })

    it('provides a default fallback for other shapes currently', () => {
        const sticks = [
            { id: '1', x: 0, y: 0, angle: 45 },
        ]

        const result = evaluatePhase('triangulo', sticks)
        expect(result.total).toBe(3)
    })
})
