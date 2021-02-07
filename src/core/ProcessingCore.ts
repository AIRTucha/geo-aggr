import { inject, injectable } from 'inversify'
import 'reflect-metadata'
import TYPES from '../di/types'
import { DataInjection, RawSample } from './apis/DataInjection'
import { SampleStorage } from './apis/SampleStorage'

import { from, interval, merge, Observable, partition } from 'rxjs'
import { filter, map, mergeAll, mergeMap, shareReplay } from 'rxjs/operators'
import { estimateReliability, evaluateQuads, GeoAggregation, isSampleConsistent, isTooFrequent, sourceKarma } from './aggregateQuad'
import { DataEmitter } from './apis/DataEmitter'
import { EvaluationStorage } from './apis/EvaluationStorage'
import { SourceStorage } from './apis/SourceStorage'

const TICK_INTERVAL = 1000 * 10

const log = (tag: string) => map(<T>(val: T) => {
    console.log(`[${tag}]`)
    return val
})

@injectable()
export default class Core {
    @inject(TYPES.SampleStorage)
    private sampleStorage!: SampleStorage

    @inject(TYPES.DataEmitter)
    private dataEmitter!: DataEmitter

    @inject(TYPES.EvaluationStorage)
    private evaluationStorage!: EvaluationStorage

    @inject(TYPES.SourceStorage)
    private sourceStorage!: SourceStorage

    processDataInBatch() {
        return interval(TICK_INTERVAL)
            .pipe(
                map(() => this.sampleStorage.clearOutdateData()),
                map(outdateSamples => this.sourceStorage.removeSample(outdateSamples)),
                map(() => this.sampleStorage.getData()),
                map(samples => {
                    const [sd, mean] = this.sourceStorage.getKarmaStat()
                    return estimateReliability(sd, mean, samples)
                }),
                map(evaluateQuads),
                log('Evaluated risks'),
                shareReplay(),
            )
    }

    updateEmittedData(data: Observable<GeoAggregation[]>) {
        data
            .pipe(
                log('Update evaluation storage'),
                map(evaluations => this.evaluationStorage.update(evaluations)),
            )
            .forEach(
                repository => {
                    console.log('Emit new evaluation')
                    this.dataEmitter.emit(repository)
                }
            )
    }

    updateSourcesReliability(data: Observable<GeoAggregation[]>) {
        data
            .pipe(
                mergeMap(from),
                log('Recompute karma'),
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
        const geoAggregation = this.processDataInBatch()

        this.updateEmittedData(geoAggregation)
        this.updateSourcesReliability(geoAggregation)
    }
}
