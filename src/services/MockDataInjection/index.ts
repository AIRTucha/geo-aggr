import { injectable } from 'inversify'
import { Observable } from 'rxjs'
import 'reflect-metadata'
import { DataInjection, RawSample } from '../../core/apis/DataInjection'

@injectable()
export class MockDataInjection implements DataInjection {
  listen(): Observable<RawSample> {
    return new Observable(subscriber => {
      setInterval(() => {
        subscriber.next({
          location: {
            lat: Math.random(),
            long: Math.random()
          },
          date: new Date(),
          risk: 5,
          id: Math.random().toString()
        })
      }, 1000)
    })
  }
}