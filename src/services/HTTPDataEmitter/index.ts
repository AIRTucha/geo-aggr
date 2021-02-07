import { injectable } from 'inversify'
import 'reflect-metadata'

import { listenOnPort } from './listenHTTP'

import express from 'express'
import { join } from 'path'
import cookieParser from 'cookie-parser'
import logger from 'morgan'
import { EvaluationRepository } from '../../core/apis/EvaluationStorage'
import { DataEmitter } from '../../core/apis/DataEmitter'

const port = process.env.PORT || '3333'

@injectable()
export class HTTPDataEmitter implements DataEmitter {
    private evaluationRepository?: EvaluationRepository
    constructor() {
        const app = express()

        app.use(logger('dev'))
        app.use(express.json())
        app.use(express.urlencoded({ extended: false }))
        app.use(cookieParser())
        app.use(express.static(join(__dirname, 'public')))

        app.get('/count', (req, res) => {
            try {
                const latMin = parseFloat(req.query.latMin as any)
                const latMax = parseFloat(req.query.latMax as any)
                const longMin = parseFloat(req.query.longMin as any)
                const longMax = parseFloat(req.query.longMax as any)
                if (this.evaluationRepository) {
                    res.send(
                        this.evaluationRepository.get(
                            { lat: latMin, long: longMin },
                            { lat: latMax, long: longMax }
                        ).length.toString()
                    )
                } else {
                    res.send(0)
                }
            } catch {
                console.error('Parsing problem with', req.query)
            }
        })

        listenOnPort(app, port)
    }

    emit(repository: EvaluationRepository): void {
        this.evaluationRepository = repository
    }
}
