import { Observable } from 'rxjs'

export type GeoPoint = {
  lat: number
  long: number
}

export type LocationData = {
  location: GeoPoint
  id: string
}

export interface DataInjection {
  listen(): Observable<LocationData>
}