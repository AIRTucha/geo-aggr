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
    return true //value > min && value < max
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

const MAX_PERSON_SPEED = 5

function getTimeDeltaSec(oldSample: RawSample, newSample: RawSample) {
    return Math.abs((newSample.date - oldSample.date) / 1000)
}

function sourceSpeed(oldSample: RawSample, newSample: RawSample) {
    const distance = samplesDistance(oldSample, newSample) / 1000
    const time_delta = getTimeDeltaSec(oldSample, newSample) / 3600
    return distance / time_delta
}

function isSpeedValid(newSample: RawSample) {
    return (oldSample: RawSample) => {
        return sourceSpeed(newSample, oldSample) < MAX_PERSON_SPEED
    }
}

export function isSampleReliable(
    newSample: RawSample,
    oldSamples: RawSample[]
) {
    return oldSamples.length > 0
        ?
        oldSamples.every(isSpeedValid(newSample))
        :
        true
}

export function deltaTimeSince(now: number, lastTime: number) {
    return now - lastTime
}

const DEBOUNCE_TIME_MS = 1000 * 60

export function isTooFrequent(now: number, lastTime: number) {
    return deltaTimeSince(now, lastTime) > DEBOUNCE_TIME_MS
}

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

export function sourceKarma(finalRisk: number, points: EvaluatedSample[]): SourceScore[] {
    return points.map(computeSourceScore(finalRisk))
}
