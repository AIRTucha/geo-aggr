import { EvaluationResult } from "./apis/DataEmitter";
import { RawSample } from "./apis/DataInjection";
import { QPoint, Quad } from "./qtree";

export type GeoAggregation = EvaluationResult & { sourcesIds: string[] }
export type EvaluatedSample = RawSample & { isReliable: boolean }

function getMedianRisk(points: QPoint<EvaluatedSample>[]) {
    points.sort((ps1, ps2) => ps1.value.risk - ps2.value.risk)
    return points[Math.floor(points.length / 2)].value.risk
}

function getIds(points: QPoint<EvaluatedSample>[]) {
    return points.map(p => p.value.id)
}

function isReliable(point: QPoint<EvaluatedSample>) {
    return point.value.isReliable
}

function estimateRisk(quad: Quad<EvaluatedSample>): GeoAggregation {
    const reliablePoints = quad.points.filter(isReliable)
    return {
        risk: getMedianRisk(reliablePoints),
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
                value: {
                    isReliable: true,
                    ...p.value
                }
            }
        }),
    }))
}