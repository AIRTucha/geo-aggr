import { injectable } from 'inversify'
import 'reflect-metadata'
import { EvaluationRepository, EvaluationResult, EvaluationStorage } from '../../core/apis/DataEmitter'

@injectable()
export class MockEvaluationStorage implements EvaluationStorage {
    update(evaluations: EvaluationResult[]): EvaluationRepository {
        return {
            get() {
                return []
            }
        }
    }
}