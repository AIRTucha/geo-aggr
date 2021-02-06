import { injectable } from 'inversify'
import { Observable } from 'rxjs'
import 'reflect-metadata'
import { DataInjection, LocationData } from '../../core/apis/DataInjection'

import * as fs from 'fs'
import { execSync } from 'child_process'

interface OsmTestData {
  version: number,
  generator: string,
  osm3s: any,
  elements: any[]
}

interface OsmData {
  id: string,
  lat: number,
  lon: number,
}

@injectable()
export class MockOsmDataInjection implements DataInjection {
  listen(): Observable<LocationData> {
    let data: OsmData[]
    try {
      const rawdata = fs.readFileSync('test_utils/data_osm.json')
      const jsonData: OsmTestData = JSON.parse(rawdata.toString())
      data = jsonData.elements
    } catch (err) {
      console.error('There is no test data file! try to load it.')
      execSync('npm run init-test-data')
      return this.listen()
    }

    return new Observable(subscriber => {
      let idx = 0
      setInterval(() => {
        subscriber.next({
          location: {
            lat: data[idx].lat,
            long: data[idx].lon
          },
          id: data[idx].id
        })
        idx += 1
      }, 1000)
    })
  }
}