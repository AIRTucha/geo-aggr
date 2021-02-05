import { inject, injectable } from 'inversify'
import 'reflect-metadata'
import TYPES from '../di/types'
import { PublicAPI } from './apis/PublicAPI'


@injectable()
export class Core {
    @inject(TYPES.PublicAPI)
    private publicAPI!: PublicAPI
    run() {
        console.log('ok')
        this.publicAPI.listen(() => 'ok')
    }
}