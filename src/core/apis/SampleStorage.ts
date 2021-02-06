
import { Quad } from '../../services/QTreeSampleStorage/qtree'
import { RawSample } from './DataInjection'

export interface SampleStorage {
    add(point: RawSample): void
    clearOutdateData(): RawSample[]
    getData(): Quad<RawSample>[]
}