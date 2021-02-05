import { Container, injectable } from "inversify";
import 'reflect-metadata'
import { Core } from "../core";
import type { PublicAPI } from '../core/apis/PublicAPI'
import { HTTPPublicAPI } from "../services/HTTPPublicAPI";
import TYPES from "./types";

@injectable()
export class BaseContainer {
    protected container = new Container()

    constructor() {
        this.bindBase()
    }

    bindBase() {
        this.container.bind<PublicAPI>(TYPES.PublicAPI).to(HTTPPublicAPI)
        this.container.bind<Core>(TYPES.Core).to(Core)
    }

    run(): void {
        this.container.get<Core>(TYPES.Core).run()
    }
}
