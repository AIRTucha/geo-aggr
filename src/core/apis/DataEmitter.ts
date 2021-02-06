import { GeoPoint } from './DataInjection'

export type EvaluatedPoint = GeoPoint & { value: number }

export interface DataEmitter {
    emit(points: EvaluatedPoint[]): void
}