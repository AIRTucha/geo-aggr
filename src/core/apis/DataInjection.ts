import { Observable } from 'rxjs'

export type GeoPoint = {
  lat: number
  long: number
}

export type RawSample = GeoPoint & {
  risk: number
  date: number
  id: string
}

export interface DataInjection {
  listen(): Observable<RawSample>
}