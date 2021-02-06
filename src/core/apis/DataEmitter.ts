import { GeoPoint } from './DataInjection'

export type EvaluationResult = GeoPoint & {
    risk: number
}

export interface EvaluationRepository {
    get(leftTop: GeoPoint, rightBottom: GeoPoint): EvaluationResult[]
}

export interface EvaluationStorage {
    update(evaluations: EvaluationResult[]): EvaluationRepository
}

export interface DataEmitter {
    emit(repository: EvaluationRepository): void
}