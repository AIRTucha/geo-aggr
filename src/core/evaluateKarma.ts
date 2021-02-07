import { EvaluatedSample, GeoAggregation } from './aggregateQuad'

export type SourceScore = {
    id: string
    karmaDelta: number
}

const karmaScores = [3, 1, -1, -2, -3]

function computeSourceScore(finalRisk: number) {
    return (points: EvaluatedSample) => ({
        id: points.id,
        karmaDelta: karmaScores[Math.abs(finalRisk - points.risk)]
    })
}

export function sourceKarma(point: GeoAggregation): SourceScore[] {
    return point.samples.map(computeSourceScore(point.risk))
}
