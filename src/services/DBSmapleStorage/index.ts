import { inject, injectable } from 'inversify'
import 'reflect-metadata'
import { SampleStorage } from '../../core/apis/SampleStorage'
import { QTreeSampleStorage } from '../QTreeSampleStorage'

import TYPES from '../../di/types'
import { DBLink } from '../../core/apis/DBLink'
import { RawSample } from '../../core/models'

@injectable()
export class DBSampleStorage extends QTreeSampleStorage implements SampleStorage {
    @inject(TYPES.DBLink)
    dbLink!: DBLink

    markAsProcessed(point: RawSample): void {
        this.dbLink.markProcessed(point.id)
        super.markAsProcessed(point)
    }
}
