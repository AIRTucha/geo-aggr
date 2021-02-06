import { inject, injectable } from 'inversify'
import 'reflect-metadata'
import TYPES from '../di/types'
import { DataInjection, RawSample } from './apis/DataInjection'
import { PublicAPI } from './apis/PublicAPI'
import { SampleStorage } from './apis/SampleStorage'

import { interval } from 'rxjs'
import { map } from 'rxjs/operators'
import { estimateReliability, evaluateQuads } from './aggregateQuad'
import { DataEmitter, EvaluationRepository, EvaluationStorage } from './apis/DataEmitter'

function formatPoint(point: RawSample) {
    return `id: ${point.id}, location: ${point.location.lat} ${point.location.long}`
}

const TICK_INTERVAL = 1000 * 60

@injectable()
export class Core {
    @inject(TYPES.PublicAPI)
    private publicAPI!: PublicAPI

    @inject(TYPES.DataInjection)
    private dataInjection!: DataInjection

    @inject(TYPES.SampleStorage)
    private RawSampleStorage!: SampleStorage

    @inject(TYPES.DataEmitter)
    private dataEmitter!: DataEmitter

    @inject(TYPES.EvaluationStorage)
    private evaluationStorage!: EvaluationStorage

    injectData(point: RawSample) {
        // TODO: inject point to user storage
        this.RawSampleStorage.add(point)
    }

    clearOutdateSamples() {
        // this.RawSampleStorage.clearOutdateData()
        // Remove outdated samples from user storage
    }

    run() {
        this.publicAPI.listen(() => 'ok')
        this.dataInjection
            .listen()
            .pipe(
                // TODO: check data integrity
            )
            .forEach(point => {
                console.log(point)
                this.RawSampleStorage.add(point)
            })

        const geoAggregation = interval(TICK_INTERVAL).pipe(
            map(() => this.clearOutdateSamples()),
            map(() => this.RawSampleStorage.getData()),
            map(estimateReliability),
            map(evaluateQuads),
        )

        geoAggregation
            .pipe(
                map(evaluations => this.evaluationStorage.update(evaluations)),
            )
            .forEach(
                repository => this.dataEmitter.emit(repository)
            )

        // aggregate:
        //// update users score
        // emit result
    }
}
