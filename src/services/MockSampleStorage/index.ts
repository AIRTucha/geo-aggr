import { injectable } from 'inversify'
import { DataEmitter, EvaluationRepository, EvaluationResult } from '../../core/apis/DataEmitter'
import 'reflect-metadata'
import { SampleStorage } from '../../core/apis/SampleStorage'
import { RawSample } from '../../core/apis/DataInjection'
import { Quad } from '../../core/qtree'

@injectable()
export class MockSampleStorage implements SampleStorage {
    add(point: RawSample): void {

    }
    clearOutdateData(): RawSample[] {
        return []
    }
    getData(): Quad<RawSample>[] {
        return []
    }
}