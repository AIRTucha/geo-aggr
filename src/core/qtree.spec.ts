import qtree, { geoDistance, MIN_BRANCH_SIZE, QPoint, QTree, Quad } from './qtree'

const coordsDeltaSmall = 0.0002
const coordsDeltaLarge = 30

const latInsideN = 55.7560
const latInsideS = 55.7562

const longInsideW = 37.6152
const longInsideE = 37.6157

const latOutsideN = latInsideN - coordsDeltaSmall
const latOutsideS = latInsideS + coordsDeltaSmall

const longOutsideW = longInsideW - coordsDeltaSmall
const lonOutsideE = longInsideE + coordsDeltaSmall

const latFarN = latInsideN - coordsDeltaLarge
const latFarS = latInsideS + coordsDeltaLarge

const longFarW = longInsideW - coordsDeltaLarge
const lonFarE = longInsideE + coordsDeltaLarge

const insideQuad1 = { lat: latInsideN, long: longInsideW, value: true }
const insideQuad2 = { lat: latInsideS, long: longInsideE, value: true }

const outsideW = { lat: latInsideN, long: longOutsideW, value: false }
const outsideNW = { lat: latOutsideN, long: longOutsideW, value: false }
const outsideN = { lat: latOutsideN, long: longInsideE, value: false }
const outsideNE = { lat: latOutsideN, long: lonOutsideE, value: false }
const outsideE = { lat: latInsideN, long: lonOutsideE, value: false }
const outsideSE = { lat: latOutsideS, long: lonOutsideE, value: false }
const outsideS = { lat: latOutsideS, long: longInsideW, value: false }
const outsideSW = { lat: latOutsideS, long: longOutsideW, value: false }

const farW = { lat: latInsideN, long: longFarW, value: false }
const farNW = { lat: latFarN, long: longFarW, value: false }
const farN = { lat: latFarN, long: longInsideE, value: false }
const farNE = { lat: latFarN, long: lonFarE, value: false }
const farE = { lat: latInsideN, long: lonFarE, value: false }
const farSE = { lat: latFarS, long: lonFarE, value: false }
const farS = { lat: latFarS, long: longInsideW, value: false }
const farSW = { lat: latFarS, long: longFarW, value: false }


function flatten(quads: Quad<boolean>[]) {
    return quads.map(q => q.points).flat()
}

const halfQuadSize = MIN_BRANCH_SIZE / 2

function quadCenterIsCloseToPoint(point: QPoint<unknown>, center: Quad<unknown>) {
    expect(geoDistance(point.lat, point.long, center.lat, center.long) <= halfQuadSize).toBeTruthy()
}

