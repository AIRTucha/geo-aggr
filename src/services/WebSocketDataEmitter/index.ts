import { injectable } from 'inversify'
import { DataEmitter, } from '../../core/apis/DataEmitter'
import 'reflect-metadata'
import ws from 'ws'
import { deserialize, serialize } from 'bson'
import { GeoPoint } from '../../core/apis/DataInjection'
import { EvaluationRepository } from '../../core/apis/EvaluationStorage'

type ScreenBounds = {
    min: GeoPoint,
    max: GeoPoint
}

@injectable()
export class WebSocketDataEmitter implements DataEmitter {
    private repository?: EvaluationRepository
    private readonly connections = new Map<ws, ScreenBounds>()
    constructor() {
        new ws.Server({ port: 9090 })
            .on('connection', socket => {
                const deleteSocket = () => {
                    this.connections.delete(socket)
                }
                const addDataSub = (data: Buffer) => {
                    const screenBounds = deserialize(data) as ScreenBounds
                    if (this.repository) {
                        const points = this
                            .repository
                            .get(screenBounds.min, screenBounds.max)
                            .map(({ lat, lng, risk }) => ({ lat, lng, risk }))
                        socket.send(serialize(points))
                    }
                    this.connections.set(socket, screenBounds)
                }
                socket
                    .on('message', addDataSub)
                    .on('close', deleteSocket)
                    .on('error', deleteSocket)
            })
    }
    emit(repository: EvaluationRepository): void {
        try {
            this.repository = repository
            for (const [socket, { min, max }] of this.connections.entries()) {
                socket.send(serialize(repository.get(min, max)))
            }
        } catch (e) {
            console.error('Cannot send data', e)
        }

    }
}