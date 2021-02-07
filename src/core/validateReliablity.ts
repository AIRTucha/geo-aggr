import { samplesDistance } from '../utils'
import { EvaluatedSample, GeoAggregation } from './aggregateQuad'
import { RawSample } from './apis/DataInjection'

const MAX_PERSON_SPEED = 10

function getTimeDeltaSec(oldSample: RawSample, newSample: RawSample) {
    return Math.abs((newSample.date - oldSample.date) / 1000)
}

function sourceSpeed(oldSample: RawSample, newSample: RawSample) {
    const distance = samplesDistance(oldSample, newSample) / 1000
    const time_delta = getTimeDeltaSec(oldSample, newSample) / 3600
    return Math.abs(distance / time_delta)
}

function isSpeedValid(newSample: RawSample) {
    return (oldSample: RawSample) => {
        return sourceSpeed(newSample, oldSample) < MAX_PERSON_SPEED
    }
}

export function isSampleConsistent(
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
    return deltaTimeSince(now, lastTime) < DEBOUNCE_TIME_MS
}
