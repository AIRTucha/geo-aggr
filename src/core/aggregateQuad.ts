import { QPoint, Quad } from '../services/QTreeSampleStorage/qtree'
import { samplesDistance } from '../utils'
import { EvaluationResult } from './apis/DataEmitter'
import { GeoPoint, RawSample } from './apis/DataInjection'
import { SampleWithKarma } from './apis/SampleStorage'

export type GeoAggregation = EvaluationResult & { samples: EvaluatedSample[] }
export type EvaluatedSample = RawSample & { isReliable: boolean }

function getMedianRisk(points: QPoint<EvaluatedSample>[]) {
    points.sort((ps1, ps2) => ps1.risk - ps2.risk)
    return points[Math.floor(points.length / 2)].risk
}

function count(points: QPoint<EvaluatedSample>[]) {
    return points.length
}

function getIds(points: QPoint<EvaluatedSample>[]) {
    return points.map(p => p.id)
}

function isReliable(point: QPoint<EvaluatedSample>) {
    return point.isReliable
}

function estimateRisk(quad: Quad<EvaluatedSample>): GeoAggregation {
    const reliablePoints = quad.points.filter(isReliable)
    return {
        risk: count(reliablePoints),
        samples: quad.points,
        ...quad
    }
}

export function evaluateQuads(quads: Quad<EvaluatedSample>[]): GeoAggregation[] {
    return quads.map(estimateRisk)
}

function inRange(min: number, max: number, value: number) {
    return value >= min && value <= max
}

// manually selected, increase span of confidence interval
const CONFIDENCE_FACTOR = 1

export function estimateReliability(
    sd: number,
    mean: number,
    quads: Quad<SampleWithKarma>[]
): Quad<EvaluatedSample>[] {

    const minBoundary = mean - sd * CONFIDENCE_FACTOR
    const maxBoundary = mean + sd * CONFIDENCE_FACTOR

    return quads.map(q => ({
        ...q,
        points: q.points.map(p => {
            return {
                ...p,
                isReliable: inRange(
                    minBoundary,
                    maxBoundary,
                    p.karma
                )
            }
        }),
    }))
}
