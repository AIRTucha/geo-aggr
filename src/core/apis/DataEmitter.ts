import { EvaluationRepository } from './EvaluationStorage'
export interface DataEmitter {
    emit(repository: EvaluationRepository): void
}
