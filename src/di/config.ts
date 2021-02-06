import { Container, injectable } from 'inversify'
import 'reflect-metadata'
import { Core } from '../core'
import { DataEmitter } from '../core/apis/DataEmitter'
import { DataInjection } from '../core/apis/DataInjection'
import type { PublicAPI } from '../core/apis/PublicAPI'
import { HTTPPublicAPI } from '../services/HTTPPublicAPI'
import { MockDataInjection } from '../services/MockDataInjection'
import { MockOsmDataInjection } from '../services/MockOsmDataInjection'
import { TgDataInjection } from '../services/TgDataInjection'
import { SocketIODataEmitter } from '../services/SocketIODataEmitter'
import TYPES from './types'

abstract class BaseContainer {
  protected container = new Container()

  constructor() {
    this.bindBase()
    this.bindInfra()
  }

  bindBase() {
    this.container.bind<PublicAPI>(TYPES.PublicAPI).to(HTTPPublicAPI)
    this.container.bind<Core>(TYPES.Core).to(Core)
    this.container.bind<DataEmitter>(TYPES.DataEmitter).to(SocketIODataEmitter)
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
