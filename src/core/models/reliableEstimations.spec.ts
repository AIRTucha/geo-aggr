import { SampleWithKarma } from '.'
import { flatten, Quad } from '../../services/QTreeSampleStorage/qtree'
import { EvaluatedSample } from './aggregateQuad'
import { estimateReliability, removeUnreliableQuads } from './reliableEstimations'

function sampleWithKarma(...karmas: number[]): Quad<SampleWithKarma> {
    return {
        points: karmas.map((karma, i) => ({
            risk: 1,
            date: 1,
            sourceId: '1',
            id: i.toString(),
            karma,
            lat: 1,
            lng: 1,
        })),
        lat: 1,
        lng: 1,
    }
}

function evaluatedSample(...isReliables: boolean[]): Quad<EvaluatedSample> {
    return {
        points: isReliables.map((isReliable, i) => ({
            risk: 1,
            date: 1,
            sourceId: '1',
            id: i.toString(),
            lat: 1,
            lng: 1,
            isReliable,
        })),
        lat: 1,
        lng: 1,
    }
}

function checkEstimations(estimations: Quad<EvaluatedSample>[], ...isReliables: boolean[]) {
    expect(flatten(estimations).map(point => point.isReliable)).toEqual(isReliables)
}

describe('estimateReliability', () => {
    describe('single points', () => {
        it('karma minus sigma', () => {
            checkEstimations(
                estimateReliability(
                    2,
                    0,
                    [sampleWithKarma(-6)]
                ),
                false
            )
        })

        it('karma in sigma', () => {
            checkEstimations(
                estimateReliability(
                    2,
                    0,
                    [sampleWithKarma(-1)]
                ),
                true
            )
        })


        it('karma plus sigma', () => {
            checkEstimations(
                estimateReliability(
                    2,
                    0,
                    [sampleWithKarma(3)]
                ),
                true
            )
        })
    })

    describe('multiple points', () => {
        it('all reliable', () => {
            checkEstimations(
                estimateReliability(
                    5,
                    0,
                    [sampleWithKarma(-4), sampleWithKarma(0), sampleWithKarma(4)]
                ),
                true,
                true,
                true
            )
        })

        it('all unreliable', () => {
            checkEstimations(
                estimateReliability(
                    5,
                    0,
                    [sampleWithKarma(-20), sampleWithKarma(-15)]
                ),
                false,
                false,
            )
        })

        it('mix unreliable', () => {
            checkEstimations(
                estimateReliability(
                    5,
                    0,
                    [sampleWithKarma(-15), sampleWithKarma(-2), sampleWithKarma(2), sampleWithKarma(8)]
                ),
                false,
                true,
                true,
                true,
            )
        })
    })
})

describe('removeUnreliableQuads', () => {
    it('empty', () => {
        expect(removeUnreliableQuads([]).length).toEqual(0)
    })


    describe('single quad', () => {
        it('one unreliable point', () => {
            expect(
                removeUnreliableQuads([
                    evaluatedSample(false)
                ]).length
            ).toEqual(0)
        })

        it('one reliable point', () => {
            expect(
                removeUnreliableQuads([
                    evaluatedSample(true)
                ]).length
            ).toEqual(0)
        })

        it('two unreliable point', () => {
            expect(
                removeUnreliableQuads([
                    evaluatedSample(false, false)
                ]).length
            ).toEqual(0)
        })

        it('two reliable point', () => {
            expect(
                removeUnreliableQuads([
                    evaluatedSample(true, true)
                ]).length
            ).toEqual(0)
        })

        it('reliable unreliable', () => {
            expect(
                removeUnreliableQuads([
                    evaluatedSample(true, false)
                ]).length
            ).toEqual(0)
        })

        it('tree reliable', () => {
            expect(
                removeUnreliableQuads([
                    evaluatedSample(true, true, true)
                ]).length
            ).toEqual(1)
        })

        it('tree unreliable', () => {
            expect(
                removeUnreliableQuads([
                    evaluatedSample(false, false, false)
                ]).length
            ).toEqual(0)
        })

        it('two reliable and unreliable', () => {
            expect(
                removeUnreliableQuads([
                    evaluatedSample(true, true, false)
                ]).length
            ).toEqual(1)
        })

        it('two unreliable and reliable', () => {
            expect(
                removeUnreliableQuads([
                    evaluatedSample(false, true, false)
                ]).length
            ).toEqual(1)
        })
    })

    describe('two quads', () => {
        it('both pass', () => {
            expect(
                removeUnreliableQuads([
                    evaluatedSample(false, true, true),
                    evaluatedSample(false, true, false, false),
                ]).length
            ).toEqual(2)
        })

        it('second pass', () => {
            const pass = evaluatedSample(true, true, false, true)
            const notPass = evaluatedSample(false)
            expect(
                removeUnreliableQuads([
                    notPass,
                    pass,
                ])
            ).toEqual([pass])
        })

        it('first pass', () => {
            const pass = evaluatedSample(false, true, false)
            const notPass = evaluatedSample(true, false)
            expect(
                removeUnreliableQuads([
                    pass,
                    notPass
                ])
            ).toEqual([pass])
        })

        it('all are removed', () => {
            expect(
                removeUnreliableQuads([
                    evaluatedSample(false, true),
                    evaluatedSample(true, true)
                ]).length
            ).toEqual(0)
        })
    })
})
