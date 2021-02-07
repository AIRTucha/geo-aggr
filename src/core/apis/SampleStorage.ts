
import { Quad } from '../../services/QTreeSampleStorage/qtree'
import { RawSample } from './DataInjection'

export type SampleWithKarma = RawSample & { karma: number }
export interface SampleStorage {
    add(point: SampleWithKarma): void
    clearOutdateData(): SampleWithKarma[]
    getData(): Quad<SampleWithKarma>[]
}