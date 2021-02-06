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
        this.publicAPI.listen(() => 'ok')
        this.dataInjection.listen().forEach(point => {
            console.log(formatPoint(point))
        })

        // Geo API
        //// break into independent clusters
        //// filter
        //// creat a grid -> arrays of points

        // listen to data injection
        // check data integrity
        // place new point in dataset

        // run timer
        // get points from dataset
        // aggregate:
        //// clean from outdated
        //// remove unreliable
        //// break into clusters
        //// evaluate clusters
        //// update users score
        // emit result
    }
}
