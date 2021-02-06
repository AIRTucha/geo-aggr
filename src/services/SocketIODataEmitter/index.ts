import { injectable } from 'inversify';
import { DataEmitter, EvaluatedPoint } from '../../core/apis/DataEmitter'
import 'reflect-metadata'

@injectable()
export class SocketIODataEmitter implements DataEmitter {
    emit(points: EvaluatedPoint[]): void {
        throw new Error('Method not implemented.');
    }

}