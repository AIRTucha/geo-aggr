import { inject, injectable } from 'inversify'
import 'reflect-metadata'

import * as data from '../../../test_utils/data.json'
import { Logger } from '../../utils'
import { DBDataProvider } from '../../core/apis/DBDataProvider'
import TYPES from '../../di/types'
import { DBLink } from '../../core/apis/DBLink'
const logger = Logger('MockDBDataProvider')

function shuffleArray<T>(array: T[]) {
    const len = array.length - 1
    const shuffleCof = 0.5
    for (let i = len * shuffleCof; i > 0; i--) {
        const j1 = Math.floor(Math.random() * len)
        const j2 = Math.floor(Math.random() * len)
        const temp = array[j1]
        array[j1] = array[j2]
        array[j2] = temp
    }
    return array
}

@injectable()
export class MockDBDataProvider implements DBDataProvider {

    @inject(TYPES.DBLink)
    dbLink!: DBLink

    async uploadData() {
        let i = 0
        // @ts-ignore
        const samples = shuffleArray<{ lat: number, lng: number, risk: number, id: string }>(data.data)
        const samplesLen = samples.length
        const pointsPerSecond = 100

        const intervalId = setInterval(
            async () => {
                const nextBound = Math.min(i + Math.floor(Math.random() * pointsPerSecond), samplesLen)

                for (; i < nextBound; i++) {
                    const sample = samples[i]

                    const userId = sample.id
                    const time = new Date().toISOString()
                    const lat = sample.lat
                    const lng = sample.lng

                    await this.dbLink.createUser(userId, time)
                    await this.dbLink.createPoint(userId, time, sample.risk, lat, lng)

                    logger(`Uploaded ${userId} at ${lat}; ${lng}`)
                }
                logger(`Users inserted`)
                if (samplesLen === nextBound) {
                    clearInterval(intervalId)
                }
            },
            1000
        )
    }
}
