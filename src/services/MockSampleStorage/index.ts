import { injectable } from 'inversify'
import 'reflect-metadata'
import { SampleStorage } from '../../core/apis/SampleStorage'
import { RawSample } from '../../core/apis/DataInjection'
import { Quad } from '../QTreeSampleStorage/qtree'

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