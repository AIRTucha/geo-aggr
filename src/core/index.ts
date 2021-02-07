import { inject, injectable } from 'inversify'
import 'reflect-metadata'
import TYPES from '../di/types'
import { DataInjection, RawSample } from './apis/DataInjection'
import { SampleStorage } from './apis/SampleStorage'

import { from, interval, Observable, partition } from 'rxjs'
import { map, mergeMap } from 'rxjs/operators'
import { estimateReliability, evaluateQuads, GeoAggregation, isSampleConsistent, isNotTooFrequent, sourceKarma } from './aggregateQuad'
import { DataEmitter } from './apis/DataEmitter'
import { EvaluationStorage } from './apis/EvaluationStorage'
import { SourceStorage } from './apis/SourceStorage'
import { flatten } from '../services/QTreeSampleStorage/qtree'

const TICK_INTERVAL = 1000 * 10
const BAD_SAMPLE_PENALTY = -13

const log = map(<T>(val: T) => {
    console.log(val)
    return val
})

@injectable()
export class Core {
    @inject(TYPES.DataInjection)
    private dataInjection!: DataInjection

    @inject(TYPES.SampleStorage)
    private sampleStorage!: SampleStorage

    @inject(TYPES.DataEmitter)
    private dataEmitter!: DataEmitter

    @inject(TYPES.EvaluationStorage)
    private evaluationStorage!: EvaluationStorage

    @inject(TYPES.SourceStorage)
    private sourceStorage!: SourceStorage

    private classifySamples(inputSamples: Observable<RawSample>) {
        const [samples, debouncedSamples] = partition(
            inputSamples,
            point => isNotTooFrequent(
                point.date,
                this.sourceStorage.getLastTime(point.id)
            )
        )
        const [reliableSamples, unreliableSamples] = partition(
            samples,
            point => isSampleConsistent(
                point,
                this.sourceStorage.getSamples(point.id)
            )
        )

        return [reliableSamples, debouncedSamples, unreliableSamples]
    }

    startHandlingIncomingData() {
        const [
            reliableSamples,
            debouncedSamples,
            unreliableSamples
        ] = this.classifySamples(this.dataInjection.listen())

        reliableSamples
            .forEach(point => {
                const karma = this.sourceStorage.getKarma(point.id)
                const sampleWithKarma = { ...point, karma }
                this.sampleStorage.add(sampleWithKarma)
                this.sourceStorage.addSample(sampleWithKarma)
            })

        debouncedSamples
            .forEach(point => {
                this.dataInjection.emit('TOO_HIGH_FREQUENCY', point.id)
            })

        unreliableSamples
            .forEach(point => {
                this.sourceStorage.updateKarma(point.id, BAD_SAMPLE_PENALTY)
            })
    }

    startDataProcessing() {
        const geoAggregation = this.processDataInBatch()

        this.updateEmittedData(geoAggregation)
        this.updateSourcesReliability(geoAggregation)
    }

    processDataInBatch() {
        return interval(TICK_INTERVAL).pipe(
            map(() => this.sampleStorage.clearOutdateData()),
            map(outdateSamples => this.sourceStorage.removeSample(outdateSamples)),
            map(() => this.sampleStorage.getData()),
            map(samples => {
                const [sd, mean] = this.sourceStorage.getKarmaStat()
                return estimateReliability(sd, mean, samples)
            }),
            map(evaluateQuads),
        )
    }

    updateEmittedData(data: Observable<GeoAggregation[]>) {
        data
            .pipe(
                map(evaluations => this.evaluationStorage.update(evaluations)),
            )
            .forEach(
                repository => {
                    this.dataEmitter.emit(repository)
                }
            )
    }

    updateSourcesReliability(data: Observable<GeoAggregation[]>) {
        data
            .pipe(
                mergeMap(from),
                map(point => sourceKarma(point.risk, point.samples)),
                mergeMap(from),
            )
            .forEach(
                karmaChange => {
                    this.sourceStorage.updateKarma(karmaChange.id, karmaChange.karmaDelta)
                }
            )
    }

    run() {
        this.startHandlingIncomingData()
        this.startDataProcessing()
    }
}
