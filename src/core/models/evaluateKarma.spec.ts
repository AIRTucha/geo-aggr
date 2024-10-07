import e from 'express'
import { EvaluatedSample } from './aggregateQuad'
import { sourceKarma, SourceScore } from './evaluateKarma'

function testSample(risk: number) {
    return {
        lat: 1,
        lng: 1,
        risk: risk,
        date: 1,
        id: '1',
        sourceId: '1',
        isReliable: true
    }
}

function testAggregation(evaluation: number, ...samples: EvaluatedSample[]) {
    return {
        lat: 1,
        lng: 1,
        risk: evaluation,
        samples: samples
    }
}

function checkKarmaDelta(sourceScores: SourceScore[], ...karmaDelta: number[]) {
    expect(sourceScores.map(sourceScore => sourceScore.karmaDelta)).toEqual(karmaDelta)
}

describe('sourceKarma', () => {

    describe('single sample', () => {
        it('evaluation 5, score 1', () => {
            checkKarmaDelta(
                sourceKarma(
                    testAggregation(5, testSample(1))
                ),
                -3
            )
        })

        it('evaluation 5, score 2', () => {
            checkKarmaDelta(
                sourceKarma(
                    testAggregation(5, testSample(2))
                ),
                -2
            )
        })

        it('evaluation 5, score 3', () => {
            checkKarmaDelta(
                sourceKarma(
                    testAggregation(5, testSample(3))
                ),
                -1
            )
        })

        it('evaluation 5, score 4', () => {
            checkKarmaDelta(
                sourceKarma(
                    testAggregation(5, testSample(4))
                ),
                1
            )
        })

        it('evaluation 5, score 5', () => {
            checkKarmaDelta(
                sourceKarma(
                    testAggregation(5, testSample(5))
                ),
                3
            )
        })

        it('evaluation 1, score 5', () => {
            checkKarmaDelta(
                sourceKarma(
                    testAggregation(1, testSample(5))
                ),
                -3
            )
        })

        it('evaluation 2, score 5', () => {
            checkKarmaDelta(
                sourceKarma(
                    testAggregation(2, testSample(5))
                )
                , -2
            )
        })

        it('evaluation 4, score 5', () => {
            checkKarmaDelta(
                sourceKarma(
                    testAggregation(4, testSample(5))
                ),
                1
            )
        })

        it('evaluation 1, score 1', () => {
            checkKarmaDelta(
                sourceKarma(
                    testAggregation(1, testSample(1))
                ),
                3
            )
        })

        it('evaluation 3, score 3', () => {
            checkKarmaDelta(
                sourceKarma(
                    testAggregation(3, testSample(3))
                ),
                3
            )
        })

        it('evaluation 3, score 5', () => {
            checkKarmaDelta(
                sourceKarma(
                    testAggregation(3, testSample(5))
                ),
                -1
            )
        })

        it('evaluation 2, score 4', () => {
            checkKarmaDelta(
                sourceKarma(
                    testAggregation(2, testSample(4))
                ),
                -1
            )
        })

        it('evaluation 4, score 2', () => {
            checkKarmaDelta(
                sourceKarma(
                    testAggregation(4, testSample(2))
                ),
                -1
            )
        })
    })


    describe('multiple', () => {
        it('evaluation 1', () => {
            checkKarmaDelta(
                sourceKarma(
                    testAggregation(
                        1,
                        testSample(1),
                        testSample(2),
                        testSample(3),
                        testSample(4),
                        testSample(5),
                    )
                ),
                3,
                1,
                -1,
                -2,
                -3,
            )
        })
        it('evaluation 3', () => {
            checkKarmaDelta(
                sourceKarma(
                    testAggregation(
                        3,
                        testSample(1),
                        testSample(2),
                        testSample(3),
                        testSample(4),
                        testSample(5),
                    )
                ),
                - 1,
                1,
                3,
                1,
                -1,
            )
        })
        it('evaluation 5', () => {
            checkKarmaDelta(
                sourceKarma(
                    testAggregation(
                        5,
                        testSample(1),
                        testSample(2),
                        testSample(3),
                        testSample(4),
                        testSample(5),
                    )
                ),
                -3,
                -2,
                -1,
                1,
                3 ,
            )
        })
    })
})
