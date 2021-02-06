import { injectable } from 'inversify'
import 'reflect-metadata'
import { SampleStorage } from '../../core/apis/SampleStorage'
import { RawSample } from '../../core/apis/DataInjection'
import qtree, { flatten, Quad } from './qtree'

const MS_IN_15_MIN = 1000 & 60 * 15

function notLaterThan15Minutes(now: number) {
    return ({ date }: RawSample) => {
        return now - date > MS_IN_15_MIN
    }
}


@injectable()
export class QTreeSampleStorage implements SampleStorage {
    private storage = qtree<RawSample>(100000)
    add(point: RawSample): void {
        this.storage.insert(point)
    }
    clearOutdateData(): RawSample[] {
        const now = Date.now()
        const [left, removed] = this.storage.partition(notLaterThan15Minutes(now))
        this.storage = left
        return flatten(removed.getQuads())
    }
    getData(): Quad<RawSample>[] {
        return this.storage.getQuads()
    }
}