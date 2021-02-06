import { GeoPoint } from './DataInjection'
import { EvaluationRepository } from './EvaluationStorage'

export type EvaluationResult = GeoPoint & {
    risk: number
}

export interface DataEmitter {
    emit(repository: EvaluationRepository): void
}