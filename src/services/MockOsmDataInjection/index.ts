import { injectable } from 'inversify'
import { Observable } from 'rxjs'
import 'reflect-metadata'
import { DataInjection, Signal } from '../../core/apis/DataInjection'

import * as fs from 'fs'
import { execSync } from 'child_process'
import { Logger, sampleID } from '../../utils'
import { RawSample } from '../../core/models'

const distTable = [
  { el: 1, freq: 0.1 },
  { el: 2, freq: 0.2 },
  { el: 3, freq: 0.2 },
  { el: 4, freq: 0.4 },
  { el: 5, freq: 0.1 },
]

function genRandom(): number {
  const maxRange = 100
  const table = distTable

  const el = Math.floor(Math.random() * maxRange) + 1

  let rangeStart = 0

  const ret = table.find((val) => {
    const start = rangeStart
    const end = rangeStart + Math.round(maxRange * val.freq)

    if (start < el && el <= end) {
      return true
    }

    rangeStart = end
    return false
  })

  return ret ? ret.el : 0
}

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
  risk: number
}

const logger = Logger('MockOsmDataInjection')
@injectable()
export class MockOsmDataInjection implements DataInjection {
  emit(signal: Signal, id: string): void {
    logger(signal, id)
  }
  listen(): Observable<RawSample> {
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
    const timeDelta = 70000
    return new Observable(subscriber => {
      let time = 60 * 1000
      let idx = 0

      for (const sample of data)
        subscriber.next({
          lat: sample.lat,
          lng: sample.lon,
          risk: genRandom(),
          date: time,
          id: sampleID(sample.id, sample.lat, sample.lon),
          sourceId: sample.id
        })
      idx += 1
      time += timeDelta * Math.random()
    })
  }
}
