import { injectable } from 'inversify'
import { Observable } from 'rxjs'
import 'reflect-metadata'
import { DataInjection, Signal } from '../../core/apis/DataInjection'

import * as data from '../../../test_utils/data.json'
import { Logger, sampleID } from '../../utils'
import { RawSample } from '../../core/models'

const logger = Logger('MockSlowDataInjection')

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
export class MockSlowDataInjection implements DataInjection {
  emit(signal: Signal, id: string): void {
    logger(signal, id)
  }
  listen(): Observable<RawSample> {

    return new Observable(subscriber => {
      let i = 0
      // @ts-ignore
      const samples = shuffleArray<{ lat: number, lng: number, risk: number, id: string }>(data.data)
      const samplesLen = samples.length
      const pointsPerSecond = 100

      const intervalId = setInterval(() => {
        const nextBound = Math.min(i + Math.floor(Math.random() * pointsPerSecond), samplesLen)
        for (; i < nextBound; i++) {
          const sample = samples[i]
          subscriber.next({
            lat: sample.lat,
            lng: sample.lng,
            risk: sample.risk,
            date: Date.now(),
            id: sampleID(sample.id, sample.lat, sample.lng),
            sourceId: sample.id
          })
        }
        if (samplesLen === nextBound) {
          clearInterval(intervalId)
        }
      }, 1000)
    })
  }
}
