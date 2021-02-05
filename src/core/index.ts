import { inject, injectable } from 'inversify'
import 'reflect-metadata'
import TYPES from '../di/types'
import { DataInjection, LocationData } from './apis/DataInjection'
import { PublicAPI } from './apis/PublicAPI'

function formatPoint(point: LocationData) {
    return `id: ${point.id}, location: ${point.location.lat} ${point.location.long}`
}

@injectable()
export class Core {
    @inject(TYPES.PublicAPI)
    private publicAPI!: PublicAPI

    @inject(TYPES.DataInjection)
    private dataInjection!: DataInjection

    run() {
        console.log('ok')
        this.publicAPI.listen(() => 'ok')
        this.dataInjection.listen().forEach(point => {
            console.log(formatPoint(point))
        })
    }
}
