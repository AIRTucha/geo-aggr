import { inject, injectable } from 'inversify'
import { interval, Observable } from 'rxjs'
import { concatMap, switchMap } from 'rxjs/operators'
import 'reflect-metadata'
import { DataInjection, Signal } from '../../core/apis/DataInjection'
import { Logger } from '../../utils'

import TYPES from '../../di/types'
import { DBLink } from '../../core/apis/DBLink'
import { RawSample } from '../../core/models'

const logger = Logger('DBDataInjection')

const timeSpan = 1000 * 60 * 15
const pollingInterval = 1000 * 5
let lastTime = Date.now() - timeSpan

@injectable()
export class DBDataInjection implements DataInjection {

  @inject(TYPES.DBLink)
  dbLink!: DBLink

  emit(signal: Signal, id: string): void {
    logger(signal, id)
  }

  listen(): Observable<RawSample> {

    return interval(pollingInterval)
      .pipe(
        switchMap(() => this.dbLink.getPoints(lastTime)),
        concatMap(
          points => points.map(
            ({ id, user_id, lat, lng, rating, created }) => {
              lastTime = new Date(created).getTime()
              return {
                lat: lat,
                lng: lng,
                risk: rating,
                date: lastTime,
                id: id,
                sourceId: user_id
              }
            }
          )
        ),
      )
  }
}
