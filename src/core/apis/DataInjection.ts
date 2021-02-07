import { Observable } from 'rxjs'

export type GeoPoint = {
  lat: number
  lng: number
}

export type RawSample = GeoPoint & {
  risk: number
  date: number
  id: string
}

export type Signal = 'TOO_HIGH_FREQUENCY'
export interface DataInjection {
  listen(): Observable<RawSample>
  emit(signal: Signal, id: string): void
}