import { EvaluationResult } from '../../core/apis/DataEmitter'
import { GeoPoint } from '../../core/apis/DataInjection'
import { EvaluationRepository, EvaluationStorage } from '../../core/apis/EvaluationStorage'
import KDBush from 'kdbush'
import { retryWhen } from 'rxjs/operators'
import { injectable } from 'inversify'

class KDEvaluationRepository implements EvaluationRepository {
    constructor(
        private readonly index: KDBush<EvaluationResult>,
        private readonly evaluations: EvaluationResult[]) {

    }
    get(min: GeoPoint, max: GeoPoint): EvaluationResult[] {
        return this.index
            .range(min.lat, min.long, max.lat, max.long)
            .map(i => this.evaluations[i])
    }
}

@injectable()
export class KDEvaluationStorage implements EvaluationStorage {
    update(evaluations: EvaluationResult[]): EvaluationRepository {
        return new KDEvaluationRepository(
            new KDBush<EvaluationResult>(evaluations, p => p.lat, p => p.long),
            evaluations
        )
    }
}