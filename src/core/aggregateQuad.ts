import { QPoint, Quad } from '../services/QTreeSampleStorage/qtree'
import { EvaluationResult } from './apis/DataEmitter'
import { RawSample } from './apis/DataInjection'

export type GeoAggregation = EvaluationResult & { sourcesIds: string[] }
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
        sourcesIds: getIds(quad.points),
        ...quad
    }
}

export function evaluateQuads(quads: Quad<EvaluatedSample>[]): GeoAggregation[] {
    return quads.map(estimateRisk)
}

export function estimateReliability(quads: Quad<RawSample>[]): Quad<EvaluatedSample>[] {
    // TODO: mark unreliable correctly
    return quads.map(q => ({
        ...q,
        points: q.points.map(p => {
            return {
                ...p,
                isReliable: true
            }
        }),
    }))
}