import { injectable } from 'inversify'
import { Observable } from 'rxjs'
import 'reflect-metadata'
import { DataInjection, LocationData } from '../../core/apis/DataInjection'

@injectable()
export class MockDataInjection implements DataInjection {
  listen(): Observable<LocationData> {
    return new Observable(subscriber => {
      setInterval(() => {
        subscriber.next({
          location: {
            lat: Math.random(),
            long: Math.random()
          },
          id: Math.random().toString()
        })
      }, 1000)
    })
  }
}