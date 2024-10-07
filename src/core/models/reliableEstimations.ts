import { SampleWithKarma } from '.'
import { Quad } from '../../services/QTreeSampleStorage/qtree'
import { EvaluatedSample } from './aggregateQuad'

function inRange(min: number, value: number) {
    return value >= min
}

// manually selected, increase span of confidence interval
const CONFIDENCE_FACTOR = 2

export function estimateReliability(
    sd: number,
    mean: number,
    quads: Quad<SampleWithKarma>[]
): Quad<EvaluatedSample>[] {
    const minBoundary = mean - sd * CONFIDENCE_FACTOR

    return quads.map(q => ({
        ...q,
        points: q.points.map(p => {
            return {
                ...p,
                isReliable: inRange(
                    minBoundary,
                    p.karma
                )
            }
        }),
    }))
}

function isQuadStatReliable(quad: Quad<EvaluatedSample>) {
    return quad.points.length > 2 && quad.points.some(p => p.isReliable)
}

export function removeUnreliableQuads(quads: Quad<EvaluatedSample>[]) {
    return quads.filter(isQuadStatReliable)
}