describe('qtree', () => {
    let tree: QTree<boolean>

    beforeEach(() => {
        tree = qtree<boolean>()
    })

    describe('single point', () => {

        it('insert', () => {
            const isAdded = tree.insert(insideQuad1)
            expect(isAdded).toBeTruthy()
        })

        describe('methods', () => {
            beforeEach(() => {
                tree.insert(insideQuad1)
            })

            it('getPoints', () => {
                const [quad] = tree.getQuads()
                quadCenterIsCloseToPoint(insideQuad1, quad)
                expect(quad.points.length).toBe(1)
                expect(quad.points).toContain(insideQuad1)
            })


            describe('filter', () => {
                it('remove', () => {
                    const quads = tree.filter(p => !p.value).getQuads()
                    expect(quads.length).toBe(0)
                })

                it('keep', () => {
                    const quads = tree.filter(p => p.value).getQuads()
                    expect(quads.length).toBe(1)
                    expect(quads[0].points).toContain(insideQuad1)
                })
            })
        })
    })

    describe('two points', () => {
        describe('same quad', () => {
            it('insert', () => {
                expect(tree.insert(insideQuad1)).toBeTruthy()
                expect(tree.insert(insideQuad2)).toBeTruthy()
            })

            describe('methods', () => {
                beforeEach(() => {
                    tree.insert(insideQuad1)
                    tree.insert(insideQuad2)
                })

                it('getPoints', () => {
                    const [quad] = tree.getQuads()

                    quadCenterIsCloseToPoint(insideQuad1, quad)
                    quadCenterIsCloseToPoint(insideQuad2, quad)

                    const points = quad.points

                    expect(points.length).toBe(2)

                    expect(points).toContain(insideQuad1)
                    expect(points).toContain(insideQuad2)
                })

                describe('filter', () => {
                    it('remove all', () => {
                        const quads = tree.filter(p => !p.value).getQuads()
                        expect(quads.length).toBe(0)
                    })

                    it('remove some', () => {
                        const [quad] = tree.filter(p => p.lat === latInsideN).getQuads()
                        const points = quad.points
                        expect(points.length).toBe(1)
                        expect(points).toContain(insideQuad1)
                        expect(points).not.toContain(insideQuad2)
                    })

                    it('keep', () => {
                        const quads = tree.filter(p => p.value).getQuads()
                        expect(quads.length).toBe(1)
                        expect(quads[0].points).toContain(insideQuad1)
                    })
                })
            })
        })

        function testNearByQuads(testName: string, pointInside: QPoint<boolean>, pointOutside: QPoint<boolean>) {

            describe(testName, () => {
                it('insert', () => {
                    expect(tree.insert(pointInside)).toBeTruthy()
                    expect(tree.insert(pointOutside)).toBeTruthy()
                })

                describe('methods', () => {
                    beforeEach(() => {
                        tree.insert(pointInside)
                        tree.insert(pointOutside)
                    })

                    it('getPoints', () => {
                        const quads = tree.getQuads()
                        expect(quads.length).toBe(2)

                        const points = flatten(quads)

                        quads.forEach(quad => {
                            if (quad.points.includes(pointInside)) {
                                quadCenterIsCloseToPoint(pointInside, quad)
                            } else {
                                quadCenterIsCloseToPoint(pointOutside, quad)
                            }
                        })

                        expect(points).toContain(pointInside)
                        expect(points).toContain(pointOutside)

                        expect(points.length).toBe(2)
                    })

                    describe('filter', () => {
                        it('remove all', () => {
                            const quads = tree.filter(p => p.lat === 0).getQuads()
                            expect(quads.length).toBe(0)
                        })

                        it('remove outside', () => {
                            const points = flatten(tree.filter(p => p.value).getQuads())
                            expect(points.length).toBe(1)
                            expect(points).toContain(pointInside)
                            expect(points).not.toContain(pointOutside)
                        })

                        it('remove inside', () => {
                            const points = flatten(tree.filter(p => !p.value).getQuads())
                            expect(points.length).toBe(1)
                            expect(points).not.toContain(pointInside)
                            expect(points).toContain(pointOutside)
                        })

                        it('keep', () => {
                            const quads = tree.filter(p => typeof p === 'object').getQuads()
                            expect(quads.length).toBe(2)
                            const points = flatten(quads)
                            expect(points).toContain(pointInside)
                            expect(points).toContain(pointOutside)
                            expect(points.length).toBe(2)
                        })
                    })
                })
            })

        }

        describe('near by quads', () => {
            testNearByQuads('W1', insideQuad1, outsideW)
            testNearByQuads('W2', insideQuad2, outsideW)

            testNearByQuads('NW1', insideQuad1, outsideNW)
            testNearByQuads('NW2', insideQuad2, outsideNW)

            testNearByQuads('N1', insideQuad1, outsideN)
            testNearByQuads('N2', insideQuad2, outsideN)

            testNearByQuads('NE1', insideQuad1, outsideNE)
            testNearByQuads('NE2', insideQuad2, outsideNE)

            testNearByQuads('E1', insideQuad1, outsideE)
            testNearByQuads('E2', insideQuad2, outsideE)

            testNearByQuads('SE1', insideQuad1, outsideSE)
            testNearByQuads('SE2', insideQuad2, outsideSE)

            testNearByQuads('S1', insideQuad1, outsideS)
            testNearByQuads('S2', insideQuad2, outsideS)

            testNearByQuads('SW1', insideQuad1, outsideSW)
            testNearByQuads('SW2', insideQuad2, outsideSW)
        })

        describe('far quads', () => {
            testNearByQuads('W1', insideQuad1, farW)
            testNearByQuads('W2', insideQuad2, farW)

            testNearByQuads('NW1', insideQuad1, farNW)
            testNearByQuads('NW2', insideQuad2, farNW)

            testNearByQuads('N1', insideQuad1, farN)
            testNearByQuads('N2', insideQuad2, farN)

            testNearByQuads('NE1', insideQuad1, farNE)
            testNearByQuads('NE2', insideQuad2, farNE)

            testNearByQuads('E1', insideQuad1, farE)
            testNearByQuads('E2', insideQuad2, farE)

            testNearByQuads('SE1', insideQuad1, farSE)
            testNearByQuads('SE2', insideQuad2, farSE)

            testNearByQuads('S1', insideQuad1, farS)
            testNearByQuads('S2', insideQuad2, farS)

            testNearByQuads('SW1', insideQuad1, farSW)
            testNearByQuads('SW2', insideQuad2, farSW)
        })
    })

    describe('three points', () => {

        function testNearByQuads(
            testName: string,
            pointInside1: QPoint<boolean>,
            pointInside2: QPoint<boolean>,
            pointOutside: QPoint<boolean>
        ) {

            describe(testName, () => {
                it('insert', () => {
                    expect(tree.insert(pointInside1)).toBeTruthy()
                    expect(tree.insert(pointOutside)).toBeTruthy()
                    expect(tree.insert(pointInside2)).toBeTruthy()
                })

                describe('methods', () => {
                    beforeEach(() => {
                        tree.insert(pointInside1)
                        tree.insert(pointOutside)
                        tree.insert(pointInside2)
                    })

                    it('getPoints', () => {
                        const quads = tree.getQuads()
                        expect(quads.length).toBe(2)

                        const points = flatten(quads)

                        quads.forEach(quad => {
                            if (quad.points.includes(pointInside1) && quad.points.includes(pointInside2)) {
                                quadCenterIsCloseToPoint(pointInside1, quad)
                                quadCenterIsCloseToPoint(pointInside2, quad)
                            } else {
                                quadCenterIsCloseToPoint(pointOutside, quad)
                            }
                        })

                        expect(points).toContain(pointInside1)
                        expect(points).toContain(pointInside2)
                        expect(points).toContain(pointOutside)

                        expect(points.length).toBe(3)
                    })

                    describe('filter', () => {
                        it('remove all', () => {
                            const quads = tree.filter(p => p.lat === 0).getQuads()
                            expect(quads.length).toBe(0)
                        })

                        it('remove outside', () => {
                            const points = flatten(tree.filter(p => p.value).getQuads())
                            expect(points.length).toBe(2)
                            expect(points).toContain(pointInside1)
                            expect(points).toContain(pointInside2)
                            expect(points).not.toContain(pointOutside)
                        })

                        it('remove inside', () => {
                            const points = flatten(tree.filter(p => !p.value).getQuads())
                            expect(points.length).toBe(1)
                            expect(points).not.toContain(pointInside1)
                            expect(points).not.toContain(pointInside2)
                            expect(points).toContain(pointOutside)
                        })

                        it('keep', () => {
                            const quads = tree.filter(p => typeof p === 'object').getQuads()
                            expect(quads.length).toBe(2)
                            const points = flatten(quads)
                            expect(points).toContain(pointInside1)
                            expect(points).toContain(pointInside2)
                            expect(points).toContain(pointOutside)
                            expect(points.length).toBe(3)
                        })
                    })
                })
            })
        }

        describe('near by quads', () => {
            testNearByQuads('W', insideQuad1, insideQuad2, outsideW)
            testNearByQuads('NW', insideQuad1, insideQuad2, outsideNW)
            testNearByQuads('N', insideQuad1, insideQuad2, outsideN)
            testNearByQuads('NE', insideQuad1, insideQuad2, outsideNE)
            testNearByQuads('E', insideQuad1, insideQuad2, outsideE)
            testNearByQuads('SE', insideQuad1, insideQuad2, outsideSE)
            testNearByQuads('S', insideQuad1, insideQuad2, outsideS)
            testNearByQuads('SW', insideQuad1, insideQuad2, outsideSW)
        })


        describe('far quads', () => {
            testNearByQuads('W', insideQuad1, insideQuad2, farW)
            testNearByQuads('NW', insideQuad1, insideQuad2, farNW)
            testNearByQuads('N', insideQuad1, insideQuad2, farN)
            testNearByQuads('NE', insideQuad1, insideQuad2, farNE)
            testNearByQuads('E', insideQuad1, insideQuad2, farE)
            testNearByQuads('SE', insideQuad1, insideQuad2, farSE)
            testNearByQuads('S', insideQuad1, insideQuad2, farS)
            testNearByQuads('SW', insideQuad1, insideQuad2, farSW)
        })
    })
})
