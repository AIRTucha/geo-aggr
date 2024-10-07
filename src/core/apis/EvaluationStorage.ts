import { EvaluationResult, GeoPoint } from "../models";

export interface EvaluationRepository {
    get(min: GeoPoint, max: GeoPoint): EvaluationResult[]
}

export interface EvaluationStorage {
    update(evaluations: EvaluationResult[]): EvaluationRepository
}
