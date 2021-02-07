import { Container, injectable } from 'inversify'
import 'reflect-metadata'
import { Core } from '../core'
import { DataEmitter } from '../core/apis/DataEmitter'
import { DataInjection } from '../core/apis/DataInjection'
import { MockOsmDataInjection } from '../services/MockOsmDataInjection'
import { TgDataInjection } from '../services/TgDataInjection'
import { WebSocketDataEmitter } from '../services/WebSocketDataEmitter'
import TYPES from './types'
import { SampleStorage } from '../core/apis/SampleStorage'
import { QTreeSampleStorage } from '../services/QTreeSampleStorage'
import { EvaluationStorage } from '../core/apis/EvaluationStorage'
import { KDEvaluationStorage } from '../services/KDEvaluationStorage'
import { SourceStorage } from '../core/apis/SourceStorage'
import { LocalSourceStorage } from '../services/LocalSourceStorage'

abstract class BaseContainer {
    protected container = new Container()

    constructor() {
        this.bindBase()
        this.bindInfra()
    }

    bindBase() {
        this.container.bind<Core>(TYPES.Core).to(Core)
        this.container.bind<DataEmitter>(TYPES.DataEmitter).to(WebSocketDataEmitter)
        this.container.bind<SampleStorage>(TYPES.SampleStorage).to(QTreeSampleStorage)
        this.container.bind<EvaluationStorage>(TYPES.EvaluationStorage).to(KDEvaluationStorage)
        this.container.bind<SourceStorage>(TYPES.SourceStorage).to(LocalSourceStorage)
    }

    abstract bindInfra(): void

    run(): void {
        this.container.get<Core>(TYPES.Core).run()
    }
}

@injectable()
export class LocalContainer extends BaseContainer {
    bindInfra(): void {
        this.container.bind<DataInjection>(TYPES.DataInjection).to(MockOsmDataInjection)
    }
}

@injectable()
export class ProdContainer extends BaseContainer {
    bindInfra(): void {
        this.container.bind<DataInjection>(TYPES.DataInjection).to(TgDataInjection)
    }
}
