import { Observable } from 'rxjs'

export type GeoPoint = {
  lat: number
  long: number
}

export type RawSample = {
  location: GeoPoint
  risk: number
  date: Date
  id: string
}

export interface DataInjection {
  listen(): Observable<RawSample>
}