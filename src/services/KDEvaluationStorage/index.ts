import { EvaluationRepository, EvaluationStorage } from '../../core/apis/EvaluationStorage'
import KDBush from 'kdbush'
import { injectable } from 'inversify'
import { EvaluationResult, GeoPoint } from '../../core/models'

class KDEvaluationRepository implements EvaluationRepository {
    constructor(
        private readonly index: KDBush<EvaluationResult>,
        private readonly evaluations: EvaluationResult[]) {

    }
    get(min: GeoPoint, max: GeoPoint): EvaluationResult[] {
        return this.index
            .range(min.lat, min.lng, max.lat, max.lng)
            .map(i => this.evaluations[i])
    }
}

@injectable()
export class KDEvaluationStorage implements EvaluationStorage {
    update(evaluations: EvaluationResult[]): EvaluationRepository {
        return new KDEvaluationRepository(
            new KDBush<EvaluationResult>(evaluations, p => p.lat, p => p.lng),
            evaluations
        )
    }
}
