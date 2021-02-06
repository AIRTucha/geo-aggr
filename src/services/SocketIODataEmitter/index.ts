import { injectable } from 'inversify'
import { DataEmitter, EvaluationRepository, EvaluationResult } from '../../core/apis/DataEmitter'
import 'reflect-metadata'

@injectable()
export class SocketIODataEmitter implements DataEmitter {
    emit(points: EvaluationRepository): void {
        throw new Error('Method not implemented.')
    }

}