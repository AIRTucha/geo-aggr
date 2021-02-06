import { EvaluationResult } from './DataEmitter'
import { GeoPoint } from './DataInjection'

export interface EvaluationRepository {
    get(min: GeoPoint, max: GeoPoint): EvaluationResult[]
}

export interface EvaluationStorage {
    update(evaluations: EvaluationResult[]): EvaluationRepository
}