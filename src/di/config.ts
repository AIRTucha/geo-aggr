import { Container, injectable } from 'inversify'
import 'reflect-metadata'
import ProcessingCore from '../core/ProcessingCore'
import InjectionCore from '../core/InjectionCore'
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
        this.container.bind<ProcessingCore>(TYPES.ProcessingCore).to(ProcessingCore).inSingletonScope()
        this.container.bind<InjectionCore>(TYPES.InjectionCore).to(InjectionCore).inSingletonScope()
        this.container.bind<DataEmitter>(TYPES.DataEmitter).to(WebSocketDataEmitter).inSingletonScope()
        this.container.bind<SampleStorage>(TYPES.SampleStorage).to(QTreeSampleStorage).inSingletonScope()
        this.container.bind<EvaluationStorage>(TYPES.EvaluationStorage).to(KDEvaluationStorage).inSingletonScope()
        this.container.bind<SourceStorage>(TYPES.SourceStorage).to(LocalSourceStorage).inSingletonScope()
    }

    abstract bindInfra(): void

    run(): void {
        this.container.get<ProcessingCore>(TYPES.ProcessingCore).run()
        this.container.get<InjectionCore>(TYPES.InjectionCore).run()
    }
}

@injectable()
export class LocalContainer extends BaseContainer {
    bindInfra(): void {
        this.container.bind<DataInjection>(TYPES.DataInjection).to(MockOsmDataInjection).inSingletonScope()
    }
}

@injectable()
export class ProdContainer extends BaseContainer {
    bindInfra(): void {
        this.container.bind<DataInjection>(TYPES.DataInjection).to(TgDataInjection).inSingletonScope()
    }
}
