import { GeoPoint } from './DataInjection'
import { EvaluationRepository } from './EvaluationStorage'

export type EvaluationResult = GeoPoint & {
    risk: number
}

<<<<<<< Updated upstream
=======
export interface EvaluationRepository {
    get(min: GeoPoint, max: GeoPoint): EvaluationResult[]
}

export interface EvaluationStorage {
    update(evaluations: EvaluationResult[]): EvaluationRepository
}

>>>>>>> Stashed changes
export interface DataEmitter {
    emit(repository: EvaluationRepository): void
}