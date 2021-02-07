import { inject, injectable } from 'inversify'
import 'reflect-metadata'
import TYPES from '../di/types'
import { DataInjection, RawSample } from './apis/DataInjection'
import { SampleStorage } from './apis/SampleStorage'

import { interval, Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { estimateReliability, evaluateQuads, GeoAggregation } from './aggregateQuad'
import { DataEmitter } from './apis/DataEmitter'
import { EvaluationStorage } from './apis/EvaluationStorage'

function formatPoint(point: RawSample) {
    return `id: ${point.id}, location: ${point.lat} ${point.long}`
}

const TICK_INTERVAL = 1000 * 10

function log<T>(val: T) {
    console.log(val)
    return val
}

@injectable()
export class Core {
    @inject(TYPES.DataInjection)
    private dataInjection!: DataInjection

    @inject(TYPES.SampleStorage)
    private RawSampleStorage!: SampleStorage

    @inject(TYPES.DataEmitter)
    private dataEmitter!: DataEmitter

    @inject(TYPES.EvaluationStorage)
    private evaluationStorage!: EvaluationStorage

    startHandlingIncomingData() {
        this.dataInjection
            .listen()
            .pipe(
                // TODO: check data integrity
            )
            .forEach(point => {
                // TODO: inject point to user storage
                this.RawSampleStorage.add(point)
            })
    }

    startDataProcessing() {
        const geoAggregation = this.processDataInBatch()

        this.updateEmittedData(geoAggregation)
        this.updateSourcesReliability(geoAggregation)
    }

    processDataInBatch() {
        return interval(TICK_INTERVAL).pipe(
            map(() => this.RawSampleStorage.clearOutdateData()),
            map(() => this.RawSampleStorage.getData()),
            map(estimateReliability),
            map(evaluateQuads),
        )
    }

    updateEmittedData(data: Observable<GeoAggregation[]>) {
        data
            .pipe(
                map(evaluations => this.evaluationStorage.update(evaluations)),
            )
            .forEach(
                repository => this.dataEmitter.emit(repository)
            )
    }

    updateSourcesReliability(data: Observable<GeoAggregation[]>) {
        // aggregate:
        //// update users score
        // emit result
    }

    run() {
        this.startHandlingIncomingData()
        this.startDataProcessing()
    }
}
