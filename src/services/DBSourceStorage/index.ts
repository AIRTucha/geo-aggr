import { inject, injectable } from 'inversify'
import 'reflect-metadata'
import { SourceStorage } from '../../core/apis/SourceStorage'
import { LocalSourceStorage } from '../LocalSourceStorage'
import TYPES from '../../di/types'
import { DBLink } from '../../core/apis/DBLink'
import { RawSample } from '../../core/models'

@injectable()
export class DBSourceStorage extends LocalSourceStorage implements SourceStorage {

    @inject(TYPES.DBLink)
    dbLink!: DBLink

    protected createSource(sample: RawSample) {
        this.dbLink.getKarma(sample.sourceId).then(
            karma => super.createSource(sample, karma)
        )
    }

    updateKarma(sample: RawSample, karmaDelta: number): void {
        this.dbLink.updateKarma(sample.sourceId, karmaDelta)
        super.updateKarma(sample, karmaDelta)
    }
}
