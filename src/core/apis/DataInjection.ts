import { Observable } from 'rxjs'
import { RawSample } from '../models'

export type Signal =
  'TOO_HIGH_FREQUENCY' |
  'ALREADY_REPORTED_LOCATION' |
  'ACCEPTED' |
  'INCONSISTENT_MOVEMENT'

export interface DataInjection {
  listen(): Observable<RawSample>
  emit(signal: Signal, id: string): void
}
