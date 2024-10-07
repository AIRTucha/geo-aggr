import { DBPoint } from "../models";

export interface DBLink {
    createUser(id: string, time: string): Promise<void>
    createPoint(userId: string, time: string, risk: number, lat: number, lng: number): Promise<void>
    getPoints(time: number): Promise<DBPoint[]>
    updateKarma(userId: string, karmaDelta: number): Promise<void>
    markProcessed(pointId: string): Promise<void>
    getKarma(id: string): Promise<number>
}
