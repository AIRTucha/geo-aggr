import { injectable } from 'inversify'
import 'reflect-metadata'
import { EvaluationResult } from '../../core/apis/DataEmitter'
import { EvaluationRepository, EvaluationStorage } from '../../core/apis/EvaluationStorage'

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