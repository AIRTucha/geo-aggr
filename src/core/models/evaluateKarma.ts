import { RawSample } from '.'
import { EvaluatedSample, GeoAggregation } from './aggregateQuad'

export type SourceScore = {
    sample: RawSample
    karmaDelta: number
}

const karmaScores = [3, 1, -1, -2, -3]

function computeSourceScore(finalRisk: number) {
    return (point: EvaluatedSample) => ({
        sample: point,
        karmaDelta: karmaScores[Math.abs(finalRisk - point.risk)]
    })
}

export function sourceKarma(point: GeoAggregation): SourceScore[] {
    return point.samples.map(computeSourceScore(point.risk))
}
