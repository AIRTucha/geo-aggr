import { inject, injectable } from 'inversify'
import 'reflect-metadata'
import TYPES from '../di/types'
import { DataInjection } from './apis/DataInjection'
import { SampleStorage } from './apis/SampleStorage'

import { filter } from 'rxjs/operators'

import { SourceStorage } from './apis/SourceStorage'
import { FlowLogger } from '../utils'
import { RawSample } from './models'
import { isSampleTooClose, isSpeedNotConsistent, isTooFrequent } from './models/validateReliablity'

const BAD_SAMPLE_PENALTY = -13
const flowLog = FlowLogger('InjectionCore')

function printRawSample(sample: RawSample) {
    return `Sample id: ${sample.id}, lat: ${sample.lat} lng: ${sample.lng} risk: ${sample.risk} `
}

function printSampleID(sample: RawSample) {
    return `Sample id: ${sample.id}`
}

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
                this.sourceStorage.getLastTime(point.sourceId)
            )
        ) {
            this.dataInjection.emit('TOO_HIGH_FREQUENCY', point.sourceId)
            return false
        } else {
            return true
        }
    }

    private detectInconsistentSamples(point: RawSample) {
        const samples = this.sourceStorage.getSamples(point.sourceId)
        if (
            isSpeedNotConsistent(
                point,
                samples
            )
        ) {
            this.sourceStorage.updateKarma(point, BAD_SAMPLE_PENALTY)
            this.dataInjection.emit('INCONSISTENT_MOVEMENT', point.sourceId)
            return false
        } else if (
            isSampleTooClose(
                point,
                samples
            )
        ) {
            this.dataInjection.emit('ALREADY_REPORTED_LOCATION', point.sourceId)
            return false
        } else {
            return true
        }
    }

    run() {
        this.dataInjection
            .listen()
            .pipe(
                flowLog('Data injection', printRawSample),
                filter(
                    point => this.debounceTooFrequentSamples(point)
                ),
                flowLog('Frequency check passed', printSampleID),
                filter(
                    point => this.detectInconsistentSamples(point)
                ),
                flowLog('Consistency check passed', printSampleID),
            )
            .forEach(point => {
                this.sampleStorage.add(point)
                this.sourceStorage.addSample(point)

                this.dataInjection.emit('ACCEPTED', point.sourceId)
            })
    }
}
