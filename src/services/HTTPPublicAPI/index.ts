import { injectable } from 'inversify'
import 'reflect-metadata'
import { PublicAPI } from '../../core/apis/PublicAPI'

import { listenOnPort } from './listenHTTP'

import express from 'express'
import { join } from 'path'
import cookieParser from 'cookie-parser'
import logger from 'morgan'

const port = process.env.PORT || '3333'

@injectable()
export class HTTPPublicAPI implements PublicAPI {
    listen(handler: () => string): void {
        const app = express()

        app.use(logger('dev'))
        app.use(express.json())
        app.use(express.urlencoded({ extended: false }))
        app.use(cookieParser())
        app.use(express.static(join(__dirname, 'public')))

        app.use('/', (req, res) => {
            res.send({ status: handler() })
        })

        listenOnPort(app, port)
    }
}
