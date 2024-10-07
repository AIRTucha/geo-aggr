import { injectable } from 'inversify'
import { Observable } from 'rxjs'
import 'reflect-metadata'
import { DataInjection, Signal } from '../../core/apis/DataInjection'
import * as data from '../../../test_utils/data.json'
import { Logger, sampleID } from '../../utils'
import { RawSample } from '../../core/models'

const logger = Logger('MockDataInjection')

const timeDelta = 70 * 1000
@injectable()
export class MockDataInjection implements DataInjection {
  emit(signal: Signal, id: string): void {
    logger(signal, id)
  }
  listen(): Observable<RawSample> {

    return new Observable(subscriber => {
      let time = Date.now() - 13 * 1000 * 60

      for (let i = 0; i < 1; i++)
        // @ts-ignore
        for (const sample of data.data)
          subscriber.next({
            lat: sample.lat,
            lng: sample.lng,
            risk: sample.risk,
            date: time,
            id: sampleID(sample.id, sample.lat, sample.lng),
            sourceId: sample.id
          })

      time += timeDelta * Math.random()
    })
  }
}
