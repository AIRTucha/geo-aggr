import { RawSample } from '.'
import { isSampleTooClose, isSpeedNotConsistent, isTooFrequent } from './validateReliablity'

const minute = 60 * 1000

describe('isTooFrequent', () => {
    const origin = 0

    it('half minute interval', () => {
        expect(isTooFrequent(origin + minute * .5, origin)).toBeTruthy()
    })

    it('minute interval', () => {
        expect(isTooFrequent(origin + minute, origin)).toBeFalsy()
    })

    it('two minute interval', () => {
        expect(isTooFrequent(origin + minute * 2, origin)).toBeFalsy()
    })
})

const smallGeoDelta = 0.0002
const bigGeoDelta = 0.0009
const veryBigGeoDelta = 1

const originTime = 1000000000
const smallTimeGap = 1000 * 20
const bigTimeGap = 5 * smallTimeGap
const veryBigTimeGap = 500 * bigTimeGap

function rawSample(latDelta: number, lngDelta: number, date = originTime): RawSample {
    return {
        risk: 1,
        date,
        sourceId: '1',
        id: '1',
        lat: 55.7560 + latDelta,
        lng: 37.6152 + lngDelta,
    }
}

describe('isSampleTooClose', () => {
    describe('single existing value', () => {
        it('same quad', () => {
            expect(
                isSampleTooClose(
                    rawSample(0, 0),
                    [rawSample(smallGeoDelta, smallGeoDelta)]
                )
            ).toBeTruthy()
        })

        it('different regions', () => {
            expect(
                isSampleTooClose(
                    rawSample(0, 0),
                    [rawSample(bigGeoDelta, bigGeoDelta)]
                )
            ).toBeFalsy()
        })

        it('far away regions', () => {
            expect(
                isSampleTooClose(
                    rawSample(0, 0),
                    [rawSample(veryBigGeoDelta, veryBigGeoDelta)]
                )
            ).toBeFalsy()
        })
    })

    describe('multiple values', () => {
        it('same quad', () => {
            expect(
                isSampleTooClose(
                    rawSample(0, 0),
                    [
                        rawSample(smallGeoDelta, smallGeoDelta),
                        rawSample(0, smallGeoDelta),
                        rawSample(smallGeoDelta, 0),
                    ]
                )
            ).toBeTruthy()
        })

        it('single point in different region', () => {
            expect(
                isSampleTooClose(
                    rawSample(0, 0),
                    [
                        rawSample(smallGeoDelta, smallGeoDelta),
                        rawSample(0, smallGeoDelta),
                        rawSample(smallGeoDelta, 0),
                        rawSample(bigGeoDelta, bigGeoDelta)
                    ]
                )
            ).toBeTruthy()
        })

        it('different region', () => {
            expect(
                isSampleTooClose(
                    rawSample(0, 0),
                    [
                        rawSample(bigGeoDelta, bigGeoDelta),
                        rawSample(veryBigGeoDelta, bigGeoDelta),
                        rawSample(bigGeoDelta, veryBigGeoDelta),
                        rawSample(veryBigGeoDelta, veryBigGeoDelta),
                    ]
                )
            ).toBeFalsy()
        })

        it('different region, single point in the same region', () => {
            expect(
                isSampleTooClose(
                    rawSample(0, 0),
                    [
                        rawSample(bigGeoDelta, bigGeoDelta),
                        rawSample(veryBigGeoDelta, bigGeoDelta),
                        rawSample(bigGeoDelta, veryBigGeoDelta),
                        rawSample(veryBigGeoDelta, veryBigGeoDelta),
                        rawSample(smallGeoDelta, smallGeoDelta),
                    ]
                )
            ).toBeTruthy()
        })
    })
})

describe('isSpeedNotConsistent', () => {
    describe('single point', () => {
        describe('consistent', () => {
            it('close points', () => {
                expect(
                    isSpeedNotConsistent(
                        rawSample(0, 0),
                        [
                            rawSample(smallGeoDelta, smallGeoDelta, originTime - smallTimeGap),
                        ]
                    )
                ).toBeFalsy()
            })

            it('remote points', () => {
                expect(
                    isSpeedNotConsistent(
                        rawSample(0, 0),
                        [
                            rawSample(bigGeoDelta, bigGeoDelta, originTime - veryBigTimeGap),
                        ]
                    )
                ).toBeFalsy()
            })


            it('very remote points', () => {
                expect(
                    isSpeedNotConsistent(
                        rawSample(0, 0),
                        [
                            rawSample(veryBigGeoDelta, veryBigGeoDelta, originTime - veryBigTimeGap),
                        ]
                    )
                ).toBeFalsy()
            })
        })

        describe('inconsistent', () => {
            it('remote points', () => {
                expect(
                    isSpeedNotConsistent(
                        rawSample(0, 0),
                        [
                            rawSample(bigGeoDelta, bigGeoDelta, originTime - smallTimeGap),
                        ]
                    )
                ).toBeTruthy()
            })


            it('very remote points', () => {
                expect(
                    isSpeedNotConsistent(
                        rawSample(0, 0),
                        [
                            rawSample(veryBigGeoDelta, veryBigGeoDelta, originTime - bigTimeGap),
                        ]
                    )
                ).toBeTruthy()
            })
        })
    })

    describe('multiple points', () => {
        it('all points consistent', () => {
            expect(
                isSpeedNotConsistent(
                    rawSample(0, 0),
                    [
                        rawSample(smallGeoDelta, smallGeoDelta, originTime - smallTimeGap),
                        rawSample(bigGeoDelta, bigGeoDelta, originTime - bigTimeGap),
                        rawSample(veryBigGeoDelta, veryBigGeoDelta, originTime - veryBigTimeGap),
                    ]
                )
            ).toBeFalsy()
        })

        it('inconsistent points near', () => {
            expect(
                isSpeedNotConsistent(
                    rawSample(0, 0),
                    [
                        rawSample(smallGeoDelta, smallGeoDelta, originTime - smallTimeGap),
                        rawSample(bigGeoDelta, bigGeoDelta, originTime - smallTimeGap - 1),
                        rawSample(veryBigGeoDelta, veryBigGeoDelta, originTime - veryBigTimeGap),
                    ]
                )
            ).toBeTruthy()
        })

        it('inconsistent points far', () => {
            expect(
                isSpeedNotConsistent(
                    rawSample(0, 0),
                    [
                        rawSample(smallGeoDelta, smallGeoDelta, originTime - smallTimeGap),
                        rawSample(bigGeoDelta, bigGeoDelta, originTime - bigTimeGap),
                        rawSample(veryBigGeoDelta, veryBigGeoDelta, originTime - bigTimeGap - 1),
                    ]
                )
            ).toBeTruthy()
        })

        it('multiple inconsistent', () => {
            expect(
                isSpeedNotConsistent(
                    rawSample(0, 0),
                    [
                        rawSample(smallGeoDelta, smallGeoDelta, originTime - smallTimeGap),
                        rawSample(bigGeoDelta, bigGeoDelta, originTime - smallTimeGap - 1),
                        rawSample(veryBigGeoDelta, veryBigGeoDelta, originTime - bigTimeGap),
                    ]
                )
            ).toBeTruthy()
        })

        it('all inconsistent', () => {
            expect(
                isSpeedNotConsistent(
                    rawSample(0, 0),
                    [
                        rawSample(bigGeoDelta, bigGeoDelta, originTime - smallTimeGap),
                        rawSample(veryBigGeoDelta, veryBigGeoDelta, originTime - bigTimeGap),
                    ]
                )
            ).toBeTruthy()
        })
    })
})
