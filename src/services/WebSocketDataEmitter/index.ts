import { injectable } from 'inversify'
import { DataEmitter, } from '../../core/apis/DataEmitter'
import 'reflect-metadata'
import ws from 'ws'
import { deserialize, serialize } from 'bson'
import { EvaluationRepository } from '../../core/apis/EvaluationStorage'
import { Logger } from '../../utils'
import { GeoPoint } from '../../core/models'

type ScreenBounds = {
    min: GeoPoint,
    max: GeoPoint
}

function latDelta(boundary: ScreenBounds) {
    return boundary.max.lat - boundary.min.lat
}

function lngDelta(boundary: ScreenBounds) {
    return boundary.max.lng - boundary.min.lng
}

function screenBoundsIsNotTooBig(boundary: ScreenBounds) {
    return latDelta(boundary) < 3 && lngDelta(boundary) < 3
}

function isNotUpToDate(newBoundary: ScreenBounds, oldBoundary?: ScreenBounds) {
    return !(
        oldBoundary &&
        oldBoundary.min.lat <= newBoundary.min.lat &&
        oldBoundary.min.lng <= newBoundary.min.lng &&
        oldBoundary.max.lat >= newBoundary.max.lat &&
        oldBoundary.max.lng >= newBoundary.max.lng
    )
}

const logger = Logger('WebSocketDataEmitter')

function portNumber() {
    try {
        return parseInt(process.env.PORT!)
    } catch {
        return 9090
    }
}

@injectable()
export class WebSocketDataEmitter implements DataEmitter {
    private repository?: EvaluationRepository
    private readonly connections = new Map<ws, ScreenBounds>()
    constructor() {
        new ws.Server({ port: portNumber() })
            .on('connection', socket => {
                const deleteSocket = () => {
                    this.connections.delete(socket)
                }
                const addDataSub = (data: Buffer) => {
                    const screenBounds = deserialize(data) as ScreenBounds
                    const oldBoundary = this.connections.get(socket)
                    logger(`Request data from ${screenBounds.min.lat};${screenBounds.min.lng} to ${screenBounds.max.lat};${screenBounds.max.lng}`)
                    if (screenBoundsIsNotTooBig(screenBounds)) {
                        if (
                            this.repository &&
                            isNotUpToDate(screenBounds, oldBoundary)
                        ) {
                            this.sendEvaluation(
                                this.repository,
                                socket,
                                screenBounds.min,
                                screenBounds.max
                            )
                        }
                        this.connections.set(socket, screenBounds)
                    } else {
                        this.connections.delete(socket)
                    }
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
                this.sendEvaluation(repository, socket, min, max)
            }
        } catch (e) {
            console.error('Cannot send data', e)
        }
    }
    private sendEvaluation(repository: EvaluationRepository, socket: ws, min: GeoPoint, max: GeoPoint) {
        const points = repository
            .get(min, max)
            .map(({ lat, lng, risk }) => ({ lat, lng, risk }))
        socket.send(serialize({ points: points }))
    }
}
