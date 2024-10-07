
import { Quad } from '../../services/QTreeSampleStorage/qtree'
import { RawSample } from '../models';
export interface SampleStorage {
    add(point: RawSample): void
    isNewSample(point: RawSample): boolean
    markAsProcessed(point: RawSample): void
    clearOutdateData(): RawSample[]
    getData(): Quad<RawSample>[]
}
