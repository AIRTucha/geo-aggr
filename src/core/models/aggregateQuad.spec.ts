import { Quad } from '../../services/QTreeSampleStorage/qtree'
import { EvaluatedSample, evaluateQuads, GeoAggregation } from './aggregateQuad'

function evaluatedSample(...vals: [boolean, number][]): Quad<EvaluatedSample> {
    return {
        points: vals.map(([isReliable, risk], i) => ({
            date: 1,
            sourceId: '1',
            id: i.toString(),
            lat: 1,
            lng: 1,
            risk,
            isReliable,
        })),
        lat: 1,
        lng: 1,
    }
}

function extractRisks(results: GeoAggregation[]) {
    return results.map(result => result.risk)
}

describe('evaluateQuads', () => {
    describe('single quad', () => {

        it('all unreliable value', () => {
            expect(
                extractRisks(
                    evaluateQuads([
                        evaluatedSample([false, 1], [false, 2], [false, 2])
                    ])
                )
            ).toEqual([])
        })

        it('single reliable value', () => {
            expect(
                extractRisks(
                    evaluateQuads([
                        evaluatedSample([true, 1], [false, 2], [false, 2])
                    ])
                )
            ).toEqual([1])
        })

        it('two reliable values', () => {
            expect(
                extractRisks(
                    evaluateQuads([
                        evaluatedSample([true, 1], [false, 2], [true, 3], [false, 2])
                    ])
                )
            ).toEqual([3])
        })

        it('two reliable values, reverse', () => {
            expect(
                extractRisks(
                    evaluateQuads([
                        evaluatedSample([true, 3], [false, 2], [true, 1], [false, 2])
                    ])
                )
            ).toEqual([3])
        })

        it('three reliable values', () => {
            expect(
                extractRisks(
                    evaluateQuads([
                        evaluatedSample([true, 3], [true, 9], [true, 1])
                    ])
                )
            ).toEqual([3])
        })

        it('three reliable values, with unreliable', () => {
            expect(
                extractRisks(
                    evaluateQuads([
                        evaluatedSample([true, 9], [true, 1], [true, 3], [false, 2])
                    ])
                )
            ).toEqual([3])
        })
    })

    describe('multiple quads', () => {
        it('all quads pass', () => {
            expect(
                extractRisks(
                    evaluateQuads([
                        evaluatedSample([false, 1], [false, 2], [true, 10], [false, 2]),
                        evaluatedSample([true, 1], [true, 2], [true, 3], [true, 2])
                    ]),
                )
            ).toEqual([10, 2])
        })

        it('first quads pass', () => {
            expect(
                extractRisks(
                    evaluateQuads([
                        evaluatedSample([true, 1], [true, 2], [true, 10], [true, 2]),
                        evaluatedSample([false, 1], [false, 2], [false, 10])
                    ]),
                )
            ).toEqual([2])
        })

        it('second quads pass', () => {
            expect(
                extractRisks(
                    evaluateQuads([
                        evaluatedSample([false, 1], [false, 2], [false, 10], [false, 30]),
                        evaluatedSample([false, 1], [true, 1], [true, 4], [true, 2], [false, 50], [false, 13]),
                    ]),
                )
            ).toEqual([2])
        })
    })
})
