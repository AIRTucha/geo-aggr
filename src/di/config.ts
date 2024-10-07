import { Container, injectable } from 'inversify'
import 'reflect-metadata'
import ProcessingCore from '../core/ProcessingCore'
import InjectionCore from '../core/InjectionCore'
import { DataEmitter } from '../core/apis/DataEmitter'
import { DataInjection } from '../core/apis/DataInjection'
import { WebSocketDataEmitter } from '../services/WebSocketDataEmitter'
import TYPES from './types'
import { SampleStorage } from '../core/apis/SampleStorage'
import { EvaluationStorage } from '../core/apis/EvaluationStorage'
import { KDEvaluationStorage } from '../services/KDEvaluationStorage'
import { SourceStorage } from '../core/apis/SourceStorage'
import { DBDataProvider } from '../core/apis/DBDataProvider'
import { MockDBDataProvider } from '../services/DBPopulation'
import { DBDataInjection } from '../services/DBDataInjection'
import { DBSourceStorage } from '../services/DBSourceStorage'
import { DBSampleStorage } from '../services/DBSmapleStorage'
import { DBLink } from '../core/apis/DBLink'
import { SQLDBLink } from '../services/SQLDBLink'

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
        this.container.bind<SampleStorage>(TYPES.SampleStorage).to(DBSampleStorage).inSingletonScope()
        this.container.bind<EvaluationStorage>(TYPES.EvaluationStorage).to(KDEvaluationStorage).inSingletonScope()
        this.container.bind<SourceStorage>(TYPES.SourceStorage).to(DBSourceStorage).inSingletonScope()
        this.container.bind<DBLink>(TYPES.DBLink).to(SQLDBLink).inSingletonScope()
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
        this.container.bind<DataInjection>(TYPES.DataInjection).to(DBDataInjection).inSingletonScope()
        this.container.bind<DBDataProvider>(TYPES.DBDataProvider).to(MockDBDataProvider).inSingletonScope()
    }
    run() {
        this.container.get<DBDataProvider>(TYPES.DBDataProvider).uploadData()
        super.run()
    }
}

@injectable()
export class ProdContainer extends BaseContainer {
    bindInfra(): void {
        this.container.bind<DataInjection>(TYPES.DataInjection).to(DBDataInjection).inSingletonScope()
    }
}
