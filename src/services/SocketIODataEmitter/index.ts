import { injectable } from 'inversify'
import { DataEmitter, EvaluationResult } from '../../core/apis/DataEmitter'
import 'reflect-metadata'
import { EvaluationRepository } from '../../core/apis/EvaluationStorage'

@injectable()
export class SocketIODataEmitter implements DataEmitter {
    emit(points: EvaluationRepository): void {
        throw new Error('Method not implemented.')
    }

}