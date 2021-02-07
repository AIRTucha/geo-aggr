import { inject, injectable } from 'inversify'
import 'reflect-metadata'
import TYPES from '../di/types'
import { DataInjection, RawSample } from './apis/DataInjection'
import { SampleStorage } from './apis/SampleStorage'

import { EMPTY, empty, from, interval, merge, Observable, partition } from 'rxjs'
import { filter, map, mergeAll, mergeMap, shareReplay } from 'rxjs/operators'
import { estimateReliability, evaluateQuads, GeoAggregation } from './aggregateQuad'
import { DataEmitter } from './apis/DataEmitter'
import { EvaluationStorage } from './apis/EvaluationStorage'
import { SourceStorage } from './apis/SourceStorage'
import { log } from '../utils'
import { sourceKarma, SourceScore } from './evaluateKarma'

const TICK_INTERVAL = 1000 * 10

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

    private updateKarma = (karmaChanges: SourceScore[]) =>
        karmaChanges
            .map(karmaChange =>
                this
                    .sourceStorage
                    .updateKarma(
                        karmaChange.id,
                        karmaChange.karmaDelta
                    )
            )

    private processDataInBatch() {
        return interval(TICK_INTERVAL)
            .pipe(
                log('Evaluate risks'),
                map(() => this.sampleStorage.clearOutdateData()),
                map(outdateSamples => this.sourceStorage.removeSample(outdateSamples)),
                map(() => this.sampleStorage.getData()),
                map(samples => {
                    const [sd, mean] = this.sourceStorage.getKarmaStat()
                    return estimateReliability(sd, mean, samples)
                }),
                map(evaluateQuads),
                shareReplay(),
            )
    }

    private updateEmittedData(data: Observable<GeoAggregation[]>) {
        data
            .pipe(
                log('Publish evaluation'),
                map(evaluations => this.evaluationStorage.update(evaluations)),
            )
            .forEach(
                repository => {
                    this.dataEmitter.emit(repository)
                }
            )
    }

    private updateSourcesReliability(data: Observable<GeoAggregation[]>) {
        data
            .pipe(
                log('Recompute karma'),
                map(points => points.flatMap(sourceKarma)),
            )
            .forEach(this.updateKarma)
    }

    run() {
        const geoAggregation = this.processDataInBatch()

        this.updateEmittedData(geoAggregation)
        this.updateSourcesReliability(geoAggregation)
    }
}
