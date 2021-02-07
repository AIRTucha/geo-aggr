import { inject, injectable } from 'inversify'
import 'reflect-metadata'
import TYPES from '../di/types'
import { DataInjection, RawSample } from './apis/DataInjection'
import { SampleStorage } from './apis/SampleStorage'

import { filter } from 'rxjs/operators'

import { SourceStorage } from './apis/SourceStorage'
import { isSampleConsistent, isTooFrequent } from './aggregateQuad'

const BAD_SAMPLE_PENALTY = -13

@injectable()
export default class Core {
    @inject(TYPES.DataInjection)
    private dataInjection!: DataInjection

    @inject(TYPES.SampleStorage)
    private sampleStorage!: SampleStorage

    @inject(TYPES.SourceStorage)
    private sourceStorage!: SourceStorage

    private debounceTooFrequentSamples(point: RawSample) {
        if (
            isTooFrequent(
                point.date,
                this.sourceStorage.getLastTime(point.id)
            )
        ) {
            this.dataInjection.emit('TOO_HIGH_FREQUENCY', point.id)
            return false
        } else {
            return true
        }
    }

    private detectIncontinentSamples(point: RawSample) {
        if (isSampleConsistent(
            point,
            this.sourceStorage.getSamples(point.id)
        )) {
            return true
        } else {
            this.sourceStorage.updateKarma(point.id, BAD_SAMPLE_PENALTY)
            return false
        }
    }

    run() {
        this.dataInjection
            .listen()
            .pipe(
                filter(
                    point => this.debounceTooFrequentSamples(point)
                ),
                filter(
                    point => this.detectIncontinentSamples(point)
                ),
            ).forEach(point => {
                const karma = this.sourceStorage.getKarma(point.id)
                const sampleWithKarma = { ...point, karma }
                this.sampleStorage.add(sampleWithKarma)
                this.sourceStorage.addSample(sampleWithKarma)
            })
    }
}
